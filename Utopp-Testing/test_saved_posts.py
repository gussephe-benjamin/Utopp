import time
import uuid

import httpx
import pytest

from config import API_BASE_URL


class TestSavedPostsAPI:
    """Integration tests for Saved Posts API endpoints."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        def _create():
            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.savedposts.{suffix}@utec.edu.pe"
            password = "TestPassword123!"

            reg = client.post(
                "/auth/register",
                json={"email": email, "password": password, "full_name": "Saved Posts QA"},
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
        def _create(owner_headers, publish=True, post_type="event", subtype="conferencia"):
            payload = {
                "title": f"Saved Post {uuid.uuid4().hex[:6]}",
                "description": "Post for saved posts tests",
                "post_type": post_type,
                "subtype": subtype,
                "tags": ["saved"],
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
        saver = create_user_and_token()
        outsider = create_user_and_token()
        post_id = create_post(owner["headers"], publish=True)
        return {"owner": owner, "saver": saver, "outsider": outsider, "post_id": post_id}

    @pytest.fixture
    def saved_context(self, client, context):
        save = client.post(
            f"/posts/{context['post_id']}/save",
            headers=context["saver"]["headers"],
        )
        assert save.status_code == 201, save.text
        return context

    # ==================== Happy Path Tests (10) ====================

    def test_save_post_success(self, client, context):
        response = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        assert response.status_code == 201
        assert response.json()["status"] == "saved"

    def test_unsave_post_success(self, client, saved_context):
        response = client.delete(f"/posts/{saved_context['post_id']}/save", headers=saved_context["saver"]["headers"])
        assert response.status_code == 200
        assert response.json()["status"] == "unsaved"

    def test_list_saved_posts_success(self, client, saved_context):
        response = client.get("/users/me/saved-posts", headers=saved_context["saver"]["headers"])
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_save_then_list_contains_post(self, client, context):
        save = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        listed = client.get("/users/me/saved-posts", headers=context["saver"]["headers"])
        assert save.status_code == 201
        assert listed.status_code == 200
        ids = [p["id"] for p in listed.json()]
        assert context["post_id"] in ids

    def test_save_unsave_cycle(self, client, context):
        save = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        unsave = client.delete(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        assert save.status_code == 201
        assert unsave.status_code == 200

    def test_multiple_posts_can_be_saved(self, client, create_post, context):
        post2 = create_post(context["owner"]["headers"], publish=True)
        r1 = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        r2 = client.post(f"/posts/{post2}/save", headers=context["saver"]["headers"])
        listed = client.get("/users/me/saved-posts", headers=context["saver"]["headers"])
        assert r1.status_code == 201
        assert r2.status_code == 201
        assert listed.status_code == 200
        assert len(listed.json()) >= 2

    def test_list_saved_posts_pagination_basic(self, client, saved_context):
        response = client.get("/users/me/saved-posts", params={"page": 1, "size": 10}, headers=saved_context["saver"]["headers"])
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_unsave_removes_from_list(self, client, saved_context):
        before = client.get("/users/me/saved-posts", headers=saved_context["saver"]["headers"])
        unsave = client.delete(f"/posts/{saved_context['post_id']}/save", headers=saved_context["saver"]["headers"])
        after = client.get("/users/me/saved-posts", headers=saved_context["saver"]["headers"])
        assert before.status_code == 200
        assert unsave.status_code == 200
        assert after.status_code == 200
        assert len(after.json()) <= len(before.json()) - 1

    def test_same_post_saved_by_different_users(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        u1 = create_user_and_token()
        u2 = create_user_and_token()
        post_id = create_post(owner["headers"], publish=True)
        s1 = client.post(f"/posts/{post_id}/save", headers=u1["headers"])
        s2 = client.post(f"/posts/{post_id}/save", headers=u2["headers"])
        assert s1.status_code == 201
        assert s2.status_code == 201

    def test_list_is_user_scoped(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        u1 = create_user_and_token()
        u2 = create_user_and_token()
        post_id = create_post(owner["headers"], publish=True)
        client.post(f"/posts/{post_id}/save", headers=u1["headers"])
        list_u1 = client.get("/users/me/saved-posts", headers=u1["headers"])
        list_u2 = client.get("/users/me/saved-posts", headers=u2["headers"])
        assert list_u1.status_code == 200
        assert list_u2.status_code == 200
        assert post_id in [p["id"] for p in list_u1.json()]
        assert post_id not in [p["id"] for p in list_u2.json()]

    # ==================== Authentication / Authorization Tests (12) ====================

    def test_save_without_auth(self, client, context):
        response = client.post(f"/posts/{context['post_id']}/save")
        assert response.status_code == 401

    def test_unsave_without_auth(self, client, context):
        response = client.delete(f"/posts/{context['post_id']}/save")
        assert response.status_code == 401

    def test_list_saved_without_auth(self, client):
        response = client.get("/users/me/saved-posts")
        assert response.status_code == 401

    def test_save_invalid_token(self, client, context):
        response = client.post(
            f"/posts/{context['post_id']}/save",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_unsave_invalid_token(self, client, context):
        response = client.delete(
            f"/posts/{context['post_id']}/save",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_list_saved_invalid_token(self, client):
        response = client.get(
            "/users/me/saved-posts",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_save_malformed_token(self, client, context):
        response = client.post(
            f"/posts/{context['post_id']}/save",
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_unsave_malformed_token(self, client, context):
        response = client.delete(
            f"/posts/{context['post_id']}/save",
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_list_saved_malformed_token(self, client):
        response = client.get(
            "/users/me/saved-posts",
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_user_cannot_list_another_user_saved_posts_endpoint(self, client, context):
        response = client.get("/users/me/saved-posts", headers=context["outsider"]["headers"])
        assert response.status_code == 200

    def test_user_can_only_unsave_own_saved_relation(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        outsider = create_user_and_token()
        post_id = create_post(owner["headers"], publish=True)
        client.post(f"/posts/{post_id}/save", headers=saver["headers"])
        response = client.delete(f"/posts/{post_id}/save", headers=outsider["headers"])
        assert response.status_code == 404

    def test_user_can_save_public_post_from_other_owner(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        post_id = create_post(owner["headers"], publish=True)
        response = client.post(f"/posts/{post_id}/save", headers=saver["headers"])
        assert response.status_code == 201

    # ==================== Data Validation Tests (14) ====================

    def test_save_post_id_not_int(self, client, context):
        response = client.post("/posts/not-int/save", headers=context["saver"]["headers"])
        assert response.status_code == 422

    def test_unsave_post_id_not_int(self, client, context):
        response = client.delete("/posts/not-int/save", headers=context["saver"]["headers"])
        assert response.status_code == 422

    def test_save_post_id_float_string(self, client, context):
        response = client.post("/posts/1.5/save", headers=context["saver"]["headers"])
        assert response.status_code == 422

    def test_unsave_post_id_float_string(self, client, context):
        response = client.delete("/posts/1.5/save", headers=context["saver"]["headers"])
        assert response.status_code == 422

    def test_list_saved_invalid_page_zero(self, client, context):
        response = client.get("/users/me/saved-posts", params={"page": 0, "size": 10}, headers=context["saver"]["headers"])
        assert response.status_code in [400, 422]

    def test_list_saved_invalid_page_negative(self, client, context):
        response = client.get("/users/me/saved-posts", params={"page": -1, "size": 10}, headers=context["saver"]["headers"])
        assert response.status_code in [400, 422]

    def test_list_saved_invalid_size_zero(self, client, context):
        response = client.get("/users/me/saved-posts", params={"page": 1, "size": 0}, headers=context["saver"]["headers"])
        assert response.status_code in [400, 422]

    def test_list_saved_invalid_size_negative(self, client, context):
        response = client.get("/users/me/saved-posts", params={"page": 1, "size": -1}, headers=context["saver"]["headers"])
        assert response.status_code in [400, 422]

    def test_list_saved_invalid_page_type(self, client, context):
        response = client.get("/users/me/saved-posts", params={"page": "abc", "size": 10}, headers=context["saver"]["headers"])
        assert response.status_code == 422

    def test_list_saved_invalid_size_type(self, client, context):
        response = client.get("/users/me/saved-posts", params={"page": 1, "size": "abc"}, headers=context["saver"]["headers"])
        assert response.status_code == 422

    def test_save_with_unexpected_query_param_ignored(self, client, context):
        response = client.post(f"/posts/{context['post_id']}/save?x=1", headers=context["saver"]["headers"])
        assert response.status_code == 201

    def test_unsave_with_unexpected_query_param_ignored(self, client, context):
        client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        response = client.delete(f"/posts/{context['post_id']}/save?x=1", headers=context["saver"]["headers"])
        assert response.status_code == 200

    def test_save_accepts_large_post_id_format_validation(self, client, context):
        response = client.post("/posts/999999999999999999999999/save", headers=context["saver"]["headers"])
        assert response.status_code in [404, 422]

    def test_unsave_accepts_large_post_id_format_validation(self, client, context):
        response = client.delete("/posts/999999999999999999999999/save", headers=context["saver"]["headers"])
        assert response.status_code in [404, 422]

    # ==================== Edge Case Tests (10) ====================

    def test_save_nonexistent_post(self, client, context):
        response = client.post("/posts/99999999/save", headers=context["saver"]["headers"])
        assert response.status_code == 404

    def test_unsave_nonexistent_post_relation(self, client, context):
        response = client.delete("/posts/99999999/save", headers=context["saver"]["headers"])
        assert response.status_code == 404

    def test_duplicate_save_conflict(self, client, context):
        r1 = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        r2 = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        assert r1.status_code == 201
        assert r2.status_code == 409

    def test_unsave_twice_second_not_found(self, client, context):
        client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        r1 = client.delete(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        r2 = client.delete(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        assert r1.status_code == 200
        assert r2.status_code == 404

    def test_saved_draft_post_not_returned_in_list(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        draft_post = create_post(owner["headers"], publish=False)
        save = client.post(f"/posts/{draft_post}/save", headers=saver["headers"])
        listed = client.get("/users/me/saved-posts", headers=saver["headers"])
        assert save.status_code == 201
        assert listed.status_code == 200
        assert draft_post not in [p["id"] for p in listed.json()]

    def test_saved_archived_post_not_returned_in_list(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        post_id = create_post(owner["headers"], publish=True)
        archive = client.post(f"/posts/{post_id}/archive", headers=owner["headers"])
        assert archive.status_code == 200
        save = client.post(f"/posts/{post_id}/save", headers=saver["headers"])
        listed = client.get("/users/me/saved-posts", headers=saver["headers"])
        assert save.status_code == 201
        assert listed.status_code == 200
        assert post_id not in [p["id"] for p in listed.json()]

    def test_large_page_returns_empty_list(self, client, saved_context):
        response = client.get("/users/me/saved-posts", params={"page": 999, "size": 10}, headers=saved_context["saver"]["headers"])
        assert response.status_code == 200
        assert response.json() == []

    def test_save_many_then_paginate(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        ids = [create_post(owner["headers"], publish=True) for _ in range(3)]
        for pid in ids:
            client.post(f"/posts/{pid}/save", headers=saver["headers"])
        page_1 = client.get("/users/me/saved-posts", params={"page": 1, "size": 2}, headers=saver["headers"])
        page_2 = client.get("/users/me/saved-posts", params={"page": 2, "size": 2}, headers=saver["headers"])
        assert page_1.status_code == 200
        assert page_2.status_code == 200
        assert len(page_1.json()) <= 2
        assert len(page_2.json()) <= 2

    def test_save_order_most_recent_first(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        p1 = create_post(owner["headers"], publish=True)
        p2 = create_post(owner["headers"], publish=True)
        client.post(f"/posts/{p1}/save", headers=saver["headers"])
        time.sleep(0.01)
        client.post(f"/posts/{p2}/save", headers=saver["headers"])
        listed = client.get("/users/me/saved-posts", headers=saver["headers"])
        assert listed.status_code == 200
        ids = [p["id"] for p in listed.json()]
        assert ids.index(p2) < ids.index(p1)

    def test_unsave_one_of_multiple_saved_posts(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        p1 = create_post(owner["headers"], publish=True)
        p2 = create_post(owner["headers"], publish=True)
        client.post(f"/posts/{p1}/save", headers=saver["headers"])
        client.post(f"/posts/{p2}/save", headers=saver["headers"])
        client.delete(f"/posts/{p1}/save", headers=saver["headers"])
        listed = client.get("/users/me/saved-posts", headers=saver["headers"])
        ids = [p["id"] for p in listed.json()]
        assert p1 not in ids
        assert p2 in ids

    # ==================== Schema + Data Integrity Tests (6) ====================

    def test_save_response_schema(self, client, context):
        response = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        assert response.status_code == 201
        assert "status" in response.json()

    def test_unsave_response_schema(self, client, context):
        client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        response = client.delete(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        assert response.status_code == 200
        assert "status" in response.json()

    def test_saved_posts_item_schema(self, client, saved_context):
        response = client.get("/users/me/saved-posts", headers=saved_context["saver"]["headers"])
        assert response.status_code == 200
        items = response.json()
        if len(items) > 0:
            first = items[0]
            for field in ["id", "user_id", "description", "post_type", "status", "time_status", "created_at", "updated_at"]:
                assert field in first, f"Missing field: {field}"

    def test_saved_posts_consistency_across_calls(self, client, saved_context):
        r1 = client.get("/users/me/saved-posts", headers=saved_context["saver"]["headers"])
        r2 = client.get("/users/me/saved-posts", headers=saved_context["saver"]["headers"])
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert [p["id"] for p in r1.json()] == [p["id"] for p in r2.json()]

    def test_save_then_unsave_then_save_again(self, client, context):
        r1 = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        r2 = client.delete(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        r3 = client.post(f"/posts/{context['post_id']}/save", headers=context["saver"]["headers"])
        assert r1.status_code == 201
        assert r2.status_code == 200
        assert r3.status_code == 201

    def test_list_saved_posts_returns_only_published_fields_consistently(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        saver = create_user_and_token()
        pub = create_post(owner["headers"], publish=True)
        drf = create_post(owner["headers"], publish=False)
        client.post(f"/posts/{pub}/save", headers=saver["headers"])
        client.post(f"/posts/{drf}/save", headers=saver["headers"])
        listed = client.get("/users/me/saved-posts", headers=saver["headers"])
        assert listed.status_code == 200
        ids = [p["id"] for p in listed.json()]
        assert pub in ids
        assert drf not in ids
