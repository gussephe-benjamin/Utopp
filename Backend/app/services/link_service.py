from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.post_link import PostLink
from app.schemas.link import LinkCreate, LinkUpdate, LinkReorderRequest
from app.core.exceptions import NotFoundException, BadRequestException


def create_link(db: Session, post_id: int, data: LinkCreate) -> PostLink:
    """Crea un nuevo link para un post."""
    # Obtener la posición máxima actual
    max_position = db.query(PostLink).filter(
        PostLink.post_id == post_id
    ).count()
    
    link = PostLink(
        post_id=post_id,
        label=data.label,
        url=data.url,
        type=data.type,
        display_type=data.display_type,
        position=data.position if data.position else max_position,
    )
    
    db.add(link)
    db.commit()
    db.refresh(link)
    
    return link


def get_link(db: Session, link_id: int) -> PostLink:
    """Obtiene un link por ID."""
    link = db.get(PostLink, link_id)
    if not link:
        raise NotFoundException("Link")
    return link


def update_link(db: Session, link: PostLink, data: LinkUpdate) -> PostLink:
    """Actualiza un link existente."""
    update_data = data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(link, field, value)
    
    db.commit()
    db.refresh(link)
    
    return link


def delete_link(db: Session, link: PostLink) -> None:
    """Elimina un link."""
    db.delete(link)
    db.commit()


def list_post_links(db: Session, post_id: int) -> List[PostLink]:
    """Lista todos los links de un post."""
    return list(
        db.scalars(
            select(PostLink)
            .where(PostLink.post_id == post_id)
            .order_by(PostLink.position)
        ).all()
    )


# def reorder_links(db: Session, post_id: int, data: LinkReorderRequest) -> List[PostLink]:
#     """Reordena los links de un post."""
#     # Verificar que todos los links pertenecen al post
#     link_ids = [item.link_id for item in data.links]
#     links = db.query(PostLink).filter(
#         PostLink.id.in_(link_ids),
#         PostLink.post_id == post_id
#     ).all()
    
#     if len(links) != len(link_ids):
#         raise BadRequestException("Algunos links no pertenecen a este post")
    
#     # Crear mapa de posiciones
#     position_map = {item.link_id: item.position for item in data.links}
    
#     # Actualizar posiciones
#     for link in links:
#         link.position = position_map[link.id]
    
#     db.commit()
    
#     return list_post_links(db, post_id)

def reorder_links(db: Session, post_id: int, data: LinkReorderRequest):

    """Reordena los links de un post."""

    link_ids = [item.link_id for item in data.links]

    links = db.query(PostLink).filter(
        PostLink.id.in_(link_ids),
        PostLink.post_id == post_id
    ).all()

    if len(links) != len(link_ids):
        raise BadRequestException("Algunos links no pertenecen a este post")

    position_map = {item.link_id: item.position for item in data.links}

    # 🚀 FASE 1 — asignar posiciones temporales negativas
    for link in links:
        link.position = -1000 - link.id

    db.flush()  # importante

    # 🚀 FASE 2 — asignar posiciones reales
    for link in links:
        link.position = position_map[link.id]

    db.commit()

    return list_post_links(db, post_id)