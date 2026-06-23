import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

BACKEND_APP_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_APP_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_APP_PATH))

from app.core.config import settings  # noqa: E402
from app.core.session import create_one_time_session_token  # noqa: E402
from app.database.session import get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    return TestClient(app)


class TestSessionExchange:
    def test_exchange_valid_token_sets_session_cookie(self, client):
        mock_user = MagicMock()
        mock_user.id = 42
        mock_user.email = "alumno@utec.edu.pe"
        mock_user.full_name = "Alumno"
        mock_user.is_onboarding_completed = True

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user

        def override_get_db():
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        token = create_one_time_session_token(42)

        try:
            with patch(
                "app.routers.auth._serialize_auth_user",
                return_value={
                    "id": 42,
                    "email": "alumno@utec.edu.pe",
                    "full_name": "Alumno",
                    "onboarding_completed": True,
                    "needs_terms": False,
                    "needs_terms_consent": False,
                    "needs_privacy_consent": False,
                    "profile_image_url": None,
                },
            ):
                response = client.post(
                    "/auth/session/exchange",
                    json={"session_token": token},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["user"]["email"] == "alumno@utec.edu.pe"
        assert data.get("access_token")
        assert settings.SESSION_COOKIE_NAME in response.cookies

    def test_exchange_rejects_reused_token(self, client):
        mock_user = MagicMock()
        mock_user.id = 7

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user

        def override_get_db():
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db
        token = create_one_time_session_token(7)

        try:
            with patch(
                "app.routers.auth._serialize_auth_user",
                return_value={
                    "id": 7,
                    "email": "alumno@utec.edu.pe",
                    "full_name": "Alumno",
                    "onboarding_completed": True,
                    "needs_terms": False,
                    "needs_terms_consent": False,
                    "needs_privacy_consent": False,
                    "profile_image_url": None,
                },
            ):
                first = client.post("/auth/session/exchange", json={"session_token": token})
                second = client.post("/auth/session/exchange", json={"session_token": token})
        finally:
            app.dependency_overrides.clear()

        assert first.status_code == 200
        assert second.status_code == 401

    def test_exchange_rejects_invalid_token(self, client):
        response = client.post(
            "/auth/session/exchange",
            json={"session_token": "not-a-valid-token"},
        )
        assert response.status_code == 401
