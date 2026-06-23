from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.activity_event import ActivityEvent
from app.models.follow import Follow
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.models.user_session import UserSession
from app.services import role_service
from app.services.analytics.activity_score import calculate_activity_score
from app.services.analytics.constants import (
    ENGAGEMENT_EVENT_TYPES,
    STATUS_FILTER_MAP,
    STATUS_INACTIVO,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def student_ids_subquery(organization_id: int | None = None):
    with_role = (
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name == role_service.STUDENT_ROLE_NAME)
    )
    without_role = (
        select(User.id).outerjoin(UserRole, UserRole.user_id == User.id).where(UserRole.user_id.is_(None))
    )
    base = with_role.union(without_role).subquery()
    stmt = select(base.c.id)
    if organization_id is not None:
        followers = select(Follow.follower_id).where(Follow.following_id == organization_id)
        stmt = stmt.where(base.c.id.in_(followers))
    return stmt


def _event_org_filter(organization_id: int | None):
    if organization_id is None:
        return True
    followers = select(Follow.follower_id).where(Follow.following_id == organization_id)
    return or_(
        ActivityEvent.organization_id == organization_id,
        ActivityEvent.user_id.in_(followers),
    )


def _session_org_filter(organization_id: int | None):
    if organization_id is None:
        return True
    followers = select(Follow.follower_id).where(Follow.following_id == organization_id)
    return or_(
        UserSession.organization_id == organization_id,
        UserSession.user_id.in_(followers),
    )


def count_distinct_active(
    db: Session,
    since: datetime,
    until: datetime,
    organization_id: int | None = None,
) -> int:
    student_ids = student_ids_subquery(organization_id)
    q = (
        select(func.count(func.distinct(ActivityEvent.user_id)))
        .where(
            ActivityEvent.created_at >= since,
            ActivityEvent.created_at < until,
            ActivityEvent.user_id.in_(student_ids),
            _event_org_filter(organization_id),
        )
    )
    return db.scalar(q) or 0


def _count_events(
    db: Session,
    event_type: str,
    since: datetime,
    until: datetime,
    organization_id: int | None = None,
) -> int:
    student_ids = student_ids_subquery(organization_id)
    q = select(func.count()).select_from(ActivityEvent).where(
        ActivityEvent.event_type == event_type,
        ActivityEvent.created_at >= since,
        ActivityEvent.created_at < until,
        ActivityEvent.user_id.in_(student_ids),
        _event_org_filter(organization_id),
    )
    return db.scalar(q) or 0


def get_summary(
    db: Session,
    *,
    date_from: datetime,
    date_to: datetime,
    organization_id: int | None = None,
) -> dict[str, Any]:
    now = _utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today_start + timedelta(days=1)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    student_ids = student_ids_subquery(organization_id)

    total_sessions = db.scalar(
        select(func.count())
        .select_from(UserSession)
        .where(
            UserSession.started_at >= date_from,
            UserSession.started_at < date_to,
            UserSession.user_id.in_(student_ids),
            _session_org_filter(organization_id),
        )
    ) or 0

    avg_duration = db.scalar(
        select(func.avg(UserSession.duration_seconds))
        .where(
            UserSession.started_at >= date_from,
            UserSession.started_at < date_to,
            UserSession.user_id.in_(student_ids),
            _session_org_filter(organization_id),
        )
    )
    avg_duration = float(avg_duration or 0)

    active_in_range = count_distinct_active(db, date_from, date_to, organization_id)
    sessions_per_student = (
        total_sessions / active_in_range if active_in_range > 0 else 0.0
    )

    inactive_students = _count_inactive_students(db, thirty_days_ago, organization_id)

    posts = _count_events(db, "post_created", date_from, date_to, organization_id)
    comments = _count_events(db, "post_commented", date_from, date_to, organization_id)
    reactions = _count_events(db, "post_liked", date_from, date_to, organization_id)

    period_days = max(1, (date_to - date_from).days)
    prev_to = date_from
    prev_from = date_from - timedelta(days=period_days)

    def _trend(current: float, previous: float) -> dict[str, Any] | None:
        if previous <= 0:
            return None
        change = ((current - previous) / previous) * 100
        return {
            "percent": round(change, 1),
            "direction": "up" if change > 0 else "down" if change < 0 else "neutral",
        }

    active_range_prev = count_distinct_active(db, prev_from, prev_to, organization_id)

    return {
        "activeToday": count_distinct_active(db, today_start, tomorrow, organization_id),
        "activeLast7Days": count_distinct_active(db, seven_days_ago, now, organization_id),
        "activeLast30Days": count_distinct_active(db, thirty_days_ago, now, organization_id),
        "totalSessions": total_sessions,
        "averageSessionDurationSeconds": round(avg_duration, 1),
        "sessionsPerActiveStudent": round(sessions_per_student, 2),
        "inactiveStudents": inactive_students,
        "postsCreated": posts,
        "commentsCreated": comments,
        "reactionsCreated": reactions,
        "totalInteractions": posts + comments + reactions,
        "trends": {
            "activeInRange": _trend(float(active_in_range), float(active_range_prev)),
            "totalSessions": _trend(
                float(total_sessions),
                float(
                    db.scalar(
                        select(func.count())
                        .select_from(UserSession)
                        .where(
                            UserSession.started_at >= prev_from,
                            UserSession.started_at < prev_to,
                            UserSession.user_id.in_(student_ids),
                            _session_org_filter(organization_id),
                        )
                    )
                    or 0
                ),
            ),
        },
    }


