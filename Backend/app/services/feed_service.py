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
from app.models.follow import Follow
from app.models.user import User
from app.models.user_profile_image import UserProfileImage
from app.schemas.feed import FeedPostOut, FeedResponse
from app.services import recommendation_service
from app.services.recommendation_service import PostSignals, ScoreResult, UserContext


def build_feed(
    db: Session,
    current_user: Optional[User],
    post_type: Optional[PostType] = None,
    exclude_post_type: Optional[PostType] = None,
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

    if exclude_post_type:
        base_conditions.append(Post.post_type != exclude_post_type)

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

    # sort=recommended: reordena los no-pineados por score heurístico (Nivel 1)
    # ajustado por personalización del usuario (Nivel 2). Los pineados nunca
    # entran al cálculo — mantienen su orden actual. Ver recommendation_service.py.
    score_by_id: dict[int, ScoreResult] = {}
    if sort == 'recommended' and posts:
        following_ids: set[int] = set()
        if current_user:
            following_ids = set(
                db.scalars(
                    select(Follow.following_id).where(Follow.follower_id == current_user.id)
                ).all()
            )

        user_ctx = UserContext(
            interests=frozenset((current_user.interests or []) if current_user else []),
            following_ids=frozenset(following_ids),
        )

        effective_profiles = None
        if current_user:
            adjustments_by_type = recommendation_service.load_weight_adjustments(db, current_user.id)
            effective_profiles = recommendation_service.effective_weight_profiles_for_user(
                adjustments_by_type, now
            )

        signals = [
            PostSignals(
                id=p.id,
                post_type=p.post_type,
                author_id=p.user_id,
                created_at=p.created_at,
                deadline_at=p.deadline_at,
                tags=p.tags or (),
                reaction_count=reaction_count_map.get(p.id, 0),
                comment_count=comment_count_map.get(p.id, 0),
                is_pinned=p.is_pinned,
                pin_priority=p.pin_priority,
            )
            for p in posts
        ]

        ranked = recommendation_service.rank_posts(
            signals, user_ctx, now=now, weight_profiles=effective_profiles
        )

        posts_by_id = {p.id: p for p in posts}
        posts = [posts_by_id[sig.id] for sig, _ in ranked]
        score_by_id = {sig.id: result for sig, result in ranked if result is not None}

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
                relevance_score=(
                    score_by_id[post.id].total if post.id in score_by_id else None
                ),
                score_breakdown=(
                    score_by_id[post.id].breakdown if post.id in score_by_id else None
                ),
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
