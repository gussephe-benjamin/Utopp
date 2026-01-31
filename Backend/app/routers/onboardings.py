from app.database.session import get_db
from app.schemas.user import LoginRequest, TokenOut
from app.schemas.onboarding import UserOnboarding_Response, OnboardingStatusOut, UserOnboardingData, OnboardingID
from app.models.user import User
from app.services.users_service import authenticate_user, create_user, get_current_user, get_user_by_email, create_google_user, is_domUtec
from app.core.security import create_access_token

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from google.auth.transport import requests
from google.oauth2 import id_token

router = APIRouter()

@router.post("/isComplete", response_model=OnboardingStatusOut)
def login(payload: OnboardingID, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == payload.id).first()
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

@router.post("/update")
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