def _count_inactive_students(
    db: Session,
    since: datetime,
    organization_id: int | None = None,
) -> int:
    student_ids = student_ids_subquery(organization_id)
    active_recent = (
        select(ActivityEvent.user_id)
        .where(ActivityEvent.created_at >= since)
        .distinct()
    )
    q = select(func.count()).select_from(User).where(
        User.id.in_(student_ids),
        User.id.notin_(active_recent),
    )
    return db.scalar(q) or 0


def get_activity_timeseries(
    db: Session,
    *,
    date_from: datetime,
    date_to: datetime,
    group_by: str,
    organization_id: int | None = None,
) -> list[dict[str, Any]]:
    trunc = {"day": "day", "week": "week", "month": "month"}.get(group_by, "day")
    student_ids = student_ids_subquery(organization_id)
    bucket = func.date_trunc(trunc, ActivityEvent.created_at).label("bucket")

    active_rows = db.execute(
        select(
            bucket,
            func.count(func.distinct(ActivityEvent.user_id)).label("active_students"),
        )
        .where(
            ActivityEvent.created_at >= date_from,
            ActivityEvent.created_at < date_to,
            ActivityEvent.user_id.in_(student_ids),
            _event_org_filter(organization_id),
        )
        .group_by(bucket)
        .order_by(bucket)
    ).all()

    session_bucket = func.date_trunc(trunc, UserSession.started_at).label("bucket")
    session_rows = db.execute(
        select(
            session_bucket,
            func.count().label("sessions"),
            func.avg(UserSession.duration_seconds).label("avg_duration"),
        )
        .where(
            UserSession.started_at >= date_from,
            UserSession.started_at < date_to,
            UserSession.user_id.in_(student_ids),
            _session_org_filter(organization_id),
        )
        .group_by(session_bucket)
        .order_by(session_bucket)
    ).all()

    session_map = {
        row.bucket.date().isoformat(): {
            "sessions": int(row.sessions or 0),
            "averageSessionDurationSeconds": round(float(row.avg_duration or 0), 1),
        }
        for row in session_rows
    }

    result = []
    for row in active_rows:
        key = row.bucket.date().isoformat()
        extra = session_map.get(key, {"sessions": 0, "averageSessionDurationSeconds": 0})
        result.append(
            {
                "date": key,
                "activeStudents": int(row.active_students or 0),
                "sessions": extra["sessions"],
                "averageSessionDurationSeconds": extra["averageSessionDurationSeconds"],
            }
        )
    return result


def get_engagement_timeseries(
    db: Session,
    *,
    date_from: datetime,
    date_to: datetime,
    group_by: str,
    organization_id: int | None = None,
) -> list[dict[str, Any]]:
    trunc = {"day": "day", "week": "week", "month": "month"}.get(group_by, "day")
    student_ids = student_ids_subquery(organization_id)
    bucket = func.date_trunc(trunc, ActivityEvent.created_at).label("bucket")

    rows = db.execute(
        select(
            bucket,
            ActivityEvent.event_type,
            func.count().label("cnt"),
        )
        .where(
            ActivityEvent.created_at >= date_from,
            ActivityEvent.created_at < date_to,
            ActivityEvent.event_type.in_(ENGAGEMENT_EVENT_TYPES),
            ActivityEvent.user_id.in_(student_ids),
            _event_org_filter(organization_id),
        )
        .group_by(bucket, ActivityEvent.event_type)
        .order_by(bucket)
    ).all()

    by_date: dict[str, dict[str, int]] = {}
    for row in rows:
        key = row.bucket.date().isoformat()
        by_date.setdefault(key, {"post_created": 0, "post_commented": 0, "post_liked": 0})
        by_date[key][row.event_type] = int(row.cnt or 0)

    return [
        {
            "date": d,
            "postsCreated": vals.get("post_created", 0),
            "commentsCreated": vals.get("post_commented", 0),
            "reactionsCreated": vals.get("post_liked", 0),
            "totalInteractions": sum(vals.values()),
        }
        for d, vals in sorted(by_date.items())
    ]


