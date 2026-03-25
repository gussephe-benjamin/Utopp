from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.pagination import PaginationParams
from app.models.user import User
from app.models.follow import Follow
from app.models.post import Post
from app.schemas.user import UserResponse_total, UserOut, UserPublicOut, UserUpdate, FollowerOut
from app.schemas.post import PostOut
from app.services.users_service import get_all_users
from app.services.profile_service import follow as svc_follow, unfollow as svc_unfollow, update_interests as svc_update_interests

router = APIRouter()


# ============================================================
# GET /users/all-users
# Lista todos los usuarios registrados (legacy).
# Auth: No requerida
# ============================================================
@router.get("/all-users", response_model=list[UserResponse_total])
def list_users(db: Session = Depends(get_db)):
    return get_all_users(db)


# ============================================================
# GET /users/me
# Devuelve el perfil completo del usuario autenticado.
# Auth: Requerida
# ============================================================
@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id
    followers_count = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.following_id == uid)
    ) or 0
    following_count = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.follower_id == uid)
    ) or 0
    posts_count = db.scalar(
        select(func.count()).select_from(Post).where(Post.user_id == uid)
    ) or 0
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        career=current_user.career,
        cycle=current_user.cycle,
        interests=current_user.interests,
        availability=current_user.availability,
        is_onboarding_completed=current_user.is_onboarding_completed,
        created_at=current_user.created_at,
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
    )


# ============================================================
# PATCH /users/me
# Actualiza los campos del perfil del usuario autenticado.
# Solo se actualizan los campos enviados (partial update).
# Auth: Requerida
# ============================================================
@router.patch("/me", response_model=UserOut)
def update_current_user(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================
# PUT /users/me/interests
# Reemplaza la lista de intereses del usuario autenticado.
# Auth: Requerida
# ============================================================
@router.put("/me/interests", response_model=UserOut)
def update_interests(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interests = payload.get("interests", [])
    svc_update_interests(db, user_id=current_user.id, interests=interests)
    db.refresh(current_user)
    return current_user


# ============================================================
# GET /users/check-username?username=...
# Verifica si un nombre de usuario ya está en uso.
# Devuelve { "available": bool }
# Auth: No requerida
# ============================================================
@router.get("/check-username")
def check_username(username: str, db: Session = Depends(get_db)):
    exists = db.scalars(
        select(User).where(func.lower(User.full_name) == func.lower(username))
    ).first()
    return {"available": exists is None}


# ============================================================
# GET /users/check-email?email=...
# Verifica si un correo ya está registrado.
# Devuelve { "available": bool }
# Auth: No requerida
# ============================================================
@router.get("/check-email")
def check_email(email: str, db: Session = Depends(get_db)):
    exists = db.scalars(
        select(User).where(func.lower(User.email) == func.lower(email))
    ).first()
    return {"available": exists is None}


# ============================================================
# GET /users/{user_id}
# Devuelve el perfil público de un usuario con conteos
# de seguidores, seguidos y cantidad de posts.
# Auth: No requerida
# ============================================================
@router.get("/{user_id}", response_model=UserPublicOut)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    followers_count = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.following_id == user_id)
    ) or 0

    following_count = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)
    ) or 0

    posts_count = db.scalar(
        select(func.count()).select_from(Post).where(Post.user_id == user_id)
    ) or 0

    return UserPublicOut(
        id=user.id,
        full_name=user.full_name,
        career=user.career,
        cycle=user.cycle,
        interests=user.interests,
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
    )


# ============================================================
# GET /users/{user_id}/posts
# Lista los posts de un usuario específico ordenados por
# fecha de creación (más recientes primero).
# Auth: No requerida
# ============================================================
@router.get("/{user_id}/posts", response_model=List[PostOut])
def get_user_posts(
    user_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    posts = db.scalars(
        select(Post)
        .options(
            selectinload(Post.user),
            selectinload(Post.images),
            selectinload(Post.links),
        )
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()

    return list(posts)


# ============================================================
# POST /users/{user_id}/follow
# El usuario autenticado sigue al usuario indicado.
# No se puede seguir a uno mismo. Devuelve error si el
# usuario destino no existe.
# Auth: Requerida
# ============================================================
@router.post("/{user_id}/follow", status_code=status.HTTP_201_CREATED)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes seguirte a ti mismo"
        )

    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    svc_follow(db, follower_id=current_user.id, following_id=user_id)
    return {"status": "followed"}


# ============================================================
# DELETE /users/{user_id}/follow
# El usuario autenticado deja de seguir al usuario indicado.
# Auth: Requerida
# ============================================================
@router.delete("/{user_id}/follow", status_code=status.HTTP_200_OK)
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc_unfollow(db, follower_id=current_user.id, following_id=user_id)
    return {"status": "unfollowed"}


# ============================================================
# GET /users/{user_id}/followers
# Lista los seguidores de un usuario con paginación.
# Auth: No requerida
# ============================================================
@router.get("/{user_id}/followers", response_model=List[FollowerOut])
def get_followers(
    user_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    follows = db.scalars(
        select(Follow)
        .where(Follow.following_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()

    result = []
    for f in follows:
        follower = db.get(User, f.follower_id)
        if follower:
            result.append(
                FollowerOut(
                    user_id=follower.id,
                    full_name=follower.full_name,
                    email=follower.email,
                    followed_at=f.created_at,
                )
            )

    return result


# ============================================================
# GET /users/{user_id}/following
# Lista los usuarios que sigue un usuario con paginación.
# Auth: No requerida
# ============================================================
@router.get("/{user_id}/following", response_model=List[FollowerOut])
def get_following(
    user_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    follows = db.scalars(
        select(Follow)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()

    result = []
    for f in follows:
        following = db.get(User, f.following_id)
        if following:
            result.append(
                FollowerOut(
                    user_id=following.id,
                    full_name=following.full_name,
                    email=following.email,
                    followed_at=f.created_at,
                )
            )

    return result


# ============================================================
# DELETE /users/me/followers/{follower_id}
# Elimina un seguidor de la lista de seguidores del usuario
# autenticado (el seguidor deja de seguir al usuario actual).
# Auth: Requerida
# ============================================================
@router.delete("/me/followers/{follower_id}", status_code=status.HTTP_200_OK)
def remove_follower(
    follower_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = db.scalars(
        select(Follow).where(
            Follow.follower_id == follower_id,
            Follow.following_id == current_user.id,
        )
    ).first()

    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Este usuario no te sigue"
        )

    db.delete(follow)
    db.commit()
    return {"status": "follower_removed"}