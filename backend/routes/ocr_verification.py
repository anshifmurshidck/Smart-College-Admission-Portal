import os
import tempfile
from flask import Blueprint, request, jsonify
from backend.ocr_utils import extract_text
from backend.verification import verify_marks

ocr_bp = Blueprint("ocr", __name__)

@ocr_bp.route("/verify", methods=["POST"])
def verify_document():

    if "marksheet" not in request.files:
        return jsonify({"error": "No marksheet uploaded"}), 400

    file = request.files["marksheet"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp:
        file.save(temp.name)
        file_path = temp.name

    try:
        extracted_text = extract_text(file_path)
    finally:
        os.remove(file_path)

    if not extracted_text:
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