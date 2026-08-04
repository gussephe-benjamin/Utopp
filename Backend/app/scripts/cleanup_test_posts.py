"""Elimina los posts de prueba generados por `seed_test_posts.py` (y cualquier
interacción de `simulate_interactions.py` sobre ellos).

Encuentra los posts a borrar por DOS criterios (unión, no intersección):
  1. `legacy_source = 'seed_test_posts'` (marcador robusto que pone el propio
     script de siembra).
  2. `title`/`description` empieza con el prefijo humano "[TEST] " (por si se
     crearon posts de prueba a mano, fuera del script, con la misma convención).

Al borrar un post, sus imágenes/links se eliminan por `cascade="all, delete-orphan"`
en el ORM ([Backend/app/models/post.py](Backend/app/models/post.py)), y sus
reacciones/comentarios/guardados/participaciones por `ON DELETE CASCADE` a nivel
de base de datos (verificado contra el esquema real). `user_weight_adjustments`
NO se borra: es un agregado por (usuario, post_type, factor), no está ligado a
posts específicos, y decae solo con el tiempo si no hay más actividad (ver
`recommendation_service.effective_delta`).

Ejecución desde el contenedor Docker:
  docker compose exec backend python -m app.scripts.cleanup_test_posts --yes

Ejecución local (solo previsualizar, no borra nada):
  python Backend/app/scripts/cleanup_test_posts.py --host 127.0.0.1
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.scripts._test_data_env_guard import ensure_local_dev_environment  # noqa: E402

TEST_MARKER = "[TEST] "
LEGACY_SOURCE = "seed_test_posts"


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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Borra los posts [TEST] generados por seed_test_posts.py y sus datos asociados."
    )
    parser.add_argument("--database-url", metavar="URL", help="Sobrescribe DATABASE_URL solo para este proceso.")
    parser.add_argument("--host", metavar="HOST", help='Reemplaza el host de DATABASE_URL (ej. "127.0.0.1").')
    parser.add_argument(
        "--yes", action="store_true",
        help="Confirma el borrado real. Sin esta bandera, solo se muestra qué se borraría (dry-run).",
    )
    args = parser.parse_args()

    if args.database_url and args.host:
        print("Error: usa solo uno de --database-url o --host.", file=sys.stderr)
        return 1

    _apply_database_cli_overrides(args.database_url, args.host)
    ensure_local_dev_environment()

    from sqlalchemy import or_
    from app.database.session import SessionLocal
    from app.models.user import User  # noqa: F401 - completa el registro de mappers
    from app.models.post import Post
    from app.models.post_image import PostImage
    from app.models.post_link import PostLink
    from app.models.post_reaction import PostReaction
    from app.models.post_comment import PostComment
    from app.models.saved_post import SavedPost
    from app.models.event_participant import PostParticipant

    db = SessionLocal()
    try:
        targets = (
            db.query(Post)
            .filter(
                or_(
                    Post.legacy_source == LEGACY_SOURCE,
                    Post.title.like(f"{TEST_MARKER}%"),
                    Post.description.like(f"{TEST_MARKER}%"),
                )
            )
            .all()
        )

        if not targets:
            print("No se encontró ningún post [TEST] para borrar. Nada que hacer.")
            return 0

        target_ids = [p.id for p in targets]

        counts = {
            "posts": len(target_ids),
            "images": db.query(PostImage).filter(PostImage.post_id.in_(target_ids)).count(),
            "links": db.query(PostLink).filter(PostLink.post_id.in_(target_ids)).count(),
            "reactions": db.query(PostReaction).filter(PostReaction.post_id.in_(target_ids)).count(),
            "comments": db.query(PostComment).filter(PostComment.post_id.in_(target_ids)).count(),
            "saved": db.query(SavedPost).filter(SavedPost.post_id.in_(target_ids)).count(),
            "participations": db.query(PostParticipant).filter(PostParticipant.post_id.in_(target_ids)).count(),
        }

        print(f"Posts [TEST] encontrados: {counts['posts']}")
        for p in targets:
            label = p.title or (p.description or "")[:60]
            print(f"  - id={p.id:>4}  [{p.post_type.value:26s}]  legacy_source={p.legacy_source!r}  {label!r}")

        print("\nSe eliminarán en cascada:")
        for key in ("images", "links", "reactions", "comments", "saved", "participations"):
            print(f"  {key:16s} {counts[key]}")
        print(
            "\nNota: no se toca 'user_weight_adjustments' (agregado por usuario/post_type/factor, "
            "no ligado a posts puntuales; decae solo con el tiempo si no hay más actividad)."
        )

        if not args.yes:
            print("\n--dry-run (default): no se borró nada. Vuelve a correr con --yes para confirmar el borrado real.")
            return 0

        for post in targets:
            db.delete(post)
        db.commit()

        print(f"\nListo: {counts['posts']} posts [TEST] eliminados (y sus datos asociados en cascada).")
        return 0
    except Exception as e:
        db.rollback()
        print(f"\nError durante la limpieza de posts de prueba: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
