from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_optional_user
from app.dependencies.pagination import PaginationParams
from app.models.user import User
from app.models.post import PostType, SubPostType
from app.schemas.feed import FeedResponse
from app.services import feed_service

router = APIRouter()


# ============================================================
# GET /feed
# Devuelve el feed de posts publicados con paginación.
# Solo muestra posts con status=published y con deadline_at
# NULL o mayor a la fecha/hora actual.
# Soporta filtros opcionales por tipo, subtipo y tags.
# Si el usuario está autenticado, incluye info de posts
# guardados y estado de participación en eventos.
# Auth: Opcional (enriquece la respuesta si está autenticado)
# ============================================================
@router.get("/feed", response_model=FeedResponse)
def get_feed(
    type: Optional[PostType] = Query(None, description="Filtrar por tipo de post"),
    exclude_type: Optional[PostType] = Query(None, description="Excluir un tipo de post (p. ej. eventos del feed de publicaciones)"),
    subtype: Optional[SubPostType] = Query(None, description="Filtrar por subtipo"),
    tags: Optional[List[str]] = Query(None, description="Filtrar por tags"),
    time_status: Optional[str] = Query(None, description="Filtrar por vigencia: 'vigente' o 'vencida'"),
    sort: Optional[str] = Query(None, description="Orden: 'recent' para más recientes primero"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    return feed_service.build_feed(
        db=db,
        current_user=current_user,
        post_type=type,
        exclude_post_type=exclude_type,
        subtype=subtype,
        tags=tags,
        time_status=time_status,
        sort=sort,
        page=pagination.page,
        size=pagination.size,
    )
