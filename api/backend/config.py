import os
from dotenv import load_dotenv

# Load environment variables
# 1. Load from root .env first
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(root_env_path):
    load_dotenv(root_env_path, override=True)

# 2. Load from api.backend/.env second (so backend-specific variables override root/system variables)
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
    
    if os.getenv("VERCEL"):
        SQLITE_PATH = "/tmp/tmec_portal_v4.db"
    else:
        SQLITE_PATH = os.path.join(os.path.dirname(__file__), "tmec_portal.db")
    
    if os.getenv("VERCEL"):
        UPLOAD_FOLDER = "/tmp/uploads"
    else:
        UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), os.getenv("UPLOAD_FOLDER", "uploads"))
    
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
