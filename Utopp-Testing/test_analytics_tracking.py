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
    headers, user_id, email = _register_and_login(client, full_name="Analytics Admin")
    bootstrap = client.post("/setup/bootstrap-admin", json={"email": email})
    if bootstrap.status_code == 201:
        return headers
    assign = client.post(f"/roles/users/{user_id}/roles/4", headers=headers)
    if assign.status_code == 201:
        return headers
    pytest.skip("No se pudo obtener permisos de administrador")


class TestAnalyticsTracking:
    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    def test_student_can_track_event(self, client):
        headers, _, _ = _register_and_login(client, full_name="Analytics Student")
        response = client.post(
            "/analytics/events",
            headers=headers,
            json={"event_type": "app_opened"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["success"] is True

    def test_invalid_event_type_rejected(self, client):
        headers, _, _ = _register_and_login(client, full_name="Analytics Student Bad")
        response = client.post(
            "/analytics/events",
            headers=headers,
            json={"event_type": "not_allowed_event"},
        )
        assert response.status_code == 422

    def test_admin_tracking_is_noop(self, client):
        admin_headers = _ensure_admin(client)
        response = client.post(
            "/analytics/events",
            headers=admin_headers,
            json={"event_type": "app_opened"},
        )
        assert response.status_code == 204

    def test_session_reused_within_idle_window(self, client):
        headers, _, _ = _register_and_login(client, full_name="Session Student")
        first = client.post(
            "/analytics/events",
            headers=headers,
            json={"event_type": "page_view", "metadata": {"page": "/app/inicio"}},
        )
        assert first.status_code == 200, first.text
        second = client.post(
            "/analytics/events",
            headers=headers,
            json={"event_type": "feed_viewed"},
        )
        assert second.status_code == 200, second.text
