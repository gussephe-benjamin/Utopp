from typing import List, Optional

from sqlalchemy import select, func, text
from sqlalchemy.orm import Session, selectinload

from app.models.event_participant import PostParticipant, PostParticipantStatus
from app.models.post import Post, PostType, PostStatus
from app.models.user_profile_image import UserProfileImage
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantUpdate,
    ParticipantCountOut,
    ParticipantPublicOut,
)
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.services import weight_adjustment_service


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

    weight_adjustment_service.record_interaction(
        db, user_id=user_id, post=post, event_type=participant.status.value
    )

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

    previous_status = participant.status
    participant.status = data.status
    db.commit()
    db.refresh(participant)

    if weight_adjustment_service.should_record_participation_change(previous_status, data.status):
        post = db.get(Post, post_id)
        if post is not None:
            weight_adjustment_service.record_interaction(
                db, user_id=user_id, post=post, event_type=data.status.value
            )

    return participant


def delete_participation(db: Session, post_id: int, user_id: int) -> None:
    """Elimina una participación."""
    participant = get_participation(db, post_id, user_id)
    
    if not participant:
        raise NotFoundException("Participación")
    
    db.delete(participant)
    db.commit()


def get_participant_counts(db: Session, post_id: int) -> ParticipantCountOut:
    """Conteo de participantes por estado, incluyendo inscritos de UF."""
    merged = list_public_participants(db, post_id, limit=100000, offset=0)
    interested = sum(1 for m in merged if m.status == PostParticipantStatus.interested)
    going = sum(1 for m in merged if m.status == PostParticipantStatus.going)
    attended = sum(1 for m in merged if m.status == PostParticipantStatus.attended)
    return ParticipantCountOut(
        interested=interested,
        going=going,
        attended=attended,
        total=interested + going + attended,
    )


def _fetch_formulario_guests(
    db: Session, post_id: int
) -> list[tuple[ParticipantPublicOut, str]]:
    """Inscritos vía Utopp Formulario para un post (lectura cross-schema).

    Devuelve tuplas (participante, email_lower). El email se usa solo para
    deduplicar internamente; nunca se expone. Lista vacía si el esquema
    'formulario' no existe en este entorno.
    """
    if db.get_bind().dialect.name != "postgresql":
        return []
    try:
        rows = db.execute(
            text("""
                SELECT a.full_name, a.email, a.registered_at,
                       COALESCE(t.checked_in, FALSE) AS checked_in,
                       u.id AS utopp_user_id
                FROM formulario.events fe
                JOIN formulario.attendees a ON a.event_id = fe.id
                LEFT JOIN formulario.tickets t ON t.attendee_id = a.id
                LEFT JOIN public.users u ON lower(u.email) = lower(a.email)
                WHERE fe.utopp_post_id = :post_id
                ORDER BY a.registered_at DESC
            """),
            {"post_id": post_id},
        ).all()
    except Exception:
        db.rollback()
        return []

    matched_ids = [r.utopp_user_id for r in rows if r.utopp_user_id is not None]
    avatar_map: dict[int, str] = {}
    if matched_ids:
        images = db.scalars(
            select(UserProfileImage).where(
                UserProfileImage.user_id.in_(matched_ids),
                UserProfileImage.is_active.is_(True),
            )
        ).all()
        avatar_map = {img.user_id: img.url for img in images}

    guests: list[tuple[ParticipantPublicOut, str]] = []
    for r in rows:
        status = (
            PostParticipantStatus.attended
            if r.checked_in
            else PostParticipantStatus.going
        )
        guests.append((
            ParticipantPublicOut(
                status=status,
                full_name=r.full_name,
                avatar_url=avatar_map.get(r.utopp_user_id),
                is_guest=r.utopp_user_id is None,
                source="formulario",
                joined_at=r.registered_at,
            ),
            r.email.lower(),
        ))
    return guests


def list_public_participants(
    db: Session,
    post_id: int,
    status: Optional[PostParticipantStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[ParticipantPublicOut]:
    """Lista unificada de participantes UP + inscritos UF, deduplicada por email."""
    guests_with_email = _fetch_formulario_guests(db, post_id)
    guest_emails = {email for _, email in guests_with_email}
    merged: list[ParticipantPublicOut] = [g for g, _ in guests_with_email]

    up_participants = db.scalars(
        select(PostParticipant)
        .where(PostParticipant.post_id == post_id)
        .options(selectinload(PostParticipant.user))
        .order_by(PostParticipant.joined_at.desc())
    ).all()

    up_participants = [
        p for p in up_participants
        if not (p.user and p.user.email and p.user.email.lower() in guest_emails)
    ]

    user_ids = [p.user_id for p in up_participants]
    avatar_map: dict[int, str] = {}
    if user_ids:
        images = db.scalars(
            select(UserProfileImage).where(
                UserProfileImage.user_id.in_(user_ids),
                UserProfileImage.is_active.is_(True),
            )
        ).all()
        avatar_map = {img.user_id: img.url for img in images}

    for p in up_participants:
        merged.append(
            ParticipantPublicOut(
                status=p.status,
                full_name=p.user.full_name if p.user else None,
                avatar_url=avatar_map.get(p.user_id),
                is_guest=False,
                source="utopp",
                joined_at=p.joined_at,
            )
        )

    if status is not None:
        merged = [m for m in merged if m.status == status]

    merged.sort(key=lambda m: m.joined_at, reverse=True)
    return merged[offset : offset + limit]
