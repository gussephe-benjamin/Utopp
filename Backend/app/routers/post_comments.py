from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.dependencies.pagination import PaginationParams
from app.models.user import User
from app.schemas.engagement import CommentCreate, CommentOut
from app.services import comment_service

router = APIRouter()


# ============================================================
# GET /posts/{post_id}/comments
# Lista los comentarios de un post (más antiguos primero), paginado.
# Auth: No requerida
# ============================================================
@router.get("/posts/{post_id}/comments", response_model=List[CommentOut])
def list_comments(
    post_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    comments, _ = comment_service.list_comments(
        db,
        post_id=post_id,
        limit=pagination.size,
        offset=pagination.offset,
    )
    return comments


# ============================================================
# POST /posts/{post_id}/comments
# Crea un comentario en un post publicado.
# Auth: Requerida
# ============================================================
@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    return comment_service.create_comment(
        db, user_id=current_user.id, post_id=post_id, data=data
    )


# ============================================================
# DELETE /posts/{post_id}/comments/{comment_id}
# Elimina un comentario. Solo el autor o un admin/root.
# Auth: Requerida
# ============================================================
@router.delete("/posts/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    comment_service.delete_comment(
        db, user_id=current_user.id, post_id=post_id, comment_id=comment_id
    )
    return None
