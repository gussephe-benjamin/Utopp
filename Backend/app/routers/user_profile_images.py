from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.models.user import User
from app.models.user_profile_image import UserProfileImage

router = APIRouter()


class ProfileImageIn(BaseModel):
    cloudinary_id: str
    url: str


class ProfileImageOut(BaseModel):
    id: int
    url: str
    is_active: bool

    class Config:
        from_attributes = True


# ============================================================
# POST /users/me/profile-images
# Guarda una nueva foto de perfil del usuario autenticado
# y la marca como activa (desactiva las anteriores).
# Auth: Requerida
# ============================================================
@router.post(
    "/me/profile-images",
    response_model=ProfileImageOut,
    status_code=status.HTTP_201_CREATED,
    tags=["user-profile-images"],
)
@router.post(
    "/users/me/profile-images",
    response_model=ProfileImageOut,
    status_code=status.HTTP_201_CREATED,
    tags=["user-profile-images"],
)
def set_profile_image(
    data: ProfileImageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    # Desactivar todas las imágenes activas del usuario
    existing = db.scalars(
        select(UserProfileImage).where(
            UserProfileImage.user_id == current_user.id,
            UserProfileImage.is_active.is_(True),
        )
    ).all()
    for img in existing:
        img.is_active = False
    db.flush()

    # Calcular la siguiente posición
    max_pos = db.scalar(
        select(UserProfileImage.position)
        .where(UserProfileImage.user_id == current_user.id)
        .order_by(UserProfileImage.position.desc())
    )
    next_pos = (max_pos + 1) if max_pos is not None else 0

    new_img = UserProfileImage(
        user_id=current_user.id,
        cloudinary_id=data.cloudinary_id,
        url=data.url,
        position=next_pos,
        is_active=True,
    )
    db.add(new_img)
    db.commit()
    db.refresh(new_img)
    return new_img
