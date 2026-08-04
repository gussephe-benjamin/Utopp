"""Guard compartido para scripts de datos de prueba (Parte B/C/limpieza).

Estos scripts insertan/borran posts marcados con el prefijo "[TEST] " y solo
deben poder ejecutarse contra una base de datos local de desarrollo. Se niegan
a correr si:
  - Hay señales de estar en Render (RENDER o RENDER_EXTERNAL_URL definidos), o
  - El host resuelto de DATABASE_URL no es uno de los hosts locales conocidos.

Uso: llamar a `ensure_local_dev_environment()` como primera línea de `main()`,
después de aplicar overrides de --host/--database-url.
"""

from __future__ import annotations

import os
import sys

_ALLOWED_LOCAL_HOSTS = {"db", "localhost", "127.0.0.1"}


def ensure_local_dev_environment() -> None:
    """Aborta el proceso (SystemExit) si el entorno no parece ser un dev local."""
    if os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL"):
        print(
            "Error: este script solo puede ejecutarse en un entorno local de desarrollo "
            "(se detectaron variables de Render: RENDER / RENDER_EXTERNAL_URL).",
            file=sys.stderr,
        )
        raise SystemExit(1)

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL no está definida.", file=sys.stderr)
        raise SystemExit(1)

    try:
        from sqlalchemy.engine.url import make_url

        host = (make_url(database_url).host or "").strip().lower()
    except Exception as e:
        print(f"Error al parsear DATABASE_URL: {e}", file=sys.stderr)
        raise SystemExit(1) from e

    if host not in _ALLOWED_LOCAL_HOSTS:
        print(
            f"Error: host de DATABASE_URL ('{host}') no es un host local conocido "
            f"({sorted(_ALLOWED_LOCAL_HOSTS)}). Este script no corre contra bases de datos remotas.",
            file=sys.stderr,
        )
        raise SystemExit(1)
