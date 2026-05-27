from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user_role import UserRole
from app.models.user import User
from app.schemas.role import RoleCreate
from app.core.exceptions import NotFoundException, ConflictException

# Nombres canónicos de los roles del sistema
ADMIN_ROLE_NAME   = "administrador"
STUDENT_ROLE_NAME = "estudiante"
ORG_ROLE_NAME     = "organización estudiantil"
OFFICE_ROLE_NAME  = "oficina"
ROOT_ROLE_NAME    = "root"

# Catálogo canónico de roles base del sistema
# Formato: nombre → (descripción, identifier numérico fijo)
DEFAULT_ROLES: dict[str, tuple[str, int]] = {
    STUDENT_ROLE_NAME: ("Rol por defecto para todos los estudiantes registrados", 1),
    ORG_ROLE_NAME:     ("Rol para organizaciones estudiantiles que publican eventos", 2),
    OFFICE_ROLE_NAME:  ("Rol para personal de oficinas y dependencias universitarias", 3),
    ADMIN_ROLE_NAME:   ("Rol con permisos de administración total del sistema", 4),
    ROOT_ROLE_NAME:    ("Rol raíz con acceso irrestricto al sistema", 5),
}


def _get_catalog_role(name: str) -> tuple[Optional[str], Optional[int]]:
    """Devuelve la metadata canónica de un rol si pertenece al catálogo base."""
    catalog = DEFAULT_ROLES.get(name)
    if not catalog:
        return None, None
    return catalog


def _get_next_role_identifier(db: Session) -> int:
    """Genera el siguiente identifier disponible para roles no canónicos."""
    max_identifier = db.scalar(select(func.max(Role.identifier)))
    return 1 if max_identifier is None else int(max_identifier) + 1


