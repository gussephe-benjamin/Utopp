from datetime import time, datetime
from pydantic import BaseModel, Field
from typing import Optional


class UserScheduleBase(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    type: str


class UserScheduleCreate(UserScheduleBase):
    pass


class UserScheduleUpdate(BaseModel):
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    type: Optional[str] = None


class UserScheduleOut(UserScheduleBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
