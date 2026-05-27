from typing import List

from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.saved_post import SavedPost
from app.models.post import Post, PostStatus
from app.core.exceptions import NotFoundException, ConflictException


def save_post(db: Session, user_id: int, post_id: int) -> SavedPost:
    """Guarda un post para un usuario."""
    # Verificar que el post existe
    post = db.get(Post, post_id)
    if not post:
        raise NotFoundException("Post")
    
    # Verificar si ya está guardado
    existing = db.query(SavedPost).filter(
        SavedPost.user_id == user_id,
        SavedPost.post_id == post_id
    ).first()
    
    if existing:
        raise ConflictException("El post ya está guardado")
    
    saved = SavedPost(
        user_id=user_id,
        post_id=post_id,
    )
    
    db.add(saved)
    db.commit()
    db.refresh(saved)
    
    return saved


def unsave_post(db: Session, user_id: int, post_id: int) -> None:
    """Quita un post de guardados."""
    saved = db.query(SavedPost).filter(
        SavedPost.user_id == user_id,
        SavedPost.post_id == post_id
    ).first()
    
    if not saved:
        raise NotFoundException("Post guardado")
    
    db.delete(saved)
    db.commit()


def is_post_saved(db: Session, user_id: int, post_id: int) -> bool:
    """Verifica si un post está guardado."""
    return db.query(SavedPost).filter(
        SavedPost.user_id == user_id,
        SavedPost.post_id == post_id
    ).first() is not None


def list_saved_posts(
    db: Session, 
    user_id: int,
    limit: int = 50,
    offset: int = 0
) -> tuple[List[Post], int]:
    """Lista los posts guardados de un usuario."""
    # Contar total de guardados del usuario
    total = db.scalar(
        select(func.count()).select_from(SavedPost).where(
            SavedPost.user_id == user_id
        )
    ) or 0

    posts = db.scalars(
        select(Post)
        .options(
            selectinload(Post.user),
            selectinload(Post.images),
        )
        .join(SavedPost, SavedPost.post_id == Post.id)
        .where(
            SavedPost.user_id == user_id,
            Post.status == PostStatus.published
        )
        .order_by(SavedPost.saved_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return list(posts), total
