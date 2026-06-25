from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from backend.db import db
from backend.config import Config
from backend.middlewares.auth import token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    admin = db.execute_read_one("SELECT * FROM admins WHERE username = %s", (username,))
    if not admin:
        return jsonify({'message': 'Invalid username or password'}), 401

    # Check password
    stored_hash = admin['password_hash']
    password_correct = False

    # Dynamic fallback check for setup convenience
    if stored_hash == 'pbkdf2:sha256:600000$admin123_placeholder':
        if password == 'admin123':
            # Hash properly and update database
            new_hash = generate_password_hash('admin123')
            db.execute_write("UPDATE admins SET password_hash = %s WHERE id = %s", (new_hash, admin['id']))
            password_correct = True
    else:
        password_correct = check_password_hash(stored_hash, password)

    if not password_correct:
        return jsonify({'message': 'Invalid username or password'}), 401

    # Generate JWT Token (expires in 24 hours)
    payload = {
        'id': admin['id'],
        'username': admin['username'],
        'email': admin['email'],
        'role': admin['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    
    token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'admin': {
            'id': admin['id'],
            'username': admin['username'],
            'name': admin['name'],
            'email': admin['email'],
            'role': admin['role']
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required()
def get_me(current_user):
    return jsonify({
        'admin': current_user
    }), 200
