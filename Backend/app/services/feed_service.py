from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session, selectinload

from app.models.post import Post, PostStatus, PostType, SubPostType
from app.models.saved_post import SavedPost
from app.models.event_participant import PostParticipant
from app.models.user import User
from app.models.user_profile_image import UserProfileImage
from app.schemas.feed import FeedPostOut, FeedResponse


def build_feed(
    db: Session,
    current_user: Optional[User],
    post_type: Optional[PostType] = None,
    subtype: Optional[SubPostType] = None,
    tags: Optional[List[str]] = None,
    page: int = 1,
    size: int = 20,
) -> FeedResponse:
    
    """Construye el feed de posts publicados."""
    
    now = datetime.now(timezone.utc)
    
    # Query base: solo posts publicados con deadline válido
    base_conditions = [
        Post.status == PostStatus.published,
        or_(
            Post.deadline_at.is_(None),
            Post.deadline_at > now
        )
    ]
    
    # Filtros opcionales
    if post_type:
        base_conditions.append(Post.post_type == post_type)
    
    if subtype:
        base_conditions.append(Post.subtype == subtype)
    
    if tags:
        # Filtrar posts que contengan al menos uno de los tags
        for tag in tags:
            base_conditions.append(Post.tags.contains([tag]))
    
    # Contar total
    count_query = select(func.count()).select_from(Post).where(and_(*base_conditions))
    total = db.scalar(count_query) or 0
    
    # Query principal con relaciones
    query = (
        select(Post)
        .options(
            selectinload(Post.user),
            selectinload(Post.images),
            selectinload(Post.links),
        )
        .where(and_(*base_conditions))
        .order_by(Post.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    
    posts = db.scalars(query).all()
    
    # Obtener posts guardados y participaciones del usuario actual
    saved_post_ids = set()
    participation_map = {}
    
    if current_user:
        saved_posts = db.scalars(
            select(SavedPost.post_id).where(SavedPost.user_id == current_user.id)
        ).all()
        saved_post_ids = set(saved_posts)
        
        post_ids = [p.id for p in posts]
        if post_ids:
            participations = db.scalars(
                select(PostParticipant).where(
                    PostParticipant.user_id == current_user.id,
                    PostParticipant.post_id.in_(post_ids)
                )
            ).all()
            participation_map = {p.post_id: p.status.value for p in participations}
    
    # Batch-fetch active profile images for all post authors
    author_ids = list({p.user_id for p in posts})
    profile_image_map: dict[int, str] = {}
    if author_ids:
        profile_images = db.scalars(
            select(UserProfileImage).where(
                UserProfileImage.user_id.in_(author_ids),
                UserProfileImage.is_active.is_(True),
            )
        ).all()
        profile_image_map = {img.user_id: img.url for img in profile_images}

    # Construir respuesta
    items = []
    for post in posts:
        first_image_url = None
        if post.images:
            sorted_images = sorted(post.images, key=lambda x: x.position)
            first_image_url = sorted_images[0].url if sorted_images else None
        
        items.append(
            FeedPostOut(
                id=post.id,
                user_id=post.user_id,
                title=post.title,
                description=post.description,
                post_type=post.post_type,
                subtype=post.subtype,
                tags=post.tags,
                deadline_at=post.deadline_at,
                time_status=post.time_status,
                created_at=post.created_at,
                user_name=post.user.full_name if post.user else None,
                user_email=post.user.email if post.user else None,
                user_profile_image_url=profile_image_map.get(post.user_id),
                image_url=first_image_url,
                images_count=len(post.images) if post.images else 0,
                links_count=len(post.links) if post.links else 0,
                is_saved=post.id in saved_post_ids,
                participation_status=participation_map.get(post.id),
            )
        )
    
    pages = (total + size - 1) // size if size > 0 else 0
    
    return FeedResponse(
        items=items,
        page=page,
        size=size,
        total=total,
        has_next=page < pages,
        has_prev=page > 1,
    )
