"""Tests unitarios de eventos participados (JOIN por email).

Cubren el soft-join guest → signup: un attendee preexistente con el mismo
email que el usuario Utopp aparece en el listado sin backfill, porque la
consulta filtra por `lower(email)` en lectura.

No requieren Postgres ni servidor vivo (mismo estilo que
`test_recommendation_score.py`).
"""
from __future__ import annotations

import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from sqlalchemy.exc import ProgrammingError

BACKEND_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from app.schemas.user_events import UserParticipatedEventOut  # noqa: E402
from app.services import user_events_service as svc  # noqa: E402


NOW = datetime(2026, 8, 10, 18, 0, tzinfo=timezone.utc)
EVENT_ID = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
TICKET_ID = uuid.UUID("11111111-2222-3333-4444-555555555555")


def _row(
    *,
    checked_in: bool = False,
    checked_in_at=None,
    title: str = "Hackathon Utopp",
    event_id=EVENT_ID,
    ticket_id=TICKET_ID,
):
    return SimpleNamespace(
        event_id=event_id,
        title=title,
        date_time=NOW,
        location="UTEC",
        banner_url=None,
        category="tech",
        theme="violet",
        registered_at=NOW,
        checked_in=checked_in,
        checked_in_at=checked_in_at,
        ticket_id=ticket_id,
    )


def _pg_db(rows=None, *, raise_exc=None):
    """Session mock con dialect postgresql."""
    db = MagicMock()
    bind = MagicMock()
    bind.dialect.name = "postgresql"
    db.get_bind.return_value = bind
    result = MagicMock()
    if raise_exc is not None:
        db.execute.side_effect = raise_exc
    else:
        result.all.return_value = list(rows or [])
        db.execute.return_value = result
    return db


class TestRowToOut:
    def test_checked_in_maps_to_attended(self):
        out = svc._row_to_out(_row(checked_in=True, checked_in_at=NOW))
        assert isinstance(out, UserParticipatedEventOut)
        assert out.status == "attended"
        assert out.checked_in is True
        assert out.event_id == EVENT_ID
        assert out.ticket_id == TICKET_ID
        assert out.ticket_url is not None
        assert "/ticket/" in out.ticket_url
        assert str(TICKET_ID) in out.ticket_url
        assert "/e/" not in out.ticket_url

    def test_not_checked_in_maps_to_registered(self):
        out = svc._row_to_out(_row(checked_in=False))
        assert out.status == "registered"
        assert out.checked_in is False
        assert out.checked_in_at is None

    def test_missing_ticket_has_no_url(self):
        out = svc._row_to_out(_row(ticket_id=None))
        assert out.ticket_id is None
        assert out.ticket_url is None


