from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional


class AnnouncementBase(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = None


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementOut(AnnouncementBase):
    id: int
    created_by_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True
