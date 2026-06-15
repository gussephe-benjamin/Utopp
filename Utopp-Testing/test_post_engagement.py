import time
import uuid

import httpx
import pytest

from config import API_BASE_URL
from auth_helpers import with_legal_ids


class TestPostEngagementAPI:
    """Integration tests for reactions and comments on posts."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        def _create():
            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.engagement.{suffix}@utec.edu.pe"
            password = "TestPassword123!"

            reg = client.post(
                "/auth/register",
                json=with_legal_ids(
                    client,
                    {"email": email, "password": password, "full_name": "Engagement QA"},
                ),
            )
            assert reg.status_code == 201, reg.text

            login = client.post("/auth/login", json={"email": email, "password": password})
            assert login.status_code == 200, login.text
            token = login.json().get("access_token")
            assert token, f"Missing access_token: {login.text}"
            headers = {"Authorization": f"Bearer {token}"}

            me = client.get("/auth/me", headers=headers)
            assert me.status_code == 200, me.text
            return {"id": me.json()["id"], "headers": headers}

        return _create

    @pytest.fixture
    def create_post(self, client):
        def _create(owner_headers, publish=True):
            payload = {
                "title": f"Engagement Post {uuid.uuid4().hex[:6]}",
                "description": "Post for engagement tests",
                "post_type": "event",
                "subtype": "conferencia",
                "tags": ["engagement"],
                "specific_fields": {},
            }
            created = client.post("/posts/", json=payload, headers=owner_headers)
            assert created.status_code == 201, created.text
            post_id = created.json()["id"]
            if publish:
                pub = client.post(f"/posts/{post_id}/publish", headers=owner_headers)
                assert pub.status_code == 200, pub.text
            return post_id

        return _create

    @pytest.fixture
    def context(self, create_user_and_token, create_post):
        owner = create_user_and_token()
        other = create_user_and_token()
        post_id = create_post(owner["headers"], publish=True)
        return {"owner": owner, "other": other, "post_id": post_id}

    # ==================== Reactions ====================

    def test_toggle_reaction_adds(self, client, context):
        res = client.post(
            f"/posts/{context['post_id']}/reactions",
            headers=context["other"]["headers"],
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["reacted"] is True
        assert data["count"] == 1

    def test_toggle_reaction_removes(self, client, context):
        headers = context["other"]["headers"]
        client.post(f"/posts/{context['post_id']}/reactions", headers=headers)
        res = client.post(f"/posts/{context['post_id']}/reactions", headers=headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["reacted"] is False
        assert data["count"] == 0

    def test_reaction_count_endpoint(self, client, context):
        client.post(
            f"/posts/{context['post_id']}/reactions",
            headers=context["owner"]["headers"],
        )
        res = client.get(
            f"/posts/{context['post_id']}/reactions/count",
            headers=context["owner"]["headers"],
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["count"] >= 1
        assert data["user_reacted"] is True

    def test_reaction_requires_auth(self, client, context):
        res = client.post(f"/posts/{context['post_id']}/reactions")
        assert res.status_code == 401

    def test_reaction_nonexistent_post(self, client, context):
        res = client.post(
            "/posts/99999999/reactions",
            headers=context["other"]["headers"],
        )
        assert res.status_code == 404

    # ==================== Comments ====================

    def test_create_comment(self, client, context):
        res = client.post(
            f"/posts/{context['post_id']}/comments",
            json={"content": "¡Buen evento!"},
            headers=context["other"]["headers"],
        )
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["content"] == "¡Buen evento!"
        assert data["post_id"] == context["post_id"]

    def test_list_comments(self, client, context):
        client.post(
            f"/posts/{context['post_id']}/comments",
            json={"content": "Comentario 1"},
            headers=context["other"]["headers"],
        )
        res = client.get(f"/posts/{context['post_id']}/comments")
        assert res.status_code == 200, res.text
        assert isinstance(res.json(), list)
        assert len(res.json()) >= 1

    def test_create_comment_requires_auth(self, client, context):
        res = client.post(
            f"/posts/{context['post_id']}/comments",
            json={"content": "Sin auth"},
        )
        assert res.status_code == 401

    def test_create_comment_empty_rejected(self, client, context):
        res = client.post(
            f"/posts/{context['post_id']}/comments",
            json={"content": "   "},
            headers=context["other"]["headers"],
        )
        assert res.status_code == 422

    def test_delete_own_comment(self, client, context):
        created = client.post(
            f"/posts/{context['post_id']}/comments",
            json={"content": "Para borrar"},
            headers=context["other"]["headers"],
        )
        assert created.status_code == 201, created.text
        comment_id = created.json()["id"]
        res = client.delete(
            f"/posts/{context['post_id']}/comments/{comment_id}",
            headers=context["other"]["headers"],
        )
        assert res.status_code == 204, res.text

    def test_cannot_delete_others_comment(self, client, context):
        created = client.post(
            f"/posts/{context['post_id']}/comments",
            json={"content": "De otro usuario"},
            headers=context["other"]["headers"],
        )
        comment_id = created.json()["id"]
        res = client.delete(
            f"/posts/{context['post_id']}/comments/{comment_id}",
            headers=context["owner"]["headers"],
        )
        assert res.status_code == 403

    # ==================== Feed counts ====================

    def test_feed_includes_engagement_counts(self, client, context):
        client.post(
            f"/posts/{context['post_id']}/reactions",
            headers=context["other"]["headers"],
        )
        client.post(
            f"/posts/{context['post_id']}/comments",
            json={"content": "Comentario para el feed"},
            headers=context["other"]["headers"],
        )
        res = client.get("/feed", headers=context["other"]["headers"], params={"type": "event"})
        assert res.status_code == 200, res.text
        items = res.json()["items"]
        target = next((p for p in items if p["id"] == context["post_id"]), None)
        assert target is not None
        assert target["reaction_count"] >= 1
        assert target["comment_count"] >= 1
        assert target["user_reacted"] is True
