from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session



from app.database.session import get_db
from app.schemas.user import UserCreate, UserOut
from app.services.users_service import get_user_by_email, create_user

router = APIRouter(prefix="/auth", tags=["invoices"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")

    user = create_user(db, payload.email, payload.password, payload.full_name)
    return user

