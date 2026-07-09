import sys
import os
import traceback
from flask import Flask, jsonify

# Add the project root to sys.path so the backend module can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)

try:
    from api.backend.app import app as backend_app
    app = backend_app
except Exception as e:
    err = traceback.format_exc()
    print("IMPORT ERROR: ", err)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return jsonify({"error": "Failed to load backend", "traceback": err}), 500
