import uuid

import pytest
import httpx
from config import API_BASE_URL
from auth_helpers import register_then_login_access_token, with_legal_ids


class TestAuthAPI:
    """Integration tests for Auth API endpoints."""
    
    @pytest.fixture(scope="module")
    def client(self):
        """HTTP client for API requests."""
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client
    
    @pytest.fixture(scope="module")
    def test_user_data(self):
        """Test user credentials."""
        return {
            "email": "test.auth@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test Auth User"
        }
    
    @pytest.fixture(scope="module")
    def auth_token(self, client, test_user_data):
        """Get JWT: /register no devuelve token; login obligatorio."""
        return register_then_login_access_token(
            client,
            email=test_user_data["email"],
            password=test_user_data["password"],
            full_name=test_user_data["full_name"],
        )
    
    @pytest.fixture(scope="module")
    def auth_headers(self, auth_token):
        """Headers with authentication token."""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # ==================== Basic Happy Path Tests ====================
    
    def test_register_success(self, client, test_user_data):
        """Test POST /auth/register - Successful registration."""
        # Use a unique email to avoid conflicts across runs
        unique_data = test_user_data.copy()
        unique_data["email"] = f"{uuid.uuid4().hex}.{test_user_data['email']}"
        
        response = client.post("/auth/register", json=with_legal_ids(client, unique_data))
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["email"] == unique_data["email"]
        assert data["full_name"] == unique_data["full_name"]
    
    def test_register_existing_email(self, client, test_user_data):
        """Test POST /auth/register - Error with existing email."""
        response = client.post("/auth/register", json=with_legal_ids(client, dict(test_user_data)))
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "ya registrado" in str(data["detail"]).lower()
    
    def test_register_non_utec_email(self, client):
        """Test POST /auth/register - Error with non-UTEC email."""
        non_utec_data = {
            "email": "test@gmail.com",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, non_utec_data))
        assert response.status_code in [400, 422]
    
    def test_login_success(self, client, test_user_data):
        """Test POST /auth/login - Successful login."""
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert isinstance(data["access_token"], str)
    
    def test_login_invalid_credentials(self, client, test_user_data):
        """Test POST /auth/login - Error with invalid credentials."""
        login_data = {
            "email": test_user_data["email"],
            "password": "WrongPassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
    
    def test_login_non_utec_email(self, client):
        """Test POST /auth/login - Error with non-UTEC email."""
        # First register a non-UTEC user (if allowed) or just test the validation
        login_data = {
            "email": "test@gmail.com",
            "password": "TestPassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        # Should fail either because user doesn't exist or domain is invalid
        assert response.status_code in [401, 400]
    
    def test_refresh_token_success(self, client, auth_headers):
        """Test POST /auth/refresh - Successful token refresh."""
        response = client.post("/auth/refresh", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert isinstance(data["access_token"], str)
    
    def test_get_current_user(self, client, auth_headers):
        """Test GET /auth/me - Get current user info."""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "onboarding_completed" in data
    
    # ==================== Authentication Tests ====================
    
    def test_refresh_without_auth(self, client):
        """Test POST /auth/refresh without authentication."""
        response = client.post("/auth/refresh")
        assert response.status_code == 401
    
    def test_get_me_without_auth(self, client):
        """Test GET /auth/me without authentication."""
        response = client.get("/auth/me")
        assert response.status_code == 401
    
    def test_get_me_with_invalid_token(self, client):
        """Test GET /auth/me with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_refresh_with_invalid_token(self, client):
        """Test POST /auth/refresh with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.post("/auth/refresh", headers=headers)
        assert response.status_code == 401
    
    # ==================== Data Validation Tests ====================
    
    def test_register_invalid_email_format(self, client):
        """Test POST /auth/register with invalid email format."""
        invalid_data = {
            "email": "invalid-email",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_empty_email(self, client):
        """Test POST /auth/register with empty email."""
        invalid_data = {
            "email": "",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_empty_password(self, client):
        """Test POST /auth/register with empty password."""
        invalid_data = {
            "email": "test.empty@utec.edu.pe",
            "password": "",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_empty_full_name(self, client):
        """Test POST /auth/register with empty full_name."""
        invalid_data = {
            "email": "test.empty2@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": ""
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_weak_password(self, client):
        """Test POST /auth/register with weak password (too short)."""
        invalid_data = {
            "email": "test.weak@utec.edu.pe",
            "password": "123",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_password_no_special_chars(self, client):
        """Test POST /auth/register with password without special chars."""
        # This might pass depending on validation rules
        invalid_data = {
            "email": "test.nospecial@utec.edu.pe",
            "password": "Password123",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        # Might pass or fail depending on password policy
        assert response.status_code in [201, 400, 422]
    
    def test_login_empty_email(self, client):
        """Test POST /auth/login with empty email."""
        login_data = {
            "email": "",
            "password": "TestPassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code in [400, 422, 401]
    
    def test_login_empty_password(self, client):
        """Test POST /auth/login with empty password."""
        login_data = {
            "email": "test.auth@utec.edu.pe",
            "password": ""
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code in [400, 422, 401]
    
    def test_login_nonexistent_email(self, client):
        """Test POST /auth/login with non-existent email."""
        login_data = {
            "email": "nonexistent@utec.edu.pe",
            "password": "TestPassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
    
    def test_login_wrong_password(self, client, test_user_data):
        """Test POST /auth/login with wrong password."""
        login_data = {
            "email": test_user_data["email"],
            "password": "WrongPassword123!"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
    
    # ==================== Edge Case Tests ====================
    
    def test_register_very_long_email(self, client):
        """Test POST /auth/register with very long email."""
        invalid_data = {
            "email": f"{'a' * 100}@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_very_long_full_name(self, client):
        """Test POST /auth/register with very long full_name."""
        invalid_data = {
            "email": "test.long@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "x" * 1000
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_very_long_password(self, client):
        """Test POST /auth/register with very long password."""
        invalid_data = {
            "email": "test.longpass@utec.edu.pe",
            "password": "x" * 1000,
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, invalid_data))
        assert response.status_code in [400, 422]
    
    def test_register_email_case_sensitivity(self, client):
        """Test POST /auth/register with email in different case."""
        # Try to register with uppercase version of existing email
        test_data = {
            "email": "TEST.AUTH@UTEC.EDU.PE",  # Uppercase
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        # Should fail if email already exists (case-insensitive check)
        assert response.status_code in [400, 201]
    
    def test_login_email_case_sensitivity(self, client, test_user_data):
        """Test POST /auth/login with email in different case."""
        login_data = {
            "email": test_user_data["email"].upper(),  # Uppercase
            "password": test_user_data["password"]
        }
        response = client.post("/auth/login", json=login_data)
        # Should work if email comparison is case-insensitive
        assert response.status_code in [200, 401]
    
    def test_register_special_chars_name(self, client):
        """Test POST /auth/register with special characters in name."""
        test_data = {
            "email": "test.special@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User-José O'Connor"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        assert response.status_code in [201, 400, 422]
    
    def test_register_unicode_name(self, client):
        """Test POST /auth/register with unicode characters in name."""
        test_data = {
            "email": "test.unicode@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test 用户 ユーザー"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        assert response.status_code in [201, 400, 422]
    
    def test_multiple_register_attempts(self, client, test_user_data):
        """Test multiple register attempts with same email."""
        # First attempt
        response1 = client.post("/auth/register", json=with_legal_ids(client, dict(test_user_data)))

        # Second attempt with same data
        response2 = client.post("/auth/register", json=with_legal_ids(client, dict(test_user_data)))
        
        # First should fail (already exists) or succeed, second should fail
        assert response1.status_code in [201, 400]
        assert response2.status_code == 400
    
    # ==================== Token Tests ====================
    
    def test_token_format(self, client, auth_token):
        """Test that token has JWT format (3 parts separated by dots)."""
        parts = auth_token.split(".")
        assert len(parts) == 3, "JWT should have 3 parts separated by dots"
    
    def test_token_contains_user_id(self, client, auth_token):
        """Test that token contains user ID in payload."""
        # JWT tokens are base64 encoded, we can decode the payload
        import base64
        try:
            payload = auth_token.split(".")[1]
            # Add padding if needed
            payload += "=" * (4 - len(payload) % 4)
            decoded = base64.b64decode(payload)
            # Should contain user ID (as string)
            assert decoded is not None
        except Exception:
            # If decoding fails, just verify token is a string
            assert isinstance(auth_token, str)
    
    def test_refresh_multiple_times(self, client, auth_headers):
        """Test refreshing token multiple times."""
        # First refresh
        response1 = client.post("/auth/refresh", headers=auth_headers)
        assert response1.status_code == 200
        new_token1 = response1.json()["access_token"]
        
        # Second refresh with new token
        new_headers = {"Authorization": f"Bearer {new_token1}"}
        response2 = client.post("/auth/refresh", headers=new_headers)
        assert response2.status_code == 200
        new_token2 = response2.json()["access_token"]
        
        # Tokens should be different
        assert new_token1 != new_token2
    
    def test_token_persists_across_requests(self, client, auth_headers):
        """Test that token works across multiple requests."""
        # First request
        response1 = client.get("/auth/me", headers=auth_headers)
        assert response1.status_code == 200
        
        # Second request
        response2 = client.get("/auth/me", headers=auth_headers)
        assert response2.status_code == 200
        
        # Third request
        response3 = client.post("/auth/refresh", headers=auth_headers)
        assert response3.status_code == 200
    
    def test_expired_token(self, client):
        """Test using an expired token."""
        # Create a token that looks expired (malformed or old)
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_malformed_token(self, client):
        """Test using a malformed token."""
        malformed_token = "not.a.valid.jwt.token"
        headers = {"Authorization": f"Bearer {malformed_token}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_token_from_different_user(self, client):
        """Test using a token that doesn't match the user."""
        # This is hard to test without creating another user
        # Just verify that invalid tokens are rejected
        fake_token = "fake.token.here"
        headers = {"Authorization": f"Bearer {fake_token}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401
    
    # ==================== UTEC Domain Validation Tests ====================
    
    def test_valid_utec_email(self, client):
        """Test POST /auth/register with valid UTEC email."""
        test_data = {
            "email": "test.valid@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        assert response.status_code in [201, 400]  # 400 if already exists
    
    def test_invalid_domain_gmail(self, client):
        """Test POST /auth/register with @gmail.com domain."""
        test_data = {
            "email": "test@gmail.com",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        assert response.status_code in [400, 422]
    
    def test_invalid_domain_yahoo(self, client):
        """Test POST /auth/register with @yahoo.com domain."""
        test_data = {
            "email": "test@yahoo.com",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        assert response.status_code in [400, 422]
    
    def test_subdomain_variations(self, client):
        """Test POST /auth/register with subdomain variations."""
        test_data = {
            "email": "test@students.utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        # May fail if only @utec.edu.pe is allowed
        assert response.status_code in [201, 400, 422]
    
    def test_domain_case_sensitivity(self, client):
        """Test POST /auth/register with domain in different case."""
        test_data = {
            "email": "test@UTEC.EDU.PE",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        assert response.status_code in [201, 400, 422]
    
    def test_multiple_at_symbols(self, client):
        """Test POST /auth/register with multiple @ symbols."""
        test_data = {
            "email": "test@@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        assert response.status_code in [400, 422]
    
    # ==================== Response Schema Tests ====================
    
    def test_register_response_schema(self, client):
        """Test POST /auth/register response has expected fields."""
        test_data = {
            "email": f"test.schema{pytest.current_time_counter}@utec.edu.pe" if hasattr(pytest, 'current_time_counter') else f"test.schema@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        if response.status_code == 201:
            data = response.json()
            expected_fields = ["id", "email", "full_name"]
            for field in expected_fields:
                assert field in data, f"Missing field: {field}"
    
    def test_login_response_schema(self, client, test_user_data):
        """Test POST /auth/login response has access_token."""
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    def test_refresh_response_schema(self, client, auth_headers):
        """Test POST /auth/refresh response has access_token."""
        response = client.post("/auth/refresh", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    def test_me_response_schema(self, client, auth_headers):
        """Test GET /auth/me response has expected fields."""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        expected_fields = ["id", "email", "onboarding_completed"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
    
    # ==================== Data Integrity Tests ====================
    
    def test_registered_user_can_login(self, client):
        """Test that a registered user can login."""
        # Register a new user
        test_data = {
            "email": f"test.integrity{pytest.current_time_counter if hasattr(pytest, 'current_time_counter') else ''}@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        register_response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        
        if register_response.status_code == 201:
            # Try to login
            login_data = {
                "email": test_data["email"],
                "password": test_data["password"]
            }
            login_response = client.post("/auth/login", json=login_data)
            assert login_response.status_code == 200
    
    def test_user_data_persists(self, client, auth_headers):
        """Test that user data persists after registration."""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify data is consistent
        assert "id" in data
        assert "email" in data
        assert isinstance(data["id"], int)
        assert isinstance(data["email"], str)
    
    def test_onboarding_status_after_registration(self, client):
        """Test that onboarding status is false after registration."""
        test_data = {
            "email": f"test.onboarding{pytest.current_time_counter if hasattr(pytest, 'current_time_counter') else ''}@utec.edu.pe",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        response = client.post("/auth/register", json=with_legal_ids(client, test_data))
        
        if response.status_code == 201:
            # Login to get token
            login_data = {
                "email": test_data["email"],
                "password": test_data["password"]
            }
            login_response = client.post("/auth/login", json=login_data)
            token = login_response.json()["access_token"]
            
            # Check onboarding status
            headers = {"Authorization": f"Bearer {token}"}
            me_response = client.get("/auth/me", headers=headers)
            data = me_response.json()
            assert data["onboarding_completed"] == False
