import time
import uuid

import httpx
import pytest

from config import API_BASE_URL
from auth_helpers import with_legal_ids


def valid_onboarding_payload(career: str = "Computer Science", cycle: int = 5) -> dict:
    return {"career": career, "cycle": cycle}


class TestOnboardingsAPI:
    """Integration tests for Onboarding API endpoints."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
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
        payload = valid_onboarding_payload()
        update_response = client.post("/onboarding/update", json=payload, headers=ctx["headers"])
        assert update_response.status_code == 200, update_response.text
        return ctx

    @pytest.fixture
    def valid_onboarding_payload_fixture(self):
        return valid_onboarding_payload()

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

    def test_update_onboarding_success(self, client, auth_headers, valid_onboarding_payload_fixture):
        response = client.post(
            "/onboarding/update", json=valid_onboarding_payload_fixture, headers=auth_headers
        )
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

    def test_update_missing_career(self, client, auth_headers):
        payload = {"cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_missing_cycle(self, client, auth_headers):
        payload = {"career": "Computer Science"}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_empty_body(self, client, auth_headers):
        response = client.post("/onboarding/update", json={}, headers=auth_headers)
        assert response.status_code == 422

    def test_update_invalid_career_type(self, client, auth_headers):
        payload = {"career": {"name": "CS"}, "cycle": 3}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_invalid_cycle_type(self, client, auth_headers):
        payload = {"career": "CS", "cycle": "fifth"}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_cycle_out_of_range(self, client, auth_headers):
        payload = {"career": "CS", "cycle": 0}
        response = client.post("/onboarding/update", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_update_repeated_returns_forbidden(self, client, completed_context, valid_onboarding_payload_fixture):
        response = client.post(
            "/onboarding/update",
            json=valid_onboarding_payload_fixture,
            headers=completed_context["headers"],
        )
        assert response.status_code == 403

    def test_onboarding_completion_changes_from_false_to_true(self, client, auth_context, valid_onboarding_payload_fixture):
        before = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})
        update = client.post(
            "/onboarding/update", json=valid_onboarding_payload_fixture, headers=auth_context["headers"]
        )
        after = client.post("/onboarding/isComplete", json={"id": auth_context["id"]})

        assert before.status_code == 200
        assert update.status_code == 200
        assert after.status_code == 200
        assert before.json()["onboarding_completed"] is False
        assert after.json()["onboarding_completed"] is True
