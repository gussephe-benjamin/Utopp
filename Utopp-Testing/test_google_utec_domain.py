import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

BACKEND_APP_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_APP_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_APP_PATH))

from app.services.google_token_service import (  # noqa: E402
    UTEC_ACCESS_DENIED_MESSAGE,
    assert_utec_email,
    assert_utec_institutional_google_account,
)
from app.services.google_oauth_service import parse_google_profile  # noqa: E402


class TestUtecEmailGuard:
    def test_valid_utec_email_passes(self):
        assert_utec_email("alumno@utec.edu.pe")

    def test_gmail_is_rejected(self):
        with pytest.raises(HTTPException) as exc:
            assert_utec_email("usuario@gmail.com")
        assert exc.value.status_code == 403
        assert exc.value.detail == UTEC_ACCESS_DENIED_MESSAGE

    def test_other_domain_is_rejected(self):
        with pytest.raises(HTTPException) as exc:
            assert_utec_email("usuario@empresa.com")
        assert exc.value.status_code == 403

    def test_idinfo_valid_passes_without_hd(self):
        assert_utec_institutional_google_account(
            {
                "email": "alumno@utec.edu.pe",
                "email_verified": False,
            }
        )

    def test_parse_google_profile_rejects_gmail(self):
        with pytest.raises(HTTPException) as exc:
            parse_google_profile(
                {
                    "email": "usuario@gmail.com",
                    "sub": "abc",
                    "name": "User",
                }
            )
        assert exc.value.status_code == 403
