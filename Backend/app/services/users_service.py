from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.models.user import User
from app.core.security import hash_password, verify_password
from app.core.config import settings
from app.database.session import get_db

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.scalar(stmt)


def create_user(db: Session, email: str, password: str, full_name: str | None = None) -> User:
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_all_users(db: Session):
    stmt = select(User)
    return db.scalars(stmt).all()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
    
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    print("🔑 TOKEN RECIBIDO:", token)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    
    return user

def create_google_user(
    db: Session,
    email: str,
    name: str,
    google_id: str
):
    user = User(
        email=email,
        name=name,
        google_id=google_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def obtener_organizacion(email):
    try:
        # Dividimos el correo en el '@' y tomamos la segunda parte
        dominio = email.split('@')[1].lower()
        dominio = dominio.split('.')[0].lower()
        
        return dominio
    except IndexError:
        return None

def is_domUtec(email):
    
    org = obtener_organizacion(email=email)
    
    if org != "utec":
        return False
    else:
        return True