def get_organizations_activity(
    db: Session,
    *,
    date_from: datetime,
    date_to: datetime,
) -> list[dict[str, Any]]:
    org_users = (
        select(User.id, User.full_name)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name == role_service.ORG_ROLE_NAME)
    )
    orgs = db.execute(org_users).all()
    result = []
    for org_id, org_name in orgs:
        total_students = db.scalar(
            select(func.count()).select_from(Follow).where(Follow.following_id == org_id)
        ) or 0
        active = count_distinct_active(db, date_from, date_to, org_id)
        sessions = db.scalar(
            select(func.count())
            .select_from(UserSession)
            .where(
                UserSession.started_at >= date_from,
                UserSession.started_at < date_to,
                _session_org_filter(org_id),
            )
        ) or 0
        avg_dur = db.scalar(
            select(func.avg(UserSession.duration_seconds)).where(
                UserSession.started_at >= date_from,
                UserSession.started_at < date_to,
                _session_org_filter(org_id),
            )
        )
        posts = _count_events(db, "post_created", date_from, date_to, org_id)
        comments = _count_events(db, "post_commented", date_from, date_to, org_id)
        reactions = _count_events(db, "post_liked", date_from, date_to, org_id)
        interactions = posts + comments + reactions
        rate = round((active / total_students * 100), 1) if total_students > 0 else 0.0
        result.append(
            {
                "organizationId": org_id,
                "organizationName": org_name or f"Org #{org_id}",
                "activeStudents": active,
                "totalStudents": total_students,
                "activationRate": rate,
                "sessions": sessions,
                "averageSessionDurationSeconds": round(float(avg_dur or 0), 1),
                "totalInteractions": interactions,
            }
        )
    return sorted(result, key=lambda x: x["activeStudents"], reverse=True)


def _student_metrics(
    db: Session,
    user: User,
    *,
    date_from: datetime,
    date_to: datetime,
    now: datetime | None = None,
) -> dict[str, Any]:
    now = now or _utcnow()
    seven_days_ago = now - timedelta(days=7)

    sessions = db.scalar(
        select(func.count())
        .select_from(UserSession)
        .where(
            UserSession.user_id == user.id,
            UserSession.started_at >= date_from,
            UserSession.started_at < date_to,
        )
    ) or 0

    total_duration = db.scalar(
        select(func.coalesce(func.sum(UserSession.duration_seconds), 0))
        .where(
            UserSession.user_id == user.id,
            UserSession.started_at >= date_from,
            UserSession.started_at < date_to,
        )
    ) or 0

    avg_duration = (total_duration / sessions) if sessions > 0 else 0

    posts = db.scalar(
        select(func.count())
        .select_from(ActivityEvent)
        .where(
            ActivityEvent.user_id == user.id,
            ActivityEvent.event_type == "post_created",
            ActivityEvent.created_at >= date_from,
            ActivityEvent.created_at < date_to,
        )
    ) or 0
    comments = db.scalar(
        select(func.count())
        .select_from(ActivityEvent)
        .where(
            ActivityEvent.user_id == user.id,
            ActivityEvent.event_type == "post_commented",
            ActivityEvent.created_at >= date_from,
            ActivityEvent.created_at < date_to,
        )
    ) or 0
    reactions = db.scalar(
        select(func.count())
        .select_from(ActivityEvent)
        .where(
            ActivityEvent.user_id == user.id,
            ActivityEvent.event_type == "post_liked",
            ActivityEvent.created_at >= date_from,
            ActivityEvent.created_at < date_to,
        )
    ) or 0

    last_activity = db.scalar(
        select(func.max(ActivityEvent.created_at)).where(ActivityEvent.user_id == user.id)
    )

    sessions_7d = db.scalar(
        select(func.count())
        .select_from(UserSession)
        .where(UserSession.user_id == user.id, UserSession.started_at >= seven_days_ago)
    ) or 0
    duration_7d = db.scalar(
        select(func.coalesce(func.sum(UserSession.duration_seconds), 0))
        .where(UserSession.user_id == user.id, UserSession.started_at >= seven_days_ago)
    ) or 0
    interactions_7d = db.scalar(
        select(func.count())
        .select_from(ActivityEvent)
        .where(
            ActivityEvent.user_id == user.id,
            ActivityEvent.event_type.in_(ENGAGEMENT_EVENT_TYPES),
            ActivityEvent.created_at >= seven_days_ago,
        )
    ) or 0

    score, status = calculate_activity_score(
        sessions_last_7_days=int(sessions_7d),
        total_duration_seconds_last_7_days=int(duration_7d),
        interactions_last_7_days=int(interactions_7d),
        last_activity_at=last_activity,
        now=now,
    )

    org_name = _primary_org_name(db, user.id)

    return {
        "studentId": user.id,
        "name": user.full_name or user.email,
        "email": user.email,
        "organization": org_name,
        "sessions": int(sessions),
        "totalDurationSeconds": int(total_duration),
        "averageSessionDurationSeconds": round(avg_duration, 1),
        "postsCreated": int(posts),
        "commentsCreated": int(comments),
        "reactionsCreated": int(reactions),
        "totalInteractions": int(posts + comments + reactions),
        "lastActivityAt": last_activity.isoformat() if last_activity else None,
        "status": status,
        "activityScore": score,
    }


