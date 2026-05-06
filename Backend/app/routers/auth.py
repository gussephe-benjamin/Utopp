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
# Valida que el correo pertenezca al dominio UTEC.
# Devuelve un JWT access token.
# Auth: No requerida
# ============================================================
@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    dominio_permitido = "utec"
    
    if is_domUtec(user.email) is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo {user.email} no pertenece a la organización {dominio_permitido}",
        )
        
    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)


# ============================================================
# POST /auth/register
# Registra un nuevo usuario con email, contraseña y nombre.
# Valida que el email no esté en uso y que pertenezca a UTEC.
# Auth: No requerida
# ============================================================
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    org = "utec"
    if is_domUtec(payload.email) is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo {payload.email} no pertenece a la organización {org}",
        )
    user = create_user(db, payload.email, payload.password, payload.full_name)
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

    needs_terms = not legal_service.user_has_valid_terms(db, current_user.id)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "onboarding_completed": current_user.is_onboarding_completed,
        "needs_terms": needs_terms,
    }
