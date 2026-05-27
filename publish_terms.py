"""
Ejecuta la sincronización de textos legales con PYTHONPATH apuntando a Backend.

Uso desde la raíz del repositorio:

  python publish_terms.py --host 127.0.0.1

Con Docker Compose, si DATABASE_URL usa el host ``db``, pasa ``--host 127.0.0.1``.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "Backend"


def main() -> int:
    if not (BACKEND / "app" / "scripts" / "publish_terms.py").is_file():
        print("No se encuentra Backend/app/scripts/publish_terms.py", file=sys.stderr)
        return 1
    env = os.environ.copy()
    sep = os.pathsep
    backend_str = str(BACKEND)
    prev = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = backend_str if not prev else f"{backend_str}{sep}{prev}"
    cmd = [sys.executable, "-m", "app.scripts.publish_terms", *sys.argv[1:]]
    completed = subprocess.run(cmd, cwd=str(BACKEND), env=env)
    return int(completed.returncode)


if __name__ == "__main__":
    raise SystemExit(main())
