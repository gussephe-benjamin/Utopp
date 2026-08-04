"""Genera posts de prueba multi-categoría para validar el algoritmo de recomendación.

No crea usuarios: reutiliza los ya existentes en la BD (ver Paso 0.4 del plan),
respetando qué `post_type` puede publicar cada rol (mismo mapeo que
`Frontend/mi-app/src/hooks/useRole.ts::ALLOWED_TYPES_BY_ROLE`).

Todos los posts creados:
  - Quedan marcados con `legacy_source="seed_test_posts"` y `legacy_source_id=<índice>`
    para que el propio script sea idempotente (reutiliza/actualiza en vez de duplicar).
  - Llevan el prefijo humano "[TEST] " en el título (o al inicio de la descripción
    para `simple_post`, que no tiene título) para que `cleanup_test_posts.py` los
    pueda encontrar y borrar sin tocar contenido real.
  - Incluyen una imagen por URL externa determinística (picsum.photos), usando el
    soporte agregado en la Parte A — sin necesidad de subir nada a Cloudinary.

Ejecución desde el contenedor Docker:
  docker compose exec backend python -m app.scripts.seed_test_posts

Ejecución local:
  python Backend/app/scripts/seed_test_posts.py --host 127.0.0.1

Ver la distribución planeada sin escribir en la BD:
  python Backend/app/scripts/seed_test_posts.py --host 127.0.0.1 --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.scripts._test_data_env_guard import ensure_local_dev_environment  # noqa: E402

TEST_MARKER = "[TEST] "
LEGACY_SOURCE = "seed_test_posts"

# Vocabulario canónico de tags (Frontend/mi-app/src/constants/interests.ts)
TAGS = [
    "academic", "tech", "entrepreneurship", "exchanges", "competitions",
    "cultural", "music", "sports", "volunteering", "gaming",
]

# Universo de autores "conocidos" identificado en el Paso 0.4 del plan (mismos emails
# que siembra Backend/app/scripts/seed_data.py, más el administrador). Se usa una
# allowlist explícita — en vez de "todos los usuarios de la BD" — para no arrastrar
# cuentas descartables que van quedando de correr la suite de integración
# (test.*@utec.edu.pe, creadas por Utopp-Testing/*.py). Usar --include-all-users
# para volver al comportamiento de "cualquier usuario con password".
KNOWN_SEED_EMAILS = {
    "esteban@utec.edu.pe", "juan.perez@utec.edu.pe", "maria.gomez@utec.edu.pe",
    "sofia.rodriguez@utec.edu.pe",
    "ieee@utec.edu.pe", "ieee.aess@utec.edu.pe", "careercenter@utec.edu.pe",
    "emprende@utec.edu.pe", "techoperu@utec.edu.pe", "acm@utec.edu.pe", "biomakers@utec.edu.pe",
    "alum@utec.edu.pe",
}


def _apply_database_cli_overrides(database_url: str | None, host: str | None) -> None:
    if database_url:
        os.environ["DATABASE_URL"] = database_url
        return
    if not host:
        return
    base = os.getenv("DATABASE_URL")
    if not base:
        print("Error: DATABASE_URL no está definida; usa --database-url.", file=sys.stderr)
        raise SystemExit(1)
    try:
        from sqlalchemy.engine.url import make_url

        url = make_url(base).set(host=host)
        os.environ["DATABASE_URL"] = url.render_as_string(hide_password=False)
    except Exception as e:
        print(f"Error al aplicar --host: {e}", file=sys.stderr)
        raise SystemExit(1) from e


def _build_tag_sequence(count: int, distribution_json: str | None) -> list[str]:
    """Secuencia de `count` tags. Uniforme por default, o custom vía --tags-distribution."""
    if not distribution_json:
        return [TAGS[i % len(TAGS)] for i in range(count)]

    try:
        distribution: dict[str, int] = json.loads(distribution_json)
    except json.JSONDecodeError as e:
        print(f"Error: --tags-distribution no es JSON válido: {e}", file=sys.stderr)
        raise SystemExit(1) from e

    invalid_tags = set(distribution) - set(TAGS)
    if invalid_tags:
        print(f"Error: tags no reconocidos en --tags-distribution: {sorted(invalid_tags)}", file=sys.stderr)
        print(f"Tags válidos: {TAGS}", file=sys.stderr)
        raise SystemExit(1)

    sequence: list[str] = []
    for tag, n in distribution.items():
        sequence.extend([tag] * int(n))

    i = 0
    while len(sequence) < count:
        sequence.append(TAGS[i % len(TAGS)])
        i += 1

    return sequence[:count]


def _print_distribution_preview(plan: list[dict]) -> None:
    by_type = Counter(p["post_type"] for p in plan)
    by_tag = Counter(t for p in plan for t in p["tags"])
    by_author = Counter(p["author_email"] for p in plan)

    print(f"\nTotal de posts planeados: {len(plan)}")
    print("\nDistribución por post_type:")
    for k, v in sorted(by_type.items()):
        print(f"  {k:28s} {v}")
    print("\nDistribución por tag:")
    for k, v in sorted(by_tag.items()):
        print(f"  {k:16s} {v}")
    print("\nDistribución por autor:")
    for k, v in sorted(by_author.items()):
        print(f"  {k:32s} {v}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Genera posts [TEST] multi-categoría para validar el algoritmo de recomendación."
    )
    parser.add_argument("--database-url", metavar="URL", help="Sobrescribe DATABASE_URL solo para este proceso.")
    parser.add_argument(
        "--host", metavar="HOST",
        help='Reemplaza el host de DATABASE_URL (ej. "127.0.0.1" cuando en .env figura "db").',
    )
    parser.add_argument("--count", type=int, default=30, help="Cantidad total de posts de prueba a generar (default 30).")
    parser.add_argument(
        "--tags-distribution", metavar="JSON",
        help='Distribución custom de tags, ej. \'{"tech": 10, "academic": 5}\'. Por default: uniforme entre las 10 categorías.',
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Solo muestra la distribución planeada (conteo por tag/tipo/autor); no escribe en la BD.",
    )
    parser.add_argument(
        "--include-all-users", action="store_true",
        help="Usa cualquier usuario con password (no solo la allowlist de KNOWN_SEED_EMAILS).",
    )
    args = parser.parse_args()

    if args.count <= 0:
        print("Error: --count debe ser mayor a 0.", file=sys.stderr)
        return 1
    if args.database_url and args.host:
        print("Error: usa solo uno de --database-url o --host.", file=sys.stderr)
        return 1

    _apply_database_cli_overrides(args.database_url, args.host)
    ensure_local_dev_environment()

    from app.database.session import SessionLocal
    from app.models.user import User
    from app.models.role import Role
    from app.models.user_role import UserRole
    from app.models.post import Post, PostType, PostStatus, TimeStatus, VALID_SUBTYPES
    from app.models.post_image import PostImage
    from app.models.post_link import PostLink  # noqa: F401 - registra la relación Post.links
    from app.services import role_service
    from app.services.image_service import build_external_cloudinary_id
    from app.services.post_service import compute_time_status

    # Mismo mapeo que Frontend/mi-app/src/hooks/useRole.ts::ALLOWED_TYPES_BY_ROLE
    ALL_TYPES = [
        PostType.international_opportunity, PostType.event, PostType.academic_project,
        PostType.announcement, PostType.simple_post,
    ]
    ALLOWED_TYPES_BY_ROLE: dict[str, list[PostType]] = {
        role_service.STUDENT_ROLE_NAME: [PostType.simple_post],
        role_service.ORG_ROLE_NAME: [PostType.event, PostType.announcement],
        role_service.OFFICE_ROLE_NAME: [PostType.event, PostType.international_opportunity, PostType.announcement],
        role_service.ADMIN_ROLE_NAME: ALL_TYPES,
        role_service.ROOT_ROLE_NAME: ALL_TYPES,
    }
    POST_TYPES = ALL_TYPES  # orden usado para el round-robin de --count

    db = SessionLocal()
    try:
        print("Resolviendo autores válidos por post_type a partir de los roles existentes...")
        rows = (
            db.query(User, Role.name)
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .filter(User.hashed_password.isnot(None))  # excluye cuentas reales vía Google OAuth (sin password)
            .all()
        )
        if not args.include_all_users:
            rows = [(user, role_name) for user, role_name in rows if user.email in KNOWN_SEED_EMAILS]

        producers_by_type: dict[PostType, list[User]] = {t: [] for t in POST_TYPES}
        for user, role_name in rows:
            for allowed_type in ALLOWED_TYPES_BY_ROLE.get(role_name, []):
                producers_by_type[allowed_type].append(user)

        missing = [t.value for t, users in producers_by_type.items() if not users]
        if missing:
            print(
                f"Error: no hay ningún usuario existente (con password) cuyo rol permita crear "
                f"post_type en {missing}. Revisa Paso 0.4 del plan o crea/reasigna un usuario con "
                f"rol 'oficina'/'administrador' antes de continuar.",
                file=sys.stderr,
            )
            return 1

        for t, users in producers_by_type.items():
            emails = ", ".join(sorted(u.email for u in users))
            print(f"  {t.value:28s} <- {emails}")

        tag_sequence = _build_tag_sequence(args.count, args.tags_distribution)

        plan: list[dict] = []
        for i in range(args.count):
            post_type = POST_TYPES[i % len(POST_TYPES)]
            candidates = producers_by_type[post_type]
            author = candidates[i % len(candidates)]

            valid_subtypes = VALID_SUBTYPES.get(post_type) or []
            subtype = valid_subtypes[i % len(valid_subtypes)] if valid_subtypes else None

            primary_tag = tag_sequence[i]
            secondary_tag = TAGS[(i + 5) % len(TAGS)] if i % 2 == 0 and TAGS[(i + 5) % len(TAGS)] != primary_tag else None
            tags = [primary_tag] if secondary_tag is None else [primary_tag, secondary_tag]

            has_deadline = post_type in (PostType.event, PostType.international_opportunity, PostType.academic_project)
            deadline_at = (
                datetime.now(timezone.utc) + timedelta(days=3 + (i % 25))
                if has_deadline else None
            )

            label = post_type.value.replace("_", " ").title()
            title = None if post_type == PostType.simple_post else f"{TEST_MARKER}{label} #{i:03d} — {primary_tag}"
            description = (
                f"{TEST_MARKER}Publicación de prueba #{i:03d} para validar el algoritmo de "
                f"recomendación. Categoría principal: {primary_tag}. Tipo: {post_type.value}."
            )

            plan.append({
                "index": i,
                "post_type": post_type.value,
                "subtype": subtype,
                "tags": tags,
                "title": title,
                "description": description,
                "deadline_at": deadline_at,
                "author_email": author.email,
                "author_id": author.id,
            })

        _print_distribution_preview(plan)

        if args.dry_run:
            print("\n--dry-run: no se escribió nada en la base de datos.")
            return 0

        created, updated, images_added = 0, 0, 0
        for item in plan:
            existing = (
                db.query(Post)
                .filter(Post.legacy_source == LEGACY_SOURCE, Post.legacy_source_id == item["index"])
                .first()
            )

            if existing:
                existing.title = item["title"]
                existing.description = item["description"]
                existing.post_type = PostType(item["post_type"])
                existing.subtype = item["subtype"]
                existing.tags = item["tags"]
                existing.deadline_at = item["deadline_at"]
                existing.time_status = compute_time_status(item["deadline_at"])
                existing.status = PostStatus.published
                post = existing
                updated += 1
            else:
                post = Post(
                    user_id=item["author_id"],
                    title=item["title"],
                    description=item["description"],
                    status=PostStatus.published,
                    post_type=PostType(item["post_type"]),
                    subtype=item["subtype"],
                    deadline_at=item["deadline_at"],
                    time_status=compute_time_status(item["deadline_at"]),
                    tags=item["tags"],
                    specific_fields={},
                    legacy_source=LEGACY_SOURCE,
                    legacy_source_id=item["index"],
                )
                db.add(post)
                created += 1
            db.flush()

            has_image = db.query(PostImage).filter(PostImage.post_id == post.id).first()
            if not has_image:
                url = f"https://picsum.photos/seed/utopp-test-{item['index']:03d}/800/600"
                db.add(PostImage(
                    post_id=post.id,
                    cloudinary_id=build_external_cloudinary_id(url),
                    url=url,
                    position=0,
                    source_type="external_url",
                ))
                images_added += 1
            db.flush()

        db.commit()
        print(f"\nListo: {created} posts creados, {updated} actualizados, {images_added} imágenes agregadas.")
        return 0
    except Exception as e:
        db.rollback()
        print(f"\nError durante la generación de posts de prueba: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
