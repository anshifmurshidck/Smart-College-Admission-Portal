import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from backend.config import Config

# Import blueprints
from backend.routes.auth import auth_bp
from backend.routes.admissions import admissions_bp
from backend.routes.admin_api import admin_api_bp
from backend.routes.departments import departments_bp
from backend.routes.reports import reports_bp
from backend.routes.chatbot import chatbot_bp

# Initialize DB Manager to trigger schema check / setup on boot
from backend.db import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend client integrations
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    # Also support CORS for uploads route
    CORS(app, resources={r"/uploads/*": {"origins": "*"}})

    # Auto-create upload directory
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    # Register API blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admissions_bp, url_prefix='/api/admissions')
    app.register_blueprint(admin_api_bp, url_prefix='/api/admin')
    app.register_blueprint(departments_bp, url_prefix='/api/departments')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

    # Serve uploaded documents statically
    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        try:
            return send_from_directory(Config.UPLOAD_FOLDER, filename)
        except FileNotFoundError:
            return jsonify({'message': 'File not found'}), 404

    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = "Connected"
        db_type = "SQLite (Fallback)" if db.is_sqlite else "MySQL"
        if db.connection_error and not db.is_sqlite:
            db_status = f"Error: {db.connection_error}"
            
        return jsonify({
            'status': 'healthy',
            'college': 'Thought Minds Engineering College',
            'database': {
                'status': db_status,
                'type': db_type
            }
        }), 200

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
