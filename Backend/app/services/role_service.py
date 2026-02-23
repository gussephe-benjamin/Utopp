from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user_role import UserRole
from app.models.user import User
from app.schemas.role import RoleCreate
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException

ADMIN_ROLE_NAME = "admin"


def create_role(db: Session, data: RoleCreate) -> Role:
    """Crea un nuevo rol."""
    # Verificar que no existe un rol con el mismo nombre
    existing = db.query(Role).filter(Role.name == data.name).first()
    if existing:
        raise ConflictException(f"Ya existe un rol con nombre '{data.name}'")
    
    role = Role(
        name=data.name,
        description=data.description,
    )
    
    db.add(role)
    db.commit()
    db.refresh(role)
    
    return role


def get_role(db: Session, role_id: int) -> Role:
    """Obtiene un rol por ID."""
    role = db.get(Role, role_id)
    if not role:
        raise NotFoundException("Rol")
    return role


def get_role_by_name(db: Session, name: str) -> Optional[Role]:
    """Obtiene un rol por nombre."""
    return db.query(Role).filter(Role.name == name).first()


def ensure_role_exists(db: Session, name: str, description: Optional[str] = None) -> Role:
    """Obtiene un rol por nombre o lo crea si no existe."""
    role = get_role_by_name(db, name)
    if role:
        return role

    role = Role(name=name, description=description)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def admin_exists(db: Session) -> bool:
    """Verifica si existe al menos un usuario con rol admin."""
    admin_role = get_role_by_name(db, ADMIN_ROLE_NAME)
    if not admin_role:
        return False

    existing_assignment = db.query(UserRole).filter(UserRole.role_id == admin_role.id).first()
    return existing_assignment is not None


def list_roles(db: Session) -> List[Role]:
    """Lista todos los roles."""
    return list(db.scalars(select(Role).order_by(Role.name)).all())


def assign_role_to_user(db: Session, user_id: int, role_id: int) -> UserRole:
    """Asigna un rol a un usuario."""
    # Verificar que el usuario existe
    user = db.get(User, user_id)
    if not user:
        raise NotFoundException("Usuario")
    
    # Verificar que el rol existe
    role = db.get(Role, role_id)
    if not role:
        raise NotFoundException("Rol")
    
    # Verificar si ya tiene el rol
    existing = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id
    ).first()
    
    if existing:
        raise ConflictException("El usuario ya tiene este rol asignado")
    
    user_role = UserRole(
        user_id=user_id,
        role_id=role_id,
    )
    
    db.add(user_role)
    db.commit()
    db.refresh(user_role)
    
    return user_role


def remove_role_from_user(db: Session, user_id: int, role_id: int) -> None:
    """Quita un rol a un usuario."""
    user_role = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id
    ).first()
    
    if not user_role:
        raise NotFoundException("Asignación de rol")
    
    db.delete(user_role)
    db.commit()


def get_user_roles(db: Session, user_id: int) -> List[Role]:
    """Obtiene los roles de un usuario."""
    user_roles = db.scalars(
        select(UserRole).where(UserRole.user_id == user_id)
    ).all()
    
    role_ids = [ur.role_id for ur in user_roles]
    if not role_ids:
        return []
    
    return list(db.scalars(select(Role).where(Role.id.in_(role_ids))).all())
