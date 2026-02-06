from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.event import EventCreate, EventUpdate, EventOut
from app.services.users_service import get_current_user
from app.services.events_service import (
    list_events,
    get_event,
    create_event as svc_create_event,
    update_event as svc_update_event,
    delete_event as svc_delete_event,
    save_event as svc_save_event,
    remove_saved_event as svc_remove_saved_event,
    attend_event as svc_attend_event,
)
from app.services.feed_service import compute_event_score
from app.models.user import User

router = APIRouter()


@router.get("/recommended-events", response_model=List[EventOut])
def recommended_events(
    tags: Optional[List[str]] = Query(None),
    fecha_from: Optional[datetime] = None,
    fecha_to: Optional[datetime] = None,
    page: int = 1,
    size: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = list_events(db, tags=tags, fecha_from=fecha_from, fecha_to=fecha_to)
    # score and sort
    events_scored = sorted(
        events,
        key=lambda e: compute_event_score(db, current_user, e),
        reverse=True,
    )
    start = max(0, (page - 1) * size)
    end = start + size
    return [EventOut.model_validate(e, from_attributes=True) for e in events_scored[start:end]]


@router.get("/", response_model=List[EventOut])
def get_events(
    tags: Optional[List[str]] = Query(None),
    fecha_from: Optional[datetime] = None,
    fecha_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = list_events(db, tags=tags, fecha_from=fecha_from, fecha_to=fecha_to)
    return [EventOut.model_validate(e, from_attributes=True) for e in events]


@router.post("/", response_model=EventOut)
def create_event(payload: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ev = svc_create_event(db, created_by_id=current_user.id, payload=payload.model_dump())
    return EventOut.model_validate(ev, from_attributes=True)


@router.get("/{event_id}", response_model=EventOut)
def get_event_by_id(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ev = get_event(db, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return EventOut.model_validate(ev, from_attributes=True)


@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ev = get_event(db, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    ev = svc_update_event(db, event=ev, payload=payload.model_dump(exclude_none=True))
    return EventOut.model_validate(ev, from_attributes=True)


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ev = get_event(db, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    svc_delete_event(db, event=ev)
    return {"status": "deleted"}


@router.post("/{event_id}/save")
def save_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc_save_event(db, user_id=current_user.id, event_id=event_id)
    return {"status": "saved"}


@router.delete("/{event_id}/save")
def remove_saved(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc_remove_saved_event(db, user_id=current_user.id, event_id=event_id)
    return {"status": "unsaved"}


@router.post("/{event_id}/attend")
def attend(event_id: int, status: str = "going", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc_attend_event(db, user_id=current_user.id, event_id=event_id, status=status)
    return {"status": status}
