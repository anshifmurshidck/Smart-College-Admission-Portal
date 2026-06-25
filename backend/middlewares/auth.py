from functools import wraps
from flask import request, jsonify
import jwt
from backend.config import Config

def token_required(allowed_roles=None):
    """
    Decorator to protect Flask endpoints with JWT authorization.
    Can optionally restrict access to a list of allowed roles.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            # Check Authorization header (expected format: Bearer <token>)
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(" ")[1]

            if not token:
                return jsonify({'message': 'Authorization token is missing', 'error': 'Unauthorized'}), 401

            try:
                # Decode JWT using config secret key
                data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
                current_user = {
                    'id': data.get('id'),
                    'username': data.get('username'),
                    'email': data.get('email'),
                    'role': data.get('role', 'admin') # Default to admin
                }
                
                # Check roles if specified
                if allowed_roles and current_user['role'] not in allowed_roles:
                    return jsonify({'message': 'Access forbidden: Insufficient permissions', 'error': 'Forbidden'}), 403

            except jwt.ExpiredSignatureError:
                return jsonify({'message': 'Authorization token has expired', 'error': 'TokenExpired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'message': 'Authorization token is invalid', 'error': 'InvalidToken'}), 401

            return f(current_user, *args, **kwargs)
        return decorated
    return decorator
