from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.post import Post, PostStatus
from app.models.post_reaction import PostReaction
from app.core.exceptions import NotFoundException


def _reaction_count(db: Session, post_id: int) -> int:
    return db.scalar(
        select(func.count()).select_from(PostReaction).where(
            PostReaction.post_id == post_id
        )
    ) or 0


def toggle_reaction(db: Session, user_id: int, post_id: int) -> tuple[bool, int]:
    """Alterna la reacción (me gusta) del usuario en un post publicado.

    Devuelve (reacted, count): si tras la operación el usuario reaccionó y el
    conteo total de reacciones.
    """
    post = db.get(Post, post_id)
    if not post or post.status != PostStatus.published:
        raise NotFoundException("Post")

    existing = db.query(PostReaction).filter(
        PostReaction.user_id == user_id,
        PostReaction.post_id == post_id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return False, _reaction_count(db, post_id)

    reaction = PostReaction(user_id=user_id, post_id=post_id)
    db.add(reaction)
    db.commit()
    return True, _reaction_count(db, post_id)


def get_reaction_count(db: Session, post_id: int, user_id: int | None = None) -> tuple[int, bool]:
    """Devuelve (count, user_reacted) para un post."""
    count = _reaction_count(db, post_id)
    user_reacted = False
    if user_id is not None:
        user_reacted = db.query(PostReaction).filter(
            PostReaction.user_id == user_id,
            PostReaction.post_id == post_id,
        ).first() is not None
    return count, user_reacted
