from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from backend.db import db
from backend.config import Config
from backend.middlewares.auth import token_required

auth_bp = Blueprint('auth', __name__)


def verify_admin_password(username, stored_hash, password):
    """Validate an admin password while supporting legacy placeholder hashes."""
    if username == Config.ADMIN_USERNAME and password == Config.ADMIN_PASSWORD:
        return True

    if not stored_hash or not password:
        return False

    if stored_hash == 'pbkdf2:sha256:600000$admin123_placeholder':
        return password in {Config.ADMIN_PASSWORD, 'admin123'}

    return check_password_hash(stored_hash, password)


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
    password_correct = verify_admin_password(username, stored_hash, password)

    if password_correct and (stored_hash == 'pbkdf2:sha256:600000$admin123_placeholder' or (username == Config.ADMIN_USERNAME and password == Config.ADMIN_PASSWORD)):
        # Replace legacy placeholder hashes with a proper hash for the configured password.
        new_hash = generate_password_hash(Config.ADMIN_PASSWORD)
        db.execute_write("UPDATE admins SET password_hash = %s WHERE id = %s", (new_hash, admin['id']))

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
