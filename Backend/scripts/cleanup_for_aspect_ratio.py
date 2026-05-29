"""Script de limpieza one-time para la migración de aspect_ratio.

Ejecuta una sola vez (manualmente) para dejar la base en un estado limpio:
  1. Garantiza que exista la columna posts.aspect_ratio (idempotente).
  2. Borra TODAS las publicaciones (cascade a post_images / post_links).
  3. Borra los usuarios de prueba (email ILIKE '%test%') y sus publicaciones.

Uso (desde la carpeta Backend/):
    python -m scripts.cleanup_for_aspect_ratio
    python -m scripts.cleanup_for_aspect_ratio --yes   # sin confirmación interactiva

ADVERTENCIA: es destructivo. No forma parte del arranque normal de la app.
"""

import argparse
import sys
from pathlib import Path

# Permite ejecutar el script directamente (python scripts/cleanup_for_aspect_ratio.py)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.database.session import engine


def _count(conn, sql: str) -> int:
    return conn.execute(text(sql)).scalar() or 0


def run(auto_confirm: bool = False) -> None:
    with engine.connect() as conn:
        total_posts = _count(conn, "SELECT COUNT(*) FROM posts")
        test_users = _count(conn, "SELECT COUNT(*) FROM users WHERE email ILIKE '%test%'")

        print(f"Publicaciones a borrar: {total_posts}")
        print(f"Usuarios de prueba (email ILIKE '%test%') a borrar: {test_users}")

        if not auto_confirm:
            answer = input("Esta operación es destructiva. ¿Continuar? (escribe 'si'): ").strip().lower()
            if answer not in ("si", "sí", "yes", "y"):
                print("Cancelado.")
                return

        # 1. Columna aspect_ratio (idempotente)
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'posts' AND column_name = 'aspect_ratio'
                ) THEN
                    ALTER TABLE posts
                    ADD COLUMN aspect_ratio VARCHAR(8) NOT NULL DEFAULT '4:5';
                END IF;
            END$$;
        """))
        conn.commit()

        # 2. Borrar todas las publicaciones (cascade a imágenes/links por FK ON DELETE CASCADE)
        conn.execute(text("DELETE FROM posts"))
        conn.commit()

        # 3. Borrar usuarios de prueba (cascade a sus posts/relaciones)
        deleted_users = conn.execute(
            text("DELETE FROM users WHERE email ILIKE '%test%' RETURNING id")
        ).fetchall()
        conn.commit()

        print(f"Listo. Publicaciones borradas: {total_posts}. Usuarios de prueba borrados: {len(deleted_users)}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Limpieza one-time para migración de aspect_ratio.")
    parser.add_argument("--yes", action="store_true", help="No pedir confirmación interactiva.")
    args = parser.parse_args()
    run(auto_confirm=args.yes)
