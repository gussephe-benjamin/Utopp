from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session


from app.database.session import get_db
from app.schemas.user import UserCreate, UserOut, UserResponse, UserResponse_total
from app.models.user import User
from app.services.users_service import get_user_by_email, create_user, get_all_users, is_domUtec

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")

    org = "utec"

    if (is_domUtec(payload.email) != True):
        raise ValueError(f"El correo {payload.email} no pertenece a la organización {org}")
        
    
    user = create_user(db, payload.email, payload.password, payload.full_name)
    return user

@router.get("/all-users", response_model=list[UserResponse_total])
def list_users(db: Session = Depends(get_db)):
    return get_all_users(db)