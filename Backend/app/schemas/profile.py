from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class ProfileOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    interests: Optional[List[str]] = None
    career: Optional[str] = None
    cycle: Optional[int] = None
    availability: Optional[int] = None

    followers_count: int
    following_count: int
    posts_count: int
    saved_event_ids: List[int]
    attending_event_ids: List[int]

    class Config:
        from_attributes = True


class InterestsUpdate(BaseModel):
    interests: List[str]
