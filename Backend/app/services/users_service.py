from sqlalchemy.orm import Session
from sqlalchemy import select, func, delete, or_
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


# ============================================================
# Administración de usuarios (dashboard admin)
# ============================================================
def _admin_users_base_query(role_name: str | None, q: str | None):
    """Construye un SELECT de ids de usuario aplicando filtros de rol y búsqueda."""
    stmt = select(User.id)

    if role_name:
        if role_name == role_service.STUDENT_ROLE_NAME:
            # Estudiantes explícitos + usuarios legacy sin ningún rol
            with_role = (
                select(User.id)
                .join(UserRole, UserRole.user_id == User.id)
                .join(Role, Role.id == UserRole.role_id)
                .where(Role.name == role_service.STUDENT_ROLE_NAME)
            )
            without_role = (
                select(User.id)
                .outerjoin(UserRole, UserRole.user_id == User.id)
                .where(UserRole.user_id.is_(None))
            )
            allowed_ids = with_role.union(without_role).subquery()
            stmt = stmt.where(User.id.in_(select(allowed_ids)))
        else:
            role_ids = (
                select(User.id)
                .join(UserRole, UserRole.user_id == User.id)
                .join(Role, Role.id == UserRole.role_id)
                .where(Role.name == role_name)
            )
            stmt = stmt.where(User.id.in_(role_ids))

    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.full_name).like(like),
                func.lower(User.email).like(like),
            )
        )

    return stmt


def admin_count_users(db: Session, role_name: str | None = None, q: str | None = None) -> int:
    """Cuenta usuarios que cumplen los filtros del panel admin."""
    base = _admin_users_base_query(role_name, q).subquery()
    return db.scalar(select(func.count()).select_from(base)) or 0


def admin_list_users(
    db: Session,
    *,
    role_name: str | None = None,
    q: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[User]:
    """Lista paginada de usuarios para el panel admin."""
    ids_subq = _admin_users_base_query(role_name, q).subquery()
    stmt = (
        select(User)
        .where(User.id.in_(select(ids_subq)))
        .order_by(User.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def list_admin_users(db: Session) -> list[User]:
    """Retorna los usuarios con rol administrador o root."""
    admin_ids = (
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name.in_([role_service.ADMIN_ROLE_NAME, role_service.ROOT_ROLE_NAME]))
    )
    stmt = select(User).where(User.id.in_(admin_ids)).order_by(User.id.asc())
    return list(db.scalars(stmt).all())


def admin_create_user(
    db: Session,
    *,
    email: str,
    password: str,
    full_name: str | None = None,
    role_name: str | None = None,
) -> User:
    """Crea un usuario desde el panel admin y le asigna el rol indicado.

    ``create_user`` ya asigna el rol estudiante por defecto; si se pide otro
    rol, se reemplaza por el indicado (exclusividad de rol).
    """
    existing = get_user_by_email(db, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese correo",
        )

    user = create_user(db, email=email, password=password, full_name=full_name)

    if role_name and role_name != role_service.STUDENT_ROLE_NAME:
        role = role_service.get_role_by_name(db, role_name)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No existe el rol '{role_name}'",
            )
        role_service.replace_user_role(db, user.id, role)
        db.refresh(user)

    return user


def admin_update_user(db: Session, user: User, data: dict) -> User:
    """Actualiza campos editables de un usuario desde el panel admin."""
    if "email" in data and data["email"]:
        new_email = data["email"]
        if new_email.lower() != (user.email or "").lower():
            clash = get_user_by_email(db, new_email)
            if clash and clash.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un usuario con ese correo",
                )

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def admin_delete_user(db: Session, user: User) -> None:
    """Elimina un usuario y todas sus filas dependientes en orden seguro."""
    from app.models.post import Post
    from app.models.post_image import PostImage
    from app.models.post_link import PostLink
    from app.models.event_participant import PostParticipant
    from app.models.saved_post import SavedPost
    from app.models.user_profile_image import UserProfileImage
    from app.models.follow import Follow
    from app.models.legal import TermsAcceptance

    user_id = user.id

    post_ids = list(db.scalars(select(Post.id).where(Post.user_id == user_id)).all())

    if post_ids:
        db.execute(delete(PostImage).where(PostImage.post_id.in_(post_ids)))
        db.execute(delete(PostLink).where(PostLink.post_id.in_(post_ids)))
        db.execute(delete(PostParticipant).where(PostParticipant.post_id.in_(post_ids)))
        db.execute(delete(SavedPost).where(SavedPost.post_id.in_(post_ids)))
        db.execute(delete(Post).where(Post.id.in_(post_ids)))

    db.execute(delete(SavedPost).where(SavedPost.user_id == user_id))
    db.execute(delete(PostParticipant).where(PostParticipant.user_id == user_id))
    db.execute(delete(UserProfileImage).where(UserProfileImage.user_id == user_id))
    db.execute(
        delete(Follow).where(
            or_(Follow.follower_id == user_id, Follow.following_id == user_id)
        )
    )
    db.execute(delete(TermsAcceptance).where(TermsAcceptance.user_id == user_id))
    db.execute(delete(UserRole).where(UserRole.user_id == user_id))

    db.delete(user)
    db.commit()


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


def is_utec_institutional_email(email: str) -> bool:
    """Verifica que el email pertenezca exactamente al dominio @utec.edu.pe."""
    if not email:
        return False
    return email.strip().lower().endswith("@utec.edu.pe")


def is_domUtec(email):
    """Verifica si el email pertenece al dominio institucional habilitado."""
    return is_utec_institutional_email(email)