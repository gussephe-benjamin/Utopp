from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    is_virtual: bool = False
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    min_cycle: Optional[int] = None
    max_cycle: Optional[int] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_virtual: Optional[bool] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    min_cycle: Optional[int] = None
    max_cycle: Optional[int] = None


class EventOut(EventBase):
    id: int
    created_by_id: int
    popularity: int

    class Config:
        from_attributes = True
