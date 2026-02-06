from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional


class CommunityPostBase(BaseModel):
    content: str
    post_type: str = "Publicación General"
    link_form: Optional[str] = None
    closing_date: Optional[datetime] = None
    required_roles: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class CommunityPostCreate(CommunityPostBase):
    pass


class CommunityPostUpdate(BaseModel):
    content: Optional[str] = None
    post_type: Optional[str] = None
    link_form: Optional[str] = None
    closing_date: Optional[datetime] = None
    required_roles: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class CommunityPostOut(CommunityPostBase):
    id: int
    user_id: int
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CommunityRecommendation(BaseModel):
    score: float
    post: CommunityPostOut
