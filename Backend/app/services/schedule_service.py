from datetime import datetime, time
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user_schedule import UserSchedule


def _overlaps(a_start: time, a_end: time, b_start: time, b_end: time) -> bool:
    return max(a_start, b_start) < min(a_end, b_end)


def _validate_no_collision(
    db: Session,
    *,
    user_id: int,
    day_of_week: int,
    start_time: time,
    end_time: time,
    exclude_id: Optional[int] = None,
) -> None:
    if start_time >= end_time:
        raise ValueError("La hora de inicio debe ser menor que la hora de fin")

    stmt = select(UserSchedule).where(
        UserSchedule.user_id == user_id,
        UserSchedule.day_of_week == day_of_week,
    )
    if exclude_id:
        stmt = stmt.where(UserSchedule.id != exclude_id)

    for s in db.scalars(stmt).all():
        if _overlaps(start_time, end_time, s.start_time, s.end_time):
            raise ValueError("Colisión horaria detectada con otro bloque del calendario")


def list_user_schedule(db: Session, user_id: int) -> List[UserSchedule]:
    return db.scalars(select(UserSchedule).where(UserSchedule.user_id == user_id)).all()


def create_schedule_entry(
    db: Session,
    *,
    user_id: int,
    day_of_week: int,
    start_time: time,
    end_time: time,
    type: str,
) -> UserSchedule:
    _validate_no_collision(db, user_id=user_id, day_of_week=day_of_week, start_time=start_time, end_time=end_time)
    item = UserSchedule(
        user_id=user_id,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
        type=type,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_schedule_entry(
    db: Session,
    *,
    user_id: int,
    schedule_id: int,
    day_of_week: Optional[int] = None,
    start_time: Optional[time] = None,
    end_time: Optional[time] = None,
    type: Optional[str] = None,
) -> UserSchedule:
    item = db.get(UserSchedule, schedule_id)
    if not item or item.user_id != user_id:
        raise ValueError("Bloque de horario no encontrado")

    new_dow = day_of_week if day_of_week is not None else item.day_of_week
    new_start = start_time if start_time is not None else item.start_time
    new_end = end_time if end_time is not None else item.end_time

    _validate_no_collision(
        db,
        user_id=user_id,
        day_of_week=new_dow,
        start_time=new_start,
        end_time=new_end,
        exclude_id=schedule_id,
    )

    if day_of_week is not None:
        item.day_of_week = day_of_week
    if start_time is not None:
        item.start_time = start_time
    if end_time is not None:
        item.end_time = end_time
    if type is not None:
        item.type = type

    db.commit()
    db.refresh(item)
    return item


def delete_schedule_entry(db: Session, *, user_id: int, schedule_id: int) -> None:
    item = db.get(UserSchedule, schedule_id)
    if not item or item.user_id != user_id:
        raise ValueError("Bloque de horario no encontrado")
    db.delete(item)
    db.commit()
