"""Eventos de Formulario en los que participa el usuario de Utopp (JOIN por email).

Consulta on-read: no hay tabla espejo ni poller. Si alguien se registró como
guest en Formulario y luego crea cuenta Utopp con el mismo email, el GET
lista esos eventos sin backfill.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.user_events import UserEventStatus, UserParticipatedEventOut


def _ticket_url(ticket_id) -> Optional[str]:
    if ticket_id is None:
        return None
    return f"{settings.UF_FRONTEND_URL.rstrip('/')}/ticket/{ticket_id}"


def _row_to_out(row) -> UserParticipatedEventOut:
    checked_in = bool(row.checked_in)
    status: UserEventStatus = "attended" if checked_in else "registered"
    ticket_id = getattr(row, "ticket_id", None)
    return UserParticipatedEventOut(
        event_id=row.event_id,
        title=row.title,
        date_time=row.date_time,
        location=row.location,
        banner_url=row.banner_url,
        category=row.category,
        theme=row.theme,
        registered_at=row.registered_at,
        checked_in=checked_in,
        checked_in_at=row.checked_in_at,
        status=status,
        ticket_id=ticket_id,
        ticket_url=_ticket_url(ticket_id),
    )


def _dedupe_by_event(
    items: List[UserParticipatedEventOut],
) -> List[UserParticipatedEventOut]:
    """Un evento por email: inscripciones duplicadas o varios boletos no duplican la tarjeta."""
    by_id: Dict[object, UserParticipatedEventOut] = {}
    order: List[object] = []
    for item in items:
        prev = by_id.get(item.event_id)
        if prev is None:
            by_id[item.event_id] = item
            order.append(item.event_id)
            continue
        if item.checked_in and not prev.checked_in:
            by_id[item.event_id] = item
    return [by_id[event_id] for event_id in order]


def list_my_participated_events(
    db: Session,
    *,
    email: str,
    status: Optional[UserEventStatus] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[UserParticipatedEventOut]:
    """Lista eventos de Formulario donde `email` aparece en attendees.

    Excluye borradores. Un inscrito sin check-in se oculta al vencer el evento;
    `checked_in` permanece siempre (evidencia de asistencia / logro).
    Si el schema formulario no está disponible, devuelve lista vacía.
    """
    if not email or not email.strip():
        return []

    if db.get_bind().dialect.name != "postgresql":
        return []

    # Filtro de status en SQL cuando se pide, para no traer filas de más.
    # Visibilidad permanente: solo check-in (asistió). Los inscritos sin QR
    # escaneado desaparecen al vencer e.date_time.
    status_clause = ""
    params: dict = {
        "email": email.strip(),
        "limit": limit,
        "offset": offset,
    }
    if status == "attended":
        status_clause = "AND COALESCE(t.checked_in, false) IS TRUE"
    elif status == "registered":
        status_clause = (
            "AND COALESCE(t.checked_in, false) IS FALSE "
            "AND e.date_time >= NOW()"
        )

    sql = f"""
        SELECT * FROM (
            SELECT DISTINCT ON (e.id)
                   e.id AS event_id,
                   e.title,
                   e.date_time,
                   e.location,
                   e.banner_url,
                   e.category,
                   e.theme,
                   a.registered_at,
                   COALESCE(t.checked_in, false) AS checked_in,
                   t.checked_in_at,
                   t.id AS ticket_id
            FROM formulario.attendees a
            JOIN formulario.events e ON e.id = a.event_id
            LEFT JOIN formulario.tickets t ON t.attendee_id = a.id
            WHERE lower(a.email) = lower(:email)
              AND e.is_draft IS FALSE
              AND (
                COALESCE(t.checked_in, false) IS TRUE
                OR e.date_time >= NOW()
              )
              {status_clause}
            ORDER BY e.id,
                     COALESCE(t.checked_in, false) DESC,
                     a.registered_at ASC,
                     t.id ASC NULLS LAST
        ) q
        ORDER BY q.date_time DESC
        LIMIT :limit OFFSET :offset
    """

    try:
        rows = db.execute(text(sql), params).all()
    except ProgrammingError:
        db.rollback()
        return []
    except Exception:
        db.rollback()
        return []

    return _dedupe_by_event([_row_to_out(row) for row in rows])
