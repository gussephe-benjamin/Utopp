from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_owner_or_admin
from app.models.user import User
from app.models.post import Post
from app.schemas.link import LinkCreate, LinkUpdate, LinkOut, LinkReorderRequest
from app.services import link_service

router = APIRouter()


# ============================================================
# POST /posts/{post_id}/links
# Agrega un link a un post (ej: formulario, recurso externo).
# Cada link tiene label, url, type y display_type.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.post("/posts/{post_id}/links", response_model=LinkOut, status_code=status.HTTP_201_CREATED)
def create_link(
    data: LinkCreate,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    return link_service.create_link(db, post_id=post.id, data=data)


# ============================================================
# GET /posts/{post_id}/links
# Lista todos los links de un post ordenados por posición.
# Auth: No requerida
# ============================================================
@router.get("/posts/{post_id}/links", response_model=List[LinkOut])
def list_links(
    post_id: int,
    db: Session = Depends(get_db),
):
    return link_service.list_post_links(db, post_id)

# ============================================================
# PATCH /posts/{post_id}/links/reorder
# Reordena los links de un post asignando nuevas posiciones.
# Se debe enviar un array con link_id y position por cada link.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.patch("/posts/{post_id}/links/reorder", response_model=List[LinkOut])
def reorder_links(
    data: LinkReorderRequest,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    return link_service.reorder_links(db, post_id=post.id, data=data)

# ============================================================
# PATCH /posts/{post_id}/links/{link_id}
# Actualiza los campos de un link existente (label, url, type).
# Verifica que el link pertenezca al post indicado.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.patch("/posts/{post_id}/links/{link_id}", response_model=LinkOut)
def update_link(
    link_id: int,
    data: LinkUpdate,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    link = link_service.get_link(db, link_id)

    if link.post_id != post.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link no encontrado en este post"
        )

    return link_service.update_link(db, link, data)


# ============================================================
# DELETE /posts/{post_id}/links/{link_id}
# Elimina un link de un post.
# Verifica que el link pertenezca al post indicado.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.delete("/posts/{post_id}/links/{link_id}", status_code=status.HTTP_200_OK)
def delete_link(
    link_id: int,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    link = link_service.get_link(db, link_id)

    if link.post_id != post.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link no encontrado en este post"
        )

    link_service.delete_link(db, link)
    return {"message": "Link eliminado correctamente"}



