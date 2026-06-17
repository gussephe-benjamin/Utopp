"""
Verificación criptográfica de Google ID Tokens y guard institucional UTEC.

Seguridad:
- La firma, expiración, issuer y audience se validan con google-auth (JWKS oficial).
- Los claims institucionales (hd, email_verified, email) se leen SOLO del payload
  verificado; nunca se confía en valores enviados manualmente por el frontend.
"""

from dataclasses import dataclass

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import settings

UTEC_DOMAIN = "utec.edu.pe"
UTEC_ACCESS_DENIED_MESSAGE = (
    "Solo se permiten cuentas institucionales UTEC (@utec.edu.pe)."
)
GOOGLE_TOKEN_INVALID_MESSAGE = "Token de Google inválido"


@dataclass(frozen=True)
class VerifiedGoogleIdentity:
    """Identidad extraída de un ID Token verificado criptográficamente."""

    email: str
    name: str
    google_id: str


def verify_google_id_token(token: str) -> dict:
    """
    Verifica criptográficamente un Google ID Token.

    Valida firma (JWKS), exp, iss y aud contra GOOGLE_CLIENT_ID del servidor.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth no está configurado en el servidor.",
        )

    try:
        return id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GOOGLE_TOKEN_INVALID_MESSAGE,
        ) from exc


def assert_utec_institutional_google_account(idinfo: dict) -> None:
    """
    Guard institucional: solo cuentas Google Workspace UTEC verificadas.

    Requiere simultáneamente:
    - hd == utec.edu.pe (Hosted Domain de Google Workspace)
    - email_verified == True
    - email termina en @utec.edu.pe
    """
    hosted_domain = idinfo.get("hd")
    email_verified = idinfo.get("email_verified")
    email = (idinfo.get("email") or "").lower()

    if (
        hosted_domain != UTEC_DOMAIN
        or email_verified is not True
        or not email.endswith(f"@{UTEC_DOMAIN}")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UTEC_ACCESS_DENIED_MESSAGE,
        )


def authenticate_google_token(token: str) -> VerifiedGoogleIdentity:
    """Verifica el token con Google y aplica el guard institucional UTEC."""
    idinfo = verify_google_id_token(token)
    assert_utec_institutional_google_account(idinfo)

    email = idinfo.get("email")
    google_id = idinfo.get("sub")
    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GOOGLE_TOKEN_INVALID_MESSAGE,
        )

    return VerifiedGoogleIdentity(
        email=email,
        name=idinfo.get("name") or "",
        google_id=google_id,
    )
