from app.database.session import get_db
from app.schemas.user import LoginRequest, TokenOut
from app.schemas.onboarding import UserOnboarding_Response, OnboardingStatusOut, UserOnboardingData
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.services.users_service import authenticate_user, create_user, get_user_by_email, create_google_user, is_domUtec
from app.core.security import create_access_token

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from google.auth.transport import requests
from google.oauth2 import id_token

import yaml
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter()


# ============================================================
# POST /auth/login
# Autentica un usuario con email y contraseña.
# Valida que el correo pertenezca al dominio institucional autorizado.
# Devuelve un JWT access token.
# Auth: No requerida
# ============================================================
@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if is_domUtec(user.email) is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo no está autorizado. Usa tu correo institucional registrado en la plataforma.",
        )
        
    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)


# ============================================================
# POST /auth/register
# Registra un nuevo usuario con email, contraseña y nombre.
# Valida que el email no esté en uso y que pertenezca al dominio institucional autorizado.
# Auth: No requerida
# ============================================================
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    from app.services import legal_service

    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if is_domUtec(payload.email) is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo no está autorizado. Usa tu correo institucional registrado en la plataforma.",
        )
    if not legal_service.register_legal_ids_match_active(
        db, payload.terms_document_id, payload.privacy_document_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los documentos legales indicados no coinciden con los vigentes. Recarga la página e inténtalo de nuevo.",
        )
    user = create_user(db, payload.email, payload.password, payload.full_name)
    fwd = request.headers.get("x-forwarded-for")
    ip = (fwd.split(",")[0].strip() if fwd else None) or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
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
# POST /auth/refresh
# Genera un nuevo JWT token para el usuario autenticado.
# Útil para renovar sesión sin volver a hacer login.
# Auth: Requerida
# ============================================================
@router.post("/refresh", response_model=TokenOut)
def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Genera un nuevo token para un usuario autenticado"""
    new_token = create_access_token(subject=str(current_user.id))
    return TokenOut(access_token=new_token)



# ============================================================
# GET /auth/me
# Devuelve datos básicos del usuario autenticado
# (id, email, estado de onboarding).
# Auth: Requerida
# ============================================================
@router.get("/me")
def get_current_user_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services import legal_service

    needs_terms_consent = legal_service.needs_terms_consent(db, current_user.id)
    needs_privacy_consent = legal_service.needs_privacy_consent(db, current_user.id)
    needs_legal = needs_terms_consent or needs_privacy_consent
    return {
        "id": current_user.id,
        "email": current_user.email,
        "onboarding_completed": current_user.is_onboarding_completed,
        "needs_terms": needs_legal,
        "needs_terms_consent": needs_terms_consent,
        "needs_privacy_consent": needs_privacy_consent,
    }
