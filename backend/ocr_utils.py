import easyocr
import fitz  # PyMuPDF
import numpy as np

# Initialize OCR Reader once
reader = easyocr.Reader(['en'], gpu=False)


def extract_text_from_pdf(file_bytes):
    try:
        text = ""

        pdf = fitz.open(stream=file_bytes, filetype="pdf")

        for page in pdf:
            pix = page.get_pixmap()
            img = np.frombuffer(pix.samples, dtype=np.uint8)
            img = img.reshape(pix.height, pix.width, pix.n)

            result = reader.readtext(img, detail=0)

            page_text = " ".join(result)
            text += page_text + " "

        if not text.strip():
            return None

        return text.strip()

    except Exception as e:
        print("OCR Extraction Error:", e)
        return None