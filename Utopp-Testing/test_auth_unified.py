"""Integration tests for unified Google OAuth auth endpoints."""

import httpx
import pytest

from auth_helpers import register_then_login_access_token
from config import API_BASE_URL


class TestUnifiedAuthAPI:
    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture(scope="module")
    def auth_token(self, client):
        return register_then_login_access_token(client)

    @pytest.fixture(scope="module")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}

    def test_auth_me_unauthenticated(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 200
        assert response.json() == {"authenticated": False}

    def test_auth_me_authenticated(self, client, auth_headers):
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert "user" in data
        assert "email" in data["user"]
        assert "onboarding_completed" in data["user"]

    def test_google_login_redirects(self, client):
        response = client.get("/auth/google/login", follow_redirects=False)
        assert response.status_code == 302
        assert "accounts.google.com" in response.headers.get("location", "")
        assert "utopp_oauth_state" in response.cookies

    def test_logout(self, client, auth_headers):
        response = client.post("/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_refresh_token_success(self, client, auth_headers):
        response = client.post("/auth/refresh", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_refresh_without_auth(self, client):
        response = client.post("/auth/refresh")
        assert response.status_code == 401

    def test_legacy_register_removed(self, client):
        response = client.post("/auth/register", json={})
        assert response.status_code in (400, 422)

    def test_legacy_login_removed(self, client):
        response = client.post("/auth/login", json={})
        assert response.status_code in (400, 422)

    def test_legacy_google_register_removed(self, client):
        response = client.post("/google/register", json={})
        assert response.status_code == 404

    def test_legacy_google_login_removed(self, client):
        response = client.post("/google/login", json={})
        assert response.status_code == 404
