from app.database.session import get_db
from app.schemas.user import LoginRequest, TokenOut
from app.schemas.onboarding import UserOnboarding_Response, OnboardingStatusOut, UserOnboardingData
from app.models.user import User
from app.services.users_service import authenticate_user, create_user, get_current_user, get_user_by_email, create_google_user, is_domUtec
from app.core.security import create_access_token

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from google.auth.transport import requests
from google.oauth2 import id_token

import yaml
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter()

@router.post("/register")
def google_register(data: dict, db: Session = Depends(get_db)):
    token = data.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Token requerido")

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
            name=name,
            google_id=google_id
        )

        # ✅ 3. Generar JWT
        access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email
        })

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Token de Google inválido"
        )
        
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

        user.google_id = google_id
        
        # ❌ 2. Si no existe → ERROR
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Usuario no registrado"
            )

        # (opcional) validar que tenga Google asociado
        if not user.google_id:
            raise HTTPException(
                status_code=403,
                detail="Cuenta no vinculada a Google"
            )

        # ✅ 3. Generar JWT
        
        access_token = create_access_token(str(user.id))

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Token de Google inválido")