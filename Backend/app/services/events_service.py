from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.event import Event
from app.models.event_participant import EventParticipant
from app.models.saved_event import SavedEvent


def list_events(
    db: Session,
    *,
    tags: Optional[List[str]] = None,
    fecha_from: Optional[datetime] = None,
    fecha_to: Optional[datetime] = None,
) -> List[Event]:
    q = select(Event)
    if fecha_from:
        q = q.where(Event.start_time >= fecha_from)
    if fecha_to:
        q = q.where(Event.start_time <= fecha_to)
    events = db.scalars(q).all()
    if tags:
        events = [e for e in events if e.tags and set(map(str.lower, tags)) & set(map(str.lower, e.tags))]
    return events


def get_event(db: Session, event_id: int) -> Optional[Event]:
    return db.get(Event, event_id)


def create_event(
    db: Session,
    *,
    created_by_id: int,
    payload: dict,
) -> Event:
    ev = Event(created_by_id=created_by_id, **payload)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def update_event(db: Session, *, event: Event, payload: dict) -> Event:
    for k, v in payload.items():
        setattr(event, k, v)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, *, event: Event) -> None:
    db.delete(event)
    db.commit()


def save_event(db: Session, *, user_id: int, event_id: int) -> None:
    exists = db.query(SavedEvent).filter(SavedEvent.user_id == user_id, SavedEvent.event_id == event_id).first()
    if not exists:
        db.add(SavedEvent(user_id=user_id, event_id=event_id))
        db.commit()


def remove_saved_event(db: Session, *, user_id: int, event_id: int) -> None:
    se = db.query(SavedEvent).filter(SavedEvent.user_id == user_id, SavedEvent.event_id == event_id).first()
    if se:
        db.delete(se)
        db.commit()


def attend_event(db: Session, *, user_id: int, event_id: int, status: str = "going") -> None:
    exists = db.query(EventParticipant).filter(EventParticipant.user_id == user_id, EventParticipant.event_id == event_id).first()
    if exists:
        exists.status = status
        db.commit()
        return
    db.add(EventParticipant(user_id=user_id, event_id=event_id, status=status))
    db.commit()
