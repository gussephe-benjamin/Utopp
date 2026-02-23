from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_admin
from app.models.user import User
from app.schemas.role import RoleCreate, RoleOut, UserRoleOut
from app.services import role_service

router = APIRouter()


# ============================================================
# GET /roles
# Lista todos los roles disponibles en el sistema.
# Auth: Requerida
# Permisos: Solo admin
# ============================================================
@router.get("/", response_model=List[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return role_service.list_roles(db)


# ============================================================
# POST /roles
# Crea un nuevo rol en el sistema.
# Si ya existe un rol con el mismo nombre, devuelve error 409.
# Auth: Requerida
# Permisos: Solo admin
# ============================================================
@router.post("/", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return role_service.create_role(db, data)


# ============================================================
# POST /roles/users/{user_id}/roles/{role_id}
# Asigna un rol existente a un usuario.
# Si el usuario ya tiene el rol, devuelve error 409.
# Auth: Requerida
# Permisos: Solo admin
# ============================================================
@router.post(
    "/users/{user_id}/roles/{role_id}",
    response_model=UserRoleOut,
    status_code=status.HTTP_201_CREATED
)
def assign_role_to_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user_role = role_service.assign_role_to_user(db, user_id=user_id, role_id=role_id)
    role = role_service.get_role(db, role_id)

    return UserRoleOut(
        user_id=user_role.user_id,
        role_id=user_role.role_id,
        role_name=role.name,
        assigned_at=user_role.assigned_at,
    )

# ============================================================
# DELETE /roles/users/{user_id}/roles/{role_id}
# Quita un rol asignado a un usuario.
# Si la asignación no existe, devuelve error 404.
# Auth: Requerida
# Permisos: Solo admin
# ============================================================
@router.delete("/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_role_from_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    role_service.remove_role_from_user(db, user_id=user_id, role_id=role_id)
    return None


# ============================================================
# GET /roles/users/{user_id}/roles
# Lista los roles asignados a un usuario específico.
# Auth: Requerida
# Permisos: Solo admin
# ============================================================
@router.get("/users/{user_id}/roles", response_model=List[RoleOut])
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return role_service.get_user_roles(db, user_id)
