"""Helpers para tests de integración (token JWT)."""

from __future__ import annotations

import httpx


def active_legal_document_ids(client: httpx.Client) -> tuple[int, int]:
    """Ids de los documentos legales activos (términos y privacidad)."""
    tr = client.get("/legal/terms/current")
    pr = client.get("/legal/privacy/current")
    assert tr.status_code == 200, tr.text
    assert pr.status_code == 200, pr.text
    return int(tr.json()["id"]), int(pr.json()["id"])


def google_register_json(client: httpx.Client, payload: dict) -> dict:
    """Incluye ``terms_document_id`` y ``privacy_document_id`` en el cuerpo de ``POST /google/register``."""
    tid, pid = active_legal_document_ids(client)
    return {**payload, "terms_document_id": tid, "privacy_document_id": pid}


def with_legal_ids(client: httpx.Client, payload: dict) -> dict:
    """Añade ``terms_document_id`` y ``privacy_document_id`` vigentes al payload de registro."""
    tid, pid = active_legal_document_ids(client)
    return {**payload, "terms_document_id": tid, "privacy_document_id": pid}


def register_then_login_access_token(
    client: httpx.Client,
    *,
    email: str,
    password: str,
    full_name: str = "Integration Test User",
) -> str:
    """POST /auth/register no devuelve JWT; siempre se obtiene el token con login."""
    body = with_legal_ids(
        client,
        {"email": email, "password": password, "full_name": full_name},
    )
    client.post("/auth/register", json=body)
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    token = login.json().get("access_token")
    assert token, f"Sin access_token: {login.text}"
    return token
