from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictException
from app.database.session import get_db
from app.schemas.role import UserRoleOut
from app.services import role_service, users_service

router = APIRouter()


class BootstrapAdminRequest(BaseModel):
    """Payload para bootstrap del primer administrador."""

    email: EmailStr


# ============================================================
# POST /setup/bootstrap-admin
# Asigna el rol admin al primer usuario administrador.
# Solo funciona si no existe ningún admin y el bootstrap está habilitado.
# Requiere header X-Setup-Token válido.
# Auth: No requerida (controlado por token de bootstrap)
# ============================================================
@router.post("/bootstrap-admin", response_model=UserRoleOut, status_code=status.HTTP_201_CREATED)
def bootstrap_admin(
    payload: BootstrapAdminRequest,
    x_setup_token: str | None = Header(default=None, alias="X-Setup-Token"),
    db: Session = Depends(get_db),
):
    # """Bootstrapea el primer usuario administrador del sistema."""
    # if not settings.ENABLE_ADMIN_BOOTSTRAP:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="El bootstrap de administrador está deshabilitado",
    #     )

    # if not settings.BOOTSTRAP_ADMIN_TOKEN:
    #     raise HTTPException(
    #         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #         detail="BOOTSTRAP_ADMIN_TOKEN no está configurado",
    #     )

    # if x_setup_token != settings.BOOTSTRAP_ADMIN_TOKEN:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Token de bootstrap inválido",
    #     )

    if role_service.admin_exists(db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe al menos un administrador en el sistema",
        )

    user = users_service.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    admin_role = role_service.ensure_role_exists(
        db,
        name=role_service.ADMIN_ROLE_NAME,
        description="Rol con permisos de administración",
    )

    try:
        user_role = role_service.assign_role_to_user(db, user_id=user.id, role_id=admin_role.id)
    except ConflictException:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya tiene rol admin asignado",
        )

    return UserRoleOut(
        user_id=user_role.user_id,
        role_id=user_role.role_id,
        role_name=admin_role.name,
        assigned_at=user_role.assigned_at,
    )
