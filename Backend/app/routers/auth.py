from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import yaml
from app.database.session import get_db
from app.schemas.user import LoginRequest, TokenOut, UserOnboarding_Response, OnboardingStatusOut, UserOnboardingData
from app.models.user import User
from app.services.users_service import authenticate_user, create_user, get_current_user, get_user_by_email, create_google_user, is_domUtec
from app.core.security import create_access_token

import os

from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter()
    
@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    dominio_permitido = "utec"
    
    if (is_domUtec(user.email) != True):
        raise ValueError(f"El correo {user.email} no pertenece a la organización {dominio_permitido}")
        
    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)

@router.post("/onboarding", response_model=OnboardingStatusOut)
def login(payload: UserOnboarding_Response, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return {
        "user_id": user.id,
        "onboarding_completed": user.is_onboarding_completed
    }


@router.get("/me")
def get_current_user_endpoint(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "onboarding_completed": current_user.is_onboarding_completed
    }


@router.post("/onboarding/update")
def complete_onboarding(
    data: UserOnboardingData,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    print("DATA RECIBIDA:", data)
    print("USER:", user.id)
    
    if user.is_onboarding_completed:
        raise HTTPException(status_code=403, detail="Onboarding already completed")

    user.career = data.career
    user.interests = data.interests
    user.availability = data.availability
    user.cycle = data.cycle
    user.is_onboarding_completed = True

    print(user.career)
    print(user.interests)
    print(user.cycle)
    print(user.availability)
    
    db.commit()
    db.refresh(user)

    return {
        "ok": True,
        "onboarding_completed": True
    }

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/google/register")
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
        
@router.post("/google/login")
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