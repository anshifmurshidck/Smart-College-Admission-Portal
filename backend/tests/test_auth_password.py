from backend.routes.auth import verify_admin_password
from backend.config import Config


def test_verify_admin_password_accepts_configured_password(monkeypatch):
    monkeypatch.setattr(Config, "ADMIN_USERNAME", "superadmin", raising=False)
    monkeypatch.setattr(Config, "ADMIN_PASSWORD", "SecurePass123", raising=False)
    assert verify_admin_password("superadmin", "invalid-hash", "SecurePass123") is True


def test_verify_admin_password_accepts_placeholder_default_password():
    assert verify_admin_password("admin", "pbkdf2:sha256:600000$admin123_placeholder", "admin123") is True
