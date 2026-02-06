from typing import Literal, List, Optional, Dict, Any
from pydantic import BaseModel


class FeedItem(BaseModel):
    type: Literal["event", "community_post", "announcement"]
    score: float
    data: Dict[str, Any]


class FeedResponse(BaseModel):
    page: int
    size: int
    items: List[FeedItem]
    next_page: Optional[int] = None
