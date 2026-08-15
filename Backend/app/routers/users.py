from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.dependencies.pagination import PaginationParams
from app.models.user import User
from app.models.follow import Follow
from app.models.post import Post
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.user_profile_image import UserProfileImage
from app.models.saved_post import SavedPost
from app.models.event_participant import PostParticipant
from app.schemas.user import (
    UserFullOut,
    UserOut,
    UserPublicOut,
    UserUpdate,
    FollowerOut,
    OrganizationSummaryOut,
)
from app.schemas.post import PostOut
from app.schemas.user_events import UserParticipatedEventOut
from app.services.users_service import (
    get_all_users_complete,
    get_user_by_email,
    get_user_by_id,
    get_students,
    get_users_by_role,
)
from app.services.profile_service import follow as svc_follow, unfollow as svc_unfollow, update_interests as svc_update_interests
from app.services.role_service import ORG_ROLE_NAME, STUDENT_ROLE_NAME, assign_student_role
from app.services.user_events_service import list_my_participated_events
from app.dependencies.permissions import get_user_roles

router = APIRouter()


def _has_role(db: Session, user_id: int, role_name: str) -> bool:
    row = db.execute(
        select(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == user_id,
            Role.name == role_name,
        )
        .limit(1)
    ).first()
    return row is not None


def _has_any_role(db: Session, user_id: int) -> bool:
    row = db.execute(
        select(UserRole.user_id).where(UserRole.user_id == user_id).limit(1)
    ).first()
    return row is not None


def _ensure_student_role_or_check(db: Session, user_id: int) -> bool:
    """
    Asegura que un usuario sea tratado como estudiante para la acción de follow.
    Si ya tiene el rol explícito, retorna True. Si NO tiene ningún rol (usuarios
    legacy creados antes del catálogo), se le asigna el rol estudiante por
    defecto del sistema y se retorna True. Si tiene otro rol (organización,
    oficina, etc.), retorna False y la acción debe bloquearse.
    """
    if _has_role(db, user_id, STUDENT_ROLE_NAME):
        return True
    if _has_any_role(db, user_id):
        return False
    assign_student_role(db, user_id)
    return True


def _organization_rows_query():
    followers_count_sq = (
        select(
            Follow.following_id.label("org_id"),
            func.count().label("followers_count"),
        )
        .group_by(Follow.following_id)
        .subquery()
    )

    active_image_sq = (
        select(
            UserProfileImage.user_id.label("img_user_id"),
            UserProfileImage.url.label("profile_image_url"),
        )
        .where(UserProfileImage.is_active.is_(True))
        .subquery()
    )

    posts_count_sq = (
        select(
            Post.user_id.label("post_user_id"),
            func.count().label("posts_count"),
        )
        .group_by(Post.user_id)
        .subquery()
    )

    saves_count_sq = (
        select(
            Post.user_id.label("post_user_id"),
            func.count(SavedPost.id).label("saves_count"),
        )
        .join(SavedPost, SavedPost.post_id == Post.id)
        .group_by(Post.user_id)
        .subquery()
    )

    participants_count_sq = (
        select(
            Post.user_id.label("post_user_id"),
            func.count(PostParticipant.id).label("participants_count"),
        )
        .join(PostParticipant, PostParticipant.post_id == Post.id)
        .group_by(Post.user_id)
        .subquery()
    )

    followers_count = func.coalesce(followers_count_sq.c.followers_count, 0)
    posts_count = func.coalesce(posts_count_sq.c.posts_count, 0)
    saves_count = func.coalesce(saves_count_sq.c.saves_count, 0)
    participants_count = func.coalesce(participants_count_sq.c.participants_count, 0)

    score_expr = (
        followers_count * 5 +
        posts_count * 2 +
        saves_count * 3 +
        participants_count * 10
    ).label("interaction_score")

    return (
        select(
            User.id,
            User.full_name,
            active_image_sq.c.profile_image_url,
            followers_count.label("followers_count"),
            posts_count.label("posts_count"),
            score_expr,
        )
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .outerjoin(followers_count_sq, followers_count_sq.c.org_id == User.id)
        .outerjoin(active_image_sq, active_image_sq.c.img_user_id == User.id)
        .outerjoin(posts_count_sq, posts_count_sq.c.post_user_id == User.id)
        .outerjoin(saves_count_sq, saves_count_sq.c.post_user_id == User.id)
        .outerjoin(participants_count_sq, participants_count_sq.c.post_user_id == User.id)
        .where(Role.name == ORG_ROLE_NAME)
    )


