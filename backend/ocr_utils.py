import os
import base64
import requests
from io import BytesIO
try:
    from PIL import Image
except ImportError:
    Image = None

def extract_text(file_path):
    """Extract text from image or PDF files using Gemini Vision API instead of Tesseract."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[OCR] GEMINI_API_KEY not found. OCR cannot proceed.")
        return None

    try:
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext == '.pdf':
            mime_type = "application/pdf"
        elif file_ext in ['.jpg', '.jpeg']:
            mime_type = "image/jpeg"
        elif file_ext == '.png':
            mime_type = "image/png"
        elif file_ext in ['.webp', '.heic', '.heif']:
            mime_type = f"image/{file_ext[1:]}"
        else:
            print(f"[OCR] Unsupported file format: {file_ext}")
            return None

        if file_ext in ['.jpg', '.jpeg', '.png', '.webp'] and Image is not None:
            with Image.open(file_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if too large to save network upload time
                max_size = 1200
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Save to buffer
                buffer = BytesIO()
                img.save(buffer, format="JPEG", quality=85)
                file_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
                mime_type = "image/jpeg"
        else:
            with open(file_path, "rb") as f:
                file_data = base64.b64encode(f.read()).decode('utf-8')

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": "Extract all the text from this document exactly as written with 100% accuracy. Pay special attention to names, Aadhaar numbers, and academic marks. If it contains academic subjects and their marks, output them clearly in a structured format with the maximum marks and obtained marks (e.g. 'Mathematics: 90 / 100'). Ensure percentages and totals are captured precisely."},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": file_data
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.0}
        }

        res = requests.post(url, json=payload, timeout=15)
        
        if res.status_code == 200:
            data = res.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return text.strip() if text.strip() else None
        else:
            print(f"[OCR] Gemini API Error {res.status_code}: {res.text}")
            return None

    except Exception as e:
        print(f"[OCR] Exception extracting text: {e}")
        return None
