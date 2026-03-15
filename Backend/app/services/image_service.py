from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.post_image import PostImage
from app.models.post import Post
from app.schemas.image import ImageCreate, ImageReorderRequest
from app.core.exceptions import NotFoundException, BadRequestException


def create_image(db: Session, post_id: int, data: ImageCreate) -> PostImage:
    """Crea una nueva imagen para un post."""
    # Verificar que no existe ya una imagen con el mismo cloudinary_id
    existing = db.query(PostImage).filter(
        PostImage.cloudinary_id == data.cloudinary_id
    ).first()
    
    if existing:
        raise BadRequestException("Ya existe una imagen con ese ID de Cloudinary")
    
    # Obtener la posición máxima actual
    max_position = db.query(PostImage).filter(
        PostImage.post_id == post_id
    ).count()
    
    image = PostImage(
        post_id=post_id,
        cloudinary_id=data.cloudinary_id,
        url=data.url,
        position=data.position if data.position is not None else max_position,
        object_position=data.object_position,
        scale=data.scale,
    )
    
    db.add(image)
    db.commit()
    db.refresh(image)
    
    return image


def get_image(db: Session, image_id: int) -> PostImage:
    """Obtiene una imagen por ID."""
    image = db.get(PostImage, image_id)
    if not image:
        raise NotFoundException("Imagen")
    return image


def delete_image(db: Session, image: PostImage) -> None:
    """Elimina una imagen."""
    db.delete(image)
    db.commit()


def list_post_images(db: Session, post_id: int) -> List[PostImage]:
    """Lista todas las imágenes de un post."""
    return list(
        db.scalars(
            select(PostImage)
            .where(PostImage.post_id == post_id)
            .order_by(PostImage.position)
        ).all()
    )


def reorder_images(db: Session, post_id: int, data: ImageReorderRequest) -> List[PostImage]:
    """Reordena las imágenes de un post."""
    # Verificar que todas las imágenes pertenecen al post
    image_ids = [item.image_id for item in data.images]
    images = db.query(PostImage).filter(
        PostImage.id.in_(image_ids),
        PostImage.post_id == post_id
    ).all()
    
    if len(images) != len(image_ids):
        raise BadRequestException("Algunas imágenes no pertenecen a este post")
    
    # Crear mapa de posiciones
    position_map = {item.image_id: item.position for item in data.images}
    
    # Actualizar posiciones en dos fases para evitar UniqueConstraint (post_id, position)
    # Fase 1: mover a valores negativos temporales (sin conflictos entre sí)
    for image in images:
        image.position = -(position_map[image.id] + 1)
    db.flush()

    # Fase 2: asignar las posiciones finales
    for image in images:
        image.position = position_map[image.id]
    db.commit()
    
    return list_post_images(db, post_id)
