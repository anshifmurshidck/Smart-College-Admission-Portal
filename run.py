"""
Thought Minds Engineering College - Backend Server Startup Script
Run this file from the project root:
    python run.py

The Flask server will start on http://localhost:5000
SQLite fallback is enabled by default if MySQL is not configured.
"""
import sys
import os

# Reconfigure stdout/stderr to UTF-8 to prevent charmap encoding errors on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure the project root is in sys.path so `backend` resolves as a package
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import app

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    print("=" * 60)
    print("  Thought Minds Engineering College")
    print("  Smart Admission Portal - Backend API Server")
    print("=" * 60)
    print(f"  API: http://localhost:{port}/api")
    print(f"  Health: http://localhost:{port}/api/health")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=True)
