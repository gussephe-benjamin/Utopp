"""DTOs de eventos en los que el usuario de Utopp figura como asistente.

La vinculación es por email (soft-join) contra `formulario.attendees`.
"""
import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


UserEventStatus = Literal["registered", "attended"]


class UserParticipatedEventOut(BaseModel):
    """Evento de Formulario al que el usuario está inscrito o asistió."""

    model_config = ConfigDict(from_attributes=True)

    event_id: uuid.UUID
    title: str
    date_time: datetime
    location: str
    banner_url: Optional[str] = None
    category: Optional[str] = None
    theme: Optional[str] = None
    registered_at: datetime
    checked_in: bool = False
    checked_in_at: Optional[datetime] = None
    status: UserEventStatus
    ticket_id: Optional[uuid.UUID] = None
    ticket_url: Optional[str] = Field(
        None,
        description="URL pública del boleto en Utopp Formulario (/ticket/{id})",
    )
