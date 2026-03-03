from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_owner_or_admin, require_owner_or_admin_archived, require_post_owner
from app.dependencies.pagination import PaginationParams
from app.models.user import User
from app.models.post import Post
from app.schemas.post import (
    PostCreate, PostUpdate, PostOut,
    AcademicProjectCreate, SimplePostCreate, AnnouncementCreate,
    AcademicProjectDeadlineUpdate,
)
from app.services import post_service

router = APIRouter()

# ============================================================
# POST /posts
# Crea un nuevo post en estado draft.
# El post se crea siempre como borrador; para hacerlo visible
# en el feed se debe llamar al endpoint de publicación.
# Auth: Requerida
# ============================================================
@router.post("/", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = post_service.create_post(db, user_id=current_user.id, data=data)
    return post_service.get_post(db, post.id)


# ============================================================
# POST /posts/academic-projects
# Crea un proyecto académico en estado draft.
# deadline_at es opcional (abierto hasta que el usuario lo cierre).
# specific_fields: participants_needed, estimated_time.
# Auth: Requerida
# ============================================================
@router.post("/academic-projects", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_academic_project(
    data: AcademicProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = post_service.create_academic_project(db, user_id=current_user.id, data=data)
    return post_service.get_post(db, post.id)


# ============================================================
# POST /posts/simple-posts
# Crea una publicación simple (sin título).
# Auth: Requerida
# ============================================================
@router.post("/simple-posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_simple_post(
    data: SimplePostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = post_service.create_simple_post(db, user_id=current_user.id, data=data)
    return post_service.get_post(db, post.id)


# ============================================================
# POST /posts/announcements
# Crea un anuncio con deadline requerido.
# Auth: Requerida
# ============================================================
@router.post("/announcements", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = post_service.create_announcement(db, user_id=current_user.id, data=data)
    return post_service.get_post(db, post.id)


# ============================================================
# GET /posts/{post_id}
# Obtiene un post por su ID con todas sus relaciones
# (usuario, imágenes, links).
# Auth: No requerida
# ============================================================
@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    return post_service.get_post(db, post_id)


# ============================================================
# PATCH /posts/{post_id}
# Actualiza campos de un post existente.
# No se pueden modificar posts archivados.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.patch("/{post_id}", response_model=PostOut)
def update_post(
    data: PostUpdate,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    updated = post_service.update_post(db, post, data)
    return post_service.get_post(db, updated.id)


# ============================================================
# POST /posts/{post_id}/publish
# Cambia el estado del post de draft a published.
# Una vez publicado, el post aparece en el feed.
# Auth: Requerida
# Permisos: Solo el dueño del post
# ============================================================
@router.post("/{post_id}/publish", response_model=PostOut)
def publish_post(
    post: Post = Depends(require_post_owner),
    db: Session = Depends(get_db),
):
    published = post_service.publish_post(db, post)
    return post_service.get_post(db, published.id)


# ============================================================
# POST /posts/{post_id}/archive
# Archiva un post. Los posts archivados no se pueden editar
# ni aparecen en el feed.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.post("/{post_id}/archive", response_model=PostOut)
def archive_post(
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    archived = post_service.archive_post(db, post)
    return post_service.get_post(db, archived.id)


# ============================================================
# POST /posts/{post_id}/unarchive
# Desarchiva un post. Vuelve a estado published.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.post("/{post_id}/unarchive", response_model=PostOut)
def unarchive_post(
    post: Post = Depends(require_owner_or_admin_archived),
    db: Session = Depends(get_db),
):
    unarchived = post_service.unarchive_post(db, post)
    return post_service.get_post(db, unarchived.id)


# ============================================================
# POST /posts/{post_id}/check-time-status
# Verifica y actualiza el time_status del post según deadline_at.
# Útil para forzar la verificación sin esperar al próximo acceso.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.post("/{post_id}/check-time-status", response_model=PostOut)
def check_time_status(
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    updated = post_service.check_and_update_time_status(db, post)
    return post_service.get_post(db, updated.id)

# ============================================================
# POST /posts/{post_id}/close
# Cierra un post asignando deadline_at = ahora.
# Útil para proyectos académicos abiertos que el usuario
# decide cerrar manualmente. time_status pasa a out_of_time.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.post("/{post_id}/close", response_model=PostOut)
def close_post(
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    closed = post_service.close_post(db, post)
    return post_service.get_post(db, closed.id)


# ============================================================
# PATCH /posts/{post_id}/deadline
# Asigna o reemplaza el deadline de un proyecto académico.
# Recalcula time_status: in_time si fecha futura, out_of_time si pasada.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.patch("/{post_id}/deadline", response_model=PostOut)
def set_deadline(
    data: AcademicProjectDeadlineUpdate,
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    updated = post_service.set_deadline(db, post, data)
    return post_service.get_post(db, updated.id)


# ============================================================
# DELETE /posts/{post_id}/deadline
# Elimina el deadline de un proyecto académico.
# time_status pasa a no_deadline.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.delete("/{post_id}/deadline", response_model=PostOut)
def remove_deadline(
    post: Post = Depends(require_owner_or_admin),
    db: Session = Depends(get_db),
):
    updated = post_service.remove_deadline(db, post)
    return post_service.get_post(db, updated.id)

# ============================================================
# DELETE /posts/{post_id}
# Elimina un post.
# Auth: Requerida
# Permisos: Solo el dueño del post o un admin
# ============================================================
@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post: Post = Depends(require_owner_or_admin_archived),
    db: Session = Depends(get_db),
):
    post_service.delete_post(db, post)
    return None
