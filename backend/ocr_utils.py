import os
import shutil
import subprocess
try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None
    ImageOps = None

try:
    import pytesseract
    # Configure path for Windows systems
    for path in [r"C:\Program Files\Tesseract-OCR\tesseract.exe", r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"]:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break
except ImportError:
    pytesseract = None


def _tesseract_command():
    """Return a local Tesseract executable without relying on pytesseract."""
    for path in [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        shutil.which("tesseract")
    ]:
        if path and os.path.exists(path):
            return path
    return None


def tesseract_available():
    return _tesseract_command() is not None


def _run_tesseract_cli(file_path, psm):
    """Run the local Tesseract executable when pytesseract is unavailable."""
    command = _tesseract_command()
    if not command:
        return None
    try:
        result = subprocess.run(
            [command, file_path, "stdout", "--oem", "3", "--psm", str(psm)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=45,
            check=False
        )
        return result.stdout.strip() or None
    except (OSError, subprocess.SubprocessError) as error:
        print(f"[OCR LOCAL] Tesseract CLI failed: {error}")
        return None

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import fitz # PyMuPDF
except ImportError:
    fitz = None


def _extract_text_locally(file_path):
    file_ext = os.path.splitext(file_path)[1].lower()
    
    # 1. Handle PDF files
    if file_ext == '.pdf':
        text_content = ""
        # Try extracting text directly first
        if pypdf is not None:
            try:
                reader = pypdf.PdfReader(file_path)
                text_list = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_list.append(page_text)
                text_content = "\n".join(text_list).strip()
            except Exception as e:
                print(f"[OCR LOCAL] pypdf extraction failed: {e}")
        
        # If native PDF text is found and long enough, return it
        if len(text_content) > 50:
            return text_content
            
        # If not, render pages as images and run Tesseract OCR
        if fitz is not None and pytesseract is not None and Image is not None:
            try:
                print("[OCR LOCAL] Rendering PDF pages as images for Tesseract OCR...")
                doc = fitz.open(file_path)
                ocr_texts = []
                for i in range(len(doc)):
                    page = doc.load_page(i)
                    # Tesseract needs a reasonably dense image; the default PDF
                    # rasterisation is often too low-resolution for ID numbers.
                    pix = page.get_pixmap(matrix=fitz.Matrix(4, 4), alpha=False)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    if ImageOps is not None:
                        img = ImageOps.autocontrast(ImageOps.grayscale(img))
                    # Certificates often use table layouts. Combine normal block
                    # reading with sparse-table reading so totals in the footer are
                    # not lost by a single page segmentation mode.
                    print(f"\n------ PAGE {i+1} ------")
                    page_text_6 = pytesseract.image_to_string(img, config='--oem 3 --psm 6')
                    page_text_4 = pytesseract.image_to_string(img, config='--oem 3 --psm 4')
                    page_text = "\n".join(filter(None, [page_text_6, page_text_4]))
                    print(page_text[:1000])
                    if page_text:
                        ocr_texts.append(page_text)
                return "\n".join(ocr_texts).strip() if ocr_texts else None
            except Exception as e:
                print(f"[OCR LOCAL] PDF rendering + Tesseract failed: {e}")
                
        return text_content if text_content else None

    # 2. Handle image files
    elif file_ext in ['.jpg', '.jpeg', '.png', '.webp']:
        if pytesseract is not None and Image is not None:
            try:
                with Image.open(file_path) as img:
                    print("=" * 80)
                    print("OCR FILE:", file_path)
                    print("FILE EXISTS:", os.path.exists(file_path))
                    print("IMAGE SIZE:", img.size)
                    if ImageOps is not None:
                        img = ImageOps.exif_transpose(img)
                        img = ImageOps.autocontrast(ImageOps.grayscale(img))
                    # PSM 4 reliably captures certificate-table footers such as
                    # "Maximum 1200 / Total 1101"; PSM 6 is better for IDs.
                    text = "\n".join(filter(None, [
                        pytesseract.image_to_string(img, config='--oem 3 --psm 6'),
                        pytesseract.image_to_string(img, config='--oem 3 --psm 4')
                    ]))
                    print("OCR RESULT:")
                    print(text[:1000])
                    print("=" * 80)

                    if text.strip():
                        return text.strip()
            except Exception as e:
                print(f"[OCR LOCAL] Tesseract OCR failed on image: {e}")

        # The backend virtual environment may not include pytesseract even when
        # Windows Tesseract is installed. Invoke the local executable directly.
        text = "\n".join(filter(None, [
            _run_tesseract_cli(file_path, 6),
            _run_tesseract_cli(file_path, 4)
        ]))
        return text.strip() if text.strip() else None
            
    else:
        # Fallback text reading (for raw text files)
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception:
            return None


def extract_text(file_path):
    """Extract document text locally with PyMuPDF and Tesseract only."""
    local_text = _extract_text_locally(file_path)
    if local_text:
        print("\n===== OCR OUTPUT =====")
        print(local_text[:1000])
        print("======================\n")
        return local_text

    print("\n===== OCR FAILED =====")
    print(file_path)
    print("======================\n")
    return None
