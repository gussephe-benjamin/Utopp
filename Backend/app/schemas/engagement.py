from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


COMMENT_MAX_LENGTH = 500


class ReactionToggleOut(BaseModel):
    """Resultado de alternar una reacción (me gusta) en un post."""
    reacted: bool
    count: int


class ReactionCountOut(BaseModel):
    """Conteo de reacciones de un post y si el usuario actual reaccionó."""
    count: int
    user_reacted: bool = False


class CommentCreate(BaseModel):
    """Datos para crear un comentario."""
    content: str = Field(..., min_length=1, max_length=COMMENT_MAX_LENGTH)

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("El comentario no puede estar vacío.")
        return stripped


class CommentOut(BaseModel):
    """Comentario en una publicación."""
    id: int
    post_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_name: Optional[str] = None
    user_profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True
