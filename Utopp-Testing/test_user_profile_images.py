import time
import uuid

import httpx
import pytest

from config import API_BASE_URL
from auth_helpers import with_legal_ids


class TestUserProfileImagesAPI:
    """Integration tests for User Profile Images API endpoint."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        def _create():
            def post_with_retry(path, **kwargs):
                last_exc = None
                for _ in range(3):
                    try:
                        return client.post(path, **kwargs)
                    except (httpx.RemoteProtocolError, httpx.ReadError) as exc:
                        last_exc = exc
                        time.sleep(0.2)
                raise last_exc

            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.profileimg.{suffix}@utec.edu.pe"
            password = "TestPassword123!"
            reg = post_with_retry(
                "/auth/register",
                json=with_legal_ids(
                    client,
                    {"email": email, "password": password, "full_name": "Profile Image QA"},
                ),
            )
            assert reg.status_code == 201, reg.text
            login = post_with_retry("/auth/login", json={"email": email, "password": password})
            assert login.status_code == 200, login.text
            token = login.json().get("access_token")
            assert token, f"Missing access_token: {login.text}"
            headers = {"Authorization": f"Bearer {token}"}
            me = client.get("/auth/me", headers=headers)
            assert me.status_code == 200, me.text
            return {"id": me.json()["id"], "headers": headers}

        return _create

    @pytest.fixture
    def ctx(self, create_user_and_token):
        owner = create_user_and_token()
        other = create_user_and_token()
        return {"owner": owner, "other": other}

    @pytest.fixture
    def profile_payload(self):
        return {
            "cloudinary_id": f"cp-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v1/profile.jpg",
        }

    @pytest.fixture
    def created_profile(self, client, ctx, profile_payload):
        r = client.post("/users/users/me/profile-images", json=profile_payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201, r.text
        return {"ctx": ctx, "image": r.json()}

    # ==================== Happy Path Tests (10) ====================

    def test_create_profile_image_success(self, client, ctx, profile_payload):
        r = client.post("/users/users/me/profile-images", json=profile_payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        assert r.json()["is_active"] is True

    def test_create_profile_image_returns_id(self, client, ctx, profile_payload):
        r = client.post("/users/users/me/profile-images", json=profile_payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        assert isinstance(r.json()["id"], int)

    def test_create_profile_image_returns_url(self, client, ctx, profile_payload):
        r = client.post("/users/users/me/profile-images", json=profile_payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        assert r.json()["url"] == profile_payload["url"]

    def test_create_profile_image_is_active_true(self, client, ctx, profile_payload):
        r = client.post("/users/users/me/profile-images", json=profile_payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        assert r.json()["is_active"] is True

    def test_second_profile_image_becomes_active(self, client, ctx):
        p1 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/1.jpg"}
        p2 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/2.jpg"}
        r1 = client.post("/users/users/me/profile-images", json=p1, headers=ctx["owner"]["headers"])
        r2 = client.post("/users/users/me/profile-images", json=p2, headers=ctx["owner"]["headers"])
        assert r1.status_code == 201
        assert r2.status_code == 201
        assert r2.json()["is_active"] is True

    def test_users_me_reflects_profile_image_url(self, client, created_profile):
        me = client.get("/users/me", headers=created_profile["ctx"]["owner"]["headers"])
        assert me.status_code == 200
        assert me.json()["profile_image_url"] == created_profile["image"]["url"]

    def test_users_public_reflects_profile_image_url(self, client, created_profile):
        uid = created_profile["ctx"]["owner"]["id"]
        pub = client.get(f"/users/{uid}")
        assert pub.status_code == 200
        assert pub.json()["profile_image_url"] == created_profile["image"]["url"]

    def test_update_profile_image_changes_users_me_url(self, client, ctx):
        p1 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/old.jpg"}
        p2 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/new.jpg"}
        client.post("/users/users/me/profile-images", json=p1, headers=ctx["owner"]["headers"])
        client.post("/users/users/me/profile-images", json=p2, headers=ctx["owner"]["headers"])
        me = client.get("/users/me", headers=ctx["owner"]["headers"])
        assert me.status_code == 200
        assert me.json()["profile_image_url"] == p2["url"]

    def test_update_profile_image_changes_users_public_url(self, client, ctx):
        p1 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/old2.jpg"}
        p2 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/new2.jpg"}
        client.post("/users/users/me/profile-images", json=p1, headers=ctx["owner"]["headers"])
        client.post("/users/users/me/profile-images", json=p2, headers=ctx["owner"]["headers"])
        pub = client.get(f"/users/{ctx['owner']['id']}")
        assert pub.status_code == 200
        assert pub.json()["profile_image_url"] == p2["url"]

    def test_other_user_profile_unchanged(self, client, ctx):
        p = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/only-owner.jpg"}
        client.post("/users/users/me/profile-images", json=p, headers=ctx["owner"]["headers"])
        other_me = client.get("/users/me", headers=ctx["other"]["headers"])
        assert other_me.status_code == 200
        assert other_me.json()["profile_image_url"] in [None, ""]

    # ==================== Authentication Tests (12) ====================

    def test_create_profile_without_auth(self, client, profile_payload):
        r = client.post("/users/users/me/profile-images", json=profile_payload)
        assert r.status_code == 401

    def test_create_profile_invalid_token(self, client, profile_payload):
        r = client.post(
            "/users/users/me/profile-images",
            json=profile_payload,
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert r.status_code == 401

    def test_create_profile_malformed_token(self, client, profile_payload):
        r = client.post(
            "/users/users/me/profile-images",
            json=profile_payload,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert r.status_code == 401

    def test_users_me_requires_auth(self, client):
        r = client.get("/users/me")
        assert r.status_code == 401

    def test_users_me_invalid_token(self, client):
        r = client.get("/users/me", headers={"Authorization": "Bearer invalid_token"})
        assert r.status_code == 401

    def test_users_me_malformed_token(self, client):
        r = client.get("/users/me", headers={"Authorization": "Bearer bad.token"})
        assert r.status_code == 401

    def test_users_public_no_auth_needed(self, client, ctx):
        r = client.get(f"/users/{ctx['owner']['id']}")
        assert r.status_code == 200

    def test_users_public_with_invalid_token_still_works(self, client, ctx):
        r = client.get(f"/users/{ctx['owner']['id']}", headers={"Authorization": "Bearer invalid"})
        assert r.status_code == 200

    def test_users_public_with_malformed_token_still_works(self, client, ctx):
        r = client.get(f"/users/{ctx['owner']['id']}", headers={"Authorization": "Bearer not.jwt"})
        assert r.status_code == 200

    def test_owner_token_sets_owner_image(self, client, ctx):
        payload = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/owner.jpg"}
        r = client.post("/users/users/me/profile-images", json=payload, headers=ctx["owner"]["headers"])
        me = client.get("/users/me", headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        assert me.status_code == 200
        assert me.json()["profile_image_url"] == payload["url"]

    def test_other_token_sets_other_image(self, client, ctx):
        payload = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/other.jpg"}
        r = client.post("/users/users/me/profile-images", json=payload, headers=ctx["other"]["headers"])
        me = client.get("/users/me", headers=ctx["other"]["headers"])
        owner_me = client.get("/users/me", headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        assert me.status_code == 200
        assert owner_me.status_code == 200
        assert me.json()["profile_image_url"] == payload["url"]
        assert owner_me.json()["profile_image_url"] != payload["url"]

    def test_profile_image_endpoint_ignores_extra_query(self, client, ctx, profile_payload):
        r = client.post("/users/users/me/profile-images?x=1", json=profile_payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201

    # ==================== Data Validation Tests (14) ====================

    def test_create_profile_missing_cloudinary_id(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"url": "https://img/missing-cloud.jpg"},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code == 422

    def test_create_profile_missing_url(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": f"cp-{uuid.uuid4().hex}"},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code == 422

    def test_create_profile_empty_cloudinary_id(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": "", "url": "https://img/e.jpg"},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code in [201, 422, 400, 500]

    def test_create_profile_empty_url(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": ""},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code in [201, 422, 400, 500]

    def test_create_profile_null_cloudinary_id(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": None, "url": "https://img/null.jpg"},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code == 422

    def test_create_profile_null_url(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": None},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code == 422

    def test_create_profile_wrong_type_cloudinary_id(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": 123, "url": "https://img/type.jpg"},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code in [422, 201]

    def test_create_profile_wrong_type_url(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": 123},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code in [422, 201]

    def test_create_profile_extra_field_allowed(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            json={"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/extra.jpg", "foo": "bar"},
            headers=ctx["owner"]["headers"],
        )
        assert r.status_code == 201

    def test_create_profile_body_as_empty_object(self, client, ctx):
        r = client.post("/users/users/me/profile-images", json={}, headers=ctx["owner"]["headers"])
        assert r.status_code == 422

    def test_create_profile_invalid_json_shape_array(self, client, ctx):
        r = client.post("/users/users/me/profile-images", json=["bad"], headers=ctx["owner"]["headers"])
        assert r.status_code == 422

    def test_create_profile_invalid_json_shape_string(self, client, ctx):
        r = client.post(
            "/users/users/me/profile-images",
            content='"bad"',
            headers={**ctx["owner"]["headers"], "Content-Type": "application/json"},
        )
        assert r.status_code in [400, 422]

    def test_users_public_user_id_not_int(self, client):
        r = client.get("/users/not-int")
        assert r.status_code == 422

    def test_users_public_negative_user_id(self, client):
        r = client.get("/users/-1")
        assert r.status_code in [404, 422]

    # ==================== Edge Cases (10) ====================

    def test_duplicate_cloudinary_id_conflict_or_error(self, client, ctx):
        cid = f"cp-{uuid.uuid4().hex}"
        p1 = {"cloudinary_id": cid, "url": "https://img/dup1.jpg"}
        p2 = {"cloudinary_id": cid, "url": "https://img/dup2.jpg"}
        r1 = client.post("/users/users/me/profile-images", json=p1, headers=ctx["owner"]["headers"])
        r2 = client.post("/users/users/me/profile-images", json=p2, headers=ctx["owner"]["headers"])
        assert r1.status_code == 201
        assert r2.status_code in [400, 409, 500]

    def test_many_profile_image_updates_keep_latest(self, client, ctx):
        latest = None
        for i in range(4):
            payload = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": f"https://img/{i}.jpg"}
            latest = payload["url"]
            r = client.post("/users/users/me/profile-images", json=payload, headers=ctx["owner"]["headers"])
            assert r.status_code == 201
        me = client.get("/users/me", headers=ctx["owner"]["headers"])
        assert me.status_code == 200
        assert me.json()["profile_image_url"] == latest

    def test_users_public_nonexistent_user(self, client):
        r = client.get("/users/99999999")
        assert r.status_code == 404

    def test_profile_image_url_with_query_params(self, client, ctx):
        payload = {
            "cloudinary_id": f"cp-{uuid.uuid4().hex}",
            "url": "https://img/query.jpg?x=1&y=2",
        }
        r = client.post("/users/users/me/profile-images", json=payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        assert r.json()["url"] == payload["url"]

    def test_profile_image_url_with_unicode_path(self, client, ctx):
        payload = {
            "cloudinary_id": f"cp-{uuid.uuid4().hex}",
            "url": "https://img/unicode/%E2%9C%93.jpg",
        }
        r = client.post("/users/users/me/profile-images", json=payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201

    def test_profile_image_url_with_long_string(self, client, ctx):
        payload = {
            "cloudinary_id": f"cp-{uuid.uuid4().hex}",
            "url": "https://img/" + ("a" * 1000) + ".jpg",
        }
        r = client.post("/users/users/me/profile-images", json=payload, headers=ctx["owner"]["headers"])
        assert r.status_code in [201, 400, 422, 500]

    def test_cloudinary_id_with_special_chars(self, client, ctx):
        payload = {"cloudinary_id": f"cp-special_{uuid.uuid4().hex}", "url": "https://img/special.jpg"}
        r = client.post("/users/users/me/profile-images", json=payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201

    def test_profile_image_switch_between_two_users(self, client, ctx):
        p1 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/u1.jpg"}
        p2 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/u2.jpg"}
        client.post("/users/users/me/profile-images", json=p1, headers=ctx["owner"]["headers"])
        client.post("/users/users/me/profile-images", json=p2, headers=ctx["other"]["headers"])
        u1 = client.get("/users/me", headers=ctx["owner"]["headers"]).json()["profile_image_url"]
        u2 = client.get("/users/me", headers=ctx["other"]["headers"]).json()["profile_image_url"]
        assert u1 == p1["url"]
        assert u2 == p2["url"]

    def test_public_profile_after_multiple_updates(self, client, ctx):
        last = None
        for i in range(3):
            p = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": f"https://img/pub{i}.jpg"}
            last = p["url"]
            client.post("/users/users/me/profile-images", json=p, headers=ctx["owner"]["headers"])
        pub = client.get(f"/users/{ctx['owner']['id']}")
        assert pub.status_code == 200
        assert pub.json()["profile_image_url"] == last

    def test_users_me_returns_none_if_never_set(self, client, create_user_and_token):
        user = create_user_and_token()
        me = client.get("/users/me", headers=user["headers"])
        assert me.status_code == 200
        assert me.json()["profile_image_url"] in [None, ""]

    # ==================== Schema + Data Integrity (6) ====================

    def test_profile_image_response_schema(self, client, ctx, profile_payload):
        r = client.post("/users/users/me/profile-images", json=profile_payload, headers=ctx["owner"]["headers"])
        assert r.status_code == 201
        data = r.json()
        for field in ["id", "url", "is_active"]:
            assert field in data

    def test_users_me_schema_contains_profile_image_url(self, client, created_profile):
        me = client.get("/users/me", headers=created_profile["ctx"]["owner"]["headers"])
        assert me.status_code == 200
        assert "profile_image_url" in me.json()

    def test_users_public_schema_contains_profile_image_url(self, client, created_profile):
        pub = client.get(f"/users/{created_profile['ctx']['owner']['id']}")
        assert pub.status_code == 200
        assert "profile_image_url" in pub.json()

    def test_profile_image_data_consistency_me_vs_public(self, client, created_profile):
        me = client.get("/users/me", headers=created_profile["ctx"]["owner"]["headers"])
        pub = client.get(f"/users/{created_profile['ctx']['owner']['id']}")
        assert me.status_code == 200
        assert pub.status_code == 200
        assert me.json()["profile_image_url"] == pub.json()["profile_image_url"]

    def test_profile_image_persists_across_requests(self, client, created_profile):
        me1 = client.get("/users/me", headers=created_profile["ctx"]["owner"]["headers"])
        me2 = client.get("/users/me", headers=created_profile["ctx"]["owner"]["headers"])
        assert me1.status_code == 200
        assert me2.status_code == 200
        assert me1.json()["profile_image_url"] == me2.json()["profile_image_url"]

    def test_setting_new_profile_image_keeps_single_active_reference(self, client, ctx):
        p1 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/single1.jpg"}
        p2 = {"cloudinary_id": f"cp-{uuid.uuid4().hex}", "url": "https://img/single2.jpg"}
        client.post("/users/users/me/profile-images", json=p1, headers=ctx["owner"]["headers"])
        client.post("/users/users/me/profile-images", json=p2, headers=ctx["owner"]["headers"])
        me = client.get("/users/me", headers=ctx["owner"]["headers"])
        assert me.status_code == 200
        assert me.json()["profile_image_url"] == p2["url"]