def _get_org_metrics(db: Session, user_id: int) -> tuple[float | None, float | None]:
    """
    Retorna (satisfaction_score, avg_students_per_event) si es organización,
    de lo contrario retorna (None, None).
    """
    if not _has_role(db, user_id, ORG_ROLE_NAME):
        return None, None

    # 1. Promedio de alumnos por evento
    event_ids = db.scalars(
        select(Post.id)
        .where(Post.user_id == user_id, Post.post_type == "event")
    ).all()

    if not event_ids:
        avg_students = 0.0
    else:
        # Suma de participantes con status 'going' o 'attended'
        total_participants = db.scalar(
            select(func.count(PostParticipant.id))
            .where(
                PostParticipant.post_id.in_(event_ids),
                PostParticipant.status.in_(["going", "attended"])
            )
        ) or 0
        avg_students = round(total_participants / len(event_ids), 1)

    # 2. Promedio de satisfacción
    # Ya que no hay tabla de valoraciones/reseñas, calculamos un puntaje dinámico entre 4.0 y 5.0
    # basado en followers_count y la cantidad total de participantes en sus eventos.
    followers_count = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.following_id == user_id)
    ) or 0

    total_all_participants = 0
    if event_ids:
        total_all_participants = db.scalar(
            select(func.count(PostParticipant.id))
            .where(PostParticipant.post_id.in_(event_ids))
        ) or 0

    # Fórmula determinista que escala de 4.0 a 5.0
    bonus = (followers_count * 0.05) + (total_all_participants * 0.08)
    satisfaction = min(5.0, 4.2 + bonus)

    if followers_count == 0 and total_all_participants == 0:
        # Si no tiene seguidores ni actividad, damos un promedio base razonable
        satisfaction = 4.5

    satisfaction = round(satisfaction, 1)

    return satisfaction, avg_students


def _make_user_out(db: Session, user: User) -> UserOut:
    uid = user.id
    followers_count = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.following_id == uid)
    ) or 0
    following_count = db.scalar(
        select(func.count()).select_from(Follow).where(Follow.follower_id == uid)
    ) or 0
    posts_count = db.scalar(
        select(func.count()).select_from(Post).where(Post.user_id == uid)
    ) or 0
    profile_img = db.scalars(
        select(UserProfileImage).where(
            UserProfileImage.user_id == uid,
            UserProfileImage.is_active.is_(True),
        )
    ).first()

    satisfaction_score, avg_students_per_event = _get_org_metrics(db, uid)

    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        career=user.career,
        cycle=user.cycle,
        interests=user.interests,
        availability=user.availability,
        description=user.description,
        contacts=user.contacts,
        is_onboarding_completed=user.is_onboarding_completed,
        created_at=user.created_at,
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
        profile_image_url=profile_img.url if profile_img else None,
        satisfaction_score=satisfaction_score,
        avg_students_per_event=avg_students_per_event,
    )


def _make_user_full_out(db: Session, user: User) -> UserFullOut:
    roles = get_user_roles(user, db)
    contacts = user.contacts
    if isinstance(contacts, dict):
        contacts = {
            str(key): value if isinstance(value, str) else str(value)
            for key, value in contacts.items()
        }
    base = UserFullOut.model_validate(user)
    return base.model_copy(update={"roles": roles, "contacts": contacts})


