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
    is_utec_profile,
)
from app.services.google_oauth_service import parse_google_profile  # noqa: E402


class TestIsUtecProfile:
    @pytest.mark.parametrize(
        ("email", "hd", "expected"),
        [
            ("alumno@utec.edu.pe", None, True),
            ("alumno@utec.edu.pe", "utec.edu.pe", True),
            ("ALUMNO@UTEC.EDU.PE", None, True),
            ("alumno@gmail.com", "utec.edu.pe", True),
            ("alumno@utec.edu.pe", "", True),
            ("alumno@gmail.com", None, False),
            ("alumno@gmail.com", "gmail.com", False),
            ("alumno@utec.edu", None, False),
            ("alumno@utec.com", None, False),
            ("", None, False),
            (None, None, False),
        ],
    )
    def test_is_utec_profile(self, email, hd, expected):
        assert is_utec_profile(email, hd) is expected


class TestAssertUtecEmail:
    @pytest.mark.parametrize(
        ("email", "hd"),
        [
            ("alumno@utec.edu.pe", None),
            ("alumno@utec.edu.pe", "utec.edu.pe"),
            ("ALUMNO@UTEC.EDU.PE", None),
            ("alumno@gmail.com", "utec.edu.pe"),
            ("alumno@utec.edu.pe", ""),
        ],
    )
    def test_valid_profiles_pass(self, email, hd):
        assert_utec_email(email, hd=hd)

    @pytest.mark.parametrize(
        ("email", "hd"),
        [
            ("alumno@gmail.com", None),
            ("alumno@gmail.com", "gmail.com"),
            ("alumno@utec.edu", None),
            ("alumno@utec.com", None),
            ("", None),
            (None, None),
        ],
    )
    def test_invalid_profiles_raise_403(self, email, hd):
        with pytest.raises(HTTPException) as exc:
            assert_utec_email(email or "", hd=hd)
        assert exc.value.status_code == 403
        assert exc.value.detail == UTEC_ACCESS_DENIED_MESSAGE

    def test_gmail_is_rejected(self):
        with pytest.raises(HTTPException) as exc:
            assert_utec_email("usuario@gmail.com")
        assert exc.value.status_code == 403
        assert exc.value.detail == UTEC_ACCESS_DENIED_MESSAGE


class TestUtecInstitutionalGoogleAccount:
    def test_idinfo_valid_passes_without_hd(self):
        assert_utec_institutional_google_account(
            {
                "email": "alumno@utec.edu.pe",
                "email_verified": False,
            }
        )

    def test_idinfo_valid_passes_with_hd(self):
        assert_utec_institutional_google_account(
            {
                "email": "alumno@utec.edu.pe",
                "hd": "utec.edu.pe",
            }
        )

    def test_idinfo_hd_only_passes(self):
        assert_utec_institutional_google_account(
            {
                "email": "alias@gmail.com",
                "hd": "utec.edu.pe",
            }
        )


class TestParseGoogleProfile:
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

    def test_parse_google_profile_accepts_hd_workspace(self):
        profile = parse_google_profile(
            {
                "email": "alias@gmail.com",
                "sub": "workspace-user-id",
                "name": "Workspace User",
                "hd": "utec.edu.pe",
            }
        )
        assert profile.email == "alias@gmail.com"
        assert profile.google_id == "workspace-user-id"

    def test_parse_google_profile_normalizes_email(self):
        profile = parse_google_profile(
            {
                "email": "ALUMNO@UTEC.EDU.PE",
                "sub": "abc123",
                "name": "Alumno",
            }
        )
        assert profile.email == "alumno@utec.edu.pe"
