from datetime import datetime, timedelta, timezone

from fastapi import Request, Response
from jose import JWTError, jwt

from app.core.config import settings
from app.core.security import create_access_token

_OAUTH_PENDING_TYP = "oauth_pending"
_OAUTH_PENDING_TTL_MINUTES = 15


def set_session_cookie(response: Response, user_id: int) -> None:
    """Establece JWT de sesión en cookie HttpOnly."""
    token = create_access_token(str(user_id))
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


def set_oauth_state_cookie(response: Response, state: str) -> None:
    response.set_cookie(
        key=settings.OAUTH_STATE_COOKIE_NAME,
        value=state,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=600,
        path="/",
    )


def clear_oauth_state_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.OAUTH_STATE_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


def _encode_oauth_pending_token(profile: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=_OAUTH_PENDING_TTL_MINUTES)
    payload = {
        "typ": _OAUTH_PENDING_TYP,
        "email": profile["email"],
        "full_name": profile.get("full_name") or "",
        "google_id": profile["google_id"],
        "picture": profile.get("picture"),
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)


def set_oauth_pending_cookie(response: Response, profile: dict) -> None:
    """Guarda perfil Google pendiente de registro (antes de aceptar términos)."""
    token = _encode_oauth_pending_token(profile)
    response.set_cookie(
        key=settings.OAUTH_PENDING_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=_OAUTH_PENDING_TTL_MINUTES * 60,
        path="/",
    )


def clear_oauth_pending_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.OAUTH_PENDING_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


def encode_oauth_pending_token(profile: dict) -> str:
    """Token firmado para registro pendiente (URL o cookie)."""
    return _encode_oauth_pending_token(profile)


def decode_oauth_pending_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        return None
    if payload.get("typ") != _OAUTH_PENDING_TYP:
        return None
    email = payload.get("email")
    google_id = payload.get("google_id")
    if not email or not google_id:
        return None
    return {
        "email": email,
        "full_name": payload.get("full_name") or "",
        "google_id": google_id,
        "picture": payload.get("picture"),
    }


def read_oauth_pending_profile(request: Request) -> dict | None:
    token = request.cookies.get(settings.OAUTH_PENDING_COOKIE_NAME)
    if not token:
        return None
    return decode_oauth_pending_token(token)


def resolve_oauth_pending_profile(
    request: Request,
    pending_token: str | None = None,
) -> dict | None:
    """Perfil pendiente desde cookie HttpOnly o token en query/body (cross-origin)."""
    profile = read_oauth_pending_profile(request)
    if profile:
        return profile
    if pending_token:
        return decode_oauth_pending_token(pending_token)
    return None

