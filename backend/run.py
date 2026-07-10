"""
Thought Minds Engineering College - Backend Server Startup Script
Run this file from the project root:
    python run.py

The Flask server will start on http://localhost:5000
SQLite fallback is enabled by default if MySQL is not configured.
"""
import sys
import os

# Force stdout/stderr to use UTF-8 and replace encoding errors to prevent crashes on Windows consoles
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Ensure this backend directory is on sys.path so its modules resolve when run directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    print("=" * 60)
    print("  Thought Minds Engineering College")
    print("  Smart Admission Portal - Backend API Server")
    print("=" * 60)
    print(f"  API: http://localhost:{port}/api")
    print(f"  Health: http://localhost:{port}/api/health")
    # Print whether Gemini API key is configured (do not print the actual key)
    try:
        import os
        gemini_present = bool(os.getenv('GEMINI_API_KEY'))
        print(f"  Gemini API Key Configured: {gemini_present}")
    except Exception:
        pass
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
