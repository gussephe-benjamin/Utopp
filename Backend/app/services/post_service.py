from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.post import Post, PostStatus, TimeStatus, PostType, SubPostType, VALID_SUBTYPES
from app.models.user import User
from app.models.user_role import UserRole
from app.models.role import Role
from app.schemas.post import (
    PostCreate, PostUpdate,
    AcademicProjectCreate, SimplePostCreate, AnnouncementCreate,
    AcademicProjectDeadlineUpdate,
)
from app.core.exceptions import NotFoundException, BadRequestException, ValidationException


# Mapeo de nombre de rol → prioridad de pin
_PIN_PRIORITY: dict[str, int] = {
    'oficina':        1,
    'administrador':  2,
    'root':           3,
}


def get_user_pin_priority(db: Session, user_id: int) -> int:
    """Devuelve la pin_priority máxima del usuario según su rol."""
    user_role = db.scalars(
        select(UserRole).where(UserRole.user_id == user_id)
    ).first()
    if not user_role:
        return 0
    role = db.get(Role, user_role.role_id)
    if not role:
        return 0
    return _PIN_PRIORITY.get(role.name.lower(), 0)


def compute_time_status(deadline_at: Optional[datetime]) -> TimeStatus:
    """Calcula el time_status según el deadline."""
    if deadline_at is None:
        return TimeStatus.no_deadline
    now = datetime.now(timezone.utc)
    if deadline_at.tzinfo is None:
        deadline_at = deadline_at.replace(tzinfo=timezone.utc)
    return TimeStatus.in_time if deadline_at >= now else TimeStatus.out_of_time


def check_and_update_time_status(db: Session, post: Post) -> Post:
    """Verifica y actualiza time_status del post según deadline_at actual."""
    expected = compute_time_status(post.deadline_at)
    if post.time_status != expected:
        post.time_status = expected
        db.commit()
        db.refresh(post)
    return post


def validate_subtype(post_type: PostType, subtype: Optional[SubPostType]) -> None:
    """Valida que el subtipo sea válido para el tipo de post."""
    if subtype is None:
        return
    
    valid = VALID_SUBTYPES.get(post_type, [])
    if subtype not in valid:
        raise ValidationException(
            f"Subtipo '{subtype.value}' no es válido para tipo '{post_type.value}'. "
            f"Subtipos válidos: {[s.value for s in valid]}"
        )


def create_post(db: Session, user_id: int, data: PostCreate) -> Post:
    """Crea un nuevo post en estado draft."""
    validate_subtype(data.post_type, data.subtype)
    
    pin_priority = get_user_pin_priority(db, user_id) if data.is_pinned else 0

    post = Post(
        user_id=user_id,
        title=data.title,
        description=data.description,
        post_type=data.post_type,
        subtype=data.subtype,
        status=PostStatus.draft,
        tags=data.tags,
        specific_fields=data.specific_fields or {},
        deadline_at=data.deadline_at,
        time_status=compute_time_status(data.deadline_at),
        is_pinned=data.is_pinned,
        pin_priority=pin_priority,
    )
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    return post


def get_post(db: Session, post_id: int, load_relations: bool = True) -> Post:
    """Obtiene un post por ID."""
    if load_relations:
        query = (
            select(Post)
            .options(
                selectinload(Post.user),
                selectinload(Post.images),
                selectinload(Post.links),
            )
            .where(Post.id == post_id)
        )
        post = db.scalars(query).first()
    else:
        post = db.get(Post, post_id)
    
    if not post:
        raise NotFoundException("Post")
    
    return check_and_update_time_status(db, post)


def update_post(db: Session, post: Post, data: PostUpdate, user_id: Optional[int] = None) -> Post:
    """Actualiza un post existente."""
    if post.status == PostStatus.archived:
        raise BadRequestException("No se puede modificar un post archivado")
    
    if data.subtype is not None:
        validate_subtype(post.post_type, data.subtype)
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Si se cambia is_pinned, recalcular pin_priority según el rol del autor
    if 'is_pinned' in update_data:
        uid = user_id or post.user_id
        update_data['pin_priority'] = get_user_pin_priority(db, uid) if update_data['is_pinned'] else 0
    
    for field, value in update_data.items():
        setattr(post, field, value)
    
    db.commit()
    db.refresh(post)
    
    check_and_update_time_status(db, post)
    return post


def publish_post(db: Session, post: Post) -> Post:
    """Publica un post (cambia de draft a published)."""
    if post.status == PostStatus.archived:
        raise BadRequestException("No se puede publicar un post archivado")
    
    if post.status == PostStatus.published:
        raise BadRequestException("El post ya está publicado")
    
    post.status = PostStatus.published
    db.commit()
    db.refresh(post)
    
    check_and_update_time_status(db, post)
    return post


