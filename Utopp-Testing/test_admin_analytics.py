import uuid

import httpx
import pytest

from auth_helpers import with_legal_ids
from config import API_BASE_URL


def _register_and_login(client: httpx.Client, *, full_name: str) -> tuple[dict[str, str], int, str]:
    email = f"test.{uuid.uuid4().hex[:8]}@utec.edu.pe"
    password = "TestPassword123!"
    register = client.post(
        "/auth/register",
        json=with_legal_ids(
            client,
            {"email": email, "password": password, "full_name": full_name},
        ),
    )
    assert register.status_code == 201, register.text
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    me = client.get("/users/me", headers=headers)
    assert me.status_code == 200, me.text
    return headers, me.json()["id"], email


def _ensure_admin(client: httpx.Client) -> dict[str, str]:
    headers, user_id, email = _register_and_login(client, full_name="Admin Analytics")
    bootstrap = client.post("/setup/bootstrap-admin", json={"email": email})
    if bootstrap.status_code == 201:
        return headers
    assign = client.post(f"/roles/users/{user_id}/roles/4", headers=headers)
    if assign.status_code == 201:
        return headers
    pytest.skip("No se pudo obtener permisos de administrador")


class TestAdminAnalyticsAPI:
    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture(scope="module")
    def admin_headers(self, client):
        return _ensure_admin(client)

    def test_summary_requires_admin(self, client):
        headers, _, _ = _register_and_login(client, full_name="Non Admin Student")
        response = client.get("/admin/analytics/summary", headers=headers)
        assert response.status_code == 403

    def test_summary_empty_ok(self, client, admin_headers):
        response = client.get("/admin/analytics/summary", headers=admin_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert "activeToday" in data
        assert "totalSessions" in data
        assert "trends" in data

    def test_activity_timeseries(self, client, admin_headers):
        response = client.get(
            "/admin/analytics/activity-timeseries",
            headers=admin_headers,
            params={"groupBy": "day"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_students_metrics_paginated(self, client, admin_headers):
        response = client.get(
            "/admin/analytics/students",
            headers=admin_headers,
            params={"page": 1, "limit": 10, "sort": "activityScore"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert "data" in body
        assert "pagination" in body

    def test_at_risk_students(self, client, admin_headers):
        response = client.get(
            "/admin/analytics/at-risk-students",
            headers=admin_headers,
            params={"inactiveDays": 7},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)
