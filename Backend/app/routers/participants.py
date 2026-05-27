from typing import List, Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.dependencies.pagination import PaginationParams
from app.models.user import User
from app.models.event_participant import PostParticipantStatus
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantUpdate,
    ParticipantOut,
    ParticipantCountOut,
)
from app.services import participant_service

router = APIRouter()

# ============================================================
# POST /posts/{post_id}/participate
# Registra la participación del usuario en un evento.
# Solo funciona con posts de tipo "event" y status "published".
# Si el usuario ya participa, devuelve error 409.
# Auth: Requerida
# ============================================================
@router.post("/posts/{post_id}/participate", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
def create_participation(
    post_id: int,
    data: ParticipantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    return participant_service.create_participation(
        db,
        post_id=post_id,
        user_id=current_user.id,
        data=data
    )

# ============================================================
# PATCH /posts/{post_id}/participation
# Actualiza el estado de participación del usuario
# (ej: de "interested" a "going").
# Auth: Requerida
# ============================================================
@router.patch("/posts/{post_id}/participation", response_model=ParticipantOut)
def update_participation(
    post_id: int,
    data: ParticipantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    return participant_service.update_participation(
        db,
        post_id=post_id,
        user_id=current_user.id,
        data=data
    )


# ============================================================
# DELETE /posts/{post_id}/participation
# Cancela la participación del usuario en un evento.
# Auth: Requerida
# ============================================================
@router.delete("/posts/{post_id}/participation", status_code=status.HTTP_204_NO_CONTENT)
def delete_participation(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    participant_service.delete_participation(
        db,
        post_id=post_id,
        user_id=current_user.id
    )
    return None


# ============================================================
# GET /posts/{post_id}/participants
# Lista los participantes de un evento con paginación.
# Se puede filtrar por estado (interested, going, attended).
# Auth: No requerida
# ============================================================
@router.get("/posts/{post_id}/participants", response_model=List[ParticipantOut])
def list_participants(
    post_id: int,
    status: Optional[PostParticipantStatus] = Query(None, description="Filtrar por estado"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    participants, _ = participant_service.list_participants(
        db,
        post_id=post_id,
        status=status,
        limit=pagination.size,
        offset=pagination.offset,
    )
    return participants


# ============================================================
# GET /posts/{post_id}/participants/count
# Devuelve el conteo de participantes agrupados por estado
# (interested, going, attended) y el total.
# Auth: No requerida
# ============================================================
@router.get("/posts/{post_id}/participants/count", response_model=ParticipantCountOut)
def get_participant_counts(
    post_id: int,
    db: Session = Depends(get_db),
):
    return participant_service.get_participant_counts(db, post_id)
