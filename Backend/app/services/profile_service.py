from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.user import User
from app.models.follow import Follow
from app.models.saved_post import SavedPost
from app.models.post import Post
from app.models.event_participant import PostParticipant, PostParticipantStatus


def get_profile(db: Session, user_id: int) -> dict:
    """Obtiene el perfil completo de un usuario con conteos y listas de IDs relacionados."""
    user = db.get(User, user_id)
    if not user:
        return {}

    followers_count = db.scalar(select(func.count()).select_from(Follow).where(Follow.following_id == user_id)) or 0
    following_count = db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)) or 0
    posts_count = db.scalar(select(func.count()).select_from(Post).where(Post.user_id == user_id)) or 0

    saved_post_ids = list(
        db.scalars(select(SavedPost.post_id).where(SavedPost.user_id == user_id)).all()
    )

    attending_posts = db.scalars(
        select(PostParticipant)
        .where(
            PostParticipant.user_id == user_id,
            PostParticipant.status == PostParticipantStatus.going
        )
    ).all()
    attending_post_ids = [p.post_id for p in attending_posts]

    return {
        "user": user,
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
        "saved_post_ids": saved_post_ids,
        "attending_post_ids": attending_post_ids,
    }


def follow(db: Session, follower_id: int, following_id: int) -> None:
    """Crea una relación de follow entre dos usuarios (idempotente)."""
    exists = db.query(Follow).filter(Follow.follower_id == follower_id, Follow.following_id == following_id).first()
    if not exists:
        db.add(Follow(follower_id=follower_id, following_id=following_id))
        db.commit()


def unfollow(db: Session, follower_id: int, following_id: int) -> None:
    """Elimina una relación de follow entre dos usuarios."""
    rel = db.query(Follow).filter(Follow.follower_id == follower_id, Follow.following_id == following_id).first()
    if rel:
        db.delete(rel)
        db.commit()


def update_interests(db: Session, user_id: int, interests: List[str]) -> User:
    """Reemplaza la lista de intereses de un usuario."""
    user = db.get(User, user_id)
    if not user:
        raise ValueError("Usuario no encontrado")
    user.interests = interests
    db.commit()
    db.refresh(user)
    return user
