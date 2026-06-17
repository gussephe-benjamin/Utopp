import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from urllib.parse import urlencode

from app.core.session import (
    clear_oauth_pending_cookie,
    clear_oauth_state_cookie,
    clear_session_cookie,
    encode_oauth_pending_token,
    resolve_oauth_pending_profile,
    set_oauth_pending_cookie,
    set_oauth_state_cookie,
    set_session_cookie,
)
from app.database.session import get_db
from app.dependencies.auth import get_current_user, get_optional_user
from app.models.user import User
from app.models.user_profile_image import UserProfileImage
from app.schemas.user import GoogleOAuthRegisterIn, LoginRequest, TokenOut, UserCreate, UserOut
from app.services import legal_service
from app.services.google_oauth_service import (
    build_google_auth_url,
    register_user_from_google_profile,
    resolve_google_oauth_code,
)
from app.services.google_token_service import UTEC_ACCESS_DENIED_MESSAGE
from app.services.users_service import (
    authenticate_user,
    create_user,
    get_user_by_email,
    is_domUtec,
)
from app.core.security import create_access_token

router = APIRouter()


def _frontend_register_redirect(pending_token: str) -> str:
    params = urlencode({"google_register": "1", "pending_token": pending_token})
    return f"{settings.FRONTEND_URL.rstrip('/')}/login?{params}"


def _request_meta(request: Request) -> tuple[str | None, str | None]:
    fwd = request.headers.get("x-forwarded-for")
    ip = (fwd.split(",")[0].strip() if fwd else None) or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
    return ip, ua


def _frontend_login_error_redirect() -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/login?error=access_denied"


def _get_profile_image_url(db: Session, user_id: int) -> str | None:
    return db.scalar(
        select(UserProfileImage.url).where(
            UserProfileImage.user_id == user_id,
            UserProfileImage.is_active.is_(True),
        )
    )


def _serialize_auth_user(db: Session, user: User) -> dict:
    needs_terms_consent = legal_service.needs_terms_consent(db, user.id)
    needs_privacy_consent = legal_service.needs_privacy_consent(db, user.id)
    needs_terms = needs_terms_consent or needs_privacy_consent

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "onboarding_completed": user.is_onboarding_completed,
        "needs_terms": needs_terms,
        "needs_terms_consent": needs_terms_consent,
        "needs_privacy_consent": needs_privacy_consent,
        "profile_image_url": _get_profile_image_url(db, user.id),
    }


def _resolve_post_auth_redirect(db: Session, user: User, is_new_user: bool) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    if not legal_service.user_has_required_legal_consent(db, user.id):
        return f"{base}/app/terms"
    if is_new_user or not user.is_onboarding_completed:
        return f"{base}/onboarding"
    return f"{base}/app/inicio"


