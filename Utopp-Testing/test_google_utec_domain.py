import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi import HTTPException

BACKEND_APP_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_APP_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_APP_PATH))

from app.services.google_token_service import (  # noqa: E402
    UTEC_ACCESS_DENIED_MESSAGE,
    UTEC_DOMAIN,
    assert_utec_institutional_google_account,
    authenticate_google_token,
    verify_google_id_token,
)


VALID_UTEC_IDINFO = {
    "email": "alumno@utec.edu.pe",
    "email_verified": True,
    "hd": UTEC_DOMAIN,
    "sub": "google-sub-123",
    "name": "Alumno UTEC",
}


class TestUtecInstitutionalGoogleGuard:
    def test_valid_utec_account_passes(self):
        assert_utec_institutional_google_account(VALID_UTEC_IDINFO)

    def test_gmail_without_hd_is_rejected(self):
        payload = {
            "email": "usuario@gmail.com",
            "email_verified": True,
        }
        with pytest.raises(HTTPException) as exc:
            assert_utec_institutional_google_account(payload)
        assert exc.value.status_code == 403
        assert exc.value.detail == UTEC_ACCESS_DENIED_MESSAGE

    def test_different_hosted_domain_is_rejected(self):
        payload = {
            "email": "usuario@empresa.com",
            "email_verified": True,
            "hd": "empresa.com",
        }
        with pytest.raises(HTTPException) as exc:
            assert_utec_institutional_google_account(payload)
        assert exc.value.status_code == 403
        assert exc.value.detail == UTEC_ACCESS_DENIED_MESSAGE

    def test_unverified_email_is_rejected(self):
        payload = {
            **VALID_UTEC_IDINFO,
            "email_verified": False,
        }
        with pytest.raises(HTTPException) as exc:
            assert_utec_institutional_google_account(payload)
        assert exc.value.status_code == 403

    def test_utec_email_with_wrong_hd_is_rejected(self):
        payload = {
            **VALID_UTEC_IDINFO,
            "hd": "other.edu.pe",
        }
        with pytest.raises(HTTPException) as exc:
            assert_utec_institutional_google_account(payload)
        assert exc.value.status_code == 403

    def test_utec_hd_with_non_utec_email_is_rejected(self):
        payload = {
            **VALID_UTEC_IDINFO,
            "email": "usuario@gmail.com",
        }
        with pytest.raises(HTTPException) as exc:
            assert_utec_institutional_google_account(payload)
        assert exc.value.status_code == 403


class TestAuthenticateGoogleToken:
    @patch("app.services.google_token_service.verify_google_id_token")
    def test_authenticate_returns_verified_identity(self, mock_verify):
        mock_verify.return_value = VALID_UTEC_IDINFO

        identity = authenticate_google_token("fake-token")

        assert identity.email == "alumno@utec.edu.pe"
        assert identity.google_id == "google-sub-123"
        assert identity.name == "Alumno UTEC"
        mock_verify.assert_called_once_with("fake-token")

    @patch("app.services.google_token_service.verify_google_id_token")
    def test_authenticate_rejects_non_utec_before_side_effects(self, mock_verify):
        mock_verify.return_value = {
            "email": "usuario@gmail.com",
            "email_verified": True,
            "sub": "google-sub-999",
        }

        with pytest.raises(HTTPException) as exc:
            authenticate_google_token("fake-token")

        assert exc.value.status_code == 403
        assert exc.value.detail == UTEC_ACCESS_DENIED_MESSAGE


class TestVerifyGoogleIdTokenInvalid:
    @patch("app.services.google_token_service.settings.GOOGLE_CLIENT_ID", "test-client-id")
    @patch("app.services.google_token_service.id_token.verify_oauth2_token")
    def test_invalid_token_raises_401(self, mock_verify):
        mock_verify.side_effect = ValueError("invalid token")

        with pytest.raises(HTTPException) as exc:
            verify_google_id_token("bad-token")

        assert exc.value.status_code == 401
        assert exc.value.detail == "Token de Google inválido"
