from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.core.security import hash_password, verify_password
from app.core.config import settings
from app.database.session import get_db
from app.services import role_service  # asignación automática de rol al registrarse

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.ALGORITHM

def get_user_by_email(db: Session, email: str) -> User | None:
    """Busca un usuario por email (case-insensitive). Retorna None si no existe."""
    stmt = select(User).where(func.lower(User.email) == func.lower(email))
    return db.scalar(stmt)


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Busca un usuario por ID. Retorna None si no existe."""
    return db.get(User, user_id)


def create_user(db: Session, email: str, password: str, full_name: str | None = None) -> User:
    """Crea un usuario con email y contraseña hasheada.
    
    Después de persistir el usuario, le asigna automáticamente
    el rol 'estudiante' como rol por defecto del sistema.
    """
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Asignar rol estudiante de forma automática e idempotente
    role_service.assign_student_role(db, user.id)

    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Autentica un usuario por email y contraseña. Retorna None si falla."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_all_users(db: Session, *, offset: int = 0, limit: int = 100):
    """Retorna usuarios con límite para evitar lecturas masivas."""
    stmt = select(User).offset(offset).limit(limit)
    return db.scalars(stmt).all()


def get_all_users_complete(db: Session) -> list[User]:
    """Retorna todos los usuarios sin paginación."""
    return list(db.scalars(select(User).order_by(User.id.asc())).all())


def get_users_by_role(db: Session, role_name: str) -> list[User]:
    """Retorna usuarios que tienen un rol específico."""
    user_ids = (
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name == role_name)
        .distinct()
    )
    stmt = select(User).where(User.id.in_(user_ids)).order_by(User.id.asc())
    return list(db.scalars(stmt).all())


def get_students(db: Session) -> list[User]:
    """Retorna estudiantes y usuarios legacy sin rol asignado."""
    users_with_student_role = (
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name == role_service.STUDENT_ROLE_NAME)
    )
    users_without_role = (
        select(User.id)
        .outerjoin(UserRole, UserRole.user_id == User.id)
        .where(UserRole.user_id.is_(None))
    )
    student_ids = users_with_student_role.union(users_without_role)
    stmt = select(User).where(User.id.in_(student_ids)).order_by(User.id.asc())
    return list(db.scalars(stmt).all())


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
    
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Decodifica el JWT y retorna el usuario autenticado."""
    
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
    except JWTError as e:
        if "expired" in str(e).lower() or "signature has expired" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado. Por favor inicia sesión nuevamente.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


def create_google_user(
    db: Session,
    email: str,
    full_name: str,
    google_id: str
):
    """Crea un usuario autenticado vía Google OAuth.
    
    Después de persistir el usuario, le asigna automáticamente
    el rol 'estudiante' como rol por defecto del sistema.
    """
    user = User(
        email=email,
        full_name=full_name,
        google_id=google_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Asignar rol estudiante de forma automática e idempotente
    role_service.assign_student_role(db, user.id)

    return user

def obtener_organizacion(email):
    """Extrae el nombre de la organización del dominio del email."""
    try:
        # Dividimos el correo en el '@' y tomamos la segunda parte
        dominio = email.split('@')[1].lower()
        dominio = dominio.split('.')[0].lower()
        
        return dominio
    except IndexError:
        return None

def is_domUtec(email):
    """Verifica si el email pertenece al dominio institucional habilitado."""
    
    org = obtener_organizacion(email=email)
    
    if org != "utec":
        return False
    else:
        return True