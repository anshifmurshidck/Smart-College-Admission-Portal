import os
from dotenv import load_dotenv

# Load environment variables from backend/.env (backend-specific variables)
backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path, override=True)


class Config:
    SECRET_KEY = os.getenv("JWT_SECRET", "tmec_fallback_session_secret_key_987654")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "tmec_secret_key_2026_jwt_auth_premium_app")

    # Admin Credentials
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
    
    # Database Settings
    MYSQL_HOST = os.getenv("DB_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("DB_PORT", "3306"))
    MYSQL_USER = os.getenv("DB_USER", "root")
    MYSQL_PASSWORD = os.getenv("DB_PASSWORD", "")
    MYSQL_DB = os.getenv("DB_NAME", "tmec_admission")
    
    FALLBACK_SQLITE = os.getenv("FALLBACK_SQLITE", "true").lower() in ("true", "1", "yes")

    # DATA_DIR lets hosts with ephemeral/read-only filesystems (e.g. Render) point
    # SQLite + uploads at a writable location such as /tmp or a mounted disk.
    DATA_DIR = os.getenv("DATA_DIR", os.path.dirname(__file__))
    SQLITE_PATH = os.path.join(DATA_DIR, "tmec_portal.db")
    UPLOAD_FOLDER = os.path.join(DATA_DIR, os.getenv("UPLOAD_FOLDER", "uploads"))
    
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
