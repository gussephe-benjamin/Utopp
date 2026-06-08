import time
import uuid

import httpx
import pytest

from auth_helpers import with_legal_ids
from config import API_BASE_URL

ADMIN_POST_SUMMARY_FIELDS = {
    "id",
    "user_id",
    "creator_name",
    "creator_email",
    "created_at",
    "title",
    "description",
}


class TestPostsAdminListAPI:
    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    def _register_user(self, client, suffix: str | None = None):
        suffix = suffix or uuid.uuid4().hex[:8]
        email = f"test.adminposts.{suffix}@utec.edu.pe"
        password = "TestPassword123!"
        register = client.post(
            "/auth/register",
            json=with_legal_ids(
                client,
                {"email": email, "password": password, "full_name": f"Admin Posts {suffix}"},
            ),
        )
        assert register.status_code == 201, register.text
        login = client.post("/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        me = client.get("/auth/me", headers=headers)
        assert me.status_code == 200, me.text
        return {"id": me.json()["id"], "headers": headers, "email": email}

    def _create_post(self, client, headers):
        payload = {
            "title": f"Admin list {uuid.uuid4().hex[:6]}",
            "description": "Post for admin list tests",
            "post_type": "event",
            "subtype": "conferencia",
            "tags": ["admin-test"],
            "specific_fields": {},
        }
        response = client.post("/posts/", json=payload, headers=headers)
        assert response.status_code == 201, response.text
        return response.json()["id"]

    def test_list_all_posts_without_auth(self, client):
        response = client.get("/posts/")
        assert response.status_code == 401

    def test_list_all_posts_forbidden_for_student(self, client):
        user = self._register_user(client)
        self._create_post(client, user["headers"])
        response = client.get("/posts/", headers=user["headers"])
        assert response.status_code == 403

    def test_list_all_posts_success_for_admin(self, client):
        admin = self._register_user(client, f"admin-{int(time.time())}")
        assign = client.post(f"/roles/users/{admin['id']}/roles/4", headers=admin["headers"])
        assert assign.status_code in (200, 201), assign.text

        post_id = self._create_post(client, admin["headers"])
        response = client.get("/posts/", headers=admin["headers"], params={"page": 1, "size": 10})
        assert response.status_code == 200, response.text
        data = response.json()

        for field in ("items", "total", "page", "size", "has_next", "has_prev", "pages"):
            assert field in data, f"Missing field: {field}"

        assert data["total"] >= 1
        assert isinstance(data["items"], list)
        assert len(data["items"]) >= 1

        match = next((item for item in data["items"] if item["id"] == post_id), None)
        assert match is not None
        assert set(match.keys()) == ADMIN_POST_SUMMARY_FIELDS
        assert match["creator_email"] == admin["email"]
        assert match["description"] == "Post for admin list tests"

    def test_list_all_posts_pagination(self, client):
        admin = self._register_user(client, f"admin-page-{uuid.uuid4().hex[:6]}")
        assign = client.post(f"/roles/users/{admin['id']}/roles/4", headers=admin["headers"])
        assert assign.status_code in (200, 201), assign.text

        for _ in range(3):
            self._create_post(client, admin["headers"])

        response = client.get("/posts/", headers=admin["headers"], params={"page": 1, "size": 2})
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["page"] == 1
        assert data["size"] == 2
        assert len(data["items"]) <= 2
        assert data["total"] >= 3
        assert data["has_next"] is True
        assert data["has_prev"] is False
