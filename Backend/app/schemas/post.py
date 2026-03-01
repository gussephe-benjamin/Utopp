from datetime import datetime
from typing import Optional, List, Dict, Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.post import PostType, SubPostType, PostStatus, TimeStatus, VALID_SUBTYPES


class PostBase(BaseModel):
    """Schema base para posts."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    post_type: PostType
    subtype: Optional[SubPostType] = None
    tags: Optional[List[str]] = None
    specific_fields: Optional[Dict[str, Any]] = Field(default_factory=dict)
    deadline_at: Optional[datetime] = None
    
    @field_validator("subtype", mode="after")
    @classmethod
    def validate_subtype(cls, v, info):
        if v is None:
            return v

        post_type = info.data.get("post_type")
        if post_type:
            valid = VALID_SUBTYPES.get(post_type, [])
            valid_values = [s.value for s in valid]

            if v.value not in valid_values:
                raise ValueError(
                    f"Subtipo '{v.value}' no es válido para tipo '{post_type.value}'. "
                    f"Subtipos válidos: {valid_values}"
                )
        return v


class PostCreate(PostBase):
    """Schema para crear un post (draft)."""
    pass


# ============================================================
# Schemas de creación por tipo
# ============================================================

class AcademicProjectCreate(BaseModel):
    """Schema para crear un proyecto académico."""
    post_type: Literal[PostType.academic_project] = PostType.academic_project
    subtype: SubPostType
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    tags: Optional[List[str]] = None
    deadline_at: Optional[datetime] = None
    participants_needed: Optional[int] = Field(None, ge=1)
    estimated_time: Optional[str] = None

    @field_validator("subtype", mode="after")
    @classmethod
    def validate_subtype(cls, v):
        valid = VALID_SUBTYPES.get(PostType.academic_project, [])
        if v not in valid:
            raise ValueError(
                f"Subtipo '{v.value}' no es válido para academic_project. "
                f"Subtipos válidos: {[s.value for s in valid]}"
            )
        return v


class SimplePostCreate(BaseModel):
    """Schema para crear una publicación simple (sin título)."""
    post_type: Literal[PostType.simple_post] = PostType.simple_post
    subtype: SubPostType
    description: str = Field(..., min_length=1)
    tags: Optional[List[str]] = None

    @field_validator("subtype", mode="after")
    @classmethod
    def validate_subtype(cls, v):
        valid = VALID_SUBTYPES.get(PostType.simple_post, [])
        if v not in valid:
            raise ValueError(
                f"Subtipo '{v.value}' no es válido para simple_post. "
                f"Subtipos válidos: {[s.value for s in valid]}"
            )
        return v


class AnnouncementCreate(BaseModel):
    """Schema para crear un anuncio."""
    post_type: Literal[PostType.announcement] = PostType.announcement
    subtype: SubPostType
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    deadline_at: datetime
    tags: Optional[List[str]] = None
    specific_fields: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @field_validator("subtype", mode="after")
    @classmethod
    def validate_subtype(cls, v):
        valid = VALID_SUBTYPES.get(PostType.announcement, [])
        if v not in valid:
            raise ValueError(
                f"Subtipo '{v.value}' no es válido para announcement. "
                f"Subtipos válidos: {[s.value for s in valid]}"
            )
        return v


class AcademicProjectDeadlineUpdate(BaseModel):
    """Schema para asignar o reemplazar el deadline de un proyecto académico."""
    deadline_at: datetime


class PostUpdate(BaseModel):
    """Schema para actualizar un post."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    subtype: Optional[SubPostType] = None
    tags: Optional[List[str]] = None
    specific_fields: Optional[Dict[str, Any]] = None
    deadline_at: Optional[datetime] = None


class PostImageOut(BaseModel):
    """Schema de imagen embebida en post."""
    id: int
    url: str
    object_position: Optional[str] = None
    scale: Optional[float] = None
    position: int
    
    class Config:
        from_attributes = True


class PostLinkOut(BaseModel):
    """Schema de link embebido en post."""
    id: int
    label: str
    url: str
    type: str
    display_type: str
    position: int
    
    class Config:
        from_attributes = True


class PostUserOut(BaseModel):
    """Schema de usuario embebido en post."""
    id: int
    full_name: Optional[str] = None
    email: str
    
    class Config:
        from_attributes = True


class PostOut(BaseModel):
    """Schema de salida de post completo."""
    id: int
    user_id: int
    title: Optional[str] = None
    description: str
    post_type: PostType
    subtype: Optional[SubPostType] = None
    status: PostStatus
    time_status: TimeStatus
    tags: Optional[List[str]] = None
    specific_fields: Dict[str, Any] = Field(default_factory=dict)
    deadline_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    user: Optional[PostUserOut] = None
    images: List[PostImageOut] = Field(default_factory=list)
    links: List[PostLinkOut] = Field(default_factory=list)
    
    class Config:
        from_attributes = True


class PostListOut(BaseModel):
    """Schema de salida para listados (sin relaciones anidadas)."""
    id: int
    user_id: int
    title: Optional[str] = None
    description: str
    post_type: PostType
    subtype: Optional[SubPostType] = None
    status: PostStatus
    time_status: TimeStatus
    tags: Optional[List[str]] = None
    deadline_at: Optional[datetime] = None
    created_at: datetime
    
    user_name: Optional[str] = None
    image_count: int = 0
    link_count: int = 0
    
    class Config:
        from_attributes = True
