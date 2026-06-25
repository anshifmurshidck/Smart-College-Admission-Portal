from flask import Blueprint, jsonify
from backend.db import db

departments_bp = Blueprint('departments', __name__)

@departments_bp.route('', methods=['GET'])
def get_departments():
    try:
        depts = db.execute_read("SELECT id, name, code, description, head_of_department, email, phone, banner_url FROM departments")
        return jsonify(depts), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving departments', 'error': str(e)}), 500

@departments_bp.route('/<int:dept_id>', methods=['GET'])
def get_department(dept_id):
    try:
        dept = db.execute_read_one("SELECT * FROM departments WHERE id = %s", (dept_id,))
        if not dept:
            return jsonify({'message': 'Department not found'}), 404
        return jsonify(dept), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving department', 'error': str(e)}), 500
