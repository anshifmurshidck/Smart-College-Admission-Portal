import os
import random
import datetime
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend.db import db
from backend.config import Config

admissions_bp = Blueprint('admissions', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def generate_application_id():
    """Generates a unique application ID (e.g., APP-2026-8742)"""
    year = datetime.datetime.now().year
    while True:
        rand_num = random.randint(1000, 9999)
        app_id = f"APP-{year}-{rand_num}"
        # Check if exists
        exists = db.execute_read_one("SELECT id FROM applications WHERE id = %s", (app_id,))
        if not exists:
            return app_id

@admissions_bp.route('/apply', methods=['POST'])
def apply():
    try:
        # Retrieve form data
        full_name = request.form.get('fullName')
        email = request.form.get('email')
        phone = request.form.get('phone')
        address = request.form.get('address')
        dob = request.form.get('dob')
        gender = request.form.get('gender')
        parent_name = request.form.get('parentName')
        parent_phone = request.form.get('parentPhone')
        department_id = request.form.get('departmentId')
        aadhaar_number = request.form.get('aadhaarNumber')
        state = request.form.get('state')
        tenth_percentage = request.form.get('tenthPercentage')
        twelfth_percentage = request.form.get('twelfthPercentage')

        # Basic validations
        if not all([full_name, email, phone, address, dob, gender, parent_name, parent_phone, department_id, aadhaar_number, state, tenth_percentage, twelfth_percentage]):
            return jsonify({'message': 'All form fields are required'}), 400

        try:
            department_id = int(department_id)
        except ValueError:
            return jsonify({'message': 'Invalid department selection'}), 400

        # Validate Aadhaar and Percentages
        if not aadhaar_number.isdigit() or len(aadhaar_number) != 12:
            return jsonify({'message': 'Aadhaar Number must be exactly 12 digits'}), 400

        try:
            tenth_percentage = float(tenth_percentage)
            twelfth_percentage = float(twelfth_percentage)
            if not (0 <= tenth_percentage <= 100) or not (0 <= twelfth_percentage <= 100):
                raise ValueError()
        except ValueError:
            return jsonify({'message': 'Academic percentages must be valid numbers between 0 and 100'}), 400

        # Validate file uploads
        files = {}
        for key in ['marksheet10', 'marksheet12', 'idProof']:
            if key not in request.files:
                return jsonify({'message': f'Document {key} is missing'}), 400
            file = request.files[key]
            if file.filename == '':
                return jsonify({'message': f'No file selected for {key}'}), 400
            if not allowed_file(file.filename):
                return jsonify({'message': f'Invalid file format for {key}. Only PDF, PNG, JPG, JPEG are allowed.'}), 400
            files[key] = file

        # Verify department exists
        dept = db.execute_read_one("SELECT id FROM departments WHERE id = %s", (department_id,))
        if not dept:
            return jsonify({'message': 'Selected department does not exist'}), 404

        # Generate unique Application ID
        app_id = generate_application_id()

        # Create upload subfolder
        app_upload_dir = os.path.join(Config.UPLOAD_FOLDER, app_id)
        os.makedirs(app_upload_dir, exist_ok=True)

        # Save files
        saved_documents = []
        doc_type_mapping = {
            'marksheet10': '10th Marksheet',
            'marksheet12': '12th Marksheet',
            'idProof': 'ID Proof'
        }

        for file_key, file in files.items():
            ext = file.filename.rsplit('.', 1)[1].lower()
            safe_name = f"{file_key}_{secure_filename(file.filename)}"
            # Avoid long filenames causing errors
            if len(safe_name) > 100:
                safe_name = f"{file_key}_{random.randint(100,999)}.{ext}"
            
            filepath = os.path.join(app_upload_dir, safe_name)
            file.save(filepath)
            
            # Save relative path for easy URL references
            rel_path = f"uploads/{app_id}/{safe_name}"
            saved_documents.append({
                'type': doc_type_mapping[file_key],
                'path': rel_path
            })

        # Insert Application to database
        db.execute_write(
            """INSERT INTO applications 
            (id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, department_id, aadhaar_number, state, tenth_percentage, twelfth_percentage, status) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending')""",
            (app_id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, department_id, aadhaar_number, state, tenth_percentage, twelfth_percentage)
        )

        # Insert Documents
        for doc in saved_documents:
            db.execute_write(
                "INSERT INTO documents (application_id, document_type, file_path) VALUES (%s, %s, %s)",
                (app_id, doc['type'], doc['path'])
            )

        # Insert Status History
        db.execute_write(
            "INSERT INTO status_history (application_id, status, comments, updated_by) VALUES (%s, 'Pending', %s, NULL)",
            (app_id, "Application submitted successfully and is awaiting verification.")
        )

        return jsonify({
            'message': 'Application submitted successfully',
            'applicationId': app_id
        }), 201

    except Exception as e:
        print(f"[ADMISSION] Error saving application: {e}")
        return jsonify({'message': 'An internal error occurred while processing application', 'error': str(e)}), 500

@admissions_bp.route('/track/<string:app_id>', methods=['GET'])
def track_status(app_id):
    try:
        # Fetch application details
        application = db.execute_read_one(
            """SELECT a.*, d.name as department_name, d.code as department_code 
               FROM applications a
               JOIN departments d ON a.department_id = d.id 
               WHERE a.id = %s""",
            (app_id,)
        )

        if not application:
            return jsonify({'message': 'Application not found'}), 404

        # Fetch status history timeline
        history = db.execute_read(
            """SELECT status, comments, updated_at 
               FROM status_history 
               WHERE application_id = %s 
               ORDER BY updated_at ASC""",
            (app_id,)
        )

        return jsonify({
            'application': {
                'id': application['id'],
                'fullName': application['full_name'],
                'email': application['email'],
                'status': application['status'],
                'departmentName': application['department_name'],
                'departmentCode': application['department_code'],
                'studentId': application['assigned_student_id'],
                'createdAt': application['created_at'],
                'aadhaarNumber': application.get('aadhaar_number'),
                'state': application.get('state'),
                'tenthPercentage': float(application['tenth_percentage']) if application.get('tenth_percentage') is not None else None,
                'twelfthPercentage': float(application['twelfth_percentage']) if application.get('twelfth_percentage') is not None else None
            },
            'timeline': history
        }), 200

    except Exception as e:
        return jsonify({'message': 'Error tracking application', 'error': str(e)}), 500
