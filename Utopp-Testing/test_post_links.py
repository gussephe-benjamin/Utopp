import time
import uuid

import httpx
import pytest

from config import API_BASE_URL
from auth_helpers import with_legal_ids


class TestPostLinksAPI:
    """Integration tests for Post Links API endpoints."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        def _create():
            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.postlinks.{suffix}@utec.edu.pe"
            password = "TestPassword123!"
            reg = client.post(
                "/auth/register",
                json=with_legal_ids(
                    client,
                    {"email": email, "password": password, "full_name": "Test Post Links"},
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
        def _create_post(owner_headers, post_type="event", subtype="conferencia"):
            payload = {
                "title": f"Post {uuid.uuid4().hex[:6]}",
                "description": "Post for link tests",
                "post_type": post_type,
                "subtype": subtype,
                "tags": ["links"],
                "specific_fields": {},
            }
            response = client.post("/posts/", json=payload, headers=owner_headers)
            assert response.status_code == 201, response.text
            return response.json()["id"]

        return _create_post

    @pytest.fixture
    def link_payload(self):
        return {
            "label": "Formulario",
            "url": "https://example.com/form",
            "type": "registration",
            "display_type": "button",
            "position": 0,
        }

    @pytest.fixture
    def post_context(self, create_user_and_token, create_post):
        owner = create_user_and_token()
        outsider = create_user_and_token()
        post_id = create_post(owner["headers"])
        return {"owner": owner, "outsider": outsider, "post_id": post_id}

    @pytest.fixture
    def created_link_context(self, client, post_context, link_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json=link_payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
        return {"post_context": post_context, "link": response.json()}

    # ==================== Happy Path Tests (10) ====================

    def test_create_link_success(self, client, post_context, link_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json=link_payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201
        assert response.json()["post_id"] == post_context["post_id"]

    def test_list_links_success(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        response = client.get(f"/posts/{post_id}/links")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_update_link_success(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/{link_id}",
            json={"label": "Nuevo Label", "type": "info"},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 200
        assert response.json()["label"] == "Nuevo Label"

    def test_delete_link_success(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.delete(
            f"/posts/{post_id}/links/{link_id}",
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 200

    def test_reorder_links_success(self, client, post_context):
        r1 = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "A", "url": "https://example.com/a", "type": "info", "display_type": "link", "position": 0},
            headers=post_context["owner"]["headers"],
        )
        r2 = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "B", "url": "https://example.com/b", "type": "resource", "display_type": "button", "position": 1},
            headers=post_context["owner"]["headers"],
        )
        assert r1.status_code == 201
        assert r2.status_code == 201

        l1, l2 = r1.json()["id"], r2.json()["id"]
        reorder = client.patch(
            f"/posts/{post_context['post_id']}/links/reorder",
            json={"links": [{"link_id": l1, "position": 3}, {"link_id": l2, "position": 2}]},
            headers=post_context["owner"]["headers"],
        )
        assert reorder.status_code == 200
        assert isinstance(reorder.json(), list)

    def test_create_link_with_default_fields(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "Info", "url": "https://example.com/default"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "info"
        assert data["display_type"] == "link"

    def test_create_multiple_links_same_post(self, client, post_context):
        for idx in range(3):
            response = client.post(
                f"/posts/{post_context['post_id']}/links",
                json={
                    "label": f"Link {idx}",
                    "url": f"https://example.com/{idx}",
                    "type": "resource",
                    "display_type": "link",
                    "position": idx,
                },
                headers=post_context["owner"]["headers"],
            )
            assert response.status_code == 201

    def test_reorder_then_list_reflects_order(self, client, post_context):
        a = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "L1", "url": "https://example.com/1", "position": 0},
            headers=post_context["owner"]["headers"],
        ).json()
        b = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "L2", "url": "https://example.com/2", "position": 1},
            headers=post_context["owner"]["headers"],
        ).json()

        reorder = client.patch(
            f"/posts/{post_context['post_id']}/links/reorder",
            json={"links": [{"link_id": a["id"], "position": 11}, {"link_id": b["id"], "position": 10}]},
            headers=post_context["owner"]["headers"],
        )
        assert reorder.status_code == 200
        listed = client.get(f"/posts/{post_context['post_id']}/links")
        assert listed.status_code == 200
        assert [x["position"] for x in listed.json()] == sorted([x["position"] for x in listed.json()])

    def test_update_partial_fields_success(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/{link_id}",
            json={"url": "https://example.com/updated"},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 200
        assert response.json()["url"] == "https://example.com/updated"

    def test_delete_then_list_decreases_count(self, client, post_context):
        created = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "ToDelete", "url": "https://example.com/delete"},
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201
        link_id = created.json()["id"]
        before = client.get(f"/posts/{post_context['post_id']}/links")
        deleted = client.delete(
            f"/posts/{post_context['post_id']}/links/{link_id}",
            headers=post_context["owner"]["headers"],
        )
        after = client.get(f"/posts/{post_context['post_id']}/links")
        assert before.status_code == 200
        assert deleted.status_code == 200
        assert after.status_code == 200
        assert len(after.json()) <= len(before.json()) - 1

    # ==================== Authentication / Authorization Tests (12) ====================

    def test_create_link_without_auth(self, client, post_context, link_payload):
        response = client.post(f"/posts/{post_context['post_id']}/links", json=link_payload)
        assert response.status_code == 401

    def test_update_link_without_auth(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(f"/posts/{post_id}/links/{link_id}", json={"label": "X"})
        assert response.status_code == 401

    def test_delete_link_without_auth(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.delete(f"/posts/{post_id}/links/{link_id}")
        assert response.status_code == 401

    def test_reorder_links_without_auth(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/reorder",
            json={"links": [{"link_id": link_id, "position": 0}]},
        )
        assert response.status_code == 401

    def test_create_link_invalid_token(self, client, post_context, link_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json=link_payload,
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_update_link_invalid_token(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/{link_id}",
            json={"label": "Y"},
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_delete_link_invalid_token(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.delete(
            f"/posts/{post_id}/links/{link_id}",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_reorder_link_invalid_token(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/reorder",
            json={"links": [{"link_id": link_id, "position": 0}]},
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_create_link_malformed_token(self, client, post_context, link_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json=link_payload,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_list_links_without_auth_allowed(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        response = client.get(f"/posts/{post_id}/links")
        assert response.status_code == 200

    def test_list_links_with_invalid_token_allowed_or_rejected(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        response = client.get(
            f"/posts/{post_id}/links",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code in [200, 401]

    def test_outsider_cannot_manage_foreign_post_links(self, client, post_context, link_payload):
        create_response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json=link_payload,
            headers=post_context["outsider"]["headers"],
        )
        assert create_response.status_code in [401, 403, 404]

    # ==================== Data Validation Tests (14) ====================

    def test_create_link_missing_label(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"url": "https://example.com/only-url"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_link_missing_url(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "Only Label"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_link_empty_label(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "", "url": "https://example.com/x"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_link_empty_url(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "X", "url": ""},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_link_invalid_type(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "X", "url": "https://example.com/x", "type": "invalid"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_link_invalid_display_type(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "X", "url": "https://example.com/x", "display_type": "invalid"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_link_negative_position(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "X", "url": "https://example.com/x", "position": -1},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_update_link_empty_body_allowed(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/{link_id}",
            json={},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 200

    def test_update_link_invalid_type(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/{link_id}",
            json={"type": "invalid"},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_links_missing_links_field(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        response = client.patch(
            f"/posts/{post_id}/links/reorder",
            json={},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_links_empty_list(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        response = client.patch(
            f"/posts/{post_id}/links/reorder",
            json={"links": []},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_item_missing_link_id(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        response = client.patch(
            f"/posts/{post_id}/links/reorder",
            json={"links": [{"position": 1}]},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_item_missing_position(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/reorder",
            json={"links": [{"link_id": link_id}]},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_post_id_not_int_validation(self, client, post_context, link_payload):
        response = client.post(
            "/posts/not-int/links",
            json=link_payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    # ==================== Edge Case Tests (10) ====================

    def test_create_link_nonexistent_post(self, client, create_user_and_token, link_payload):
        user = create_user_and_token()
        response = client.post(
            "/posts/99999999/links",
            json=link_payload,
            headers=user["headers"],
        )
        assert response.status_code == 404

    def test_update_nonexistent_link(self, client, post_context):
        response = client.patch(
            f"/posts/{post_context['post_id']}/links/99999999",
            json={"label": "X"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 404

    def test_delete_nonexistent_link(self, client, post_context):
        response = client.delete(
            f"/posts/{post_context['post_id']}/links/99999999",
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 404

    def test_update_link_mismatch_post_and_link(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        p1 = create_post(owner["headers"])
        p2 = create_post(owner["headers"])
        created = client.post(
            f"/posts/{p1}/links",
            json={"label": "Mismatch", "url": "https://example.com/mm"},
            headers=owner["headers"],
        )
        assert created.status_code == 201
        link_id = created.json()["id"]

        response = client.patch(
            f"/posts/{p2}/links/{link_id}",
            json={"label": "Nope"},
            headers=owner["headers"],
        )
        assert response.status_code == 404

    def test_delete_link_mismatch_post_and_link(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        p1 = create_post(owner["headers"])
        p2 = create_post(owner["headers"])
        created = client.post(
            f"/posts/{p1}/links",
            json={"label": "Mismatch", "url": "https://example.com/mm2"},
            headers=owner["headers"],
        )
        assert created.status_code == 201
        link_id = created.json()["id"]
        response = client.delete(
            f"/posts/{p2}/links/{link_id}",
            headers=owner["headers"],
        )
        assert response.status_code == 404

    def test_reorder_with_foreign_link_id(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        p1 = create_post(owner["headers"])
        p2 = create_post(owner["headers"])
        l1 = client.post(
            f"/posts/{p1}/links",
            json={"label": "L1", "url": "https://example.com/l1"},
            headers=owner["headers"],
        ).json()["id"]
        l2 = client.post(
            f"/posts/{p2}/links",
            json={"label": "L2", "url": "https://example.com/l2"},
            headers=owner["headers"],
        ).json()["id"]

        response = client.patch(
            f"/posts/{p1}/links/reorder",
            json={"links": [{"link_id": l1, "position": 1}, {"link_id": l2, "position": 0}]},
            headers=owner["headers"],
        )
        assert response.status_code == 400

    def test_list_links_nonexistent_post_returns_empty(self, client):
        response = client.get("/posts/99999999/links")
        assert response.status_code == 200
        assert response.json() == []

    def test_reorder_nonexistent_post(self, client, create_user_and_token):
        user = create_user_and_token()
        response = client.patch(
            "/posts/99999999/links/reorder",
            json={"links": [{"link_id": 1, "position": 0}]},
            headers=user["headers"],
        )
        assert response.status_code == 404

    def test_reorder_nonexistent_link_id(self, client, post_context):
        response = client.patch(
            f"/posts/{post_context['post_id']}/links/reorder",
            json={"links": [{"link_id": 99999999, "position": 0}]},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 400

    def test_delete_link_twice_second_time_not_found(self, client, post_context):
        created = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "Twice", "url": "https://example.com/twice"},
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201
        link_id = created.json()["id"]
        first = client.delete(
            f"/posts/{post_context['post_id']}/links/{link_id}",
            headers=post_context["owner"]["headers"],
        )
        second = client.delete(
            f"/posts/{post_context['post_id']}/links/{link_id}",
            headers=post_context["owner"]["headers"],
        )
        assert first.status_code == 200
        assert second.status_code == 404

    # ==================== Schema + Data Integrity Tests (6) ====================

    def test_create_link_response_schema(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "Schema", "url": "https://example.com/schema"},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201
        data = response.json()
        for field in ["id", "post_id", "label", "url", "type", "display_type", "position"]:
            assert field in data, f"Missing field: {field}"

    def test_update_link_response_schema(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        link_id = created_link_context["link"]["id"]
        response = client.patch(
            f"/posts/{post_id}/links/{link_id}",
            json={"label": "Schema2"},
            headers=created_link_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 200
        data = response.json()
        for field in ["id", "post_id", "label", "url", "type", "display_type", "position"]:
            assert field in data

    def test_list_links_item_schema(self, client, created_link_context):
        post_id = created_link_context["post_context"]["post_id"]
        response = client.get(f"/posts/{post_id}/links")
        assert response.status_code == 200
        items = response.json()
        if len(items) > 0:
            for field in ["id", "post_id", "label", "url", "type", "display_type", "position"]:
                assert field in items[0]

    def test_delete_link_response_message(self, client, post_context):
        created = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "Msg", "url": "https://example.com/msg"},
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201
        link_id = created.json()["id"]
        deleted = client.delete(
            f"/posts/{post_context['post_id']}/links/{link_id}",
            headers=post_context["owner"]["headers"],
        )
        assert deleted.status_code == 200
        assert "message" in deleted.json()

    def test_reorder_response_schema(self, client, post_context):
        a = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "RA", "url": "https://example.com/ra"},
            headers=post_context["owner"]["headers"],
        ).json()
        b = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "RB", "url": "https://example.com/rb"},
            headers=post_context["owner"]["headers"],
        ).json()
        response = client.patch(
            f"/posts/{post_context['post_id']}/links/reorder",
            json={"links": [{"link_id": a["id"], "position": 21}, {"link_id": b["id"], "position": 20}]},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            for field in ["id", "post_id", "label", "url", "type", "display_type", "position"]:
                assert field in data[0]

    def test_reorder_persists_positions(self, client, post_context):
        a = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "P1", "url": "https://example.com/p1"},
            headers=post_context["owner"]["headers"],
        ).json()
        b = client.post(
            f"/posts/{post_context['post_id']}/links",
            json={"label": "P2", "url": "https://example.com/p2"},
            headers=post_context["owner"]["headers"],
        ).json()
        reorder = client.patch(
            f"/posts/{post_context['post_id']}/links/reorder",
            json={"links": [{"link_id": a["id"], "position": 31}, {"link_id": b["id"], "position": 30}]},
            headers=post_context["owner"]["headers"],
        )
        assert reorder.status_code == 200
        listed = client.get(f"/posts/{post_context['post_id']}/links")
        assert listed.status_code == 200
        pos = {x["id"]: x["position"] for x in listed.json()}
        assert pos[a["id"]] == 31
        assert pos[b["id"]] == 30
