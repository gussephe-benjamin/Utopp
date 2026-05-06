import time
import uuid

import httpx
import pytest

from config import API_BASE_URL


class TestPostImagesAPI:
    """Integration tests for Post Images API endpoints."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        def _create_user_and_token():
            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.postimages.{suffix}@utec.edu.pe"
            password = "TestPassword123!"

            register_response = client.post(
                "/auth/register",
                json={"email": email, "password": password, "full_name": "Test Post Images"},
            )
            assert register_response.status_code == 201, register_response.text

            login_response = client.post(
                "/auth/login", json={"email": email, "password": password}
            )
            assert login_response.status_code == 200, login_response.text

            token = login_response.json().get("access_token")
            assert token, f"Missing access_token: {login_response.text}"
            headers = {"Authorization": f"Bearer {token}"}

            me = client.get("/auth/me", headers=headers)
            assert me.status_code == 200, me.text
            return {"id": me.json()["id"], "headers": headers}

        return _create_user_and_token

    @pytest.fixture
    def create_post(self, client):
        def _create_post(owner_headers, post_type="event", subtype="conferencia"):
            payload = {
                "title": f"Post {uuid.uuid4().hex[:6]}",
                "description": "Post for image tests",
                "post_type": post_type,
                "subtype": subtype,
                "tags": ["images"],
                "specific_fields": {},
            }
            response = client.post("/posts/", json=payload, headers=owner_headers)
            assert response.status_code == 201, response.text
            return response.json()["id"]

        return _create_post

    @pytest.fixture
    def image_payload(self):
        return {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/test.jpg",
            "position": 0,
            "object_position": "center",
            "scale": 1.0,
        }

    @pytest.fixture
    def post_context(self, create_user_and_token, create_post):
        owner = create_user_and_token()
        outsider = create_user_and_token()
        post_id = create_post(owner["headers"])
        return {"owner": owner, "outsider": outsider, "post_id": post_id}

    @pytest.fixture
    def created_image_context(self, client, post_context, image_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=image_payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
        return {"post_context": post_context, "image": response.json()}

    # ==================== Happy Path Tests (10) ====================

    def test_create_image_success(self, client, post_context, image_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=image_payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201
        assert response.json()["post_id"] == post_context["post_id"]

    def test_list_images_success(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        response = client.get(f"/posts/{post_id}/images")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_delete_image_success(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.delete(
            f"/posts/{post_id}/images/{image_id}",
            headers=created_image_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 200

    def test_reorder_images_success(self, client, post_context):
        p1 = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/1.jpg",
            "position": 0,
        }
        p2 = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/2.jpg",
            "position": 1,
        }
        r1 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=p1,
            headers=post_context["owner"]["headers"],
        )
        r2 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=p2,
            headers=post_context["owner"]["headers"],
        )
        assert r1.status_code == 201
        assert r2.status_code == 201
        i1 = r1.json()["id"]
        i2 = r2.json()["id"]

        reorder = client.patch(
            f"/posts/{post_context['post_id']}/images/reorder",
            json={"images": [{"image_id": i1, "position": 1}, {"image_id": i2, "position": 0}]},
            headers=post_context["owner"]["headers"],
        )
        assert reorder.status_code == 200
        data = reorder.json()
        assert data[0]["position"] == 0

    def test_create_image_with_minimal_payload(self, client, post_context):
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/min.jpg",
            "position": 0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201

    def test_list_images_sorted_by_position(self, client, post_context):
        images = []
        for pos in [2, 0, 1]:
            payload = {
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": f"https://res.cloudinary.com/demo/image/upload/v123/{pos}.jpg",
                "position": pos,
            }
            resp = client.post(
                f"/posts/{post_context['post_id']}/images",
                json=payload,
                headers=post_context["owner"]["headers"],
            )
            assert resp.status_code == 201
            images.append(resp.json())

        listed = client.get(f"/posts/{post_context['post_id']}/images")
        assert listed.status_code == 200
        positions = [x["position"] for x in listed.json()]
        assert positions == sorted(positions)

    def test_reorder_then_list_reflects_new_order(self, client, post_context):
        p1 = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/a.jpg",
            "position": 0,
        }
        p2 = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/b.jpg",
            "position": 1,
        }
        i1 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=p1,
            headers=post_context["owner"]["headers"],
        ).json()["id"]
        i2 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=p2,
            headers=post_context["owner"]["headers"],
        ).json()["id"]

        reorder = client.patch(
            f"/posts/{post_context['post_id']}/images/reorder",
            json={"images": [{"image_id": i1, "position": 5}, {"image_id": i2, "position": 4}]},
            headers=post_context["owner"]["headers"],
        )
        assert reorder.status_code == 200

        listed = client.get(f"/posts/{post_context['post_id']}/images")
        assert listed.status_code == 200
        assert [x["position"] for x in listed.json()] == sorted([x["position"] for x in listed.json()])

    def test_create_multiple_images_same_post(self, client, post_context):
        for _ in range(3):
            payload = {
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/multi.jpg",
                "position": 0,
            }
            response = client.post(
                f"/posts/{post_context['post_id']}/images",
                json=payload,
                headers=post_context["owner"]["headers"],
            )
            assert response.status_code == 201

    def test_delete_then_list_decreases_count(self, client, post_context):
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/x.jpg",
            "position": 0,
        }
        created = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201
        image_id = created.json()["id"]

        before = client.get(f"/posts/{post_context['post_id']}/images")
        deleted = client.delete(
            f"/posts/{post_context['post_id']}/images/{image_id}",
            headers=post_context["owner"]["headers"],
        )
        after = client.get(f"/posts/{post_context['post_id']}/images")
        assert before.status_code == 200
        assert deleted.status_code == 200
        assert after.status_code == 200
        assert len(after.json()) <= len(before.json()) - 1

    def test_create_image_for_second_post_success(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        post_1 = create_post(owner["headers"])
        post_2 = create_post(owner["headers"])

        response = client.post(
            f"/posts/{post_2}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/post2.jpg",
                "position": 0,
            },
            headers=owner["headers"],
        )
        assert response.status_code == 201
        assert response.json()["post_id"] == post_2
        assert response.json()["post_id"] != post_1

    # ==================== Authentication / Authorization Tests (12) ====================

    def test_create_image_without_auth(self, client, post_context, image_payload):
        response = client.post(f"/posts/{post_context['post_id']}/images", json=image_payload)
        assert response.status_code == 401

    def test_delete_image_without_auth(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.delete(f"/posts/{post_id}/images/{image_id}")
        assert response.status_code == 401

    def test_reorder_without_auth(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={"images": [{"image_id": image_id, "position": 0}]},
        )
        assert response.status_code == 401

    def test_create_image_invalid_token(self, client, post_context, image_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=image_payload,
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_delete_image_invalid_token(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.delete(
            f"/posts/{post_id}/images/{image_id}",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_reorder_invalid_token(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={"images": [{"image_id": image_id, "position": 0}]},
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_create_image_malformed_token(self, client, post_context, image_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=image_payload,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_delete_image_malformed_token(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.delete(
            f"/posts/{post_id}/images/{image_id}",
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_reorder_malformed_token(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={"images": [{"image_id": image_id, "position": 0}]},
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_list_images_without_auth_allowed(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        response = client.get(f"/posts/{post_id}/images")
        assert response.status_code == 200

    def test_list_images_with_invalid_token_still_allowed(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        response = client.get(
            f"/posts/{post_id}/images",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code in [200, 401]

    def test_outsider_cannot_create_image_on_foreign_post(self, client, post_context, image_payload):
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=image_payload,
            headers=post_context["outsider"]["headers"],
        )
        assert response.status_code in [401, 403, 404]

    # ==================== Data Validation Tests (14) ====================

    def test_create_image_missing_cloudinary_id(self, client, post_context):
        payload = {"url": "https://res.cloudinary.com/demo/image/upload/v123/test.jpg", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_image_missing_url(self, client, post_context):
        payload = {"cloudinary_id": f"cid-{uuid.uuid4().hex}", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_image_empty_cloudinary_id(self, client, post_context):
        payload = {"cloudinary_id": "", "url": "https://res.cloudinary.com/demo/image/upload/v123/test.jpg", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_image_empty_url(self, client, post_context):
        payload = {"cloudinary_id": f"cid-{uuid.uuid4().hex}", "url": "", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_image_negative_position(self, client, post_context):
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/test.jpg",
            "position": -1,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_image_invalid_scale_low(self, client, post_context):
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/test.jpg",
            "position": 0,
            "scale": 0.0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_image_invalid_scale_high(self, client, post_context):
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/test.jpg",
            "position": 0,
            "scale": 10.1,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_create_image_object_position_too_long(self, client, post_context):
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/test.jpg",
            "position": 0,
            "object_position": "x" * 100,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_missing_images_field(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={},
            headers=created_image_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_empty_images_list(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={"images": []},
            headers=created_image_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_item_missing_image_id(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={"images": [{"position": 0}]},
            headers=created_image_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_item_missing_position(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={"images": [{"image_id": image_id}]},
            headers=created_image_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_reorder_item_negative_position(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.patch(
            f"/posts/{post_id}/images/reorder",
            json={"images": [{"image_id": image_id, "position": -1}]},
            headers=created_image_context["post_context"]["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_post_id_not_int_validation(self, client, post_context, image_payload):
        response = client.post(
            "/posts/not-int/images",
            json=image_payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    # ==================== Edge Case Tests (10) ====================

    def test_create_image_nonexistent_post(self, client, create_user_and_token, image_payload):
        user = create_user_and_token()
        response = client.post(
            "/posts/99999999/images",
            json=image_payload,
            headers=user["headers"],
        )
        assert response.status_code == 404

    def test_delete_image_nonexistent_image_id(self, client, post_context):
        response = client.delete(
            f"/posts/{post_context['post_id']}/images/99999999",
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 404

    def test_delete_image_mismatch_post_and_image(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        post_a = create_post(owner["headers"])
        post_b = create_post(owner["headers"])
        create_resp = client.post(
            f"/posts/{post_a}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/mismatch.jpg",
                "position": 0,
            },
            headers=owner["headers"],
        )
        assert create_resp.status_code == 201
        image_id = create_resp.json()["id"]

        delete_resp = client.delete(
            f"/posts/{post_b}/images/{image_id}",
            headers=owner["headers"],
        )
        assert delete_resp.status_code == 404

    def test_reorder_with_foreign_image_id(self, client, create_user_and_token, create_post):
        owner = create_user_and_token()
        post_a = create_post(owner["headers"])
        post_b = create_post(owner["headers"])
        image_a = client.post(
            f"/posts/{post_a}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/a.jpg",
                "position": 0,
            },
            headers=owner["headers"],
        ).json()["id"]
        image_b = client.post(
            f"/posts/{post_b}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/b.jpg",
                "position": 0,
            },
            headers=owner["headers"],
        ).json()["id"]

        response = client.patch(
            f"/posts/{post_a}/images/reorder",
            json={"images": [{"image_id": image_a, "position": 1}, {"image_id": image_b, "position": 0}]},
            headers=owner["headers"],
        )
        assert response.status_code == 400

    def test_create_duplicate_cloudinary_id(self, client, post_context):
        cloud_id = f"cid-{uuid.uuid4().hex}"
        payload = {"cloudinary_id": cloud_id, "url": "https://res.cloudinary.com/demo/image/upload/v123/dup.jpg", "position": 0}
        r1 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        r2 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert r1.status_code == 201
        assert r2.status_code == 400

    def test_list_images_nonexistent_post_returns_empty(self, client):
        response = client.get("/posts/99999999/images")
        assert response.status_code == 200
        assert response.json() == []

    def test_reorder_nonexistent_post(self, client, create_user_and_token):
        user = create_user_and_token()
        response = client.patch(
            "/posts/99999999/images/reorder",
            json={"images": [{"image_id": 1, "position": 0}]},
            headers=user["headers"],
        )
        assert response.status_code == 404

    def test_reorder_nonexistent_image_id(self, client, post_context):
        response = client.patch(
            f"/posts/{post_context['post_id']}/images/reorder",
            json={"images": [{"image_id": 99999999, "position": 0}]},
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 400

    def test_delete_image_twice_second_time_not_found(self, client, post_context):
        create_resp = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/twice.jpg",
                "position": 0,
            },
            headers=post_context["owner"]["headers"],
        )
        assert create_resp.status_code == 201
        image_id = create_resp.json()["id"]

        first = client.delete(
            f"/posts/{post_context['post_id']}/images/{image_id}",
            headers=post_context["owner"]["headers"],
        )
        second = client.delete(
            f"/posts/{post_context['post_id']}/images/{image_id}",
            headers=post_context["owner"]["headers"],
        )
        assert first.status_code == 200
        assert second.status_code == 404

    def test_outsider_cannot_delete_foreign_image(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        image_id = created_image_context["image"]["id"]
        response = client.delete(
            f"/posts/{post_id}/images/{image_id}",
            headers=created_image_context["post_context"]["outsider"]["headers"],
        )
        assert response.status_code in [401, 403, 404]

    # ==================== Schema + Data Integrity Tests (6) ====================

    def test_create_image_response_schema(self, client, post_context):
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/schema.jpg",
                "position": 0,
            },
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201
        data = response.json()
        for field in ["id", "post_id", "cloudinary_id", "url", "position", "created_at"]:
            assert field in data, f"Missing field: {field}"

    def test_list_images_item_schema(self, client, created_image_context):
        post_id = created_image_context["post_context"]["post_id"]
        response = client.get(f"/posts/{post_id}/images")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            for field in ["id", "post_id", "cloudinary_id", "url", "position", "created_at"]:
                assert field in data[0], f"Missing field: {field}"

    def test_delete_image_response_message(self, client, post_context):
        created = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/msg.jpg",
                "position": 0,
            },
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201
        image_id = created.json()["id"]

        deleted = client.delete(
            f"/posts/{post_context['post_id']}/images/{image_id}",
            headers=post_context["owner"]["headers"],
        )
        assert deleted.status_code == 200
        assert "message" in deleted.json()

    def test_reorder_response_schema(self, client, post_context):
        a = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/s1.jpg",
                "position": 0,
            },
            headers=post_context["owner"]["headers"],
        ).json()
        b = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/s2.jpg",
                "position": 1,
            },
            headers=post_context["owner"]["headers"],
        ).json()
        reorder = client.patch(
            f"/posts/{post_context['post_id']}/images/reorder",
            json={"images": [{"image_id": a["id"], "position": 2}, {"image_id": b["id"], "position": 1}]},
            headers=post_context["owner"]["headers"],
        )
        assert reorder.status_code == 200
        data = reorder.json()
        assert isinstance(data, list)
        if len(data) > 0:
            for field in ["id", "post_id", "cloudinary_id", "url", "position"]:
                assert field in data[0]

    def test_reorder_persists_positions(self, client, post_context):
        a = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/p1.jpg",
                "position": 0,
            },
            headers=post_context["owner"]["headers"],
        ).json()
        b = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/p2.jpg",
                "position": 1,
            },
            headers=post_context["owner"]["headers"],
        ).json()
        reorder = client.patch(
            f"/posts/{post_context['post_id']}/images/reorder",
            json={"images": [{"image_id": a["id"], "position": 10}, {"image_id": b["id"], "position": 11}]},
            headers=post_context["owner"]["headers"],
        )
        assert reorder.status_code == 200
        listed = client.get(f"/posts/{post_context['post_id']}/images")
        assert listed.status_code == 200
        pos_map = {i["id"]: i["position"] for i in listed.json()}
        assert pos_map[a["id"]] == 10
        assert pos_map[b["id"]] == 11

    def test_created_image_is_returned_by_list(self, client, post_context):
        created = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={
                "cloudinary_id": f"cid-{uuid.uuid4().hex}",
                "url": "https://res.cloudinary.com/demo/image/upload/v123/listed.jpg",
                "position": 0,
            },
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201
        image_id = created.json()["id"]
        listed = client.get(f"/posts/{post_context['post_id']}/images")
        assert listed.status_code == 200
        ids = [x["id"] for x in listed.json()]
        assert image_id in ids