class TestListMyParticipatedEvents:
    def test_email_match_returns_events(self):
        """Match case-insensitive: el SQL usa lower(email); el mock simula filas ya filtradas."""
        db = _pg_db([_row()])
        items = svc.list_my_participated_events(db, email="Guest.User@UTEC.edu.pe")
        assert len(items) == 1
        assert items[0].title == "Hackathon Utopp"
        assert items[0].status == "registered"
        assert items[0].ticket_url is not None
        assert str(TICKET_ID) in items[0].ticket_url
        # Parámetro pasado al SQL en lower-compare
        args, kwargs = db.execute.call_args
        params = args[1] if len(args) > 1 else kwargs.get("parameters") or kwargs
        assert params["email"] == "Guest.User@UTEC.edu.pe"

    def test_attended_status_filter_in_sql(self):
        db = _pg_db([_row(checked_in=True, checked_in_at=NOW)])
        items = svc.list_my_participated_events(
            db, email="a@utec.edu.pe", status="attended"
        )
        assert len(items) == 1
        assert items[0].status == "attended"
        sql_text = str(db.execute.call_args[0][0])
        assert "checked_in" in sql_text
        assert "TRUE" in sql_text

    def test_registered_status_filter_in_sql(self):
        db = _pg_db([_row()])
        svc.list_my_participated_events(db, email="a@utec.edu.pe", status="registered")
        sql_text = str(db.execute.call_args[0][0])
        assert "FALSE" in sql_text

    def test_sql_excludes_drafts(self):
        db = _pg_db([])
        svc.list_my_participated_events(db, email="a@utec.edu.pe")
        sql_text = str(db.execute.call_args[0][0])
        assert "is_draft IS FALSE" in sql_text
        assert "t.id AS ticket_id" in sql_text
        assert "e.date_time >= NOW()" in sql_text
        assert "checked_in" in sql_text
        assert "DISTINCT ON" in sql_text

    def test_duplicate_attendee_or_ticket_rows_collapse_to_one_event(self):
        """Inscripciones viejas (2 attendees / 2 boletos) no duplican la tarjeta del perfil."""
        other_ticket = uuid.UUID("99999999-8888-7777-6666-555555555555")
        db = _pg_db([_row(ticket_id=TICKET_ID), _row(ticket_id=other_ticket)])
        items = svc.list_my_participated_events(db, email="a@utec.edu.pe")
        assert len(items) == 1
        assert items[0].event_id == EVENT_ID
        assert items[0].ticket_id == TICKET_ID

    def test_duplicate_rows_prefer_checked_in(self):
        other_ticket = uuid.UUID("99999999-8888-7777-6666-555555555555")
        db = _pg_db(
            [
                _row(checked_in=False, ticket_id=TICKET_ID),
                _row(checked_in=True, ticket_id=other_ticket),
            ]
        )
        items = svc.list_my_participated_events(db, email="a@utec.edu.pe")
        assert len(items) == 1
        assert items[0].status == "attended"
        assert items[0].ticket_id == other_ticket

    def test_expired_noshow_excluded_from_visibility_sql(self):
        """Inscritos vencidos sin check-in no aparecen: hace falta NOW() O attended."""
        db = _pg_db([])
        svc.list_my_participated_events(db, email="a@utec.edu.pe")
        sql_text = str(db.execute.call_args[0][0])
        assert "OR e.date_time >= NOW()" in sql_text

    def test_registered_filter_requires_upcoming(self):
        db = _pg_db([])
        svc.list_my_participated_events(db, email="a@utec.edu.pe", status="registered")
        sql_text = str(db.execute.call_args[0][0])
        assert "FALSE" in sql_text
        assert sql_text.count("e.date_time >= NOW()") >= 1

    def test_attended_filter_does_not_require_upcoming(self):
        """Asistencias permanecen aunque el evento ya haya vencido."""
        db = _pg_db([])
        svc.list_my_participated_events(db, email="a@utec.edu.pe", status="attended")
        sql_text = str(db.execute.call_args[0][0])
        assert "AND COALESCE(t.checked_in, false) IS TRUE" in sql_text

    def test_empty_when_no_attendees(self):
        db = _pg_db([])
        assert svc.list_my_participated_events(db, email="nobody@utec.edu.pe") == []

    def test_empty_email_short_circuits(self):
        db = _pg_db([_row()])
        assert svc.list_my_participated_events(db, email="") == []
        assert svc.list_my_participated_events(db, email="   ") == []
        db.execute.assert_not_called()

    def test_non_postgres_returns_empty(self):
        db = MagicMock()
        bind = MagicMock()
        bind.dialect.name = "sqlite"
        db.get_bind.return_value = bind
        assert svc.list_my_participated_events(db, email="a@utec.edu.pe") == []
        db.execute.assert_not_called()

    def test_programming_error_returns_empty(self):
        db = _pg_db(raise_exc=ProgrammingError("stmt", {}, Exception("no schema")))
        assert svc.list_my_participated_events(db, email="a@utec.edu.pe") == []
        db.rollback.assert_called()

    def test_guest_then_signup_implicit_match(self):
        """Producto: attendee creado antes de la cuenta Utopp; mismo email → listado.

        No hay backfill ni utopp_user_id: basta con pasar el email del usuario
        recién creado (como hace GET /users/me/events con current_user.email).
        """
        guest_email = "pre.signup@utec.edu.pe"
        # Simula fila de attendees insertada cuando aún no existía public.users
        db = _pg_db([_row(title="Evento pre-cuenta")])
        items = svc.list_my_participated_events(db, email=guest_email)
        assert len(items) == 1
        assert items[0].title == "Evento pre-cuenta"
        assert items[0].status == "registered"


class TestUserParticipatedEventOutSchema:
    def test_status_literal(self):
        out = UserParticipatedEventOut(
            event_id=EVENT_ID,
            title="X",
            date_time=NOW,
            location="Y",
            registered_at=NOW,
            checked_in=False,
            status="registered",
            ticket_id=TICKET_ID,
            ticket_url="http://localhost:5174/ticket/" + str(TICKET_ID),
        )
        assert out.status == "registered"
        with pytest.raises(Exception):
            UserParticipatedEventOut(
                event_id=EVENT_ID,
                title="X",
                date_time=NOW,
                location="Y",
                registered_at=NOW,
                checked_in=False,
                status="draft",  # type: ignore[arg-type]
                ticket_url="http://x",
            )
