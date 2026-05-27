from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.dependencies.pagination import PaginationParams
from app.models.user import User
from app.schemas.post import PostOut
from app.services import saved_post_service

router = APIRouter()


# ============================================================
# POST /posts/{post_id}/save
# Guarda un post en la lista de guardados del usuario actual.
# Si el post ya está guardado, devuelve error 409.
# Auth: Requerida
# ============================================================
@router.post("/posts/{post_id}/save", status_code=status.HTTP_201_CREATED)
def save_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    saved_post_service.save_post(db, user_id=current_user.id, post_id=post_id)
    return {"status": "saved"}


# ============================================================
# DELETE /posts/{post_id}/save
# Quita un post de la lista de guardados del usuario actual.
# Si el post no estaba guardado, devuelve error 404.
# Auth: Requerida
# ============================================================
@router.delete("/posts/{post_id}/save", status_code=status.HTTP_200_OK)
def unsave_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    saved_post_service.unsave_post(db, user_id=current_user.id, post_id=post_id)
    return {"status": "unsaved"}


# ============================================================
# GET /users/me/saved-posts
# Lista los posts guardados del usuario autenticado.
# Los posts se ordenan por fecha de guardado (más reciente primero).
# Solo devuelve posts que estén publicados.
# Auth: Requerida
# ============================================================
@router.get("/users/me/saved-posts", response_model=List[PostOut])
def get_saved_posts(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    posts, _ = saved_post_service.list_saved_posts(
        db,
        user_id=current_user.id,
        limit=pagination.size,
        offset=pagination.offset,
    )
    return posts
