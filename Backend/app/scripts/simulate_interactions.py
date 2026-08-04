"""Simula interacciones de un usuario de prueba y compara el feed recomendado
antes/después, para validar en vivo el algoritmo de recomendación (Nivel 1 + 2).

Autentica como un usuario ya existente (por default `esteban@utec.edu.pe`, id 4 —
decisión confirmada en el Paso 0 del plan) generando un JWT directamente con
`create_access_token` (sin password ni Google OAuth) y hablando por HTTP contra
el backend real (`--base-url`, default http://localhost:8000).

No hay ningún job asíncrono que esperar: Nivel 2 (`weight_adjustment_service`)
escribe en `user_weight_adjustments` de forma síncrona en el mismo request de
cada interacción (ver Paso 0.5 del plan), así que el GET /feed inmediatamente
después ya refleja el estado actualizado.

Nota importante sobre el mecanismo real (léase antes de interpretar el output):
Nivel 2 aprende por (post_type, factor) a partir del *feature value* observado
en el momento de la interacción (overlap con `user.interests`, si el usuario
sigue al autor, engagement del post) — no aprende directamente "me gustan los
posts con tag X". Elegir posts por tag (como pide el plan) es una forma
conveniente de armar un conjunto de posts para interactuar; el efecto medible
ocurre a nivel de `post_type`, y por eso el reporte también imprime la tabla
cruda de `user_weight_adjustments` como evidencia de qué aprendió realmente el
algoritmo, además de la comparación de posiciones en el feed.

Ejecución (backend corriendo en local, ej. `docker compose up`):
  python Backend/app/scripts/simulate_interactions.py --host 127.0.0.1
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
COMMENT_TEXT = "Comentario de prueba (simulate_interactions.py) para validar el algoritmo de recomendación."


def _load_dotenv_if_missing(path: Path) -> None:
    """Carga variables KEY=VALUE de `path` sin pisar las ya presentes en el entorno."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if key and key not in os.environ:
            os.environ[key] = value.strip()


def _load_project_dotenvs() -> None:
    """Carga el `.env` de la raíz (DATABASE_URL, etc.) y `Backend/.env` (JWT_SECRET_KEY),
    en ese orden, sin pisar variables ya presentes en el entorno.

    El backend real corre en Docker con `env_file: .env` (raíz) más `./Backend:/app`
    montado, por lo que su `JWT_SECRET_KEY` efectivo viene de `Backend/.env` (cwd=/app
    dentro del contenedor). Sin cargar exactamente ese archivo aquí, un JWT minteado por
    `create_access_token` en este proceso usaría el secreto default y el backend real
    lo rechazaría con 401 al no coincidir la firma.
    """
    _load_dotenv_if_missing(_BACKEND_ROOT.parent / ".env")
    _load_dotenv_if_missing(_BACKEND_ROOT / ".env")


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


def _is_test_post(item: dict) -> bool:
    title = item.get("title") or ""
    description = item.get("description") or ""
    return title.startswith(TEST_MARKER) or description.startswith(TEST_MARKER)


def _label(item: dict) -> str:
    title = item.get("title")
    if title:
        return title
    return (item.get("description") or "")[:60]


