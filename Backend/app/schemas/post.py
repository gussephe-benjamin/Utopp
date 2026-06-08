from datetime import datetime
from typing import Optional, List, Dict, Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.post import PostType, SubPostType, PostStatus, TimeStatus, VALID_SUBTYPES


def _coerce_post_type(value: object) -> PostType | None:
    """Convierte post_type (enum o string JSON) para lookups en VALID_SUBTYPES."""
    if value is None:
        return None
    if isinstance(value, PostType):
        return value
    try:
        return PostType(value)
    except (ValueError, TypeError):
        return None

DESCRIPTION_MIN_WORDS = 0
DESCRIPTION_MAX_WORDS = 700

ALLOWED_ASPECT_RATIOS = ("1:1", "4:5", "1.91:1")
DEFAULT_ASPECT_RATIO = "4:5"


def _validate_aspect_ratio(value: str) -> str:
    if value not in ALLOWED_ASPECT_RATIOS:
        raise ValueError(
            f"aspect_ratio debe ser uno de {ALLOWED_ASPECT_RATIOS} (recibido: {value})."
        )
    return value


def _count_words(value: str) -> int:
    return len([word for word in value.strip().split() if word])


def _validate_description_word_count(value: str) -> str:
    words = _count_words(value)
    if words < DESCRIPTION_MIN_WORDS or words > DESCRIPTION_MAX_WORDS:
        raise ValueError(
            f"La descripción debe tener entre {DESCRIPTION_MIN_WORDS} y "
            f"{DESCRIPTION_MAX_WORDS} palabras (actual: {words})."
        )
    return value


class PostBase(BaseModel):
    """Schema base para posts."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    post_type: PostType
    subtype: Optional[SubPostType] = None
    tags: Optional[List[str]] = None
    specific_fields: Optional[Dict[str, Any]] = Field(default_factory=dict)
    deadline_at: Optional[datetime] = None
    is_pinned: bool = False
    aspect_ratio: str = DEFAULT_ASPECT_RATIO
    
    @field_validator("aspect_ratio")
    @classmethod
    def validate_aspect_ratio(cls, v: str):
        return _validate_aspect_ratio(v)
    
    @field_validator("subtype", mode="after")
    @classmethod
    def validate_subtype(cls, v, info):
        if v is None:
            return v

        post_type = _coerce_post_type(info.data.get("post_type"))
        if post_type:
            valid = VALID_SUBTYPES.get(post_type, [])
            valid_values = [s.value for s in valid]
            subtype_value = v.value if hasattr(v, "value") else str(v)

            if subtype_value not in valid_values:
                raise ValueError(
                    f"Subtipo '{subtype_value}' no es válido para tipo '{post_type.value}'. "
                    f"Subtipos válidos: {valid_values}"
                )
        return v

    @field_validator("description")
    @classmethod
    def validate_description_words(cls, v: str):
        return _validate_description_word_count(v)


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

    @field_validator("description")
    @classmethod
    def validate_description_words(cls, v: str):
        return _validate_description_word_count(v)


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

    @field_validator("description")
    @classmethod
    def validate_description_words(cls, v: str):
        return _validate_description_word_count(v)


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

    @field_validator("description")
    @classmethod
    def validate_description_words(cls, v: str):
        return _validate_description_word_count(v)


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
    is_pinned: Optional[bool] = None
    aspect_ratio: Optional[str] = None

    @field_validator("description")
    @classmethod
    def validate_description_words(cls, v: Optional[str]):
        if v is None:
            return v
        return _validate_description_word_count(v)

    @field_validator("aspect_ratio")
    @classmethod
    def validate_aspect_ratio(cls, v: Optional[str]):
        if v is None:
            return v
        return _validate_aspect_ratio(v)


class PostImageOut(BaseModel):
    """Schema de imagen embebida en post."""
    id: int
    cloudinary_id: str
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
    profile_image_url: Optional[str] = None
    
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
    aspect_ratio: str = DEFAULT_ASPECT_RATIO
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
    aspect_ratio: str = DEFAULT_ASPECT_RATIO
    deadline_at: Optional[datetime] = None
    created_at: datetime
    
    user_name: Optional[str] = None
    image_count: int = 0
    link_count: int = 0
    
    class Config:
        from_attributes = True


class AdminPostSummaryOut(BaseModel):
    """Resumen mínimo de publicación para listado admin."""
    id: int
    user_id: int
    creator_name: Optional[str] = None
    creator_email: str
    created_at: datetime
    title: Optional[str] = None
    description: str
