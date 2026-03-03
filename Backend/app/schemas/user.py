from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    """Respuesta mínima de usuario (id, email, nombre)."""
    id: int
    email: EmailStr
    full_name: str | None

    class Config:
        from_attributes = True


class UserResponse_total(BaseModel):
    """Respuesta completa de usuario con todos los campos (legacy)."""
    id: int
    email: EmailStr
    full_name: str | None = None
    hashed_password: str | None
    career: str | None = None
    interests: list[str] | None = []
    availability: int | None = None
    cycle: int | None = None
    is_onboarding_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Datos requeridos para registrar un usuario."""
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None


class UserBasicOut(BaseModel):
    """Salida básica de usuario para auth (id, email, nombre)."""
    id: int
    email: EmailStr
    full_name: str | None = None

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    """Salida completa de usuario autenticado."""
    id: int
    email: str
    full_name: Optional[str] = None
    career: Optional[str] = None
    cycle: Optional[int] = None
    interests: Optional[List[str]] = None
    availability: Optional[int] = None
    is_onboarding_completed: bool = False
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0

    class Config:
        from_attributes = True


class UserPublicOut(BaseModel):
    """Perfil público de un usuario con conteos."""
    id: int
    full_name: Optional[str] = None
    career: Optional[str] = None
    cycle: Optional[int] = None
    interests: Optional[List[str]] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Campos actualizables del perfil de usuario."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    career: Optional[str] = Field(None, max_length=100)
    cycle: Optional[int] = Field(None, ge=1, le=12)
    interests: Optional[List[str]] = None
    availability: Optional[int] | None = None


class FollowOut(BaseModel):
    """Datos de una relación de follow."""
    id: int
    follower_id: int
    following_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FollowerOut(BaseModel):
    """Datos de un seguidor en listados."""
    user_id: int
    full_name: Optional[str] = None
    email: str
    followed_at: datetime

    class Config:
        from_attributes = True


class SavedPostOut(BaseModel):
    """Datos de un post guardado."""
    id: int
    post_id: int
    saved_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Credenciales de login."""
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    """Respuesta con JWT token."""
    access_token: str
    token_type: str = "bearer"
