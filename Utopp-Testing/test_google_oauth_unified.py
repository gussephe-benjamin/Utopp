import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

BACKEND_APP_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_APP_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_APP_PATH))

from app.core.config import settings  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.database.session import get_db  # noqa: E402
from app.dependencies.auth import get_optional_user  # noqa: E402
from app.main import app  # noqa: E402
from app.services.google_oauth_service import (  # noqa: E402
    GoogleOAuthProfile,
    GoogleOAuthUpsertResult,
    upsert_user_from_google,
)
from app.services.google_token_service import UTEC_ACCESS_DENIED_MESSAGE  # noqa: E402


@pytest.fixture
def client():
    return TestClient(app)


class TestUnifiedGoogleOAuthEndpoints:
    def test_auth_me_unauthenticated(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 200
        assert response.json() == {"authenticated": False}

    def test_auth_me_authenticated(self, client):
        mock_user = MagicMock()
        mock_user.id = 42
        mock_user.email = "alumno@utec.edu.pe"
        mock_user.full_name = "Test User"
        mock_user.is_onboarding_completed = True

        def override_optional_user():
            return mock_user

        def override_get_db():
            yield MagicMock()

        app.dependency_overrides[get_optional_user] = override_optional_user
        app.dependency_overrides[get_db] = override_get_db

        try:
            with patch(
                "app.routers.auth._serialize_auth_user",
                return_value={
                    "id": 42,
                    "email": "alumno@utec.edu.pe",
                    "full_name": "Test User",
                    "onboarding_completed": True,
                    "needs_terms": False,
                    "needs_terms_consent": False,
                    "needs_privacy_consent": False,
                    "profile_image_url": None,
                },
            ):
                client.cookies.set(settings.SESSION_COOKIE_NAME, create_access_token("42"))
                response = client.get("/auth/me")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["user"]["email"] == "alumno@utec.edu.pe"

    def test_google_login_redirects(self, client):
        with patch("app.routers.auth.build_google_auth_url", return_value="https://google.test/auth"):
            response = client.get("/auth/google/login", follow_redirects=False)
        assert response.status_code == 302
        assert response.headers["location"] == "https://google.test/auth"
        assert settings.OAUTH_STATE_COOKIE_NAME in response.cookies
        assert settings.OAUTH_PKCE_COOKIE_NAME in response.cookies

    def test_logout_clears_session_cookie(self, client):
        response = client.post("/auth/logout")
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_callback_rejects_invalid_state(self, client):
        response = client.get(
            "/auth/google/callback?code=abc&state=wrong",
            cookies={settings.OAUTH_STATE_COOKIE_NAME: "expected"},
            follow_redirects=False,
        )
        assert response.status_code == 302
        assert "/login?error=access_denied" in response.headers["location"]

    def test_callback_utec_rejection_redirects_not_utec_email(self, client):
        with patch(
            "app.routers.auth.resolve_google_oauth_code",
            side_effect=HTTPException(
                status_code=403,
                detail=UTEC_ACCESS_DENIED_MESSAGE,
            ),
        ):
            response = client.get(
                "/auth/google/callback?code=valid&state=csrf",
                cookies={settings.OAUTH_STATE_COOKIE_NAME: "csrf"},
                follow_redirects=False,
            )

        assert response.status_code == 302
        assert "error=not_utec_email" in response.headers["location"]
        assert "error=access_denied" not in response.headers["location"]

    def test_callback_success_sets_session_cookie(self, client):
        mock_user = MagicMock()
        mock_user.id = 42
        mock_user.is_onboarding_completed = True
        mock_profile = MagicMock()
        mock_profile.email = "alumno@utec.edu.pe"
        mock_profile.full_name = "Alumno"
        mock_profile.google_id = "gid"
        mock_profile.picture = None
        mock_result = MagicMock()
        mock_result.user = mock_user
        mock_result.profile = mock_profile

        with (
            patch(
                "app.routers.auth.resolve_google_oauth_code",
                return_value=mock_result,
            ),
            patch(
                "app.routers.auth.legal_service.user_has_required_legal_consent",
                return_value=True,
            ),
        ):
            response = client.get(
                "/auth/google/callback?code=valid&state=csrf",
                cookies={settings.OAUTH_STATE_COOKIE_NAME: "csrf"},
                follow_redirects=False,
            )

        assert response.status_code == 302
        assert settings.SESSION_COOKIE_NAME in response.cookies
        assert "/auth/callback" in response.headers["location"]
        assert "session_token=" in response.headers["location"]

    def test_callback_new_user_redirects_to_register(self, client):
        mock_profile = MagicMock()
        mock_profile.email = "nuevo@utec.edu.pe"
        mock_profile.full_name = "Nuevo"
        mock_profile.google_id = "gid-new"
        mock_profile.picture = None
        mock_result = MagicMock()
        mock_result.user = None
        mock_result.profile = mock_profile

        with patch(
            "app.routers.auth.resolve_google_oauth_code",
            return_value=mock_result,
        ):
            response = client.get(
                "/auth/google/callback?code=valid&state=csrf",
                cookies={settings.OAUTH_STATE_COOKIE_NAME: "csrf"},
                follow_redirects=False,
            )

        assert response.status_code == 302
        assert "google_register=1" in response.headers["location"]
        assert "pending_token=" in response.headers["location"]
        assert settings.OAUTH_PENDING_COOKIE_NAME in response.cookies
        assert settings.SESSION_COOKIE_NAME not in response.cookies

    def test_upsert_existing_user_is_login(self):
        db = MagicMock()
        existing = MagicMock()
        existing.google_id = "gid"
        existing.full_name = "Existing"

        profile = GoogleOAuthProfile(
            email="alumno@utec.edu.pe",
            full_name="Google Name",
            google_id="gid",
            picture=None,
        )

        with patch("app.services.google_oauth_service.get_user_by_email", return_value=existing):
            result = upsert_user_from_google(db, profile)

        assert result.is_new_user is False
        assert result.user is existing
        db.commit.assert_called_once()

    def test_upsert_new_user_is_register(self):
        db = MagicMock()
        created = MagicMock()
        created.id = 7

        profile = GoogleOAuthProfile(
            email="nuevo@utec.edu.pe",
            full_name="Nuevo",
            google_id="gid-new",
            picture="https://example.com/p.jpg",
        )

        with (
            patch("app.services.google_oauth_service.get_user_by_email", return_value=None),
            patch("app.services.google_oauth_service.create_google_user", return_value=created),
            patch("app.services.google_oauth_service._set_google_profile_picture"),
        ):
            result = upsert_user_from_google(db, profile)

        assert result.is_new_user is True
        assert result.user is created

    def test_upsert_rejects_non_utec_email(self):
        db = MagicMock()
        profile = GoogleOAuthProfile(
            email="user@gmail.com",
            full_name="User",
            google_id="gid",
            picture=None,
        )

        with pytest.raises(HTTPException) as exc:
            parse_profile_and_upsert(db, profile)

        assert exc.value.status_code == 403


def parse_profile_and_upsert(db, profile):
    from app.services.google_token_service import assert_utec_email

    assert_utec_email(profile.email)
    return upsert_user_from_google(db, profile)
