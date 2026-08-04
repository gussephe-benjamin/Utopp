"""Mueve los eventos históricos de `public.posts` a la tabla compartida.

Antes de unificar, un evento en Plataforma era un post con
`post_type = 'event'`. Ahora los eventos viven en `formulario.events`, que es
la tabla que comparten los dos productos.

El script es idempotente: `formulario.events.utopp_post_id` tiene índice único,
así que un post ya migrado se detecta y se omite. Los posts no se borran ni se
modifican: quedan como historial y el feed de publicaciones ya los excluye.

Solo migra eventos publicados y con fecha, porque `formulario.events.date_time`
es NOT NULL: los borradores sin fecha no representan un evento real.

Uso:
    docker compose exec backend python -m app.scripts.migrate_event_posts_to_shared_events --dry-run
    docker compose exec backend python -m app.scripts.migrate_event_posts_to_shared_events
"""
import argparse
import sys
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models import legal as _legal  # noqa: F401 — relaciones de User
from app.models import post_link as _post_link  # noqa: F401 — relaciones de Post
from app.models import user_profile_image as _profile_image  # noqa: F401
from app.models.post import Post, PostStatus, PostType
from app.models.post_image import PostImage
from app.models.shared_event import SharedEvent, SharedFormularioUser
from app.models.user import User

LOCATION_FALLBACK = "Por confirmar"


def _location(post: Post) -> str:
    fields = post.specific_fields or {}
    for key in ("location", "lugar", "place", "venue"):
        value = fields.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()[:255]
    return LOCATION_FALLBACK


def _capacity(post: Post) -> int | None:
    fields = post.specific_fields or {}
    for key in ("capacity", "capacidad", "participants_needed"):
        value = fields.get(key)
        if isinstance(value, int) and value > 0:
            return value
        if isinstance(value, str) and value.strip().isdigit():
            parsed = int(value.strip())
            if parsed > 0:
                return parsed
    return None


def _banner_url(db: Session, post: Post) -> str | None:
    return db.execute(
        select(PostImage.url)
        .where(PostImage.post_id == post.id)
        .order_by(PostImage.position)
        .limit(1)
    ).scalar_one_or_none()


def _mirror_user(db: Session, cache: dict, user: User) -> SharedFormularioUser | None:
    """Fila del organizador en formulario.users, reutilizada o creada."""
    if not user or not user.email:
        return None

    email_key = user.email.lower()
    if email_key in cache:
        return cache[email_key]

    mirror = db.execute(
        select(SharedFormularioUser).where(
            func.lower(SharedFormularioUser.email) == email_key
        )
    ).scalar_one_or_none()

    if mirror is None:
        mirror = SharedFormularioUser(
            id=uuid.uuid4(),
            email=user.email,
            password_hash=None,
            full_name=user.full_name,
        )
        db.add(mirror)
        db.flush()

    cache[email_key] = mirror
    return mirror


def migrate(dry_run: bool = False) -> int:
    db = SessionLocal()
    created = 0
    skipped_existing = 0
    skipped_invalid = 0

    try:
        already_linked = set(
            db.execute(
                select(SharedEvent.utopp_post_id).where(
                    SharedEvent.utopp_post_id.is_not(None)
                )
            ).scalars()
        )

        posts = (
            db.execute(
                select(Post)
                .where(Post.post_type == PostType.event)
                .where(Post.status == PostStatus.published)
                .where(Post.deadline_at.is_not(None))
                .order_by(Post.id)
            )
            .scalars()
            .all()
        )

        print(f"Candidatos (eventos publicados con fecha): {len(posts)}")
        mirror_cache: dict = {}

        for post in posts:
            if post.id in already_linked:
                skipped_existing += 1
                continue

            author = db.get(User, post.user_id)
            mirror = _mirror_user(db, mirror_cache, author)
            if mirror is None:
                print(f"  omitido post {post.id}: autor sin email")
                skipped_invalid += 1
                continue

            event = SharedEvent(
                id=uuid.uuid4(),
                creator_id=mirror.id,
                creator_utopp_user_id=post.user_id,
                title=(post.title or "Evento sin título")[:255],
                description=post.description,
                short_description=None,
                category=post.subtype.value if post.subtype else None,
                theme=None,
                highlights=None,
                date_time=post.deadline_at,
                location=_location(post),
                capacity=_capacity(post),
                banner_url=_banner_url(db, post),
                allow_only_utec_emails=False,
                utopp_post_id=post.id,
            )
            db.add(event)
            created += 1
            print(f"  post {post.id} -> evento '{event.title}' ({event.date_time:%Y-%m-%d})")

        if dry_run:
            db.rollback()
            print("\n[dry-run] nada se guardó.")
        else:
            db.commit()

        print(
            f"\nCreados: {created} | ya migrados: {skipped_existing} | "
            f"omitidos: {skipped_invalid}"
        )
        return created
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra lo que haría sin escribir en la base",
    )
    args = parser.parse_args()
    sys.exit(0 if migrate(dry_run=args.dry_run) >= 0 else 1)
