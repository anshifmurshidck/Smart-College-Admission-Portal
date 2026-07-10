import os
import logging

def configure_tesseract():
    return True

def extract_text(file_path):
    try:
        from PIL import Image
        import pytesseract
        
        # Check if tesseract is installed
        try:
            pytesseract.get_tesseract_version()
        except Exception:
            logging.warning("Tesseract is not installed. Returning empty string.")
            return ""
            
        # Try to extract text
        text = pytesseract.image_to_string(Image.open(file_path))
        return text
    except ImportError:
        logging.warning("PIL or pytesseract not installed. Returning empty string.")
        return ""
    except Exception as e:
        logging.error(f"OCR Error extracting text from {file_path}: {e}")
        return ""
