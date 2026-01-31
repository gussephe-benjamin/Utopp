from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserResponse_total
from app.models.user import User
from app.services.users_service import get_user_by_email, create_user, get_all_users, is_domUtec

router = APIRouter()

@router.get("/all-users", response_model=list[UserResponse_total])
def list_users(db: Session = Depends(get_db)):
    return get_all_users(db)