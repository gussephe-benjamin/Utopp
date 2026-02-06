from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Iterable

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.event import Event
from app.models.community_post import CommunityPost
from app.models.announcement import Announcement
from app.models.user import User
from app.models.follow import Follow
from app.models.user_schedule import UserSchedule


def _interest_score(item_tags: Optional[List[str]], user_interests: Optional[List[str]]) -> float:
    if not item_tags or not user_interests:
        return 0.0
    inter = len(set(map(str.lower, item_tags)) & set(map(str.lower, user_interests)))
    union = len(set(map(str.lower, item_tags)))
    return inter / union if union else 0.0


def _cycle_score(user_cycle: Optional[int], min_cycle: Optional[int], max_cycle: Optional[int]) -> float:
    if user_cycle is None:
        return 0.0
    if min_cycle is not None and user_cycle < min_cycle:
        return 0.0
    if max_cycle is not None and user_cycle > max_cycle:
        return 0.0
    return 1.0


def _social_proximity_score(db: Session, user_id: int, author_id: Optional[int]) -> float:
    if not author_id:
        return 0.0
    stmt = select(Follow).where(Follow.follower_id == user_id, Follow.following_id == author_id)
    return 1.0 if db.scalar(stmt) else 0.0


def _to_aware_utc(dt: datetime) -> datetime:
    """Return a timezone-aware datetime in UTC."""
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        # Assume naive datetimes are UTC
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _recency_score(created_at: Optional[datetime]) -> float:
    if not created_at:
        return 0.0
    # Normalize: full score within last 7 days, decay after
    now = datetime.now(timezone.utc)
    created_utc = _to_aware_utc(created_at)
    days = (now - created_utc).days
    return max(0.0, 1.0 - (days / 7.0))


def _time_compatibility_score(db: Session, user_id: int, start: datetime, end: datetime) -> float:
    # If any schedule entry of type 'available' covers the event window, consider compatible
    if not start or not end:
        return 0.0
    dow = start.weekday()  # 0-6
    schedules = db.scalars(
        select(UserSchedule).where(UserSchedule.user_id == user_id, UserSchedule.day_of_week == dow)
    ).all()
    if not schedules:
        return 0.0
    for s in schedules:
        st = datetime.combine(start.date(), s.start_time, start.tzinfo)
        et = datetime.combine(start.date(), s.end_time, start.tzinfo)
        if s.type == "available" and st <= start and et >= end:
            return 1.0
    return 0.0


def compute_event_score(db: Session, user: User, ev: Event) -> float:
    # score = compatibilidad_horaria * 40 + intereses * 30 + ciclo_academico * 20 + cercania_social * 10
    compat = _time_compatibility_score(db, user.id, ev.start_time, ev.end_time)
    interests = _interest_score(ev.tags, user.interests)
    cycle = _cycle_score(user.cycle, ev.min_cycle, ev.max_cycle)
    social = _social_proximity_score(db, user.id, ev.created_by_id)
    return (compat * 40 + interests * 30 + cycle * 20 + social * 10) / 100.0


def compute_community_post_score(db: Session, user: User, cp: CommunityPost) -> float:
    # score = intereses_comunes * 40 + cercania_social * 30 + actividad_reciente * 30
    interests = _interest_score(cp.tags, user.interests)
    social = _social_proximity_score(db, user.id, cp.user_id)
    recent = _recency_score(cp.created_at)
    return (interests * 40 + social * 30 + recent * 30) / 100.0


def compute_announcement_score(db: Session, user: User, an: Announcement) -> float:
    interests = _interest_score(an.tags, user.interests)
    recent = _recency_score(an.created_at)
    social = _social_proximity_score(db, user.id, an.created_by_id)
    # Balance for announcements
    return (interests * 50 + recent * 40 + social * 10) / 100.0


def build_feed(
    db: Session,
    user: User,
    *,
    tipo: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    fecha_from: Optional[datetime] = None,
    fecha_to: Optional[datetime] = None,
    order: str = "relevancia",
    page: int = 1,
    size: int = 10,
) -> Dict[str, Any]:
    if page < 1:
        page = 1
    if size < 1 or size > 100:
        size = 10

    tipos = set(t.lower() for t in tipo) if tipo else {"event", "community_post", "announcement"}

    items: List[Dict[str, Any]] = []

    # Events
    if "event" in tipos:
        q = select(Event)
        if fecha_from:
            q = q.where(Event.start_time >= fecha_from)
        if fecha_to:
            q = q.where(Event.start_time <= fecha_to)
        events = db.scalars(q).all()
        for ev in events:
            if tags and not _interest_score(ev.tags, tags):
                # fallback filter if "&&" operator is not supported
                continue
            score = compute_event_score(db, user, ev)
            items.append({"type": "event", "score": score, "data": ev})

    # Community posts
    if "community_post" in tipos:
        q = select(CommunityPost)
        posts = db.scalars(q).all()
        for cp in posts:
            score = compute_community_post_score(db, user, cp)
            items.append({"type": "community_post", "score": score, "data": cp})

    # Announcements
    if "announcement" in tipos:
        q = select(Announcement)
        anns = db.scalars(q).all()
        for an in anns:
            score = compute_announcement_score(db, user, an)
            items.append({"type": "announcement", "score": score, "data": an})

    # Sort and paginate
    items.sort(key=lambda x: x["score"], reverse=True)

    start_idx = (page - 1) * size
    end_idx = start_idx + size
    page_items = items[start_idx:end_idx]

    # Serialize data using simple dict conversion via Pydantic in router layer.
    next_page = page + 1 if end_idx < len(items) else None

    return {"page": page, "size": size, "items": page_items, "next_page": next_page}
