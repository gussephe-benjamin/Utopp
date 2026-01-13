from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import yaml
from app.database.session import get_db
from app.schemas.user import LoginRequest, TokenOut, UserOnboarding_Response, OnboardingStatusOut, UserOnboardingData
from app.models.user import User
from app.services.users_service import authenticate_user, create_user, get_current_user
from app.core.security import create_access_token

router = APIRouter()


@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

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
    user.is_onboarding_completed = False

    print(user.career)
    print(user.interests)
    print(user.availability)
    
    db.commit()
    db.refresh(user)

    return {
        "ok": True,
        "onboarding_completed": True
    }