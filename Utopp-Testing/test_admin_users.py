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


def _ensure_admin(client: httpx.Client) -> tuple[dict[str, str], int]:
    headers, user_id, email = _register_and_login(client, full_name="Test Admin User")
    bootstrap = client.post("/setup/bootstrap-admin", json={"email": email})
    if bootstrap.status_code == 201:
        return headers, user_id

    assign = client.post(f"/roles/users/{user_id}/roles/4", headers=headers)
    if assign.status_code == 201:
        return headers, user_id

    pytest.skip("No se pudo obtener permisos de administrador para el test")


class TestAdminUsersAPI:
    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture(scope="module")
    def admin_headers(self, client):
        return _ensure_admin(client)

    def test_delete_user_requires_admin(self, client):
        headers, _, _ = _register_and_login(client, full_name="Regular Student")
        response = client.delete("/admin/users/999999", headers=headers)
        assert response.status_code == 403

    def test_delete_user_not_found(self, client, admin_headers):
        headers, _ = admin_headers
        response = client.delete("/admin/users/999999", headers=headers)
        assert response.status_code == 404

    def test_delete_user_success(self, client, admin_headers):
        headers, admin_id = admin_headers
        victim_headers, victim_id, _ = _register_and_login(client, full_name="Victim User")
        assert victim_id != admin_id
        del victim_headers

        delete_response = client.delete(f"/admin/users/{victim_id}", headers=headers)
        assert delete_response.status_code == 204

        get_response = client.get(f"/users/by-id/{victim_id}")
        assert get_response.status_code == 404

    def test_delete_self_forbidden(self, client, admin_headers):
        headers, admin_id = admin_headers
        response = client.delete(f"/admin/users/{admin_id}", headers=headers)
        assert response.status_code == 400
        assert "propia" in response.json()["detail"].lower()
