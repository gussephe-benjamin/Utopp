"""DTOs de la tabla de eventos compartida con Utopp Formulario.

Reflejan campo por campo `EventCreate` / `EventOut` de
`utopp-formulario/Backend/app/schemas/formulario.py`. Si cambia uno, cambian
los dos.
"""
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SharedEventCreator(BaseModel):
    """Organizador tal como lo conoce el schema formulario."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    utopp_user_id: Optional[int] = None


class SharedEventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=120)
    theme: Optional[str] = Field(None, max_length=40)
    highlights: Optional[List[str]] = None
    date_time: datetime
    location: str = Field(..., min_length=1, max_length=255)
    capacity: Optional[int] = Field(None, ge=1)
    banner_url: Optional[str] = None
    allow_only_utec_emails: bool = False


class SharedEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    creator_id: uuid.UUID
    title: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = None
    theme: Optional[str] = None
    highlights: Optional[List[str]] = None
    date_time: datetime
    location: str
    capacity: Optional[int] = None
    banner_url: Optional[str] = None
    allow_only_utec_emails: bool = False
    visible_on_plataforma: bool = True
    utopp_post_id: Optional[int] = None
    creator_utopp_user_id: Optional[int] = None
    created_at: datetime
    registered_count: int = 0
    creator: Optional[SharedEventCreator] = None
    # URL del formulario público de inscripción, servido por Utopp Formulario
    registration_url: Optional[str] = None