def create_role(db: Session, data: RoleCreate) -> Role:
    """Crea un nuevo rol."""
    # Verificar que no existe un rol con el mismo nombre
    existing = db.query(Role).filter(Role.name == data.name).first()
    if existing:
        raise ConflictException(f"Ya existe un rol con nombre '{data.name}'")

    default_description, default_identifier = _get_catalog_role(data.name)
    identifier = (
        default_identifier
        if default_identifier is not None
        else _get_next_role_identifier(db)
    )

    role = Role(
        name=data.name,
        description=data.description or default_description,
        identifier=identifier,
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


def get_role_by_identifier(db: Session, identifier: int) -> Optional[Role]:
    """Obtiene un rol por su identifier numérico fijo."""
    return db.query(Role).filter(Role.identifier == identifier).first()


def ensure_role_exists(db: Session, name: str, description: Optional[str] = None, identifier: Optional[int] = None) -> Role:
    """Obtiene un rol por nombre o lo crea si no existe."""
    default_description, default_identifier = _get_catalog_role(name)
    description = description if description is not None else default_description
    identifier = identifier if identifier is not None else default_identifier

    role = get_role_by_name(db, name)
    if role:
        changed = False
        if description is not None and role.description != description:
            role.description = description
            changed = True
        if identifier is not None and role.identifier != identifier:
            role.identifier = identifier
            changed = True
        if changed:
            db.commit()
            db.refresh(role)
        return role

    if identifier is None:
        identifier = _get_next_role_identifier(db)

    role = Role(name=name, description=description, identifier=identifier)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def admin_exists(db: Session) -> bool:
    """Verifica si existe al menos un usuario con rol administrador."""
    admin_role = get_role_by_name(db, ADMIN_ROLE_NAME)
    if not admin_role:
        return False

    existing_assignment = db.query(UserRole).filter(UserRole.role_id == admin_role.id).first()
    return existing_assignment is not None


def replace_user_role(db: Session, user_id: int, new_role: Role) -> None:
    """Reemplaza cualquier rol previo del usuario por el nuevo rol indicado.
    
    Garantiza que el usuario tenga exactamente un rol en todo momento.
    Si ya tiene el nuevo rol, no hace nada (idempotente).
    """
    # Obtener todos los roles actuales del usuario
    existing_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()

    for existing in existing_roles:
        if existing.role_id == new_role.id:
            # El usuario ya tiene exactamente este rol; nada que hacer
            return
        # Eliminar el rol anterior para mantener exclusividad
        db.delete(existing)

    db.flush()  # Aplicar eliminaciones antes de insertar el nuevo rol

    # Asignar el nuevo rol
    db.add(UserRole(user_id=user_id, role_id=new_role.id))
    db.commit()


def assign_student_role(db: Session, user_id: int) -> None:
    """Asigna el rol 'estudiante' a un usuario recién creado.
    
    Usa lógica exclusiva: reemplaza cualquier rol previo.
    Crea el rol si todavía no existe.
    """
    desc, ident = DEFAULT_ROLES[STUDENT_ROLE_NAME]
    student_role = ensure_role_exists(
        db,
        name=STUDENT_ROLE_NAME,
        description=desc,
        identifier=ident,
    )

    # Reemplazar cualquier rol previo por el rol estudiante
    replace_user_role(db, user_id, student_role)


def seed_default_roles_if_empty(db: Session) -> bool:
    """Si la tabla `roles` está vacía, crea el catálogo canónico.

    No toca filas existentes (seguro en despliegues con datos o roles extra).
    """
    n = db.scalar(select(func.count()).select_from(Role)) or 0
    if n > 0:
        return False
    for name, (description, identifier) in DEFAULT_ROLES.items():
        db.add(Role(name=name, description=description, identifier=identifier))
    db.commit()
    return True


def ensure_default_roles(db: Session) -> dict:
    """Sincroniza estrictamente el catálogo de roles base del sistema.

    El resultado final en la tabla `roles` debe contener exactamente los roles
    canónicos definidos en DEFAULT_ROLES. Para minimizar impacto sobre
    asignaciones válidas:
    - elimina roles inesperados,
    - crea roles faltantes,
    - corrige descripciones de roles válidos existentes.

    Retorna un resumen del proceso con el estado por rol y los roles eliminados.
    """
    existing_roles = list(db.scalars(select(Role)).all())
    existing_by_name = {role.name: role for role in existing_roles}
    expected_names = set(DEFAULT_ROLES.keys())

    removed_roles: List[str] = []
    statuses: dict[str, str] = {}

    for role in existing_roles:
        if role.name not in expected_names:
            removed_roles.append(role.name)
            db.delete(role)

    if removed_roles:
        db.flush()

    for name, (description, identifier) in DEFAULT_ROLES.items():
        existing = existing_by_name.get(name)
        if not existing:
            db.add(Role(name=name, description=description, identifier=identifier))
            db.flush()
            statuses[name] = "created"
            continue

        changed = False
        if existing.description != description:
            existing.description = description
            changed = True
        if existing.identifier != identifier:
            existing.identifier = identifier
            changed = True
        statuses[name] = "updated" if changed else "already_exists"

    db.commit()
    return {
        "roles": statuses,
        "removed_roles": removed_roles,
    }



def list_roles(db: Session) -> List[Role]:
    """Lista todos los roles."""
    return list(db.scalars(select(Role).order_by(Role.identifier, Role.name)).all())


def assign_role_to_user(db: Session, user_id: int, role_id: int) -> UserRole:
    """Asigna un rol a un usuario reemplazando cualquier rol previo (exclusividad)."""
    # Verificar que el usuario existe
    user = db.get(User, user_id)
    if not user:
        raise NotFoundException("Usuario")
    
    # Verificar que el rol existe
    role = db.get(Role, role_id)
    if not role:
        raise NotFoundException("Rol")
    
    # Verificar si ya tiene exactamente este rol (idempotente)
    already = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id
    ).first()
    if already:
        raise ConflictException("El usuario ya tiene este rol asignado")

    # Eliminar cualquier otro rol previo para garantizar exclusividad
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    db.flush()

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

    return list(
        db.scalars(
            select(Role)
            .where(Role.id.in_(role_ids))
            .order_by(Role.identifier, Role.name)
        ).all()
    )
