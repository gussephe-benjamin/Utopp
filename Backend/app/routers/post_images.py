from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_owner_or_admin
from app.models.user import User
from app.models.post import Post
from app.schemas.image import ImageCreate, ImageOut, ImageReorderRequest
from app.services import image_service

router = APIRouter()


# ============================================================
# POST /posts/{post_id}/images
# Sube una nueva imagen asociada a un post.
# La imagen se guarda con su cloudinary_id, url y posición.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.post("/posts/{post_id}/images", response_model=ImageOut, status_code=status.HTTP_201_CREATED)
def create_image(
    data: ImageCreate,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    return image_service.create_image(db, post_id=post.id, data=data)


# ============================================================
# GET /posts/{post_id}/images
# Lista todas las imágenes de un post ordenadas por posición.
# Auth: No requerida
# ============================================================
@router.get("/posts/{post_id}/images", response_model=List[ImageOut])
def list_images(
    post_id: int,
    db: Session = Depends(get_db),
):
    return image_service.list_post_images(db, post_id)


# ============================================================
# DELETE /posts/{post_id}/images/{image_id}
# Elimina una imagen específica de un post.
# Verifica que la imagen pertenezca al post indicado.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.delete("/posts/{post_id}/images/{image_id}", status_code=status.HTTP_200_OK)
def delete_image(
    image_id: int,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    image = image_service.get_image(db, image_id)

    if image.post_id != post.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no encontrada en este post"
        )

    image_service.delete_image(db, image)
    return {"message": "Imagen eliminada correctamente"}


# ============================================================
# PATCH /posts/{post_id}/images/reorder
# Reordena las imágenes de un post asignando nuevas posiciones.
# Se debe enviar un array con image_id y position por cada imagen.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.patch("/posts/{post_id}/images/reorder", response_model=List[ImageOut])
def reorder_images(
    data: ImageReorderRequest,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    return image_service.reorder_images(db, post_id=post.id, data=data)
