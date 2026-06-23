import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

BACKEND_APP_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_APP_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_APP_PATH))

from app.services.google_oauth_service import (  # noqa: E402
    exchange_code_for_id_token,
    resolve_google_oauth_code,
)


@pytest.fixture(autouse=True)
def _mock_oauth_credentials():
    with patch(
        "app.services.google_oauth_service._google_oauth_credentials",
        return_value=("test-client-id", "test-client-secret", "http://localhost:8000/auth/google/callback"),
    ):
        yield


class TestGoogleTokenExchange:
    def test_exchange_logs_google_error_body(self, caplog):
        import logging

        caplog.set_level(logging.WARNING)
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": "invalid_grant",
            "error_description": "Bad Request",
        }

        with (
            patch("app.services.google_oauth_service.requests.post", return_value=mock_response),
            pytest.raises(HTTPException) as exc,
        ):
            exchange_code_for_id_token("test-code")

        assert exc.value.status_code == 401
        assert "Google token exchange failed" in caplog.text
        assert "invalid_grant" in caplog.text

    def test_exchange_verify_failure_raises_401(self, caplog):
        import logging

        caplog.set_level(logging.WARNING)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id_token": "fake-token"}

        with (
            patch("app.services.google_oauth_service.requests.post", return_value=mock_response),
            patch(
                "app.services.google_oauth_service.id_token.verify_oauth2_token",
                side_effect=ValueError("Token has wrong audience"),
            ),
            pytest.raises(HTTPException) as exc,
        ):
            exchange_code_for_id_token("test-code")

        assert exc.value.status_code == 401
        assert "Google id_token verify failed" in caplog.text

    def test_exchange_success_returns_idinfo(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id_token": "fake-token"}
        idinfo = {
            "email": "alumno@utec.edu.pe",
            "sub": "google-sub",
            "hd": "utec.edu.pe",
        }

        with (
            patch("app.services.google_oauth_service.requests.post", return_value=mock_response),
            patch(
                "app.services.google_oauth_service.id_token.verify_oauth2_token",
                return_value=idinfo,
            ),
        ):
            result = exchange_code_for_id_token("test-code")

        assert result["email"] == "alumno@utec.edu.pe"

    def test_resolve_google_oauth_code_with_mocked_exchange(self):
        db = MagicMock()
        idinfo = {
            "email": "alumno@utec.edu.pe",
            "sub": "google-sub",
            "name": "Alumno",
            "hd": "utec.edu.pe",
        }

        with (
            patch(
                "app.services.google_oauth_service.exchange_code_for_id_token",
                return_value=idinfo,
            ),
            patch(
                "app.services.google_oauth_service.get_user_by_email",
                return_value=None,
            ),
        ):
            result = resolve_google_oauth_code(db, "auth-code")

        assert result.profile.email == "alumno@utec.edu.pe"
        assert result.user is None


class TestGooglePkce:
    def test_generate_pkce_pair(self):
        from app.services.google_oauth_service import generate_pkce_pair

        verifier, challenge = generate_pkce_pair()
        assert len(verifier) >= 43
        assert len(challenge) >= 43
        verifier2, challenge2 = generate_pkce_pair()
        assert verifier != verifier2
        assert challenge != challenge2

    def test_build_google_auth_url_includes_pkce(self):
        from app.services.google_oauth_service import build_google_auth_url

        url = build_google_auth_url("state123", code_challenge="challenge123")
        assert "code_challenge=challenge123" in url
        assert "code_challenge_method=S256" in url
