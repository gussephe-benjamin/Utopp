import os
import sys
from pathlib import Path

import pytest

BACKEND_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from app.core.config import Settings, validate_deployment_settings  # noqa: E402


def test_cors_origins_includes_frontend_url(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://mi-front.onrender.com")
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://extra.example.com")
    cfg = Settings()
    origins = cfg.cors_origins()
    assert "https://mi-front.onrender.com" in origins
    assert "https://extra.example.com" in origins
    assert "http://localhost:5173" in origins


def test_validate_warns_on_localhost_redirect_with_https_frontend(caplog, monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://utopp-fronted.onrender.com")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    from app.core import config

    config.settings = Settings()
    with caplog.at_level("WARNING"):
        validate_deployment_settings()
    assert any("localhost" in record.message for record in caplog.records)


def test_cookie_samesite_normalized(monkeypatch):
    monkeypatch.setenv("COOKIE_SAMESITE", "None")
    cfg = Settings()
    assert cfg.COOKIE_SAMESITE == "none"