def _fmt(value: float | None) -> str:
    return f"{value:.4f}" if isinstance(value, (int, float)) else "—"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Simula interacciones fuertes en posts [TEST] y compara el feed recomendado antes/después."
    )
    parser.add_argument("--database-url", metavar="URL", help="Sobrescribe DATABASE_URL solo para este proceso.")
    parser.add_argument("--host", metavar="HOST", help='Reemplaza el host de DATABASE_URL (ej. "127.0.0.1").')
    parser.add_argument("--base-url", default="http://localhost:8000", help="URL del backend (default http://localhost:8000).")
    parser.add_argument("--email", default="esteban@utec.edu.pe", help="Usuario de prueba a simular (default esteban@utec.edu.pe).")
    parser.add_argument("--reinforce-tags", default="tech,academic", help="Tags a reforzar con interacciones fuertes (CSV).")
    parser.add_argument("--ignore-tags", default="sports,gaming", help="Tags de control, sin interacción (CSV).")
    parser.add_argument("--limit", type=int, default=12, help="Máximo de posts [TEST] a reforzar (default 12).")
    args = parser.parse_args()

    if args.database_url and args.host:
        print("Error: usa solo uno de --database-url o --host.", file=sys.stderr)
        return 1

    _load_project_dotenvs()
    _apply_database_cli_overrides(args.database_url, args.host)
    ensure_local_dev_environment()

    import httpx
    from app.core.security import create_access_token
    from app.database.session import SessionLocal
    from app.models.user import User
    from app.models.post import Post  # noqa: F401 - completa el registro de mappers
    from app.models.post_image import PostImage  # noqa: F401
    from app.models.post_link import PostLink  # noqa: F401
    from app.models.user_weight_adjustment import UserWeightAdjustment

    reinforce_tags = {t.strip() for t in args.reinforce_tags.split(",") if t.strip()}
    ignore_tags = {t.strip() for t in args.ignore_tags.split(",") if t.strip()}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == args.email).first()
        if not user:
            print(f"Error: no existe ningún usuario con email '{args.email}'.", file=sys.stderr)
            return 1
        user_id = user.id
        token = create_access_token(str(user_id))
    finally:
        db.close()

    client = httpx.Client(base_url=args.base_url, timeout=30.0, headers={"Authorization": f"Bearer {token}"})

    def fetch_feed() -> list[dict]:
        resp = client.get("/feed", params={"sort": "recommended", "page": 1, "size": 100})
        resp.raise_for_status()
        return resp.json()["items"]

    print(f"Autenticado como {args.email} (user_id={user_id}). Capturando feed ANTES de interactuar...")
    before_items = fetch_feed()
    before_pos = {it["id"]: idx for idx, it in enumerate(before_items)}
    before_by_id = {it["id"]: it for it in before_items}
    before_test = [it for it in before_items if _is_test_post(it)]

    if not before_test:
        print(
            "Error: no se encontró ningún post [TEST] en el feed. "
            "Corre primero Backend/app/scripts/seed_test_posts.py.",
            file=sys.stderr,
        )
        return 1

    reinforce_candidates = [
        it for it in before_test if set(it.get("tags") or []) & reinforce_tags
    ][: args.limit]
    reinforced_post_types = {it["post_type"] for it in reinforce_candidates}

    # Grupo de control: posts [TEST] con tags "ignoradas" y de un post_type que NO
    # se tocó — así su score no puede moverse por Nivel 2 (que ajusta por post_type),
    # dando una comparación limpia.
    control_candidates = [
        it for it in before_test
        if (set(it.get("tags") or []) & ignore_tags) and it["post_type"] not in reinforced_post_types
    ]

    if not reinforce_candidates:
        print(
            f"Error: no hay posts [TEST] con tags {sorted(reinforce_tags)} en el feed actual.",
            file=sys.stderr,
        )
        return 1

    print(f"\nPosts [TEST] a reforzar (tags {sorted(reinforce_tags)}): {len(reinforce_candidates)}")
    for it in reinforce_candidates:
        print(f"  - id={it['id']:>4}  [{it['post_type']:26s}]  tags={it.get('tags')}  {_label(it)!r}")

    print(f"\nPosts [TEST] de control, sin interacción (tags {sorted(ignore_tags)}, post_type distinto al reforzado): {len(control_candidates)}")
    for it in control_candidates:
        print(f"  - id={it['id']:>4}  [{it['post_type']:26s}]  tags={it.get('tags')}  {_label(it)!r}")

    print("\nAplicando interacciones fuertes (like + save + comment [+ participate si es 'event'])...")
    for it in reinforce_candidates:
        post_id = it["id"]
        results = []

        r = client.post(f"/posts/{post_id}/reactions")
        results.append(("like", r.status_code))

        r = client.post(f"/posts/{post_id}/save")
        results.append(("save", r.status_code if r.status_code != 409 else "409(ya guardado)"))

        r = client.post(f"/posts/{post_id}/comments", json={"content": COMMENT_TEXT})
        results.append(("comment", r.status_code))

        if it["post_type"] == "event":
            r = client.post(f"/posts/{post_id}/participate", json={"status": "going"})
            results.append(("participate", r.status_code if r.status_code != 409 else "409(ya participa)"))

        print(f"  id={post_id}: {results}")

    print("\nCapturando feed DESPUÉS de interactuar...")
    after_items = fetch_feed()
    after_pos = {it["id"]: idx for idx, it in enumerate(after_items)}
    after_by_id = {it["id"]: it for it in after_items}

    # Evidencia cruda: lo que Nivel 2 realmente aprendió y persistió para este usuario.
    db = SessionLocal()
    try:
        rows = (
            db.query(UserWeightAdjustment)
            .filter(UserWeightAdjustment.user_id == user_id)
            .order_by(UserWeightAdjustment.post_type, UserWeightAdjustment.factor)
            .all()
        )
        print(f"\n{'='*100}\nEvidencia real: user_weight_adjustments para user_id={user_id}\n{'='*100}")
        if not rows:
            print("  (vacío — ningún factor alcanzó el umbral mínimo de evidencia (MIN_EVIDENCE=5) todavía)")
        else:
            print(f"  {'post_type':<26} {'factor':<18} {'delta_ema':>10} {'evidence':>9}  last_event_at")
            for row in rows:
                print(
                    f"  {row.post_type.value:<26} {row.factor:<18} {row.delta_ema:>10.4f} "
                    f"{row.evidence_count:>9}  {row.last_event_at}"
                )
    finally:
        db.close()

    def _print_comparison(title: str, items: list[dict]) -> None:
        print(f"\n{'='*100}\n{title}\n{'='*100}")
        print(f"  {'id':>5}  {'pos.antes':>9}  {'pos.despues':>11}  {'Δpos':>6}  {'score.antes':>11}  {'score.despues':>13}  post_type / tags")
        for it in items:
            pid = it["id"]
            pb = before_pos.get(pid)
            pa = after_pos.get(pid)
            delta = (pa - pb) if (pb is not None and pa is not None) else None
            sb = before_by_id.get(pid, {}).get("relevance_score")
            sa = after_by_id.get(pid, {}).get("relevance_score")
            delta_str = f"{delta:+d}" if delta is not None else "—"
            print(
                f"  {pid:>5}  {pb if pb is not None else '—':>9}  {pa if pa is not None else '—':>11}  "
                f"{delta_str:>6}  {_fmt(sb):>11}  {_fmt(sa):>13}  {it['post_type']} / {it.get('tags')}"
            )
            breakdown_after = after_by_id.get(pid, {}).get("score_breakdown") or {}
            breakdown_before = before_by_id.get(pid, {}).get("score_breakdown") or {}
            if breakdown_after or breakdown_before:
                factors = sorted(set(breakdown_before) | set(breakdown_after))
                parts = [
                    f"{f}: {_fmt(breakdown_before.get(f))}→{_fmt(breakdown_after.get(f))}"
                    for f in factors
                ]
                print(f"         breakdown: {', '.join(parts)}")

    _print_comparison("Posts REFORZADOS (like+save+comment[+participate])", reinforce_candidates)
    _print_comparison("Posts de CONTROL (sin interacción, tag ignorado, post_type no tocado)", control_candidates)

    print(
        f"\n{'='*100}\n"
        "Nota de lectura: el score/posición de un post de control puede seguir moviéndose "
        "levemente por 'recency' (pasa el tiempo entre ambas capturas) o porque otros posts "
        "reforzados subieron/bajaron alrededor suyo en el orden relativo — pero su propio "
        "score_breakdown por (interest_overlap/social_proximity/engagement) NO debería cambiar, "
        "porque esos posts son de un post_type distinto al de los posts reforzados.\n"
        f"{'='*100}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
