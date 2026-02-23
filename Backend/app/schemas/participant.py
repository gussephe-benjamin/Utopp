from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.event_participant import PostParticipantStatus


class ParticipantCreate(BaseModel):
    """Schema para crear participación."""
    status: PostParticipantStatus = PostParticipantStatus.interested


class ParticipantUpdate(BaseModel):
    """Schema para actualizar participación."""
    status: PostParticipantStatus


class ParticipantUserOut(BaseModel):
    """Usuario embebido en participante."""
    id: int
    full_name: Optional[str] = None
    email: str
    
    class Config:
        from_attributes = True


class ParticipantOut(BaseModel):
    """Schema de salida de participante."""
    id: int
    post_id: int
    user_id: int
    status: PostParticipantStatus
    joined_at: datetime
    
    user: Optional[ParticipantUserOut] = None
    
    class Config:
        from_attributes = True


class ParticipantCountOut(BaseModel):
    """Conteo de participantes por estado."""
    interested: int = 0
    going: int = 0
    attended: int = 0
    total: int = 0
