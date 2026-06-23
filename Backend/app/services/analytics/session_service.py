from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_session import UserSession
from app.services.analytics.constants import SESSION_IDLE_MINUTES


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _session_duration_seconds(started_at: datetime, ended_at: datetime) -> int:
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    if ended_at.tzinfo is None:
        ended_at = ended_at.replace(tzinfo=timezone.utc)
    return max(0, int((ended_at - started_at).total_seconds()))


def close_session(session: UserSession, ended_at: datetime | None = None) -> None:
    ended = ended_at or _utcnow()
    if session.ended_at is None:
        session.ended_at = ended
        ref_end = session.last_activity_at or ended
        session.duration_seconds = _session_duration_seconds(session.started_at, ref_end)


def get_open_session(db: Session, user_id: int) -> UserSession | None:
    return db.scalars(
        select(UserSession)
        .where(UserSession.user_id == user_id, UserSession.ended_at.is_(None))
        .order_by(UserSession.last_activity_at.desc())
        .limit(1)
    ).first()


def touch_or_create_session(
    db: Session,
    user: User,
    *,
    organization_id: int | None = None,
    device_type: str | None = None,
    browser: str | None = None,
    ip_address: str | None = None,
    now: datetime | None = None,
) -> UserSession:
    now = now or _utcnow()
    idle_limit = timedelta(minutes=SESSION_IDLE_MINUTES)
    open_session = get_open_session(db, user.id)

    def _aware(dt: datetime) -> datetime:
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    if open_session and (_aware(now) - _aware(open_session.last_activity_at)) <= idle_limit:
        open_session.last_activity_at = now
        open_session.updated_at = now
        if organization_id and not open_session.organization_id:
            open_session.organization_id = organization_id
        return open_session

    if open_session:
        close_session(open_session, now)

    session = UserSession(
        user_id=user.id,
        organization_id=organization_id,
        started_at=now,
        last_activity_at=now,
        device_type=device_type,
        browser=browser,
        ip_address=ip_address,
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    db.flush()
    return session


def end_user_sessions(db: Session, user_id: int, ended_at: datetime | None = None) -> None:
    now = ended_at or _utcnow()
    for session in db.scalars(
        select(UserSession).where(UserSession.user_id == user_id, UserSession.ended_at.is_(None))
    ).all():
        close_session(session, now)
        session.updated_at = now
