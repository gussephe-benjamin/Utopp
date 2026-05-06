"""Helpers para tests de integración (token JWT)."""

from __future__ import annotations

import httpx


def register_then_login_access_token(
    client: httpx.Client,
    *,
    email: str,
    password: str,
    full_name: str = "Integration Test User",
) -> str:
    """POST /auth/register no devuelve JWT; siempre se obtiene el token con login."""
    client.post(
        "/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    token = login.json().get("access_token")
    assert token, f"Sin access_token: {login.text}"
    return token
