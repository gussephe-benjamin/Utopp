from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.post_link import PostLinkType, PostLinkDisplayType


class LinkCreate(BaseModel):
    """Schema para crear link de post."""
    label: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1)
    type: PostLinkType = PostLinkType.info
    display_type: PostLinkDisplayType = PostLinkDisplayType.link
    position: int = Field(0, ge=0)


class LinkUpdate(BaseModel):
    """Schema para actualizar link."""
    label: Optional[str] = Field(None, min_length=1, max_length=100)
    url: Optional[str] = Field(None, min_length=1)
    type: Optional[PostLinkType] = None
    display_type: Optional[PostLinkDisplayType] = None


class LinkOut(BaseModel):
    """Schema de salida de link."""
    id: int
    post_id: int
    label: str
    url: str
    type: PostLinkType
    display_type: PostLinkDisplayType
    position: int
    
    class Config:
        from_attributes = True


class LinkReorderItem(BaseModel):
    """Item individual para reordenar."""
    link_id: int
    position: int = Field(..., ge=0)


class LinkReorderRequest(BaseModel):
    """Schema para reordenar links."""
    links: List[LinkReorderItem] = Field(..., min_length=1)
