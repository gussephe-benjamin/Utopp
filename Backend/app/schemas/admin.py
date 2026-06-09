"""Schemas para la administración de usuarios desde el dashboard admin."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class AdminUserListItem(BaseModel):
    """Fila de usuario para listados administrativos."""

    id: int
    email: str
    full_name: Optional[str] = None
    career: Optional[str] = None
    cycle: Optional[int] = None
    profile_image_url: Optional[str] = None
    posts_count: int = 0
    created_at: datetime
    roles: List[str] = []

    class Config:
        from_attributes = True


class AdminUserDetailOut(BaseModel):
    """Detalle completo de usuario para la vista admin."""

    id: int
    email: str
    full_name: Optional[str] = None
    career: Optional[str] = None
    cycle: Optional[int] = None
    interests: Optional[List[str]] = None
    availability: Optional[int] = None
    description: Optional[str] = None
    contacts: Optional[Dict[str, Any]] = None
    is_onboarding_completed: bool = False
    profile_image_url: Optional[str] = None
    created_at: datetime
    roles: List[str] = []

    class Config:
        from_attributes = True


class AdminIdentityOut(BaseModel):
    """Identidad y estado administrativo del usuario consultado."""

    user_id: int
    email: str
    full_name: Optional[str] = None
    is_admin: bool = False
    is_root: bool = False
    roles: List[str] = []


class AdminUserCreate(BaseModel):
    """Datos para crear un usuario desde el panel admin."""

    email: EmailStr = Field(..., max_length=255)
    password: str = Field(min_length=6, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(
        default=None,
        description="Nombre del rol a asignar (estudiante, organización estudiantil, oficina, ...).",
    )


class AdminUserUpdate(BaseModel):
    """Campos editables de un usuario desde el panel admin."""

    email: Optional[EmailStr] = Field(None, max_length=255)
    full_name: Optional[str] = Field(None, max_length=255)
    career: Optional[str] = Field(None, max_length=100)
    cycle: Optional[int] = Field(None, ge=1, le=12)
    interests: Optional[List[str]] = None
    availability: Optional[int] = None
    description: Optional[str] = Field(None, max_length=2000)
    contacts: Optional[Dict[str, str]] = None