# ============================================================
# GET /auth/me
# Estado de sesión (cookie HttpOnly). No requiere autenticación.
# ============================================================
@router.get("/me")
def auth_me(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    if not current_user:
        return {"authenticated": False}

    return {
        "authenticated": True,
        "user": _serialize_auth_user(db, current_user),
    }


# ============================================================
# POST /auth/register
# Registro por email/contraseña (testing, bootstrap, herramientas).
# El acceso en producción es vía Google OAuth.
# ============================================================
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if not is_domUtec(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UTEC_ACCESS_DENIED_MESSAGE,
        )
    if not legal_service.register_legal_ids_match_active(
        db, payload.terms_document_id, payload.privacy_document_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los documentos legales indicados no coinciden con los vigentes. Recarga la página e inténtalo de nuevo.",
        )

    user = create_user(db, payload.email, payload.password, payload.full_name)

    ip, ua = _request_meta(request)
    legal_service.record_acceptances_for_documents(
        db,
        user_id=user.id,
        document_ids=[payload.terms_document_id, payload.privacy_document_id],
        ip_address=ip,
        user_agent=ua,
        auth_method="email_password_register",
        commit=True,
    )
    return user


# ============================================================
# POST /auth/login
# Login por email/contraseña (testing, herramientas). Establece cookie de sesión.
# ============================================================
@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not is_domUtec(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UTEC_ACCESS_DENIED_MESSAGE,
        )

    token = create_access_token(subject=str(user.id))
    set_session_cookie(response, user.id)
    return TokenOut(access_token=token)


# ============================================================
# GET /auth/google/login
# Inicia OAuth server-side con Google (redirect).
# ============================================================
@router.get("/google/login")
def google_oauth_login():
    state = secrets.token_urlsafe(32)
    redirect = RedirectResponse(build_google_auth_url(state), status_code=status.HTTP_302_FOUND)
    set_oauth_state_cookie(redirect, state)
    return redirect


# ============================================================
# GET /auth/google/callback
# Usuario existente → sesión. Usuario nuevo → cookie pendiente + términos en FE.
# ============================================================
@router.get("/google/callback")
def google_oauth_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error or not code or not state:
        return RedirectResponse(_frontend_login_error_redirect(), status_code=status.HTTP_302_FOUND)

    expected_state = request.cookies.get(settings.OAUTH_STATE_COOKIE_NAME)
    if not expected_state or expected_state != state:
        response = RedirectResponse(_frontend_login_error_redirect(), status_code=status.HTTP_302_FOUND)
        clear_oauth_state_cookie(response)
        return response

    try:
        resolved = resolve_google_oauth_code(db, code)
    except HTTPException:
        response = RedirectResponse(_frontend_login_error_redirect(), status_code=status.HTTP_302_FOUND)
        clear_oauth_state_cookie(response)
        return response

    if resolved.user:
        destination = _resolve_post_auth_redirect(db, resolved.user, is_new_user=False)
        response = RedirectResponse(destination, status_code=status.HTTP_302_FOUND)
        clear_oauth_state_cookie(response)
        set_session_cookie(response, resolved.user.id)
        return response

    profile_payload = {
        "email": resolved.profile.email,
        "full_name": resolved.profile.full_name,
        "google_id": resolved.profile.google_id,
        "picture": resolved.profile.picture,
    }
    pending_token = encode_oauth_pending_token(profile_payload)
    response = RedirectResponse(
        _frontend_register_redirect(pending_token),
        status_code=status.HTTP_302_FOUND,
    )
    clear_oauth_state_cookie(response)
    set_oauth_pending_cookie(response, profile_payload)
    return response


# ============================================================
# GET /auth/google/pending
# Perfil Google pendiente de registro (cookie HttpOnly).
# ============================================================
@router.get("/google/pending")
def google_oauth_pending(request: Request, pending_token: str | None = None):
    pending = resolve_oauth_pending_profile(request, pending_token)
    if not pending:
        return {"pending": False}
    return {
        "pending": True,
        "email": pending["email"],
        "full_name": pending.get("full_name") or "",
    }


# ============================================================
# POST /auth/google/register
# Crea cuenta tras aceptar términos (perfil en cookie pendiente).
# ============================================================
@router.post("/google/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def google_oauth_register(
    payload: GoogleOAuthRegisterIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    pending = resolve_oauth_pending_profile(request, payload.pending_token)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay un registro con Google pendiente. Vuelve a iniciar sesión con Google.",
        )

    from app.services.google_oauth_service import GoogleOAuthProfile

    profile = GoogleOAuthProfile(
        email=pending["email"],
        full_name=pending.get("full_name") or "",
        google_id=pending["google_id"],
        picture=pending.get("picture"),
    )

    ip, ua = _request_meta(request)
    user = register_user_from_google_profile(
        db,
        profile,
        terms_document_id=payload.terms_document_id,
        privacy_document_id=payload.privacy_document_id,
        ip_address=ip,
        user_agent=ua,
    )
    clear_oauth_pending_cookie(response)
    set_session_cookie(response, user.id)
    return user


# ============================================================
# POST /auth/google/cancel-pending
# Cancela registro pendiente y limpia cookie.
# ============================================================
@router.post("/google/cancel-pending")
def google_oauth_cancel_pending(response: Response):
    clear_oauth_pending_cookie(response)
    return {"ok": True}


# ============================================================
# POST /auth/logout
# Invalida la sesión HttpOnly.
# ============================================================
@router.post("/logout")
def logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}


# ============================================================
# POST /auth/refresh
# Renueva JWT en cookie HttpOnly (y opcionalmente Bearer).
# ============================================================
@router.post("/refresh", response_model=TokenOut)
def refresh_token(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    token = create_access_token(subject=str(current_user.id))
    set_session_cookie(response, current_user.id)
    return TokenOut(access_token=token)
