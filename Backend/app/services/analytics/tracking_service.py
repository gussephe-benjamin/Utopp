import json
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.dependencies.permissions import get_user_roles
from app.models.activity_event import ActivityEvent
from app.models.user import User
from app.services import role_service
from app.services.analytics.constants import (
    ALLOWED_EVENT_TYPES,
    MAX_METADATA_BYTES,
    METADATA_FORBIDDEN_KEYS,
)
from app.services.analytics.session_service import end_user_sessions, touch_or_create_session


@dataclass
class RequestMeta:
    ip_address: str | None = None
    user_agent: str | None = None
    device_type: str | None = None
    browser: str | None = None


def is_student_user(user: User, db: Session) -> bool:
    roles = get_user_roles(user, db)
    if not roles:
        return True
    return len(roles) == 1 and roles[0] == role_service.STUDENT_ROLE_NAME


def _sanitize_metadata(metadata: dict | None) -> dict | None:
    if not metadata:
        return None
    cleaned: dict = {}
    for key, value in metadata.items():
        key_str = str(key).lower()
        if key_str in METADATA_FORBIDDEN_KEYS:
            continue
        if isinstance(value, (str, int, float, bool)) or value is None:
            cleaned[str(key)[:64]] = value
        elif isinstance(value, list) and len(value) <= 20:
            cleaned[str(key)[:64]] = value[:20]
    encoded = json.dumps(cleaned, default=str)
    if len(encoded.encode("utf-8")) > MAX_METADATA_BYTES:
        raise ValueError("metadata demasiado grande")
    return cleaned or None


def _extract_organization_id(metadata: dict | None) -> int | None:
    if not metadata:
        return None
    raw = metadata.get("organization_id")
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def track_activity_event(
    db: Session,
    user: User,
    event_type: str,
    metadata: dict | None = None,
    request_meta: RequestMeta | None = None,
) -> bool:
    """
    Registra evento y actualiza sesión. Retorna False si el usuario no es alumno.
    """
    if not is_student_user(user, db):
        return False

    if event_type not in ALLOWED_EVENT_TYPES:
        raise ValueError(f"event_type no permitido: {event_type}")

    meta = _sanitize_metadata(metadata)
    org_id = _extract_organization_id(meta)
    now = datetime.now(timezone.utc)
    req = request_meta or RequestMeta()

    if event_type in {"logout", "session_ended"}:
        end_user_sessions(db, user.id, now)
    else:
        touch_or_create_session(
            db,
            user,
            organization_id=org_id,
            device_type=req.device_type,
            browser=req.browser,
            ip_address=req.ip_address,
            now=now,
        )

    event = ActivityEvent(
        user_id=user.id,
        organization_id=org_id,
        event_type=event_type,
        event_metadata=meta,
        created_at=now,
    )
    db.add(event)
    db.commit()
    return True
