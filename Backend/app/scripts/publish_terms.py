"""Sincroniza términos y privacidad desde Markdown hacia ``legal_documents`` (mismo id por slug).

Desde la carpeta Backend:

  python -m app.scripts.publish_terms

Desde la raíz del repositorio Utopp:

  python Backend/app/scripts/publish_terms.py

Si ``DATABASE_URL`` usa el host Docker ``db`` y ejecutas el CLI en tu máquina, usa ``--host 127.0.0.1``.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))


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
    from app.services import legal_service

    parser = argparse.ArgumentParser(
        description="Sincroniza terms.md y privacy.md con la base (actualiza contenido sin rotar ids)."
    )
    parser.add_argument(
        "--database-url",
        metavar="URL",
        help="Sobrescribe DATABASE_URL solo para este proceso.",
    )
    parser.add_argument(
        "--host",
        metavar="HOST",
        help='Reemplaza el host de DATABASE_URL (ej. "127.0.0.1" cuando en .env figura "db").',
    )
    args = parser.parse_args()

    if args.database_url and args.host:
        print("Error: usa solo uno de --database-url o --host.", file=sys.stderr)
        return 1

    _apply_database_cli_overrides(args.database_url, args.host)

    from app.database.session import SessionLocal

    db = SessionLocal()
    try:
        legal_service.sync_legal_documents_from_repo(db)
        print("Sincronizado: terms + privacy desde el repositorio.")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
