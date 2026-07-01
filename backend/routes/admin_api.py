import datetime
import random
import csv
from io import StringIO
from flask import Blueprint, request, jsonify, make_response
from backend.db import db
from backend.middlewares.auth import token_required

admin_api_bp = Blueprint('admin_api', __name__)

@admin_api_bp.route('/dashboard-stats', methods=['GET'])
@token_required()
def get_dashboard_stats(current_user):
    try:
        # 1. Card stats
        total = db.execute_read_one("SELECT COUNT(*) as count FROM applications")['count']
        approved = db.execute_read_one("SELECT COUNT(*) as count FROM applications WHERE status = 'Approved'")['count']
        rejected = db.execute_read_one("SELECT COUNT(*) as count FROM applications WHERE status = 'Rejected'")['count']
        pending = db.execute_read_one("SELECT COUNT(*) as count FROM applications WHERE status = 'Pending' OR status = 'Under Verification'")['count']

        # 2. Department-wise applications
        dept_stats = db.execute_read(
            """SELECT d.name, d.code, COUNT(a.id) as count 
               FROM departments d 
               LEFT JOIN applications a ON a.department_id = d.id 
               GROUP BY d.id"""
        )

        # 3. Monthly admissions (last 6 months)
        # SQLite vs MySQL date formatting
        if db.is_sqlite:
            monthly_stats = db.execute_read(
                """SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count 
                   FROM applications 
                   WHERE status = 'Approved' 
                   GROUP BY month 
                   ORDER BY month DESC 
                   LIMIT 6"""
            )
        else:
            monthly_stats = db.execute_read(
                """SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count 
                   FROM applications 
                   WHERE status = 'Approved' 
                   GROUP BY month 
                   ORDER BY month DESC 
                   LIMIT 6"""
            )

        # Ensure order is chronological
        monthly_stats.reverse()

        # 4. Recent activity log (latest 5 application submissions/updates)
        recent_activity = db.execute_read(
            """SELECT a.id, a.full_name, a.status, a.created_at, d.code as department_code 
               FROM applications a
               JOIN departments d ON a.department_id = d.id
               ORDER BY a.created_at DESC 
               LIMIT 5"""
        )

        return jsonify({
            'cards': {
                'total': total,
                'approved': approved,
                'rejected': rejected,
                'pending': pending
            },
            'departments': dept_stats,
            'monthly': monthly_stats,
            'activity': recent_activity
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving dashboard stats', 'error': str(e)}), 500


@admin_api_bp.route('/applications', methods=['GET'])
@token_required()
def get_applications(current_user):
    try:
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        dept_id = request.args.get('departmentId', '').strip()
        sort_by = request.args.get('sortBy', 'created_at').strip()
        sort_order = request.args.get('sortOrder', 'DESC').strip()

        # Security check on sort direction
        if sort_order not in ('ASC', 'DESC'):
            sort_order = 'DESC'
        
        allowed_sort_fields = {
            'created_at': 'a.created_at',
            'full_name': 'a.full_name',
            'status': 'a.status',
            'id': 'a.id'
        }
        sort_col = allowed_sort_fields.get(sort_by, 'a.created_at')

        query = """SELECT a.*, d.name as department_name, d.code as department_code 
                   FROM applications a 
                   JOIN departments d ON a.department_id = d.id 
                   WHERE 1=1"""
        params = []

        if search:
            query += " AND (a.full_name LIKE %s OR a.id LIKE %s OR a.email LIKE %s OR a.phone LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param, search_param])

        if status:
            query += " AND a.status = %s"
            params.append(status)

        if dept_id:
            query += " AND a.department_id = %s"
            params.append(int(dept_id))

        query += f" ORDER BY {sort_col} {sort_order}"

        apps = db.execute_read(query, tuple(params))
        return jsonify(apps), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving applications', 'error': str(e)}), 500


@admin_api_bp.route('/applications/<string:app_id>', methods=['GET'])
@token_required()
def get_application_details(current_user, app_id):
    try:
        application = db.execute_read_one(
            """SELECT a.*, d.name as department_name, d.code as department_code 
               FROM applications a
               JOIN departments d ON a.department_id = d.id 
               WHERE a.id = %s""",
            (app_id,)
        )
        if not application:
            return jsonify({'message': 'Application not found'}), 404

        documents = db.execute_read("SELECT id, document_type, file_path FROM documents WHERE application_id = %s", (app_id,))
        timeline = db.execute_read(
            """SELECT h.*, adm.name as updater_name 
               FROM status_history h 
               LEFT JOIN admins adm ON h.updated_by = adm.id 
               WHERE h.application_id = %s 
               ORDER BY h.updated_at DESC""",
            (app_id,)
        )

        return jsonify({
            'application': application,
            'documents': documents,
            'timeline': timeline
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving application details', 'error': str(e)}), 500


def generate_student_id():
    """Generates next Student ID in the format TMEC-YYYY-XXXX (e.g., TMEC-2026-0001)"""
    year = datetime.datetime.now().year
    prefix = f"TMEC-{year}-"
    
    # Query count of students in current year
    query = "SELECT id FROM students WHERE id LIKE %s"
    year_students = db.execute_read(query, (f"{prefix}%",))
    
    count = len(year_students)
    next_num = count + 1
    
    while True:
        serial = f"{next_num:04d}" # 4 digits padded with zeros
        student_id = f"{prefix}{serial}"
        
        # Verify uniqueness
        exists = db.execute_read_one("SELECT id FROM students WHERE id = %s", (student_id,))
        if not exists:
            return student_id
        next_num += 1


@admin_api_bp.route('/applications/<string:app_id>/status', methods=['POST'])
@token_required()
def update_application_status(current_user, app_id):
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        comments = data.get('comments', '').strip()

        if not new_status or new_status not in ('Pending', 'Under Verification', 'Approved', 'Rejected'):
            return jsonify({'message': 'Invalid status update request'}), 400

        # Retrieve current application
        app = db.execute_read_one("SELECT * FROM applications WHERE id = %s", (app_id,))
        if not app:
            return jsonify({'message': 'Application not found'}), 404

        if app['status'] == 'Approved' and new_status != 'Approved':
            return jsonify({'message': 'Cannot change status of already approved application'}), 400

        student_id = app['assigned_student_id']

        # Auto-registration block on Approval
        if new_status == 'Approved' and app['status'] != 'Approved':
            if not student_id:
                student_id = generate_student_id()
                
                # Check if student record already exists to prevent duplicate insertion
                existing_student = db.execute_read_one("SELECT id FROM students WHERE application_id = %s", (app_id,))
                if not existing_student:
                    # Insert into students
                    db.execute_write(
                        """INSERT INTO students (id, application_id, full_name, email, phone, dob, gender, department_id) 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                        (student_id, app_id, app['full_name'], app['email'], app['phone'], app['dob'], app['gender'], app['department_id'])
                    )
                
                # Update assigned student ID in application
                db.execute_write("UPDATE applications SET assigned_student_id = %s WHERE id = %s", (student_id, app_id))
            
            if not comments:
                comments = "Congratulations! Your application has been approved. Assigned Student ID: " + student_id

        # Update application status
        db.execute_write(
            "UPDATE applications SET status = %s WHERE id = %s",
            (new_status, app_id)
        )

        # Write status log
        db.execute_write(
            "INSERT INTO status_history (application_id, status, comments, updated_by) VALUES (%s, %s, %s, %s)",
            (app_id, new_status, comments, current_user['id'])
        )

        return jsonify({
            'message': f'Application status updated to {new_status}',
            'status': new_status,
            'studentId': student_id
        }), 200

    except Exception as e:
        print(f"[STATUS UPDATE ERROR]: {e}")
        return jsonify({'message': 'Error updating application status', 'error': str(e)}), 500


@admin_api_bp.route('/students', methods=['GET'])
@token_required()
def get_students(current_user):
    try:
        search = request.args.get('search', '').strip()
        dept_id = request.args.get('departmentId', '').strip()
        export_csv = request.args.get('export', '').lower() == 'csv'

        query = """SELECT s.*, d.name as department_name, d.code as department_code 
                   FROM students s
                   JOIN departments d ON s.department_id = d.id 
                   WHERE 1=1"""
        params = []

        if search:
            query += " AND (s.full_name LIKE %s OR s.id LIKE %s OR s.email LIKE %s OR s.phone LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param, search_param])

        if dept_id:
            query += " AND s.department_id = %s"
            params.append(int(dept_id))

        query += " ORDER BY s.enroll_date DESC"

        students = db.execute_read(query, tuple(params))

        # Handle CSV Export
        if export_csv:
            si = StringIO()
            cw = csv.writer(si)
            # Write Header
            cw.writerow(['Student ID', 'Application ID', 'Full Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Department', 'Enroll Date'])
            # Write Rows
            for s in students:
                cw.writerow([
                    s['id'],
                    s['application_id'],
                    s['full_name'],
                    s['email'],
                    s['phone'],
                    str(s['dob']),
                    s['gender'],
                    s['department_name'],
                    str(s['enroll_date'])
                ])
            
            output = make_response(si.getvalue())
            output.headers["Content-Disposition"] = "attachment; filename=students_database.csv"
            output.headers["Content-type"] = "text/csv"
            return output

        return jsonify(students), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving students', 'error': str(e)}), 500


@admin_api_bp.route('/students/<string:student_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required()
def handle_student(current_user, student_id):
    try:
        if request.method == 'GET':
            student = db.execute_read_one(
                """SELECT s.*, d.name as department_name, d.code as department_code, a.address 
                   FROM students s
                   JOIN departments d ON s.department_id = d.id 
                   LEFT JOIN applications a ON s.application_id = a.id
                   WHERE s.id = %s""",
                (student_id,)
            )
            if not student:
                return jsonify({'message': 'Student not found'}), 404
            
            # Fetch student documents via application
            documents = db.execute_read("SELECT id, document_type, file_path FROM documents WHERE application_id = %s", (student['application_id'],))
            return jsonify({
                'student': student,
                'documents': documents
            }), 200

        elif request.method == 'PUT':
            data = request.get_json() or {}
            full_name = data.get('full_name')
            email = data.get('email')
            phone = data.get('phone')
            dob = data.get('dob')
            gender = data.get('gender')
            dept_id = data.get('department_id')
            aadhaar_number = data.get('aadhaar_number')
            state = data.get('state')
            tenth_percentage = data.get('tenth_percentage')
            twelfth_percentage = data.get('twelfth_percentage')

            if not all([full_name, email, phone, dob, gender, dept_id]):
                return jsonify({'message': 'All profile fields are required'}), 400

            if not aadhaar_number or not isinstance(aadhaar_number, str) or not aadhaar_number.isdigit() or len(aadhaar_number) != 12:
                return jsonify({'message': 'Aadhaar Number must be exactly 12 digits'}), 400

            try:
                birth_date = datetime.datetime.strptime(dob, '%Y-%m-%d').date()
                today = datetime.date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                if age < 17:
                    return jsonify({'message': 'Student must be at least 17 years old'}), 400
            except (ValueError, TypeError):
                return jsonify({'message': 'Invalid Date of Birth format'}), 400

            # Verify student exists
            tenth_str = str(tenth_percentage).strip()
            twelfth_str = str(twelfth_percentage).strip()
            import re
            if not re.match(r'^\d+(\.\d{1,2})?$', tenth_str) or not re.match(r'^\d+(\.\d{1,2})?$', twelfth_str):
                return jsonify({'message': 'Academic percentages must have at most 2 decimal places (e.g. 78.90)'}), 400
            student = db.execute_read_one("SELECT * FROM students WHERE id = %s", (student_id,))
            if not student:
                return jsonify({'message': 'Student not found'}), 404

            # Update student row
            db.execute_write(
                """UPDATE students 
                   SET full_name = %s, email = %s, phone = %s, dob = %s, gender = %s, department_id = %s 
                   WHERE id = %s""",
                (full_name, email, phone, dob, gender, int(dept_id), student_id)
            )

            # Keep application details in sync
            db.execute_write(
                """UPDATE applications 
                   SET full_name = %s, email = %s, phone = %s, dob = %s, gender = %s, department_id = %s,
                       aadhaar_number = %s, state = %s, tenth_percentage = %s, twelfth_percentage = %s
                   WHERE id = %s""",
                (full_name, email, phone, dob, gender, int(dept_id), aadhaar_number, state, tenth_percentage, twelfth_percentage, student['application_id'])
            )

            return jsonify({'message': 'Student profile updated successfully'}), 200

        elif request.method == 'DELETE':
            # Delete student (doesn't delete application to preserve logs, but sets assigned student id back to NULL or we can leave it)
            student = db.execute_read_one("SELECT * FROM students WHERE id = %s", (student_id,))
            if not student:
                return jsonify({'message': 'Student not found'}), 404

            db.execute_write("UPDATE applications SET assigned_student_id = NULL, status = 'Pending' WHERE id = %s", (student['application_id'],))
            db.execute_write("DELETE FROM students WHERE id = %s", (student_id,))
            
            return jsonify({'message': 'Student deleted successfully'}), 200

    except Exception as e:
        return jsonify({'message': 'Error processing student action', 'error': str(e)}), 500


@admin_api_bp.route('/students/add', methods=['POST'])
@token_required()
def add_student_manual(current_user):
    """Allows manual student addition by Admins"""
    try:
        data = request.get_json() or {}
        full_name = data.get('fullName')
        email = data.get('email')
        phone = data.get('phone')
        dob = data.get('dob')
        gender = data.get('gender')
        dept_id = data.get('departmentId')
        address = data.get('address', 'Manually Registered by Admin')

        if not all([full_name, email, phone, dob, gender, dept_id]):
            return jsonify({'message': 'All form fields are required'}), 400

        # Create dummy application for registration sync
        year = datetime.datetime.now().year
        rand_num = random.randint(10000, 99999)
        dummy_app_id = f"MAN-{year}-{rand_num}"

        # Insert dummy app
        db.execute_write(
            """INSERT INTO applications 
            (id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, department_id, status) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'N/A', 'N/A', %s, 'Approved')""",
            (dummy_app_id, full_name, email, phone, address, dob, gender, int(dept_id))
        )

        student_id = generate_student_id()
        
        # Insert student
        db.execute_write(
            """INSERT INTO students (id, application_id, full_name, email, phone, dob, gender, department_id) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (student_id, dummy_app_id, full_name, email, phone, dob, gender, int(dept_id))
        )

        # Update assigned ID
        db.execute_write("UPDATE applications SET assigned_student_id = %s WHERE id = %s", (student_id, dummy_app_id))

        return jsonify({
            'message': 'Student added successfully',
            'studentId': student_id
        }), 201
    except Exception as e:
        return jsonify({'message': 'Error adding student', 'error': str(e)}), 500
