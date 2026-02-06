from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.schedule import UserScheduleCreate, UserScheduleUpdate, UserScheduleOut
from app.services.schedule_service import (
    list_user_schedule,
    create_schedule_entry,
    update_schedule_entry,
    delete_schedule_entry,
)
from app.services.users_service import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/schedule", response_model=list[UserScheduleOut])
def get_schedule(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = list_user_schedule(db, current_user.id)
    return [UserScheduleOut.model_validate(i, from_attributes=True) for i in items]

@router.post("/schedule", response_model=UserScheduleOut)
def create_schedule(payload: UserScheduleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        item = create_schedule_entry(db, user_id=current_user.id, **payload.model_dump())
        return UserScheduleOut.model_validate(item, from_attributes=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/schedule/{schedule_id}", response_model=UserScheduleOut)
def update_schedule(schedule_id: int, payload: UserScheduleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        item = update_schedule_entry(db, user_id=current_user.id, schedule_id=schedule_id, **payload.model_dump(exclude_none=True))
        return UserScheduleOut.model_validate(item, from_attributes=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/schedule/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        delete_schedule_entry(db, user_id=current_user.id, schedule_id=schedule_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