def _primary_org_name(db: Session, user_id: int) -> str | None:
    row = db.execute(
        select(User.full_name)
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
        .limit(1)
    ).first()
    return row[0] if row else None


def get_students_table(
    db: Session,
    *,
    date_from: datetime,
    date_to: datetime,
    organization_id: int | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
    sort: str = "activityScore",
) -> dict[str, Any]:
    student_ids = student_ids_subquery(organization_id)
    stmt = select(User).where(User.id.in_(student_ids))
    if search:
        like = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(func.lower(User.full_name).like(like), func.lower(User.email).like(like))
        )
    users = list(db.scalars(stmt).all())
    rows = [_student_metrics(db, u, date_from=date_from, date_to=date_to) for u in users]

    if status_filter and status_filter in STATUS_FILTER_MAP:
        target = STATUS_FILTER_MAP[status_filter]
        rows = [r for r in rows if r["status"] == target]

    sort_key = {
        "activityScore": lambda r: r["activityScore"],
        "lastActivityAt": lambda r: r["lastActivityAt"] or "",
        "sessions": lambda r: r["sessions"],
        "totalDurationSeconds": lambda r: r["totalDurationSeconds"],
        "totalInteractions": lambda r: r["totalInteractions"],
    }.get(sort, lambda r: r["activityScore"])

    rows.sort(key=sort_key, reverse=True)
    total = len(rows)
    start = (page - 1) * limit
    page_rows = rows[start : start + limit]
    pages = (total + limit - 1) // limit if limit > 0 else 0

    return {
        "data": page_rows,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": pages,
        },
    }


def get_at_risk_students(
    db: Session,
    *,
    organization_id: int | None = None,
    inactive_days: int = 7,
) -> list[dict[str, Any]]:
    now = _utcnow()
    student_ids = student_ids_subquery(organization_id)
    users = list(db.scalars(select(User).where(User.id.in_(student_ids))).all())
    result = []
    for user in users:
        last_activity = db.scalar(
            select(func.max(ActivityEvent.created_at)).where(ActivityEvent.user_id == user.id)
        )
        if last_activity is None:
            days_inactive = 999
        else:
            days_inactive = int((now - _aware(last_activity)).total_seconds() / 86400)
        if days_inactive < inactive_days:
            continue
        if days_inactive >= 30:
            risk = "Crítico"
        elif days_inactive >= 14:
            risk = "Medio"
        else:
            risk = "Bajo"
        prev_sessions = db.scalar(
            select(func.count())
            .select_from(UserSession)
            .where(UserSession.user_id == user.id)
        ) or 0
        result.append(
            {
                "studentId": user.id,
                "name": user.full_name or user.email,
                "email": user.email,
                "organization": _primary_org_name(db, user.id),
                "lastActivityAt": last_activity.isoformat() if last_activity else None,
                "inactiveDays": days_inactive if days_inactive < 999 else None,
                "previousSessions": int(prev_sessions),
                "riskLevel": risk,
            }
        )
    result.sort(key=lambda x: x["inactiveDays"] if x["inactiveDays"] is not None else 999, reverse=True)
    return result
