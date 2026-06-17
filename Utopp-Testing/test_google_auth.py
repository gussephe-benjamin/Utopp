import uuid

import httpx
import pytest

from config import API_BASE_URL
from auth_helpers import google_register_json, with_legal_ids


class TestGoogleAuthAPI:
    """Integration tests for Google Auth endpoints.

    Domain/institutional guard cases (hd, email_verified, @utec.edu.pe) are covered
    in test_google_utec_domain.py with mocked ID token payloads.
    """

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture(scope="module")
    def registered_user(self, client):
        suffix = uuid.uuid4().hex[:8]
        data = {
            "email": f"test.google.{suffix}@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Google Auth Test User",
        }
        register = client.post("/auth/register", json=with_legal_ids(client, data))
        assert register.status_code == 201, register.text
        return data

    # ==================== Endpoint Availability (10) ====================

    def test_google_register_endpoint_exists(self, client):
        r = client.post("/google/register", json={})
        assert r.status_code in [400, 401, 422]

    def test_google_login_endpoint_exists(self, client):
        r = client.post("/google/login", json={})
        assert r.status_code in [400, 401, 422]

    def test_google_register_get_not_allowed(self, client):
        r = client.get("/google/register")
        assert r.status_code == 405

    def test_google_login_get_not_allowed(self, client):
        r = client.get("/google/login")
        assert r.status_code == 405

    def test_google_register_put_not_allowed(self, client):
        r = client.put("/google/register", json={})
        assert r.status_code == 405

    def test_google_login_put_not_allowed(self, client):
        r = client.put("/google/login", json={})
        assert r.status_code == 405

    def test_google_register_delete_not_allowed(self, client):
        r = client.delete("/google/register")
        assert r.status_code == 405

    def test_google_login_delete_not_allowed(self, client):
        r = client.delete("/google/login")
        assert r.status_code == 405

    def test_google_register_patch_not_allowed(self, client):
        r = client.patch("/google/register", json={})
        assert r.status_code == 405

    def test_google_login_patch_not_allowed(self, client):
        r = client.patch("/google/login", json={})
        assert r.status_code == 405

    # ==================== Token Required Validation (12) ====================

    def test_google_register_missing_token(self, client):
        r = client.post("/google/register", json={})
        assert r.status_code in [400, 422]

    def test_google_login_missing_token(self, client):
        r = client.post("/google/login", json={})
        assert r.status_code in [400, 422]

    def test_google_register_token_none(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": None}))
        assert r.status_code in [400, 422]

    def test_google_login_token_none(self, client):
        r = client.post("/google/login", json={"token": None})
        assert r.status_code == 400

    def test_google_register_token_empty(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": ""}))
        assert r.status_code in [400, 422]

    def test_google_login_token_empty(self, client):
        r = client.post("/google/login", json={"token": ""})
        assert r.status_code == 400

    def test_google_register_token_whitespace(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": "   "}))
        assert r.status_code in [401, 500]

    def test_google_login_token_whitespace(self, client):
        r = client.post("/google/login", json={"token": "   "})
        assert r.status_code in [401, 500]

    def test_google_register_without_json_body(self, client):
        r = client.post("/google/register")
        assert r.status_code in [400, 422]

    def test_google_login_without_json_body(self, client):
        r = client.post("/google/login")
        assert r.status_code in [400, 422]

    def test_google_register_with_null_body(self, client):
        r = client.post("/google/register", content="null", headers={"Content-Type": "application/json"})
        assert r.status_code in [400, 422, 500]

    def test_google_login_with_null_body(self, client):
        r = client.post("/google/login", content="null", headers={"Content-Type": "application/json"})
        assert r.status_code in [400, 422, 500]

    # ==================== Invalid Token Behavior (10) ====================

    def test_google_register_invalid_token_plaintext(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": "invalid-token"}))
        assert r.status_code in [401, 500]

    def test_google_login_invalid_token_plaintext(self, client):
        r = client.post("/google/login", json={"token": "invalid-token"})
        assert r.status_code in [401, 500]

    def test_google_register_invalid_jwt_like_token(self, client):
        token = "a.b.c"
        r = client.post("/google/register", json=google_register_json(client, {"token": token}))
        assert r.status_code in [401, 500]

    def test_google_login_invalid_jwt_like_token(self, client):
        token = "a.b.c"
        r = client.post("/google/login", json={"token": token})
        assert r.status_code in [401, 500]

    def test_google_register_random_long_token(self, client):
        token = "x" * 5000
        r = client.post("/google/register", json=google_register_json(client, {"token": token}))
        assert r.status_code in [401, 500]

    def test_google_login_random_long_token(self, client):
        token = "x" * 5000
        r = client.post("/google/login", json={"token": token})
        assert r.status_code in [401, 500]

    def test_google_register_fake_bearer_token_string(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": "Bearer fake"}))
        assert r.status_code in [401, 500]

    def test_google_login_fake_bearer_token_string(self, client):
        r = client.post("/google/login", json={"token": "Bearer fake"})
        assert r.status_code in [401, 500]

    def test_google_register_unicode_token(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": "トークン無効"}))
        assert r.status_code in [401, 500]

    def test_google_login_unicode_token(self, client):
        r = client.post("/google/login", json={"token": "トークン無効"})
        assert r.status_code in [401, 500]

    # ==================== Payload Shape Validation (10) ====================

    def test_google_register_token_wrong_type_number(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": 123}))
        assert r.status_code in [401, 422, 500]

    def test_google_login_token_wrong_type_number(self, client):
        r = client.post("/google/login", json={"token": 123})
        assert r.status_code in [401, 422, 500]

    def test_google_register_token_wrong_type_object(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": {"x": 1}}))
        assert r.status_code in [401, 422, 500]

    def test_google_login_token_wrong_type_object(self, client):
        r = client.post("/google/login", json={"token": {"x": 1}})
        assert r.status_code in [401, 422, 500]

    def test_google_register_token_wrong_type_array(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": ["a", "b"]}))
        assert r.status_code in [401, 422, 500]

    def test_google_login_token_wrong_type_array(self, client):
        r = client.post("/google/login", json={"token": ["a", "b"]})
        assert r.status_code in [401, 422, 500]

    def test_google_register_with_extra_fields(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": "invalid-token", "foo": "bar"}))
        assert r.status_code in [401, 500]

    def test_google_login_with_extra_fields(self, client):
        r = client.post("/google/login", json={"token": "invalid-token", "foo": "bar"})
        assert r.status_code in [401, 500]

    def test_google_register_payload_as_array(self, client):
        r = client.post("/google/register", json=["token", "abc"])
        assert r.status_code in [400, 422, 500]

    def test_google_login_payload_as_array(self, client):
        r = client.post("/google/login", json=["token", "abc"])
        assert r.status_code in [400, 422, 500]

    # ==================== Edge and Regression Cases (10) ====================

    def test_google_register_existing_local_user_with_invalid_google_token(self, client, registered_user):
        r = client.post("/google/register", json=google_register_json(client, {"token": "invalid-token"}))
        assert r.status_code in [401, 500]

    def test_google_login_existing_local_user_with_invalid_google_token(self, client, registered_user):
        r = client.post("/google/login", json={"token": "invalid-token"})
        assert r.status_code in [401, 500]

    def test_google_register_content_type_text_plain(self, client):
        r = client.post("/google/register", content="token=abc", headers={"Content-Type": "text/plain"})
        assert r.status_code in [400, 422, 500]

    def test_google_login_content_type_text_plain(self, client):
        r = client.post("/google/login", content="token=abc", headers={"Content-Type": "text/plain"})
        assert r.status_code in [400, 422, 500]

    def test_google_register_invalid_json(self, client):
        r = client.post("/google/register", content="{bad json", headers={"Content-Type": "application/json"})
        assert r.status_code in [400, 422]

    def test_google_login_invalid_json(self, client):
        r = client.post("/google/login", content="{bad json", headers={"Content-Type": "application/json"})
        assert r.status_code in [400, 422]

    def test_google_register_response_on_missing_token_has_detail(self, client):
        r = client.post("/google/register", json={})
        assert r.status_code in [400, 422]
        assert "detail" in r.json()

    def test_google_login_response_on_missing_token_has_detail(self, client):
        r = client.post("/google/login", json={})
        assert r.status_code == 400
        assert "detail" in r.json()

    def test_google_register_invalid_token_has_detail(self, client):
        r = client.post("/google/register", json=google_register_json(client, {"token": "invalid-token"}))
        assert r.status_code in [401, 500]
        assert "detail" in r.json()

    def test_google_login_invalid_token_has_detail(self, client):
        r = client.post("/google/login", json={"token": "invalid-token"})
        assert r.status_code in [401, 500]
        assert "detail" in r.json()
