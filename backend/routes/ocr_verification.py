from flask import Blueprint, request, jsonify
from backend.ocr_utils import extract_text_from_pdf
from backend.verification import verify_marks

ocr_bp = Blueprint("ocr", __name__)

@ocr_bp.route("/verify", methods=["POST"])
def verify_document():

    if "marksheet" not in request.files:
        return jsonify({"error": "No marksheet uploaded"}), 400

    file = request.files["marksheet"]

    file_bytes = file.read()

    extracted_text = extract_text_from_pdf(file_bytes)

    if extracted_text is None:
        return jsonify({"error": "OCR failed"}), 400

    form_marks = {
        "Mathematics": request.form.get("Mathematics"),
        "Physics": request.form.get("Physics"),
        "Chemistry": request.form.get("Chemistry"),
        "English": request.form.get("English"),
    }

    result = verify_marks(form_marks, extracted_text)

    return jsonify({
        "ocr_text": extracted_text,
        "verification": result
    })