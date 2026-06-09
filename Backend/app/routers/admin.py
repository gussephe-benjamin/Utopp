"""Endpoints de administración: gestión de usuarios (alumnos y organizaciones)."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.dependencies.pagination import PageResponse, PaginationParams
from app.dependencies.permissions import require_admin_or_root
from app.models.post import Post
from app.models.user import User
from app.models.user_profile_image import UserProfileImage
from app.schemas.admin import (
    AdminIdentityOut,
    AdminUserCreate,
    AdminUserDetailOut,
    AdminUserListItem,
    AdminUserUpdate,
)
from app.services import users_service
from app.services.role_service import ADMIN_ROLE_NAME, ROOT_ROLE_NAME, get_user_roles

router = APIRouter()


def _profile_image_url(db: Session, user_id: int) -> Optional[str]:
    img = db.scalars(
        select(UserProfileImage).where(
            UserProfileImage.user_id == user_id,
            UserProfileImage.is_active.is_(True),
        )
    ).first()
    return img.url if img else None


def _posts_count(db: Session, user_id: int) -> int:
    return db.scalar(
        select(func.count()).select_from(Post).where(Post.user_id == user_id)
    ) or 0


def _role_names(db: Session, user_id: int) -> list[str]:
    return [r.name for r in get_user_roles(db, user_id)]


def _to_list_item(db: Session, user: User) -> AdminUserListItem:
    return AdminUserListItem(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        career=user.career,
        cycle=user.cycle,
        profile_image_url=_profile_image_url(db, user.id),
        posts_count=_posts_count(db, user.id),
        created_at=user.created_at,
        roles=_role_names(db, user.id),
    )


def _to_detail(db: Session, user: User) -> AdminUserDetailOut:
    return AdminUserDetailOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        career=user.career,
        cycle=user.cycle,
        interests=user.interests,
        availability=user.availability,
        description=user.description,
        contacts=user.contacts,
        is_onboarding_completed=user.is_onboarding_completed,
        profile_image_url=_profile_image_url(db, user.id),
        created_at=user.created_at,
        roles=_role_names(db, user.id),
    )


# ============================================================
# GET /admin/me
# Identidad y estado administrativo del usuario autenticado.
# Auth: Requerida — Permisos: cualquier usuario autenticado
# (un no-admin recibe is_admin=false en vez de 403).
# ============================================================
@router.get("/me", response_model=AdminIdentityOut)
def get_admin_identity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    role_names = _role_names(db, current_user.id)
    is_root = ROOT_ROLE_NAME in role_names
    is_admin = ADMIN_ROLE_NAME in role_names or is_root
    return AdminIdentityOut(
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_admin=is_admin,
        is_root=is_root,
        roles=role_names,
    )


# ============================================================
# GET /admin/admins
# Lista los usuarios con rol administrador o root.
# Auth: Requerida — Permisos: administrador o root
# ============================================================
@router.get("/admins", response_model=list[AdminUserListItem])
def list_admins(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    users = users_service.list_admin_users(db)
    return [_to_list_item(db, u) for u in users]


# ============================================================
# GET /admin/users
# Lista paginada de usuarios con filtros de rol y búsqueda.
# Auth: Requerida — Permisos: administrador o root
# ============================================================
@router.get("/users", response_model=PageResponse[AdminUserListItem])
def list_users(
    role: Optional[str] = Query(
        default=None,
        description="Filtra por nombre de rol (estudiante, organización estudiantil, oficina...). 'all' o vacío = todos.",
    ),
    q: Optional[str] = Query(default=None, description="Busca por nombre o correo."),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    role_name = None if (role is None or role == "all") else role
    total = users_service.admin_count_users(db, role_name=role_name, q=q)
    users = users_service.admin_list_users(
        db,
        role_name=role_name,
        q=q,
        offset=pagination.offset,
        limit=pagination.size,
    )
    items = [_to_list_item(db, u) for u in users]
    return PageResponse.create(
        items=items, total=total, page=pagination.page, size=pagination.size
    )


# ============================================================
# GET /admin/users/{user_id}
# Detalle de un usuario. Auth: admin o root
# ============================================================
@router.get("/users/{user_id}", response_model=AdminUserDetailOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    user = users_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return _to_detail(db, user)


# ============================================================
# POST /admin/users
# Crea un usuario y le asigna un rol. Auth: admin o root
# ============================================================
@router.post("/users", response_model=AdminUserDetailOut, status_code=status.HTTP_201_CREATED)
def create_user(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    user = users_service.admin_create_user(
        db,
        email=str(data.email),
        password=data.password,
        full_name=data.full_name,
        role_name=data.role,
    )
    return _to_detail(db, user)


# ============================================================
# PATCH /admin/users/{user_id}
# Actualiza campos editables de un usuario. Auth: admin o root
# ============================================================
@router.patch("/users/{user_id}", response_model=AdminUserDetailOut)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    user = users_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] is not None:
        update_data["email"] = str(update_data["email"])

    user = users_service.admin_update_user(db, user, update_data)
    return _to_detail(db, user)


# ============================================================
# DELETE /admin/users/{user_id}
# Elimina un usuario y sus datos asociados. Auth: admin o root
# ============================================================
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_root),
):
    user = users_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta",
        )
    users_service.admin_delete_user(db, user)
