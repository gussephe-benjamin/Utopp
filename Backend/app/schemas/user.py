from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.weekly_availability import validate_weekly_availability

ORG_DESCRIPTION_MAX_LENGTH = 2000
ORG_CONTACTS_MAX_KEYS = 10


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


class UserFullOut(BaseModel):
    """Salida administrativa con todos los campos del modelo User y roles."""
    id: int
    email: str
    full_name: Optional[str] = None
    hashed_password: Optional[str] = None
    is_onboarding_completed: bool = False
    career: Optional[str] = None
    cycle: Optional[int] = None
    interests: Optional[List[str]] = None
    availability: Optional[int] = None
    weekly_availability: Optional[Dict] = None
    description: Optional[str] = None
    contacts: Optional[Dict[str, Any]] = None
    google_id: Optional[str] = None
    last_accepted_legal_document_id: Optional[int] = None
    last_accepted_privacy_document_id: Optional[int] = None
    created_at: datetime
    roles: List[str] = []

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Datos requeridos para registrar un usuario."""
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(None, max_length=255)
    terms_document_id: int = Field(..., ge=1, description="Id del documento activo de términos al momento del registro")
    privacy_document_id: int = Field(..., ge=1, description="Id del documento activo de privacidad al momento del registro")


class UserBasicOut(BaseModel):
    """Salida básica de usuario para auth (id, email, nombre)."""
    id: int
    email: EmailStr
    full_name: str | None = None

    class Config:
        from_attributes = True


def _normalize_contacts(value: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
    if value is None:
        return None
    normalized: Dict[str, str] = {}
    for key, raw in value.items():
        clean_key = str(key).strip().lower()
        clean_val = str(raw).strip()
        if not clean_key or not clean_val:
            continue
        normalized[clean_key] = clean_val
    if len(normalized) > ORG_CONTACTS_MAX_KEYS:
        raise ValueError(f"Máximo {ORG_CONTACTS_MAX_KEYS} contactos permitidos")
    return normalized


class UserOut(BaseModel):
    """Salida completa de usuario autenticado."""
    id: int
    email: str
    full_name: Optional[str] = None
    career: Optional[str] = None
    cycle: Optional[int] = None
    interests: Optional[List[str]] = None
    availability: Optional[int] = None
    weekly_availability: Optional[Dict] = None
    description: Optional[str] = None
    contacts: Optional[Dict[str, str]] = None
    is_onboarding_completed: bool = False
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    profile_image_url: Optional[str] = None
    satisfaction_score: Optional[float] = None
    avg_students_per_event: Optional[float] = None

    class Config:
        from_attributes = True


class UserPublicOut(BaseModel):
    """Perfil público de un usuario con conteos."""
    id: int
    full_name: Optional[str] = None
    career: Optional[str] = None
    cycle: Optional[int] = None
    interests: Optional[List[str]] = None
    availability: Optional[int] = None
    description: Optional[str] = None
    contacts: Optional[Dict[str, str]] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    profile_image_url: Optional[str] = None
    satisfaction_score: Optional[float] = None
    avg_students_per_event: Optional[float] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Campos actualizables del perfil de usuario."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    career: Optional[str] = Field(None, max_length=100)
    cycle: Optional[int] = Field(None, ge=1, le=12)
    interests: Optional[List[str]] = None
    availability: Optional[int] = None
    weekly_availability: Optional[Dict] = None
    description: Optional[str] = Field(None, max_length=ORG_DESCRIPTION_MAX_LENGTH)
    contacts: Optional[Dict[str, str]] = None

    @field_validator("weekly_availability")
    @classmethod
    def validate_weekly_availability_field(cls, value: Optional[Dict]) -> Optional[Dict]:
        if value is None:
            return None
        return validate_weekly_availability(value)

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        stripped = v.strip()
        return stripped if stripped else None

    @field_validator("contacts")
    @classmethod
    def validate_contacts(cls, v: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
        return _normalize_contacts(v)


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


class OrganizationSummaryOut(BaseModel):
    """Resumen de organización para listados en perfil."""
    id: int
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    followers_count: int = 0
    posts_count: int = 0
    interaction_score: int = 0

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


class SessionExchangeIn(BaseModel):
    """Canje de token de sesión de un solo uso tras OAuth cross-origin."""
    session_token: str = Field(..., min_length=10)


class GoogleOAuthRegisterIn(BaseModel):
    """Completa registro Google tras aceptar términos (perfil en cookie o token)."""
    terms_document_id: int = Field(..., ge=1)
    privacy_document_id: int = Field(..., ge=1)
    pending_token: str | None = Field(default=None, min_length=10)


class GoogleRegisterIn(BaseModel):
    """Registro con Google: token y snapshot de documentos legales vigentes."""
    model_config = {"extra": "ignore"}

    token: str = Field(..., min_length=10)
    terms_document_id: int = Field(..., ge=1)
    privacy_document_id: int = Field(..., ge=1)


class GoogleLoginIn(BaseModel):
    """Login con Google ID Token."""
    model_config = {"extra": "ignore"}

    token: str = Field(..., min_length=10)
