from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.services import legal_service

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

_TERMS_DETAIL = {
    "code": "TERMS_RECONSENT_REQUIRED",
    "message": "Debes aceptar los términos y la política de privacidad vigentes para continuar.",
}


def _extract_token(request: Request, bearer_token: Optional[str]) -> Optional[str]:
    cookie_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if cookie_token:
        return cookie_token
    return bearer_token


def _decode_user_id(token: str) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError as exc:
        if "expired" in str(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado. Por favor inicia sesión nuevamente.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc
        raise credentials_exception from exc


def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> User:
    """Obtiene el usuario autenticado desde cookie HttpOnly o Bearer."""
    token = _extract_token(request, bearer_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudieron validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = _decode_user_id(token)
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudieron validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_terms_accepted(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Bloquea acceso a la API de negocio hasta aceptar la versión activa de términos."""
    if not legal_service.user_has_required_legal_consent(db, user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_TERMS_DETAIL,
        )
    return user


def get_optional_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Obtiene el usuario si está autenticado, None si no lo está."""
    token = _extract_token(request, bearer_token)
    if not token:
        return None

    try:
        user_id = _decode_user_id(token)
    except HTTPException:
        return None

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        return None
    return user
