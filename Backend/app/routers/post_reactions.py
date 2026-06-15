from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted, get_optional_user
from app.models.user import User
from app.schemas.engagement import ReactionToggleOut, ReactionCountOut
from app.services import reaction_service

router = APIRouter()


# ============================================================
# POST /posts/{post_id}/reactions
# Alterna la reacción (me gusta) del usuario en un post.
# Si ya existe la elimina; si no, la crea.
# Auth: Requerida
# ============================================================
@router.post("/posts/{post_id}/reactions", response_model=ReactionToggleOut)
def toggle_reaction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    reacted, count = reaction_service.toggle_reaction(
        db, user_id=current_user.id, post_id=post_id
    )
    return ReactionToggleOut(reacted=reacted, count=count)


# ============================================================
# GET /posts/{post_id}/reactions/count
# Devuelve el conteo de reacciones y si el usuario actual reaccionó.
# Auth: Opcional (user_reacted solo si está autenticado)
# ============================================================
@router.get("/posts/{post_id}/reactions/count", response_model=ReactionCountOut)
def get_reaction_count(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    count, user_reacted = reaction_service.get_reaction_count(
        db, post_id=post_id, user_id=current_user.id if current_user else None
    )
    return ReactionCountOut(count=count, user_reacted=user_reacted)
