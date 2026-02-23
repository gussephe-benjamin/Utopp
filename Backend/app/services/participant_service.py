from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.event_participant import PostParticipant, PostParticipantStatus
from app.models.post import Post, PostType, PostStatus
from app.schemas.participant import ParticipantCreate, ParticipantUpdate, ParticipantCountOut
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException


def create_participation(
    db: Session, 
    post_id: int, 
    user_id: int, 
    data: ParticipantCreate
) -> PostParticipant:
    """Crea una participación en un post (evento)."""
    # Verificar que el post existe y es un evento
    post = db.get(Post, post_id)
    if not post:
        raise NotFoundException("Post")
    
    if post.post_type != PostType.event:
        raise BadRequestException("Solo se puede participar en eventos")
    
    if post.status != PostStatus.published:
        raise BadRequestException("El evento no está disponible")
    
    # Verificar si ya existe participación
    existing = db.query(PostParticipant).filter(
        PostParticipant.post_id == post_id,
        PostParticipant.user_id == user_id
    ).first()
    
    if existing:
        raise ConflictException("Ya estás participando en este evento")
    
    participant = PostParticipant(
        post_id=post_id,
        user_id=user_id,
        status=data.status,
    )
    
    db.add(participant)
    db.commit()
    db.refresh(participant)
    
    return participant


def get_participation(db: Session, post_id: int, user_id: int) -> Optional[PostParticipant]:
    """Obtiene la participación de un usuario en un post."""
    return db.query(PostParticipant).filter(
        PostParticipant.post_id == post_id,
        PostParticipant.user_id == user_id
    ).first()


def update_participation(
    db: Session, 
    post_id: int, 
    user_id: int, 
    data: ParticipantUpdate
) -> PostParticipant:
    """Actualiza el estado de participación."""
    participant = get_participation(db, post_id, user_id)
    
    if not participant:
        raise NotFoundException("Participación")
    
    participant.status = data.status
    db.commit()
    db.refresh(participant)
    
    return participant


def delete_participation(db: Session, post_id: int, user_id: int) -> None:
    """Elimina una participación."""
    participant = get_participation(db, post_id, user_id)
    
    if not participant:
        raise NotFoundException("Participación")
    
    db.delete(participant)
    db.commit()


def list_participants(
    db: Session, 
    post_id: int,
    status: Optional[PostParticipantStatus] = None,
    limit: int = 50,
    offset: int = 0
) -> tuple[List[PostParticipant], int]:
    """Lista participantes de un post."""
    query = select(PostParticipant).where(PostParticipant.post_id == post_id)
    count_query = select(func.count()).select_from(PostParticipant).where(
        PostParticipant.post_id == post_id
    )
    
    if status:
        query = query.where(PostParticipant.status == status)
        count_query = count_query.where(PostParticipant.status == status)
    
    total = db.scalar(count_query) or 0
    
    participants = db.scalars(
        query
        .options(selectinload(PostParticipant.user))
        .order_by(PostParticipant.joined_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    
    return list(participants), total


def get_participant_counts(db: Session, post_id: int) -> ParticipantCountOut:
    """Obtiene conteo de participantes por estado."""
    interested = db.scalar(
        select(func.count()).select_from(PostParticipant).where(
            PostParticipant.post_id == post_id,
            PostParticipant.status == PostParticipantStatus.interested
        )
    ) or 0
    
    going = db.scalar(
        select(func.count()).select_from(PostParticipant).where(
            PostParticipant.post_id == post_id,
            PostParticipant.status == PostParticipantStatus.going
        )
    ) or 0
    
    attended = db.scalar(
        select(func.count()).select_from(PostParticipant).where(
            PostParticipant.post_id == post_id,
            PostParticipant.status == PostParticipantStatus.attended
        )
    ) or 0
    
    return ParticipantCountOut(
        interested=interested,
        going=going,
        attended=attended,
        total=interested + going + attended
    )
