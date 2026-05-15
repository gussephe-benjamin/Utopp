from app.database.session import get_db
from app.schemas.user import LoginRequest, TokenOut, GoogleRegisterIn
from app.schemas.onboarding import UserOnboarding_Response, OnboardingStatusOut, UserOnboardingData
from app.models.user import User
from app.services.users_service import authenticate_user, create_user, get_current_user, get_user_by_email, create_google_user, is_domUtec
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
# POST /register
# Registra un nuevo usuario usando su token de Google OAuth.
# Verifica el token con Google, crea el usuario en BD
# y devuelve un JWT access token.
# Auth: No requerida (usa token de Google)
# ============================================================
@router.post("/register")
def google_register(payload: GoogleRegisterIn, request: Request, db: Session = Depends(get_db)):
    from app.services import legal_service

    if not legal_service.register_legal_ids_match_active(
        db, payload.terms_document_id, payload.privacy_document_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los documentos legales indicados no coinciden con los vigentes. Recarga la página e inténtalo de nuevo.",
        )

    token = payload.token

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name", "")
        google_id = idinfo["sub"]

        # 🔍 1. Verificar si ya existe
        user = get_user_by_email(db, email)

        if user:
            raise HTTPException(
                status_code=409,
                detail="El usuario ya está registrado"
            )

        # ✅ 2. Crear usuario
        user = create_google_user(
            db=db,
            email=email,
            full_name=name,
            google_id=google_id
        )

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
            auth_method="google_oauth_register",
            commit=True,
        )

        # ✅ 3. Generar JWT
        access_token = create_access_token(str(user.id))

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Token de Google inválido"
        )
        
# ============================================================
# POST /login
# Autentica un usuario existente usando su token de Google.
# Verifica el token con Google, busca al usuario en BD
# y devuelve un JWT access token.
# Si el usuario no tiene google_id vinculado, lo asigna.
# Auth: No requerida (usa token de Google)
# ============================================================
@router.post("/login")
def google_login(data: dict, db: Session = Depends(get_db)):
    
    token = data.get("token")

    print(token)

    if not token:
        raise HTTPException(status_code=400, detail="Token requerido")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name")
        google_id = idinfo["sub"]
        
        # 🔎 1. Buscar usuario en BD
        user = get_user_by_email(db, email)

        # ❌ 2. Si no existe → ERROR
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Usuario no registrado"
            )

        # (opcional) validar que tenga Google asociado
        # if not user.google_id:
        #     raise HTTPException(
        #         status_code=403,
        #         detail="Cuenta no vinculada a Google"
        #     )

        # Si no tiene google_id, lo asignamos ahora
        if not user.google_id:
            user.google_id = google_id
            db.commit()

        # ✅ 3. Generar JWT
        
        access_token = create_access_token(str(user.id))

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Token de Google inválido")