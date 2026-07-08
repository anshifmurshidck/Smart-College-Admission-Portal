import os
import cv2
import fitz  # PyMuPDF
import numpy as np
import pytesseract

# Tell Python where Tesseract is installed
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def preprocess_image(image):

    # Convert to grayscale
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

        return pytesseract.image_to_string(
            processed,
            config="--oem 3 --psm 11"
        )

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