def _make_user_full_out_list(db: Session, users: list[User]) -> list[UserFullOut]:
    return [_make_user_full_out(db, user) for user in users]


# ============================================================
# GET /users/all-users
# Lista todos los usuarios registrados con todos los campos.
# Auth: No requerida
# ============================================================
@router.get("/all-users", response_model=list[UserFullOut])
def list_users(
    db: Session = Depends(get_db),
):
    users = get_all_users_complete(db)
    return _make_user_full_out_list(db, users)


# ============================================================
# GET /users/by-email?email=...
# Busca un usuario por correo con todos los campos.
# Auth: No requerida
# ============================================================
@router.get("/by-email", response_model=UserFullOut)
def get_user_by_email_endpoint(
    email: str,
    db: Session = Depends(get_db),
):
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return _make_user_full_out(db, user)


# ============================================================
# GET /users/by-id/{user_id}
# Busca un usuario por ID con todos los campos.
# Auth: No requerida
# ============================================================
@router.get("/by-id/{user_id}", response_model=UserFullOut)
def get_user_by_id_full_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return _make_user_full_out(db, user)


# ============================================================
# GET /users/students
# Lista todos los alumnos (rol estudiante + legacy sin rol).
# Auth: No requerida
# ============================================================
@router.get("/students", response_model=list[UserFullOut])
def list_students(
    db: Session = Depends(get_db),
):
    users = get_students(db)
    return _make_user_full_out_list(db, users)


# ============================================================
# GET /users/me
# Devuelve el perfil completo del usuario autenticado.
# Auth: Requerida
# ============================================================
@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    return _make_user_out(db, current_user)


# ============================================================
# GET /users/me/events
# Eventos de Formulario donde el email del usuario figura en attendees.
# Soft-join por email: guest → signup posterior aparece sin backfill.
# Auth: Requerida (+ términos aceptados)
# ============================================================
@router.get("/me/events", response_model=List[UserParticipatedEventOut])
def get_my_participated_events(
    pagination: PaginationParams = Depends(),
    status_filter: Optional[Literal["registered", "attended"]] = Query(
        None,
        alias="status",
        description="Filtrar por inscrito o asistió (checked_in)",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    return list_my_participated_events(
        db,
        email=current_user.email or "",
        status=status_filter,
        limit=pagination.size,
        offset=pagination.offset,
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
    current_user: User = Depends(require_terms_accepted),
):
    update_data = data.model_dump(exclude_unset=True)

    org_only_fields = {"description", "contacts"}
    student_only_fields = {"weekly_availability"}
    if org_only_fields.intersection(update_data.keys()):
        if not _has_role(db, current_user.id, ORG_ROLE_NAME):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo las organizaciones pueden actualizar descripción y contactos",
            )
    if student_only_fields.intersection(update_data.keys()):
        if not _has_role(db, current_user.id, STUDENT_ROLE_NAME):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los estudiantes pueden actualizar la disponibilidad semanal detallada",
            )

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return _make_user_out(db, current_user)


