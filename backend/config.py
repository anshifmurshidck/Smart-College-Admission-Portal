import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("JWT_SECRET", "tmec_fallback_session_secret_key_987654")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "tmec_secret_key_2026_jwt_auth_premium_app")
    
    # Database Settings
    MYSQL_HOST = os.getenv("DB_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("DB_PORT", "3306"))
    MYSQL_USER = os.getenv("DB_USER", "root")
    MYSQL_PASSWORD = os.getenv("DB_PASSWORD", "")
    MYSQL_DB = os.getenv("DB_NAME", "tmec_admission")
    
    FALLBACK_SQLITE = os.getenv("FALLBACK_SQLITE", "true").lower() in ("true", "1", "yes")
    SQLITE_PATH = os.path.join(os.path.dirname(__file__), "tmec_portal.db")
    
    # Upload Settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), os.getenv("UPLOAD_FOLDER", "uploads"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
