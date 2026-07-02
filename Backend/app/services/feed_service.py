import json
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func, or_, and_, case, literal_column, text as sa_text
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.post import Post, PostStatus, PostType, SubPostType, TimeStatus as TSEnum
from app.models.saved_post import SavedPost
from app.models.event_participant import PostParticipant
from app.models.post_reaction import PostReaction
from app.models.post_comment import PostComment
from app.models.user import User
from app.models.user_profile_image import UserProfileImage
from app.schemas.feed import FeedPostOut, FeedResponse


def build_feed(
    db: Session,
    current_user: Optional[User],
    post_type: Optional[PostType] = None,
    subtype: Optional[SubPostType] = None,
    tags: Optional[List[str]] = None,
    time_status: Optional[str] = None,
    sort: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> FeedResponse:
    
    """Construye el feed de posts publicados."""
    
    now = datetime.now(timezone.utc)
    
    # Query base: solo posts publicados (incluye vencidos)
    base_conditions = [
        Post.status == PostStatus.published,
    ]
    
    # Filtro por time_status — calculado en tiempo real a partir de deadline_at
    # vigente = sin deadline O deadline en el futuro
    # vencida = tiene deadline Y ya expiró
    if time_status == 'vigente':
        base_conditions.append(
            or_(
                Post.deadline_at.is_(None),
                Post.deadline_at > now,
            )
        )
    elif time_status == 'vencida':
        base_conditions.append(
            and_(
                Post.deadline_at.is_not(None),
                Post.deadline_at <= now,
            )
        )
    
    # Filtros opcionales
    if post_type:
        base_conditions.append(Post.post_type == post_type)
    
    if subtype:
        base_conditions.append(Post.subtype == subtype)
    
    if tags:
        # PostgreSQL: posts.tags es JSON/jsonb (array de strings). No usar LIKE sobre jsonb.
        # @> comprueba que el array contenga el elemento (OR entre tags seleccionados).
        fragments: list[str] = []
        bind: dict[str, str] = {}
        for i, tag in enumerate(tags):
            key = f"feed_tag_{i}"
            fragments.append(
                f"(posts.tags IS NOT NULL AND posts.tags::jsonb @> CAST(:{key} AS jsonb))"
            )
            bind[key] = json.dumps([tag])
        base_conditions.append(sa_text("(" + " OR ".join(fragments) + ")").bindparams(**bind))
    
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
        .order_by(
            # 1. Pinned siempre primero, por prioridad de rol (root > admin > oficina)
            Post.is_pinned.desc(),
            Post.pin_priority.desc(),
            *(
                # 2a. Orden por urgencia (default)
                [
                    case(
                        (Post.deadline_at.is_(None), literal_column('1')),
                        (Post.deadline_at > now,     literal_column('0')),
                        else_=literal_column('2'),
                    ),
                    case(
                        (and_(Post.deadline_at.is_not(None), Post.deadline_at > now), Post.deadline_at),
                        else_=literal_column('NULL'),
                    ).asc().nullslast(),
                    Post.created_at.desc(),
                ] if sort != 'recent' else
                # 2b. Orden por más recientes primero
                [Post.created_at.desc()]
            )
        )
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
    
    # Batch-fetch reaction/comment counts y reacciones del usuario actual
    post_ids = [p.id for p in posts]
    reaction_count_map: dict[int, int] = {}
    comment_count_map: dict[int, int] = {}
    user_reacted_ids: set[int] = set()
    if post_ids:
        reaction_rows = db.execute(
            select(PostReaction.post_id, func.count())
            .where(PostReaction.post_id.in_(post_ids))
            .group_by(PostReaction.post_id)
        ).all()
        reaction_count_map = {row[0]: row[1] for row in reaction_rows}

        comment_rows = db.execute(
            select(PostComment.post_id, func.count())
            .where(PostComment.post_id.in_(post_ids))
            .group_by(PostComment.post_id)
        ).all()
        comment_count_map = {row[0]: row[1] for row in comment_rows}

        if current_user:
            reacted = db.scalars(
                select(PostReaction.post_id).where(
                    PostReaction.user_id == current_user.id,
                    PostReaction.post_id.in_(post_ids),
                )
            ).all()
            user_reacted_ids = set(reacted)

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

    # URLs de inscripción de Utopp Formulario (lectura cross-schema)
    registration_url_map: dict[int, str] = {}
    if post_ids and db.get_bind().dialect.name == "postgresql":
        try:
            rows = db.execute(
                sa_text(
                    "SELECT utopp_post_id, id FROM formulario.events "
                    "WHERE utopp_post_id = ANY(:ids)"
                ),
                {"ids": post_ids},
            ).all()
            base_url = settings.UF_FRONTEND_URL.rstrip("/")
            registration_url_map = {
                int(row[0]): f"{base_url}/e/{row[1]}" for row in rows
            }
        except Exception:
            # El esquema formulario puede no existir en este entorno
            db.rollback()

    # Construir respuesta
    items = []
    for post in posts:
        first_image_url = None
        if post.images:
            sorted_images = sorted(post.images, key=lambda x: x.position)
            first_image_url = sorted_images[0].url if sorted_images else None
        
        # Calcular time_status en tiempo real (no depender del valor almacenado en DB)
        if post.deadline_at is None:
            computed_status = TSEnum.no_deadline
        else:
            dl = post.deadline_at
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            computed_status = TSEnum.in_time if dl > now else TSEnum.out_of_time
        
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
                time_status=computed_status,
                is_pinned=post.is_pinned,
                pin_priority=post.pin_priority,
                created_at=post.created_at,
                user_name=post.user.full_name if post.user else None,
                user_email=post.user.email if post.user else None,
                user_profile_image_url=profile_image_map.get(post.user_id),
                image_url=first_image_url,
                images_count=len(post.images) if post.images else 0,
                links_count=len(post.links) if post.links else 0,
                aspect_ratio=getattr(post, "aspect_ratio", None) or "4:5",
                is_saved=post.id in saved_post_ids,
                participation_status=participation_map.get(post.id),
                registration_url=registration_url_map.get(post.id),
                reaction_count=reaction_count_map.get(post.id, 0),
                user_reacted=post.id in user_reacted_ids,
                comment_count=comment_count_map.get(post.id, 0),
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
