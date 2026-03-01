from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class ImageCreate(BaseModel):
    """Schema para crear imagen de post."""
    cloudinary_id: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1)
    position: int = Field(0, ge=0)
    object_position: Optional[str] = Field(None, max_length=64)
    scale: Optional[float] = Field(None, ge=0.1, le=10.0)


class ImageOut(BaseModel):
    """Schema de salida de imagen."""
    id: int
    post_id: int
    cloudinary_id: str
    url: str
    position: int
    object_position: Optional[str] = None
    scale: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ImageReorderItem(BaseModel):
    """Item individual para reordenar."""
    image_id: int
    position: int = Field(..., ge=0)


class ImageReorderRequest(BaseModel):
    """Schema para reordenar imágenes."""
    images: List[ImageReorderItem] = Field(..., min_length=1)
