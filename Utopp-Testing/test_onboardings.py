import time
import uuid

import httpx
import pytest

from config import API_BASE_URL
from auth_helpers import with_legal_ids


class TestOnboardingsAPI:
    """Integration tests for Onboarding API endpoints."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        """Return a callable that creates a unique user and logs in."""

        def _create_user_and_token():
            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.onboarding.{suffix}@utec.edu.pe"
            password = "TestPassword123!"
            full_name = "Test Onboarding User"

            register_response = client.post(
                "/auth/register",
                json=with_legal_ids(
                    client,
                    {"email": email, "password": password, "full_name": full_name},
                ),
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
    def auth_context(self, create_user_and_token):
        return create_user_and_token()

    @pytest.fixture
    def auth_headers(self, auth_context):
        return auth_context["headers"]

    @pytest.fixture
    def test_user_id(self, auth_context):
        return auth_context["id"]

    @pytest.fixture
    def completed_context(self, client, create_user_and_token):
        ctx = create_user_and_token()
        payload = {
            "career": "Computer Science",
            "interests": ["AI", "Backend"],
            "availability": 20,
            "cycle": 5,
        }
        update_response = client.post("/onboarding/update", json=payload, headers=ctx["headers"])
        assert update_response.status_code == 200, update_response.text
        return ctx

    @pytest.fixture
    def valid_onboarding_payload(self):
        return {
            "career": "Computer Science",
            "interests": ["AI", "Backend"],
            "availability": 20,
            "cycle": 5,
        }

    # ==================== Happy Path Tests (10) ====================

    def test_is_complete_existing_user_default_false(self, client, auth_context):
        response = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == auth_context["id"]
        assert data["onboarding_completed"] is False

    def test_get_me_authenticated_success(self, client, auth_headers):
        response = client.get("/onboarding/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "onboarding_completed" in data

    def test_update_onboarding_success(self, client, auth_headers, valid_onboarding_payload):
        response = client.post("/onboarding/update", json=valid_onboarding_payload, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["onboarding_completed"] is True

    def test_is_complete_after_update_true(self, client, completed_context):
        response = client.post("/onboarding/isComplete", json={"id": completed_context["id"]})
        assert response.status_code == 200
        assert response.json()["onboarding_completed"] is True

    def test_me_after_update_true(self, client, completed_context):
        response = client.get("/onboarding/me", headers=completed_context["headers"])
        assert response.status_code == 200
        assert response.json()["onboarding_completed"] is True

    def test_me_matches_is_complete(self, client, completed_context):
        me_response = client.get("/onboarding/me", headers=completed_context["headers"])
        complete_response = client.post("/onboarding/isComplete", json={"id": completed_context["id"]})
        assert me_response.status_code == 200
        assert complete_response.status_code == 200
        assert me_response.json()["onboarding_completed"] == complete_response.json()["onboarding_completed"]

    def test_is_complete_idempotent_read(self, client, auth_context):
        response1 = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})
        response2 = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["onboarding_completed"] == response2.json()["onboarding_completed"]

    def test_me_idempotent_read(self, client, auth_headers):
        response1 = client.get("/onboarding/me", headers=auth_headers)
        response2 = client.get("/onboarding/me", headers=auth_headers)
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["id"] == response2.json()["id"]

    def test_update_then_me_keeps_same_user_identity(self, client, auth_context, valid_onboarding_payload):
        update_response = client.post(
            "/onboarding/update", json=valid_onboarding_payload, headers=auth_context["headers"]
        )
        me_response = client.get("/onboarding/me", headers=auth_context["headers"])
        assert update_response.status_code == 200
        assert me_response.status_code == 200
        assert me_response.json()["id"] == auth_context["id"]

    # ==================== Authentication / Authorization Tests (12) ====================

    def test_me_without_auth(self, client):
        response = client.get("/onboarding/me")
        assert response.status_code == 401

    def test_update_without_auth(self, client, valid_onboarding_payload):
        response = client.post("/onboarding/update", json=valid_onboarding_payload)
        assert response.status_code == 401

    def test_me_with_invalid_token(self, client):
        response = client.get("/onboarding/me", headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401

    def test_update_with_invalid_token(self, client, valid_onboarding_payload):
        response = client.post(
            "/onboarding/update",
            json=valid_onboarding_payload,
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_me_with_malformed_token(self, client):
        response = client.get("/onboarding/me", headers={"Authorization": "Bearer not.a.jwt"})
        assert response.status_code == 401

    def test_update_with_malformed_token(self, client, valid_onboarding_payload):
        response = client.post(
            "/onboarding/update",
            json=valid_onboarding_payload,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert response.status_code == 401

    def test_is_complete_without_auth_allowed(self, client, auth_context):
        response = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})
        assert response.status_code == 200

    def test_is_complete_with_invalid_token_still_allowed(self, client, auth_context):
        response = client.post(
            "/onboarding/isComplete",
            json={"id": auth_context["id"]},
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 200

    def test_is_complete_with_malformed_token_still_allowed(self, client, auth_context):
        response = client.post(
            "/onboarding/isComplete",
            json={"id": auth_context["id"]},
            headers={"Authorization": "Bearer malformed"},
        )
        assert response.status_code == 200

    def test_user_token_scope_me_returns_same_user(self, client, auth_context):
        response = client.get("/onboarding/me", headers=auth_context["headers"])
        assert response.status_code == 200
        assert response.json()["id"] == auth_context["id"]

    def test_another_user_token_returns_other_identity(self, client, create_user_and_token):
        ctx_one = create_user_and_token()
        ctx_two = create_user_and_token()
        response = client.get("/onboarding/me", headers=ctx_two["headers"])
        assert response.status_code == 200
        assert response.json()["id"] == ctx_two["id"]
        assert response.json()["id"] != ctx_one["id"]

    def test_update_with_other_user_token_updates_token_owner(self, client, create_user_and_token, valid_onboarding_payload):
        ctx_one = create_user_and_token()
        ctx_two = create_user_and_token()

        response = client.post("/onboarding/update", json=valid_onboarding_payload, headers=ctx_two["headers"])
        assert response.status_code == 200

        is_complete_one = client.post("/onboarding/isComplete", json={"id": ctx_one["id"]})
        is_complete_two = client.post("/onboarding/isComplete", json={"id": ctx_two["id"]})
        assert is_complete_one.status_code == 200
        assert is_complete_two.status_code == 200
        assert is_complete_one.json()["onboarding_completed"] is False
        assert is_complete_two.json()["onboarding_completed"] is True

    # ==================== Data Validation Tests (14) ====================

    def test_update_missing_career(self, client, auth_headers):
        payload = {"interests": ["AI"], "availability": 10, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_missing_interests(self, client, auth_headers):
        payload = {"career": "Computer Science", "availability": 10, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_missing_availability(self, client, auth_headers):
        payload = {"career": "Computer Science", "interests": ["AI"], "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_missing_cycle(self, client, auth_headers):
        payload = {"career": "Computer Science", "interests": ["AI"], "availability": 10}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_empty_body(self, client, auth_headers):
        response = client.post("/onboarding/update", json={}, headers=auth_headers)
        assert response.status_code == 422

    def test_update_invalid_career_type(self, client, auth_headers):
        payload = {"career": {"name": "CS"}, "interests": ["AI"], "availability": 10, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_invalid_interests_type(self, client, auth_headers):
        payload = {"career": "CS", "interests": 123, "availability": 10, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_invalid_interests_item_type(self, client, auth_headers):
        payload = {"career": "CS", "interests": ["AI", {"topic": "ML"}], "availability": 10, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_invalid_availability_type(self, client, auth_headers):
        payload = {"career": "CS", "interests": ["AI"], "availability": "many", "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_invalid_cycle_type(self, client, auth_headers):
        payload = {"career": "CS", "interests": ["AI"], "availability": 10, "cycle": "fifth"}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_is_complete_missing_id(self, client):
        response = client.post("/onboarding/isComplete", json={})
        assert response.status_code == 422

    def test_is_complete_invalid_id_type_string(self, client):
        response = client.post("/onboarding/isComplete", json={"id": "abc"})
        assert response.status_code == 422

    def test_is_complete_invalid_id_type_object(self, client):
        response = client.post("/onboarding/isComplete", json={"id": {"value": 1}})
        assert response.status_code == 422

    def test_update_accepts_empty_interests_list(self, client, auth_headers):
        payload = {"career": "CS", "interests": [], "availability": 10, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 200

    # ==================== Edge Case Tests (10) ====================

    def test_is_complete_nonexistent_user(self, client):
        response = client.post("/onboarding/isComplete", json={"id": 99999999})
        assert response.status_code == 401

    def test_is_complete_zero_id(self, client):
        response = client.post("/onboarding/isComplete", json={"id": 0})
        assert response.status_code == 401

    def test_is_complete_negative_id(self, client):
        response = client.post("/onboarding/isComplete", json={"id": -1})
        assert response.status_code == 401

    def test_update_repeated_returns_forbidden(self, client, completed_context, valid_onboarding_payload):
        response = client.post(
            "/onboarding/update",
            json=valid_onboarding_payload,
            headers=completed_context["headers"],
        )
        assert response.status_code == 403

    def test_update_allows_long_career_text(self, client, auth_headers):
        payload = {
            "career": "x" * 512,
            "interests": ["AI", "Robotics"],
            "availability": 10,
            "cycle": 3,
        }
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 200

    def test_update_allows_special_chars_career(self, client, auth_headers):
        payload = {
            "career": "Ing. Sistemas - IA & Data #1",
            "interests": ["AI", "Backend"],
            "availability": 10,
            "cycle": 3,
        }
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 200

    def test_update_allows_whitespace_career(self, client, auth_headers):
        payload = {
            "career": "   Computer Science   ",
            "interests": ["AI"],
            "availability": 10,
            "cycle": 3,
        }
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 200

    def test_update_accepts_zero_availability(self, client, auth_headers):
        payload = {"career": "CS", "interests": ["AI"], "availability": 0, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 200

    def test_update_accepts_zero_cycle(self, client, auth_headers):
        payload = {"career": "CS", "interests": ["AI"], "availability": 10, "cycle": 0}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 200

    def test_update_accepts_negative_cycle(self, client, auth_headers):
        payload = {"career": "CS", "interests": ["AI"], "availability": 10, "cycle": -1}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 200

    # ==================== Schema + Data Integrity Tests (6) ====================

    def test_is_complete_response_schema(self, client, auth_context):
        response = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})
        assert response.status_code == 200
        data = response.json()
        for field in ["user_id", "onboarding_completed"]:
            assert field in data, f"Missing field: {field}"

    def test_me_response_schema(self, client, auth_headers):
        response = client.get("/onboarding/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        for field in ["id", "email", "onboarding_completed"]:
            assert field in data, f"Missing field: {field}"

    def test_update_response_schema(self, client, auth_headers, valid_onboarding_payload):
        response = client.post("/onboarding/update", json=valid_onboarding_payload, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        for field in ["ok", "onboarding_completed"]:
            assert field in data, f"Missing field: {field}"

    def test_onboarding_status_persists_across_reads(self, client, completed_context):
        response1 = client.get("/onboarding/me", headers=completed_context["headers"])
        response2 = client.post("/onboarding/isComplete", json={"id": completed_context["id"]})
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["onboarding_completed"] is True
        assert response2.json()["onboarding_completed"] is True

    def test_onboarding_completion_changes_from_false_to_true(self, client, auth_context, valid_onboarding_payload):
        before = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})
        update = client.post("/onboarding/update", json=valid_onboarding_payload, headers=auth_context["headers"])
        after = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})

        assert before.status_code == 200
        assert update.status_code == 200
        assert after.status_code == 200
        assert before.json()["onboarding_completed"] is False
        assert after.json()["onboarding_completed"] is True

    def test_me_reads_are_consistent_after_completion(self, client, completed_context):
        response1 = client.get("/onboarding/me", headers=completed_context["headers"])
        response2 = client.get("/onboarding/me", headers=completed_context["headers"])
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["id"] == response2.json()["id"]
        assert response1.json()["onboarding_completed"] == response2.json()["onboarding_completed"]