# ============================================================
# PUT /users/me/interests
# Reemplaza la lista de intereses del usuario autenticado.
# Auth: Requerida
# ============================================================
@router.put("/me/interests", response_model=UserOut)
def update_interests(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    interests = payload.get("interests", [])
    svc_update_interests(db, user_id=current_user.id, interests=interests)
    db.refresh(current_user)
    return _make_user_out(db, current_user)


# ============================================================
# GET /users/me/following-organizations
# Lista las organizaciones (rol organización estudiantil)
# seguidas por el usuario autenticado.
# Auth: Requerida
# ============================================================
@router.get("/me/following-organizations", response_model=List[OrganizationSummaryOut])
def get_my_following_organizations(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    rows = db.execute(
        _organization_rows_query()
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == current_user.id)
        .order_by(Follow.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()
    return [
        OrganizationSummaryOut(
            id=row.id,
            full_name=row.full_name,
            profile_image_url=row.profile_image_url,
            followers_count=row.followers_count or 0,
            posts_count=row.posts_count or 0,
            interaction_score=row.interaction_score or 0,
        )
        for row in rows
    ]


# ============================================================
# GET /users/{user_id}/following-organizations
# Lista las organizaciones seguidas por un usuario.
# Auth: No requerida
# ============================================================
@router.get("/{user_id}/following-organizations", response_model=List[OrganizationSummaryOut])
def get_user_following_organizations(
    user_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    rows = db.execute(
        _organization_rows_query()
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()
    return [
        OrganizationSummaryOut(
            id=row.id,
            full_name=row.full_name,
            profile_image_url=row.profile_image_url,
            followers_count=row.followers_count or 0,
            posts_count=row.posts_count or 0,
            interaction_score=row.interaction_score or 0,
        )
        for row in rows
    ]


# ============================================================
# GET /users/organizations/all
# Lista todas las organizaciones con datos completos del usuario.
# Auth: No requerida
# ============================================================
@router.get("/organizations/all", response_model=list[UserFullOut])
def list_organizations_full(
    db: Session = Depends(get_db),
):
    users = get_users_by_role(db, ORG_ROLE_NAME)
    return _make_user_full_out_list(db, users)


# ============================================================
# GET /users/organizations
# Lista todas las organizaciones del sistema.
# Auth: No requerida
# ============================================================
@router.get("/organizations", response_model=List[OrganizationSummaryOut])
def list_organizations(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        _organization_rows_query()
        .order_by(text("interaction_score DESC"), User.full_name.asc(), User.id.asc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()
    return [
        OrganizationSummaryOut(
            id=row.id,
            full_name=row.full_name,
            profile_image_url=row.profile_image_url,
            followers_count=row.followers_count or 0,
            posts_count=row.posts_count or 0,
            interaction_score=row.interaction_score or 0,
        )
        for row in rows
    ]


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

    profile_img = db.scalars(
        select(UserProfileImage).where(
            UserProfileImage.user_id == user_id,
            UserProfileImage.is_active.is_(True),
        )
    ).first()

    satisfaction_score, avg_students_per_event = _get_org_metrics(db, user_id)

    return UserPublicOut(
        id=user.id,
        full_name=user.full_name,
        career=user.career,
        cycle=user.cycle,
        interests=user.interests,
        availability=user.availability,
        description=user.description,
        contacts=user.contacts,
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
        profile_image_url=profile_img.url if profile_img else None,
        satisfaction_score=satisfaction_score,
        avg_students_per_event=avg_students_per_event,
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
    current_user: User = Depends(require_terms_accepted),
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

    if not _ensure_student_role_or_check(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden seguir organizaciones",
        )

    if not _has_role(db, target_user.id, ORG_ROLE_NAME):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes seguir cuentas de organizaciones estudiantiles",
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
    current_user: User = Depends(require_terms_accepted),
):
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if not _ensure_student_role_or_check(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los alumnos pueden dejar de seguir organizaciones",
        )

    if not _has_role(db, target_user.id, ORG_ROLE_NAME):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes dejar de seguir cuentas de organizaciones estudiantiles",
        )

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
    rows = db.execute(
        select(
            User.id,
            User.full_name,
            User.email,
            Follow.created_at.label("followed_at"),
        )
        .join(User, User.id == Follow.follower_id)
        .where(Follow.following_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()
    return [
        FollowerOut(
            user_id=row.id,
            full_name=row.full_name,
            email=row.email,
            followed_at=row.followed_at,
        )
        for row in rows
    ]


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
    rows = db.execute(
        select(
            User.id,
            User.full_name,
            User.email,
            Follow.created_at.label("followed_at"),
        )
        .join(User, User.id == Follow.following_id)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    ).all()
    return [
        FollowerOut(
            user_id=row.id,
            full_name=row.full_name,
            email=row.email,
            followed_at=row.followed_at,
        )
        for row in rows
    ]


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
    current_user: User = Depends(require_terms_accepted),
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