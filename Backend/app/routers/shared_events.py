"""Eventos compartidos con Utopp Formulario.

A diferencia del dashboard de Utopp Formulario, que muestra solo los eventos
del organizador autenticado, aquí el listado devuelve los eventos de todos los
creadores: es la sección Eventos de la plataforma.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.dependencies.pagination import PageResponse, PaginationParams
from app.models.user import User
from app.schemas.shared_event import SharedEventCreate, SharedEventOut
from app.services import shared_event_service

router = APIRouter()


# ============================================================
# GET /events
# Lista TODOS los eventos de la tabla compartida, sin filtrar
# por creador. Auth: no requerida.
# ============================================================
@router.get("/events", response_model=PageResponse[SharedEventOut])
def list_events(
    pagination: PaginationParams = Depends(),
    upcoming_only: bool = Query(False, description="Solo eventos que aún no ocurrieron"),
    search: Optional[str] = Query(None, description="Busca en título y lugar"),
    category: Optional[str] = Query(None, description="Filtra por categoría"),
    db: Session = Depends(get_db),
):
    items, total = shared_event_service.list_events(
        db,
        limit=pagination.size,
        offset=pagination.offset,
        upcoming_only=upcoming_only,
        search=search,
        category=category,
    )
    return PageResponse.create(
        items=[SharedEventOut(**item) for item in items],
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


# ============================================================
# GET /events/{event_id}
# Detalle de un evento. Auth: no requerida.
# ============================================================
@router.get("/events/{event_id}", response_model=SharedEventOut)
def get_event(event_id: uuid.UUID, db: Session = Depends(get_db)):
    return SharedEventOut(**shared_event_service.get_event(db, event_id))


# ============================================================
# POST /events
# Crea un evento en la tabla compartida. Queda visible tanto
# aquí como en el dashboard de Utopp Formulario.
# Auth: requerida.
# ============================================================
@router.post("/events", response_model=SharedEventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    data: SharedEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    return SharedEventOut(
        **shared_event_service.create_event(db, user=current_user, data=data)
    )