def archive_post(db: Session, post: Post) -> Post:
    """Archiva un post."""
    if post.status == PostStatus.archived:
        raise BadRequestException("El post ya está archivado")
    
    post.status = PostStatus.archived
    db.commit()
    db.refresh(post)
    
    return post


def unarchive_post(db: Session, post: Post) -> Post:
    """Desarchiva un post — vuelve a estado published y recalcula time_status."""
    if post.status != PostStatus.archived:
        raise BadRequestException("El post no está archivado")
    
    post.status = PostStatus.published
    post.time_status = compute_time_status(post.deadline_at)
    db.commit()
    db.refresh(post)
    
    return post


def create_academic_project(db: Session, user_id: int, data: AcademicProjectCreate) -> Post:
    """Crea un proyecto académico."""
    specific_fields = {}
    if data.participants_needed is not None:
        specific_fields["participants_needed"] = data.participants_needed
    if data.estimated_time is not None:
        specific_fields["estimated_time"] = data.estimated_time

    post = Post(
        user_id=user_id,
        title=data.title,
        description=data.description,
        post_type=PostType.academic_project,
        subtype=data.subtype,
        status=PostStatus.draft,
        tags=data.tags,
        specific_fields=specific_fields,
        deadline_at=data.deadline_at,
        time_status=compute_time_status(data.deadline_at),
    )

    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def create_simple_post(db: Session, user_id: int, data: SimplePostCreate) -> Post:
    """Crea una publicación simple (sin título)."""
    post = Post(
        user_id=user_id,
        title=None,
        description=data.description,
        post_type=PostType.simple_post,
        subtype=data.subtype,
        status=PostStatus.draft,
        tags=data.tags,
        specific_fields={},
        deadline_at=None,
        time_status=TimeStatus.no_deadline,
    )

    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def create_announcement(db: Session, user_id: int, data: AnnouncementCreate) -> Post:
    """Crea un anuncio con deadline requerido."""
    post = Post(
        user_id=user_id,
        title=data.title,
        description=data.description,
        post_type=PostType.announcement,
        subtype=data.subtype,
        status=PostStatus.draft,
        tags=data.tags,
        specific_fields=data.specific_fields or {},
        deadline_at=data.deadline_at,
        time_status=compute_time_status(data.deadline_at),
    )

    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def close_post(db: Session, post: Post) -> Post:
    """Cierra un post asignando deadline_at = ahora.
    Útil para proyectos académicos abiertos que el usuario decide cerrar."""
    if post.status == PostStatus.archived:
        raise BadRequestException("No se puede cerrar un post archivado")

    if post.post_type != PostType.academic_project:
        raise BadRequestException("Este endpoint solo aplica a proyectos académicos")
    
    now = datetime.now(timezone.utc)
    post.deadline_at = now
    post.time_status = TimeStatus.out_of_time
    db.commit()
    db.refresh(post)
    return post


def set_deadline(db: Session, post: Post, data: AcademicProjectDeadlineUpdate) -> Post:
    """Asigna o reemplaza el deadline de un proyecto académico y recalcula time_status."""
    if post.post_type != PostType.academic_project:
        raise BadRequestException("Este endpoint solo aplica a proyectos académicos")
    if post.status == PostStatus.archived:
        raise BadRequestException("No se puede modificar un post archivado")

    deadline_at = data.deadline_at
    if deadline_at.tzinfo is None:
        deadline_at = deadline_at.replace(tzinfo=timezone.utc)

    post.deadline_at = deadline_at
    post.time_status = compute_time_status(deadline_at)
    db.commit()
    db.refresh(post)
    return post


def remove_deadline(db: Session, post: Post) -> Post:
    """Elimina el deadline de un proyecto académico → time_status = no_deadline."""
    if post.post_type != PostType.academic_project:
        raise BadRequestException("Este endpoint solo aplica a proyectos académicos")
    if post.status == PostStatus.archived:
        raise BadRequestException("No se puede modificar un post archivado")

    post.deadline_at = None
    post.time_status = TimeStatus.no_deadline
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post: Post) -> None:
    """Elimina un post."""
    
    db.delete(post)
    db.commit()


def list_user_posts(
    db: Session, 
    user_id: int, 
    status: Optional[PostStatus] = None,
    limit: int = 50,
    offset: int = 0
) -> tuple[List[Post], int]:
    """Lista posts de un usuario."""
    query = select(Post).where(Post.user_id == user_id)
    
    if status:
        query = query.where(Post.status == status)
    
    total = db.scalar(
        select(func.count()).select_from(Post).where(Post.user_id == user_id)
    ) or 0
    
    posts = db.scalars(
        query
        .options(selectinload(Post.user))
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    
    return list(posts), total
