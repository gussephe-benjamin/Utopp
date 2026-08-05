"""Acceso a la tabla de eventos compartida con Utopp Formulario.

Los dos productos usan la misma instancia de PostgreSQL. La tabla de eventos
vive en el schema `formulario`, cuyo dueño es Utopp Formulario; Plataforma solo
tiene USAGE sobre el schema, SELECT + INSERT en `events` y `users`, y SELECT en
`attendees`. Cualquier operación fuera de eso falla por permisos, a propósito.

Diferencia con Formulario: allí el listado se filtra por organizador; aquí se
devuelven los eventos de todos los creadores.
"""
import uuid
from typing import List, Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.shared_event import SharedEvent, SharedFormularioUser
from app.models.user import User
from app.schemas.shared_event import SharedEventCreate

# Utopp Formulario no acepta inscripciones con campos personalizados que no
# haya definido el organizador, y Plataforma no puede escribir en
# ticket_form_fields. Los eventos creados desde aquí usan el formulario
# estándar (nombre + email), que es lo que exige formulario.attendees.


def _registration_url(event_id: uuid.UUID) -> str:
    return f"{settings.UF_FRONTEND_URL.rstrip('/')}/e/{event_id}"


def _registered_counts(db: Session, event_ids: Sequence[uuid.UUID]) -> dict:
    """Inscritos por evento. Devuelve ceros si no hay permiso de lectura."""
    if not event_ids:
        return {}
    try:
        rows = db.execute(
            text(
                "SELECT event_id, COUNT(*) FROM formulario.attendees "
                "WHERE event_id = ANY(:ids) GROUP BY event_id"
            ),
            {"ids": list(event_ids)},
        ).all()
    except ProgrammingError:
        db.rollback()
        return {}
    return {row[0]: row[1] for row in rows}


def _creators(db: Session, creator_ids: Sequence[uuid.UUID]) -> dict:
    if not creator_ids:
        return {}
    rows = (
        db.execute(
            select(SharedFormularioUser).where(
                SharedFormularioUser.id.in_(list(creator_ids))
            )
        )
        .scalars()
        .all()
    )
    return {row.id: row for row in rows}


def _utopp_ids_by_email(db: Session, emails: Sequence[str]) -> dict:
    """Cruza organizadores de Formulario con usuarios de Plataforma por email."""
    if not emails:
        return {}
    rows = db.execute(
        select(User.email, User.id).where(
            func.lower(User.email).in_([e.lower() for e in emails if e])
        )
    ).all()
    return {email.lower(): user_id for email, user_id in rows}


def _serialize(event: SharedEvent, counts: dict, creators: dict, utopp_ids: dict) -> dict:
    creator = creators.get(event.creator_id)
    creator_payload = None
    if creator is not None:
        creator_payload = {
            "id": creator.id,
            "email": creator.email,
            "full_name": creator.full_name,
            "avatar_url": creator.avatar_url,
            "utopp_user_id": utopp_ids.get((creator.email or "").lower()),
        }

    return {
        "id": event.id,
        "creator_id": event.creator_id,
        "title": event.title,
        "description": event.description,
        "short_description": event.short_description,
        "category": event.category,
        "theme": event.theme,
        "highlights": event.highlights,
        "date_time": event.date_time,
        "location": event.location,
        "capacity": event.capacity,
        "banner_url": event.banner_url,
        "allow_only_utec_emails": event.allow_only_utec_emails,
        "visible_on_plataforma": event.visible_on_plataforma,
        "utopp_post_id": event.utopp_post_id,
        "creator_utopp_user_id": event.creator_utopp_user_id,
        "created_at": event.created_at,
        "registered_count": counts.get(event.id, 0),
        "creator": creator_payload,
        "registration_url": _registration_url(event.id),
    }


def list_events(
    db: Session,
    *,
    limit: int = 20,
    offset: int = 0,
    upcoming_only: bool = False,
    search: Optional[str] = None,
    category: Optional[str] = None,
) -> tuple[List[dict], int]:
    """Todos los eventos de todos los creadores, más recientes primero."""
    stmt = select(SharedEvent)
    count_stmt = select(func.count()).select_from(SharedEvent)

    if upcoming_only:
        stmt = stmt.where(SharedEvent.date_time >= func.now())
        count_stmt = count_stmt.where(SharedEvent.date_time >= func.now())
    if category:
        stmt = stmt.where(SharedEvent.category == category)
        count_stmt = count_stmt.where(SharedEvent.category == category)
    if search:
        pattern = f"%{search.strip()}%"
        condition = SharedEvent.title.ilike(pattern) | SharedEvent.location.ilike(pattern)
        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(condition)

    total = db.execute(count_stmt).scalar_one()
    events = (
        db.execute(
            stmt.order_by(SharedEvent.date_time.desc()).limit(limit).offset(offset)
        )
        .scalars()
        .all()
    )

    counts = _registered_counts(db, [e.id for e in events])
    creators = _creators(db, [e.creator_id for e in events])
    utopp_ids = _utopp_ids_by_email(db, [c.email for c in creators.values()])

    return [_serialize(e, counts, creators, utopp_ids) for e in events], total


def get_event(db: Session, event_id: uuid.UUID) -> dict:
    event = db.get(SharedEvent, event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado"
        )
    counts = _registered_counts(db, [event.id])
    creators = _creators(db, [event.creator_id])
    utopp_ids = _utopp_ids_by_email(db, [c.email for c in creators.values()])
    return _serialize(event, counts, creators, utopp_ids)


def resolve_formulario_user(db: Session, user: User) -> SharedFormularioUser:
    """Devuelve la fila espejo del usuario en formulario.users, creándola si falta.

    `formulario.events.creator_id` es FK a `formulario.users`, así que un
    usuario de Plataforma necesita su fila allí antes de poder crear un evento.
    El email es la clave de correspondencia entre los dos productos, igual que
    en el login SSO de Utopp Formulario.
    """
    if not user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tu cuenta no tiene un email asociado; no se puede crear el evento.",
        )

    existing = db.execute(
        select(SharedFormularioUser).where(
            func.lower(SharedFormularioUser.email) == user.email.lower()
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    mirror = SharedFormularioUser(
        id=uuid.uuid4(),
        email=user.email,
        # Sin password_hash: Utopp Formulario lo interpreta como usuario SSO.
        password_hash=None,
        full_name=user.full_name,
    )
    db.add(mirror)
    db.flush()
    return mirror


def create_event(db: Session, *, user: User, data: SharedEventCreate) -> dict:
    creator = resolve_formulario_user(db, user)

    event = SharedEvent(
        id=uuid.uuid4(),
        creator_id=creator.id,
        creator_utopp_user_id=user.id,
        title=data.title.strip(),
        description=data.description,
        short_description=data.short_description,
        category=data.category,
        theme=data.theme,
        highlights=data.highlights,
        date_time=data.date_time,
        location=data.location.strip(),
        capacity=data.capacity,
        banner_url=data.banner_url,
        allow_only_utec_emails=data.allow_only_utec_emails,
        # Un evento creado desde Plataforma nace visible ahí.
        visible_on_plataforma=True,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return _serialize(
        event,
        counts={},
        creators={creator.id: creator},
        utopp_ids={(creator.email or "").lower(): user.id},
    )
