from typing import List

from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.post import Post, PostStatus
from app.models.post_comment import PostComment
from app.models.user_profile_image import UserProfileImage
from app.schemas.engagement import CommentCreate, CommentOut
from app.core.exceptions import NotFoundException, ForbiddenException
from app.services import role_service, weight_adjustment_service


def _to_comment_out(comment: PostComment, profile_image_url: str | None) -> CommentOut:
    return CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        user_name=comment.user.full_name if comment.user else None,
        user_profile_image_url=profile_image_url,
    )


def create_comment(db: Session, user_id: int, post_id: int, data: CommentCreate) -> CommentOut:
    """Crea un comentario en un post publicado."""
    post = db.get(Post, post_id)
    if not post or post.status != PostStatus.published:
        raise NotFoundException("Post")

    comment = PostComment(
        user_id=user_id,
        post_id=post_id,
        content=data.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    weight_adjustment_service.record_interaction(db, user_id=user_id, post=post, event_type="commented")

    db.refresh(comment, attribute_names=["user"])
    profile_image_url = db.scalar(
        select(UserProfileImage.url).where(
            UserProfileImage.user_id == user_id,
            UserProfileImage.is_active.is_(True),
        )
    )
    return _to_comment_out(comment, profile_image_url)


def list_comments(
    db: Session,
    post_id: int,
    limit: int = 20,
    offset: int = 0,
) -> tuple[List[CommentOut], int]:
    """Lista los comentarios de un post, más antiguos primero."""
    total = db.scalar(
        select(func.count()).select_from(PostComment).where(
            PostComment.post_id == post_id
        )
    ) or 0

    comments = db.scalars(
        select(PostComment)
        .options(selectinload(PostComment.user))
        .where(PostComment.post_id == post_id)
        .order_by(PostComment.created_at.asc())
        .offset(offset)
        .limit(limit)
    ).all()

    author_ids = list({c.user_id for c in comments})
    profile_image_map: dict[int, str] = {}
    if author_ids:
        images = db.scalars(
            select(UserProfileImage).where(
                UserProfileImage.user_id.in_(author_ids),
                UserProfileImage.is_active.is_(True),
            )
        ).all()
        profile_image_map = {img.user_id: img.url for img in images}

    items = [_to_comment_out(c, profile_image_map.get(c.user_id)) for c in comments]
    return items, total


def delete_comment(db: Session, user_id: int, post_id: int, comment_id: int) -> None:
    """Elimina un comentario. Solo el autor o un admin/root puede hacerlo."""
    comment = db.get(PostComment, comment_id)
    if not comment or comment.post_id != post_id:
        raise NotFoundException("Comentario")

    if comment.user_id != user_id:
        role_names = {r.name for r in role_service.get_user_roles(db, user_id)}
        if not ({role_service.ADMIN_ROLE_NAME, role_service.ROOT_ROLE_NAME} & role_names):
            raise ForbiddenException("No puedes eliminar este comentario")

    db.delete(comment)
    db.commit()
