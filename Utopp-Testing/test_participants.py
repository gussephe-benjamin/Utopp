import time
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import pytest

from config import API_BASE_URL


class TestParticipantsAPI:
    """Integration tests for Participants API endpoints."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        def _create_user_and_token():
            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.participants.{suffix}@utec.edu.pe"
            password = "TestPassword123!"
            full_name = "Test Participants User"

            register_response = client.post(
                "/auth/register",
                json={"email": email, "password": password, "full_name": full_name},
            )
            assert register_response.status_code == 201, register_response.text

            login_response = client.post(
                "/auth/login", json={"email": email, "password": password}
            )
            assert login_response.status_code == 200, login_response.text

            token = login_response.json().get("access_token")
            assert token, f"Missing access_token: {login_response.text}"

            headers = {"Authorization": f"Bearer {token}"}
            me_response = client.get("/auth/me", headers=headers)
            assert me_response.status_code == 200, me_response.text
            user_data = me_response.json()

            return {
                "email": email,
                "password": password,
                "headers": headers,
                "id": user_data["id"],
            }

        return _create_user_and_token

    @pytest.fixture
    def create_post_helpers(self, client):
        def _create_post(owner_headers, post_type="event", subtype="conferencia", publish=True):
            payload = {
                "title": f"Event {uuid.uuid4().hex[:6]}",
                "description": "Test event description",
                "post_type": post_type,
                "subtype": subtype,
                "tags": ["qa", "participants"],
                "specific_fields": {},
            }
            create_response = client.post("/posts/", json=payload, headers=owner_headers)
            assert create_response.status_code == 201, create_response.text
            post_id = create_response.json()["id"]

            if publish:
                publish_response = client.post(f"/posts/{post_id}/publish", headers=owner_headers)
                assert publish_response.status_code == 200, publish_response.text

            return post_id

        def _participate(post_id, headers, status="interested"):
            return client.post(
                f"/posts/{post_id}/participate",
                json={"status": status},
                headers=headers,
            )

        return {
            "create_post": _create_post,
            "participate": _participate,
        }

    @pytest.fixture
    def participation_context(self, create_user_and_token, create_post_helpers):
        owner = create_user_and_token()
        participant = create_user_and_token()
        post_id = create_post_helpers["create_post"](owner["headers"], post_type="event", publish=True)
        return {"owner": owner, "participant": participant, "post_id": post_id}

    @pytest.fixture
    def created_participation_context(self, client, participation_context, create_post_helpers):
        response = create_post_helpers["participate"](
            participation_context["post_id"],
            participation_context["participant"]["headers"],
            "interested",
        )
        assert response.status_code == 201, response.text
        return participation_context

    # ==================== Happy Path Tests (10) ====================

    def test_create_participation_success(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": "interested"},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 201
        assert response.json()["post_id"] == participation_context["post_id"]

    def test_create_participation_default_status(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 201
        assert response.json()["status"] == "interested"

    def test_update_participation_success(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": "going"},
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 200
        assert response.json()["status"] == "going"

    def test_delete_participation_success(self, client, created_participation_context):
        response = client.delete(
            f"/posts/{created_participation_context['post_id']}/participation",
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 204

    def test_list_participants_success(self, client, created_participation_context):
        response = client.get(f"/posts/{created_participation_context['post_id']}/participants")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_count_participants_success(self, client, created_participation_context):
        response = client.get(f"/posts/{created_participation_context['post_id']}/participants/count")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data

    def test_list_participants_filtered_by_status(self, client, created_participation_context):
        response = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"status": "interested"},
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_participation_cycle_create_update_delete(self, client, participation_context):
        create_resp = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": "interested"},
            headers=participation_context["participant"]["headers"],
        )
        update_resp = client.patch(
            f"/posts/{participation_context['post_id']}/participation",
            json={"status": "attended"},
            headers=participation_context["participant"]["headers"],
        )
        delete_resp = client.delete(
            f"/posts/{participation_context['post_id']}/participation",
            headers=participation_context["participant"]["headers"],
        )
        assert create_resp.status_code == 201
        assert update_resp.status_code == 200
        assert delete_resp.status_code == 204

    def test_multiple_users_can_participate_same_event(self, client, create_user_and_token, create_post_helpers):
        owner = create_user_and_token()
        participant_1 = create_user_and_token()
        participant_2 = create_user_and_token()
        post_id = create_post_helpers["create_post"](owner["headers"], post_type="event", publish=True)

        r1 = create_post_helpers["participate"](post_id, participant_1["headers"], "interested")
        r2 = create_post_helpers["participate"](post_id, participant_2["headers"], "going")
        count = client.get(f"/posts/{post_id}/participants/count")

        assert r1.status_code == 201
        assert r2.status_code == 201
        assert count.status_code == 200
        assert count.json()["total"] >= 2

    def test_update_changes_state_visible_in_list(self, client, created_participation_context):
        patch_resp = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": "going"},
            headers=created_participation_context["participant"]["headers"],
        )
        list_resp = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"status": "going"},
        )
        assert patch_resp.status_code == 200
        assert list_resp.status_code == 200
        assert any(p["user_id"] == created_participation_context["participant"]["id"] for p in list_resp.json())

    # ==================== Authentication / Authorization Tests (12) ====================

    def test_create_participation_without_auth(self, client, participation_context):
        response = client.post(f"/posts/{participation_context['post_id']}/participate", json={"status": "interested"})
        assert response.status_code == 401

    def test_update_participation_without_auth(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": "going"},
        )
        assert response.status_code == 401

    def test_delete_participation_without_auth(self, client, created_participation_context):
        response = client.delete(f"/posts/{created_participation_context['post_id']}/participation")
        assert response.status_code == 401

    def test_create_participation_invalid_token(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": "interested"},
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_update_participation_invalid_token(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": "going"},
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_delete_participation_invalid_token(self, client, created_participation_context):
        response = client.delete(
            f"/posts/{created_participation_context['post_id']}/participation",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_create_participation_malformed_token(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": "interested"},
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_update_participation_malformed_token(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": "going"},
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_delete_participation_malformed_token(self, client, created_participation_context):
        response = client.delete(
            f"/posts/{created_participation_context['post_id']}/participation",
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_list_participants_without_auth_allowed(self, client, created_participation_context):
        response = client.get(f"/posts/{created_participation_context['post_id']}/participants")
        assert response.status_code == 200

    def test_count_participants_without_auth_allowed(self, client, created_participation_context):
        response = client.get(f"/posts/{created_participation_context['post_id']}/participants/count")
        assert response.status_code == 200

    def test_user_cannot_update_other_user_participation(self, client, create_user_and_token, create_post_helpers):
        owner = create_user_and_token()
        participant_owner = create_user_and_token()
        other_user = create_user_and_token()
        post_id = create_post_helpers["create_post"](owner["headers"], post_type="event", publish=True)
        create_post_helpers["participate"](post_id, participant_owner["headers"], "interested")

        response = client.patch(
            f"/posts/{post_id}/participation",
            json={"status": "going"},
            headers=other_user["headers"],
        )
        assert response.status_code == 404

    # ==================== Data Validation Tests (14) ====================

    def test_create_participation_invalid_status_value(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": "invalid_status"},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_create_participation_invalid_status_type(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": 123},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_update_participation_invalid_status_value(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": "invalid_status"},
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_update_participation_invalid_status_type(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": 999},
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_create_participation_missing_body(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code in [201, 422]

    def test_update_participation_missing_status(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={},
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_create_participation_post_id_not_int(self, client, participation_context):
        response = client.post(
            "/posts/not-an-int/participate",
            json={"status": "interested"},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_update_participation_post_id_not_int(self, client, created_participation_context):
        response = client.patch(
            "/posts/not-an-int/participation",
            json={"status": "going"},
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_delete_participation_post_id_not_int(self, client, created_participation_context):
        response = client.delete(
            "/posts/not-an-int/participation",
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 422

    def test_list_participants_invalid_status_filter(self, client, created_participation_context):
        response = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"status": "unknown"},
        )
        assert response.status_code == 422

    def test_list_participants_invalid_page_zero(self, client, created_participation_context):
        response = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"page": 0, "size": 10},
        )
        assert response.status_code in [400, 422]

    def test_list_participants_invalid_negative_page(self, client, created_participation_context):
        response = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"page": -1, "size": 10},
        )
        assert response.status_code in [400, 422]

    def test_list_participants_invalid_size_zero(self, client, created_participation_context):
        response = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"page": 1, "size": 0},
        )
        assert response.status_code in [400, 422]

    def test_count_participants_post_id_not_int(self, client):
        response = client.get("/posts/not-an-int/participants/count")
        assert response.status_code == 422

    # ==================== Edge Case Tests (10) ====================

    def test_create_participation_nonexistent_post(self, client, create_user_and_token):
        user = create_user_and_token()
        response = client.post(
            "/posts/99999999/participate",
            json={"status": "interested"},
            headers=user["headers"],
        )
        assert response.status_code == 404

    def test_create_participation_non_event_post(self, client, create_user_and_token, create_post_helpers):
        owner = create_user_and_token()
        participant = create_user_and_token()
        post_id = create_post_helpers["create_post"](
            owner["headers"], post_type="announcement", subtype="comunicado", publish=True
        )
        response = client.post(
            f"/posts/{post_id}/participate",
            json={"status": "interested"},
            headers=participant["headers"],
        )
        assert response.status_code == 400

    def test_create_participation_draft_event(self, client, create_user_and_token, create_post_helpers):
        owner = create_user_and_token()
        participant = create_user_and_token()
        post_id = create_post_helpers["create_post"](owner["headers"], post_type="event", publish=False)
        response = client.post(
            f"/posts/{post_id}/participate",
            json={"status": "interested"},
            headers=participant["headers"],
        )
        assert response.status_code == 400

    def test_create_duplicate_participation_conflict(self, client, created_participation_context):
        response = client.post(
            f"/posts/{created_participation_context['post_id']}/participate",
            json={"status": "interested"},
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 409

    def test_update_nonexistent_participation(self, client, participation_context):
        response = client.patch(
            f"/posts/{participation_context['post_id']}/participation",
            json={"status": "going"},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 404

    def test_delete_nonexistent_participation(self, client, participation_context):
        response = client.delete(
            f"/posts/{participation_context['post_id']}/participation",
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 404

    def test_list_participants_nonexistent_post_returns_empty(self, client):
        response = client.get("/posts/99999999/participants")
        assert response.status_code == 200
        assert response.json() == []

    def test_count_participants_nonexistent_post_returns_zero(self, client):
        response = client.get("/posts/99999999/participants/count")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0

    def test_list_participants_high_page_returns_empty(self, client, created_participation_context):
        response = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"page": 999, "size": 10},
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_list_participants_filter_without_matches(self, client, created_participation_context):
        response = client.get(
            f"/posts/{created_participation_context['post_id']}/participants",
            params={"status": "attended"},
        )
        assert response.status_code == 200
        assert response.json() == []

    # ==================== Schema + Data Integrity Tests (6) ====================

    def test_create_participation_response_schema(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": "interested"},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 201
        data = response.json()
        for field in ["id", "post_id", "user_id", "status", "joined_at"]:
            assert field in data, f"Missing field: {field}"

    def test_update_participation_response_schema(self, client, created_participation_context):
        response = client.patch(
            f"/posts/{created_participation_context['post_id']}/participation",
            json={"status": "going"},
            headers=created_participation_context["participant"]["headers"],
        )
        assert response.status_code == 200
        data = response.json()
        for field in ["id", "post_id", "user_id", "status", "joined_at"]:
            assert field in data, f"Missing field: {field}"

    def test_list_participants_response_item_schema(self, client, created_participation_context):
        response = client.get(f"/posts/{created_participation_context['post_id']}/participants")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            first = data[0]
            for field in ["id", "post_id", "user_id", "status", "joined_at"]:
                assert field in first, f"Missing field: {field}"

    def test_count_participants_response_schema(self, client, created_participation_context):
        response = client.get(f"/posts/{created_participation_context['post_id']}/participants/count")
        assert response.status_code == 200
        data = response.json()
        for field in ["interested", "going", "attended", "total"]:
            assert field in data, f"Missing field: {field}"

    def test_counts_match_list_length(self, client, create_user_and_token, create_post_helpers):
        owner = create_user_and_token()
        p1 = create_user_and_token()
        p2 = create_user_and_token()
        post_id = create_post_helpers["create_post"](owner["headers"], post_type="event", publish=True)
        create_post_helpers["participate"](post_id, p1["headers"], "interested")
        create_post_helpers["participate"](post_id, p2["headers"], "going")

        list_resp = client.get(f"/posts/{post_id}/participants")
        count_resp = client.get(f"/posts/{post_id}/participants/count")

        assert list_resp.status_code == 200
        assert count_resp.status_code == 200
        assert count_resp.json()["total"] == len(list_resp.json())

    def test_joined_at_is_iso_datetime_string(self, client, participation_context):
        response = client.post(
            f"/posts/{participation_context['post_id']}/participate",
            json={"status": "interested"},
            headers=participation_context["participant"]["headers"],
        )
        assert response.status_code == 201
        joined_at = response.json()["joined_at"]
        parsed = datetime.fromisoformat(joined_at.replace("Z", "+00:00"))
        assert parsed <= datetime.now(timezone.utc) + timedelta(seconds=5)
