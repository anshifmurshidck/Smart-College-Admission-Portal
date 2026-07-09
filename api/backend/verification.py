import re

def extract_marks(ocr_text):
    marks = {}

    patterns = [
        r"(Mathematics|Maths|Physics|Chemistry|Biology|English)\s*[:\-]?\s*(\d+)",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, ocr_text, re.IGNORECASE)

        for subject, mark in matches:
            marks[subject.lower()] = int(mark)

    return marks


def verify_marks(form_marks, ocr_text):

    extracted_marks = extract_marks(ocr_text)

    result = {
        "verified": True,
        "mismatches": []
    }

    for subject, entered_mark in form_marks.items():

        ocr_mark = extracted_marks.get(subject.lower())

        if ocr_mark is None:
            result["verified"] = False
            result["mismatches"].append(
                f"{subject} not found in marksheet"
            )

        elif int(entered_mark) != int(ocr_mark):
            result["verified"] = False
            result["mismatches"].append(
                f"{subject}: Form={entered_mark}, OCR={ocr_mark}"
            )

    return result