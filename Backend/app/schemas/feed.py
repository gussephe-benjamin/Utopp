from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.post import PostType, SubPostType, TimeStatus


class FeedFilters(BaseModel):
    """Filtros para el feed."""
    type: Optional[PostType] = None
    exclude_type: Optional[PostType] = None
    subtype: Optional[SubPostType] = None
    tags: Optional[List[str]] = None


class FeedPostOut(BaseModel):
    """Schema de post en el feed."""
    id: int
    user_id: int
    title: Optional[str] = None
    description: str
    post_type: PostType
    subtype: Optional[SubPostType] = None
    tags: Optional[List[str]] = None
    deadline_at: Optional[datetime] = None
    time_status: TimeStatus
    created_at: datetime
    
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_profile_image_url: Optional[str] = None
    
    image_url: Optional[str] = None
    images_count: int = 0
    links_count: int = 0
    aspect_ratio: str = "4:5"
    
    is_pinned: bool = False
    pin_priority: int = 0
    is_saved: bool = False
    participation_status: Optional[str] = None
    registration_url: Optional[str] = None

    reaction_count: int = 0
    user_reacted: bool = False
    comment_count: int = 0

    relevance_score: Optional[float] = None
    score_breakdown: Optional[dict[str, float]] = None

    class Config:
        from_attributes = True


class FeedResponse(BaseModel):
    """Respuesta del feed paginada."""
    items: List[FeedPostOut]
    page: int
    size: int
    total: int
    has_next: bool
    has_prev: bool
