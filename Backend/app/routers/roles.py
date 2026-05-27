from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.models.user import User
from app.schemas.role import RoleCreate, RoleOut, RoleWithUserOut, UserRoleOut
from app.services import role_service
from app.services.users_service import get_user_by_email, get_user_by_id
from app.services.role_service import get_role_by_identifier

router = APIRouter()


# ============================================================
# GET /roles/me
# Retorna los roles del usuario autenticado, incluyendo su email.
# Auth: Requerida
# Permisos: Cualquier usuario autenticado
# ============================================================
@router.get("/me", response_model=List[RoleWithUserOut])
def get_my_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    roles = role_service.get_user_roles(db, current_user.id)
    return [
        RoleWithUserOut(
            id=r.id,
            identifier=r.identifier,
            name=r.name,
            description=r.description,
            user_email=current_user.email,
        )
        for r in roles
    ]


# ============================================================
# GET /roles/by-email?email=...
# Retorna los roles de un usuario identificado por correo, con su email.
# Auth: Requerida
# Permisos: Cualquier usuario autenticado
# ============================================================
@router.get("/by-email", response_model=List[RoleWithUserOut])
def get_roles_by_email(
    email: str = Query(..., description="Correo electrónico del usuario a consultar"),
    db: Session = Depends(get_db),
    _: User = Depends(require_terms_accepted),
):
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró ningún usuario con el correo '{email}'",
        )
    roles = role_service.get_user_roles(db, user.id)
    return [
        RoleWithUserOut(
            id=r.id,
            identifier=r.identifier,
            name=r.name,
            description=r.description,
            user_email=user.email,
        )
        for r in roles
    ]


# ============================================================
# GET /roles
# Lista todos los roles del catálogo del sistema.
# Auth: Requerida
# Permisos: Cualquier usuario autenticado
# ============================================================
@router.get("/", response_model=List[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_terms_accepted),
):
    return role_service.list_roles(db)


# ============================================================
# POST /roles
# Crea un rol nuevo y le asigna un identifier válido.
# Auth: Requerida
# Permisos: Cualquier usuario autenticado
# ============================================================
@router.post("/", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_terms_accepted),
):
    return role_service.create_role(db, data)


# ============================================================
# POST /roles/users/{user_id}/roles/{role_identifier}
# Asigna un rol existente a un usuario usando el identifier numérico del rol.
# Auth: Requerida
# Permisos: Cualquier usuario autenticado
# ============================================================
@router.post(
    "/users/{user_id}/roles/{role_identifier}",
    response_model=UserRoleOut,
    status_code=status.HTTP_201_CREATED,
)
def assign_role_to_user(
    user_id: int,
    role_identifier: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_terms_accepted),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    role = get_role_by_identifier(db, role_identifier)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No existe un rol con identifier '{role_identifier}'")

    user_role = role_service.assign_role_to_user(db, user_id=user_id, role_id=role.id)

    return UserRoleOut(
        user_id=user_role.user_id,
        user_email=user.email,
        role_id=user_role.role_id,
        role_identifier=role.identifier,
        role_name=role.name,
        assigned_at=user_role.assigned_at,
    )


# ============================================================
# DELETE /roles/users/{user_id}/roles/{role_identifier}
# Quita un rol asignado a un usuario usando el identifier numérico del rol.
# Auth: Requerida
# Permisos: Cualquier usuario autenticado
# ============================================================
@router.delete("/users/{user_id}/roles/{role_identifier}", status_code=status.HTTP_204_NO_CONTENT)
def remove_role_from_user(
    user_id: int,
    role_identifier: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_terms_accepted),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    role = get_role_by_identifier(db, role_identifier)
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No existe un rol con identifier '{role_identifier}'")

    role_service.remove_role_from_user(db, user_id=user_id, role_id=role.id)


# ============================================================
# GET /roles/users/{user_id}/roles
# Lista los roles asignados a un usuario específico, con su email.
# Auth: Requerida
# Permisos: Cualquier usuario autenticado
# ============================================================
@router.get("/users/{user_id}/roles", response_model=List[RoleWithUserOut])
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_terms_accepted),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    roles = role_service.get_user_roles(db, user_id)
    return [
        RoleWithUserOut(
            id=r.id,
            identifier=r.identifier,
            name=r.name,
            description=r.description,
            user_email=user.email,
        )
        for r in roles
    ]
