import os
import shutil
import cv2
import fitz  # PyMuPDF
import numpy as np
import pytesseract

def configure_tesseract():
    """Use an installed Tesseract binary without depending on one hardcoded path."""
    configured = os.getenv("TESSERACT_CMD", "").strip()
    
    # Resolve through shutil.which if available
    resolved_which = shutil.which("tesseract")
    
    candidates = [
        configured,
        resolved_which,
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ]

    local_appdata = os.getenv("LOCALAPPDATA")
    if local_appdata:
        candidates.append(os.path.join(local_appdata, "Tesseract-OCR", "tesseract.exe"))
        candidates.append(os.path.join(local_appdata, "Programs", "Tesseract-OCR", "tesseract.exe"))

    # Also check typical user profile paths just in case
    candidates.append(r"C:\Users\ARDHRA\AppData\Local\Tesseract-OCR\tesseract.exe")
    candidates.append(r"C:\Users\ARDHRA\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")

    for path in candidates:
        if path and os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            print(f"[OCR] Tesseract binary successfully configured at: {path}")
            return path

    print("[OCR WARNING] Tesseract binary could not be found automatically! Image OCR will be simulated.")
    return None

configure_tesseract()


def preprocess_image(image):
    # Convert to grayscale
    if len(image.shape) == 2:
        gray = image
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Enlarge small images
    h, w = gray.shape
    if w < 1800:
        scale = 1800 / w
        gray = cv2.resize(
            gray,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC
        )

    # Reduce noise
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Convert to black & white
    gray = cv2.threshold(
        gray,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )[1]

    return gray

def extract_text_from_image(file_path):
    """
    Extract text from JPG, JPEG and PNG images.
    """
    try:
        img = cv2.imread(file_path)

        if img is None:
            return ""

        processed = preprocess_image(img)

        # Default layout analysis is much more robust for structured documents like marksheets/IDs
        return pytesseract.image_to_string(processed)

    except Exception as e:
        print("Image OCR Error:", e)
        return ""


def extract_text_from_pdf(file_path):
    """
    Extract text from PDF.
    If the PDF already contains text, return it.
    Otherwise perform OCR.
    """
    try:
        text = ""

        pdf = fitz.open(file_path)

        for page in pdf:

            page_text = page.get_text()

            if page_text.strip():
                text += page_text
                continue

            pix = page.get_pixmap(dpi=300)

            img = np.frombuffer(
                pix.samples,
                dtype=np.uint8
            ).reshape(
                pix.height,
                pix.width,
                pix.n
            )

            if pix.n == 4:
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)

            processed = preprocess_image(img)

            text += pytesseract.image_to_string(processed)
            text += "\n"

        pdf.close()

        return text

    except Exception as e:
        print("PDF OCR Error:", e)
        return ""


def extract_text(file_path):
    """
    Automatically choose OCR based on file extension.
    """

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)

    if extension in [".png", ".jpg", ".jpeg"]:
        return extract_text_from_image(file_path)

    return ""