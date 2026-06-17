"""Helpers para tests de integración (JWT vía seed directo en BD)."""

from __future__ import annotations

import sys
import uuid
from pathlib import Path

import httpx

BACKEND_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from app.core.security import create_access_token  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.services import legal_service  # noqa: E402
from app.services.users_service import create_user, get_user_by_email  # noqa: E402


def active_legal_document_ids(client: httpx.Client) -> tuple[int, int]:
    """Ids de los documentos legales activos (términos y privacidad)."""
    tr = client.get("/legal/terms/current")
    pr = client.get("/legal/privacy/current")
    assert tr.status_code == 200, tr.text
    assert pr.status_code == 200, pr.text
    return int(tr.json()["id"]), int(pr.json()["id"])


def with_legal_ids(client: httpx.Client, payload: dict) -> dict:
    """Añade ``terms_document_id`` y ``privacy_document_id`` vigentes al payload."""
    tid, pid = active_legal_document_ids(client)
    return {**payload, "terms_document_id": tid, "privacy_document_id": pid}


def google_register_json(client: httpx.Client, payload: dict) -> dict:
    """Legacy helper kept for skipped google POST tests."""
    return with_legal_ids(client, payload)


def _ensure_test_user(
    *,
    email: str,
    password: str,
    full_name: str,
    client: httpx.Client,
):
    db = SessionLocal()
    try:
        user = get_user_by_email(db, email)
        if user is None:
            user = create_user(db, email=email, password=password, full_name=full_name)

        terms_id, privacy_id = active_legal_document_ids(client)
        legal_service.record_acceptances_for_documents(
            db,
            user_id=user.id,
            document_ids=[terms_id, privacy_id],
            ip_address="127.0.0.1",
            user_agent="utopp-testing",
            auth_method="testing",
        )
        db.refresh(user)
        return user
    finally:
        db.close()


def register_then_login_access_token(
    client: httpx.Client,
    *,
    email: str | None = None,
    password: str = "TestPassword123!",
    full_name: str = "Integration Test User",
) -> str:
    """Crea usuario de prueba en BD y devuelve JWT Bearer para tests."""
    resolved_email = email or f"test.{uuid.uuid4().hex[:10]}@utec.edu.pe"
    user = _ensure_test_user(
        email=resolved_email,
        password=password,
        full_name=full_name,
        client=client,
    )
    return create_access_token(str(user.id))
