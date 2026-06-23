"""
Flujo OAuth server-side con Google (authorization code).

El backend intercambia el code, verifica el ID token criptográficamente
y valida el dominio institucional antes de crear sesión o usuario.
"""

import hashlib
import logging
import secrets
from base64 import urlsafe_b64encode
from dataclasses import dataclass
from urllib.parse import urlencode

import requests
from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.user_profile_image import UserProfileImage
from app.services.google_token_service import (
    GOOGLE_TOKEN_INVALID_MESSAGE,
    UTEC_ACCESS_DENIED_MESSAGE,
    assert_utec_email,
)
from app.services.users_service import create_google_user, get_user_by_email

GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GoogleOAuthProfile:
    email: str
    full_name: str
    google_id: str
    picture: str | None


@dataclass(frozen=True)
class GoogleOAuthResolveResult:
    profile: GoogleOAuthProfile
    user: User | None


@dataclass(frozen=True)
class GoogleOAuthUpsertResult:
    user: User
    is_new_user: bool


def generate_pkce_pair() -> tuple[str, str]:
    """Genera code_verifier y code_challenge (S256) para OAuth con PKCE."""
    verifier = urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode("ascii")
    challenge = urlsafe_b64encode(
        hashlib.sha256(verifier.encode("ascii")).digest()
    ).rstrip(b"=").decode("ascii")
    return verifier, challenge


def build_google_auth_url(state: str, *, code_challenge: str | None = None) -> str:
    client_id, _, redirect_uri = _google_oauth_credentials()
    if not client_id or not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth no está configurado en el servidor.",
        )

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
        "state": state,
    }
    if code_challenge:
        params["code_challenge"] = code_challenge
        params["code_challenge_method"] = "S256"
    return f"{GOOGLE_AUTH_ENDPOINT}?{urlencode(params)}"


def _google_oauth_credentials() -> tuple[str, str, str]:
    """Client id, secret y redirect_uri normalizados (sin espacios accidentales)."""
    return (
        settings.GOOGLE_CLIENT_ID.strip(),
        settings.GOOGLE_CLIENT_SECRET.strip(),
        settings.GOOGLE_REDIRECT_URI.strip(),
    )


def exchange_code_for_id_token(code: str, code_verifier: str | None = None) -> dict:
    client_id, client_secret, redirect_uri = _google_oauth_credentials()
    if not client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth no está configurado en el servidor.",
        )

    logger.warning(
        "Google token exchange attempt: redirect_uri=%s client_id=%s code_prefix=%s",
        redirect_uri,
        f"{client_id[:20]}..." if client_id else None,
        f"{code[:12]}..." if code else None,
    )

    token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
    if code_verifier:
        token_data["code_verifier"] = code_verifier

    response = requests.post(
        GOOGLE_TOKEN_ENDPOINT,
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )

    if response.status_code != 200:
        try:
            err_body = response.json()
        except ValueError:
            err_body = response.text[:500]
        logger.warning(
            "Google token exchange failed: status=%s body=%s",
            response.status_code,
            err_body,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GOOGLE_TOKEN_INVALID_MESSAGE,
        )

    token_payload = response.json()
    raw_id_token = token_payload.get("id_token")
    if not raw_id_token:
        logger.warning(
            "Google token exchange missing id_token: keys=%s",
            sorted(token_payload.keys()),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GOOGLE_TOKEN_INVALID_MESSAGE,
        )

    try:
        return id_token.verify_oauth2_token(
            raw_id_token,
            google_requests.Request(),
            client_id,
            clock_skew_in_seconds=60,
        )
    except ValueError as exc:
        logger.warning("Google id_token verify failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GOOGLE_TOKEN_INVALID_MESSAGE,
        ) from exc


def parse_google_profile(idinfo: dict) -> GoogleOAuthProfile:
    email = (idinfo.get("email") or "").strip().lower()
    google_id = idinfo.get("sub") or ""
    hd = idinfo.get("hd")
    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GOOGLE_TOKEN_INVALID_MESSAGE,
        )

    logger.warning(
        "=== GOOGLE ID TOKEN CLAIMS === %s",
        {k: idinfo.get(k) for k in ("email", "hd", "sub", "email_verified", "iss", "aud")},
    )
    logger.warning("=== UTEC VALIDATION === email=%s, hd=%s", email, hd)
    assert_utec_email(email, hd=hd)

    return GoogleOAuthProfile(
        email=email,
        full_name=idinfo.get("name") or "",
        google_id=google_id,
        picture=idinfo.get("picture"),
    )


def _set_google_profile_picture(
    db: Session,
    user_id: int,
    google_id: str,
    picture_url: str | None,
) -> None:
    if not picture_url:
        return

    existing = db.scalar(
        select(UserProfileImage).where(
            UserProfileImage.user_id == user_id,
            UserProfileImage.is_active.is_(True),
        )
    )
    if existing:
        return

    db.add(
        UserProfileImage(
            user_id=user_id,
            cloudinary_id=f"google:{google_id}",
            url=picture_url,
            position=0,
            is_active=True,
        )
    )


def resolve_google_oauth_code(
    db: Session,
    code: str,
    code_verifier: str | None = None,
) -> GoogleOAuthResolveResult:
    """Intercambia code por perfil Google. Devuelve usuario existente o None si es nuevo."""
    idinfo = exchange_code_for_id_token(code, code_verifier=code_verifier)
    profile = parse_google_profile(idinfo)
    user = get_user_by_email(db, profile.email)
    if user:
        if not user.google_id:
            user.google_id = profile.google_id
        if profile.full_name and not user.full_name:
            user.full_name = profile.full_name
        db.commit()
        db.refresh(user)
    return GoogleOAuthResolveResult(profile=profile, user=user)


def register_user_from_google_profile(
    db: Session,
    profile: GoogleOAuthProfile,
    *,
    terms_document_id: int,
    privacy_document_id: int,
    ip_address: str | None,
    user_agent: str | None,
) -> User:
    """Crea usuario Google tras aceptación legal explícita."""
    from app.services import legal_service

    if get_user_by_email(db, profile.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email ya registrado",
        )
    if not legal_service.register_legal_ids_match_active(
        db, terms_document_id, privacy_document_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los documentos legales indicados no coinciden con los vigentes. Recarga la página e inténtalo de nuevo.",
        )

    user = create_google_user(
        db=db,
        email=profile.email,
        full_name=profile.full_name,
        google_id=profile.google_id,
    )
    _set_google_profile_picture(db, user.id, profile.google_id, profile.picture)
    legal_service.record_acceptances_for_documents(
        db,
        user_id=user.id,
        document_ids=[terms_document_id, privacy_document_id],
        ip_address=ip_address,
        user_agent=user_agent,
        auth_method="google_oauth_register",
        commit=False,
    )
    db.commit()
    db.refresh(user)
    return user


def upsert_user_from_google(db: Session, profile: GoogleOAuthProfile) -> GoogleOAuthUpsertResult:
    user = get_user_by_email(db, profile.email)
    if user:
        if not user.google_id:
            user.google_id = profile.google_id
        if profile.full_name and not user.full_name:
            user.full_name = profile.full_name
        db.commit()
        db.refresh(user)
        return GoogleOAuthUpsertResult(user=user, is_new_user=False)

    user = create_google_user(
        db=db,
        email=profile.email,
        full_name=profile.full_name,
        google_id=profile.google_id,
    )
    _set_google_profile_picture(db, user.id, profile.google_id, profile.picture)
    db.commit()
    db.refresh(user)
    return GoogleOAuthUpsertResult(user=user, is_new_user=True)


def authenticate_google_oauth_code(
    db: Session,
    code: str,
    code_verifier: str | None = None,
) -> GoogleOAuthUpsertResult:
    resolved = resolve_google_oauth_code(db, code, code_verifier=code_verifier)
    if resolved.user:
        return GoogleOAuthUpsertResult(user=resolved.user, is_new_user=False)
    return upsert_user_from_google(db, resolved.profile)
