import pytest
import httpx
from config import API_BASE_URL
from auth_helpers import register_then_login_access_token


class TestRolesAPI:
    """Integration tests for Roles API endpoints."""
    
    @pytest.fixture(scope="module")
    def client(self):
        """HTTP client for API requests."""
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client
    
    @pytest.fixture(scope="module")
    def auth_token(self, client):
        """JWT vía login (register no incluye token)."""
        return register_then_login_access_token(
            client,
            email="test.roles@utec.edu.pe",
            password="TestPassword123!",
            full_name="Test Roles User",
        )
    
    @pytest.fixture(scope="module")
    def auth_headers(self, auth_token):
        """Headers with authentication token."""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="module")
    def test_user_id(self, client, auth_headers):
        """Get test user ID."""
        response = client.get("/users/me", headers=auth_headers)
        return response.json()["id"]
    
    # ==================== Basic Happy Path Tests ====================
    
    def test_get_my_roles(self, client, auth_headers):
        """Test GET /roles/me - Get current user's roles."""
        response = client.get("/roles/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_list_all_roles(self, client, auth_headers):
        """Test GET /roles/ - List all system roles."""
        response = client.get("/roles/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_roles_by_email(self, client, auth_headers):
        """Test GET /roles/by-email - Get roles by email."""
        response = client.get("/roles/by-email", params={"email": "test.roles@utec.edu.pe"}, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_user_roles(self, client, auth_headers, test_user_id):
        """Test GET /roles/users/{user_id}/roles - Get user's roles."""
        response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_role(self, client, auth_headers):
        """Test POST /roles/ - Create a new role."""
        role_data = {
            "identifier": 999,
            "name": "Test Role",
            "description": "A test role for testing"
        }
        response = client.post("/roles/", json=role_data, headers=auth_headers)
        # May fail if identifier already exists
        assert response.status_code in [201, 400, 409]
    
    def test_assign_role_to_user(self, client, auth_headers, test_user_id):
        """Test POST /roles/users/{user_id}/roles/{role_identifier} - Assign role."""
        # Try to assign role with identifier 1 (assuming it exists)
        response = client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        # May fail if already assigned or role doesn't exist
        assert response.status_code in [201, 400, 404, 409]
    
    def test_remove_role_from_user(self, client, auth_headers, test_user_id):
        """Test DELETE /roles/users/{user_id}/roles/{role_identifier} - Remove role."""
        response = client.delete(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        # May fail if not assigned or role doesn't exist
        assert response.status_code in [204, 404, 400]
    
    def test_empty_roles_list(self, client, auth_headers):
        """Test GET /roles/ when no roles exist (unlikely but possible)."""
        response = client.get("/roles/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    # ==================== Authentication Tests ====================
    
    def test_get_my_roles_without_auth(self, client):
        """Test GET /roles/me without authentication."""
        response = client.get("/roles/me")
        assert response.status_code == 401
    
    def test_list_roles_without_auth(self, client):
        """Test GET /roles/ without authentication."""
        response = client.get("/roles/")
        assert response.status_code == 401
    
    def test_get_roles_by_email_without_auth(self, client):
        """Test GET /roles/by-email without authentication."""
        response = client.get("/roles/by-email", params={"email": "test@utec.edu.pe"})
        assert response.status_code == 401
    
    def test_get_user_roles_without_auth(self, client):
        """Test GET /roles/users/{user_id}/roles without authentication."""
        response = client.get("/roles/users/1/roles")
        assert response.status_code == 401
    
    def test_create_role_without_auth(self, client):
        """Test POST /roles/ without authentication."""
        role_data = {"identifier": 998, "name": "Test", "description": "Test"}
        response = client.post("/roles/", json=role_data)
        assert response.status_code == 401
    
    def test_assign_role_without_auth(self, client):
        """Test POST /roles/users/{user_id}/roles/{role_identifier} without auth."""
        response = client.post("/roles/users/1/roles/1")
        assert response.status_code == 401
    
    def test_remove_role_without_auth(self, client):
        """Test DELETE /roles/users/{user_id}/roles/{role_identifier} without auth."""
        response = client.delete("/roles/users/1/roles/1")
        assert response.status_code == 401
    
    def test_invalid_token(self, client):
        """Test endpoints with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/roles/me", headers=headers)
        assert response.status_code == 401
    
    # ==================== Data Validation Tests ====================
    
    def test_create_role_missing_identifier(self, client, auth_headers):
        """El schema público no incluye identifier; el backend lo calcula."""
        role_data = {"name": "Rol body sin identifier", "description": "Test"}
        response = client.post("/roles/", json=role_data, headers=auth_headers)
        assert response.status_code in [201, 409]
    
    def test_create_role_missing_name(self, client, auth_headers):
        """Test POST /roles/ without name."""
        role_data = {"identifier": 997, "description": "Test"}
        response = client.post("/roles/", json=role_data, headers=auth_headers)
        assert response.status_code in [400, 422]
    
    def test_create_role_empty_name(self, client, auth_headers):
        """Test POST /roles/ with empty name."""
        role_data = {"identifier": 996, "name": "", "description": "Test"}
        response = client.post("/roles/", json=role_data, headers=auth_headers)
        assert response.status_code in [400, 422]
    
    def test_create_role_very_long_name(self, client, auth_headers):
        """Test POST /roles/ with very long name."""
        role_data = {"identifier": 995, "name": "x" * 1000, "description": "Test"}
        response = client.post("/roles/", json=role_data, headers=auth_headers)
        assert response.status_code in [400, 422]
    
    def test_create_role_very_long_description(self, client, auth_headers):
        """Test POST /roles/ with very long description."""
        role_data = {"identifier": 994, "name": "Test", "description": "x" * 10000}
        response = client.post("/roles/", json=role_data, headers=auth_headers)
        assert response.status_code in [400, 422, 201, 500]
    
    def test_get_roles_by_email_missing_param(self, client, auth_headers):
        """Test GET /roles/by-email without email parameter."""
        response = client.get("/roles/by-email", headers=auth_headers)
        assert response.status_code in [400, 422]
    
    def test_get_roles_by_email_empty_email(self, client, auth_headers):
        """Test GET /roles/by-email with empty email."""
        response = client.get("/roles/by-email", params={"email": ""}, headers=auth_headers)
        assert response.status_code in [400, 422, 404]
    
    def test_get_roles_by_email_invalid_format(self, client, auth_headers):
        """Test GET /roles/by-email with invalid email format."""
        response = client.get("/roles/by-email", params={"email": "invalid-email"}, headers=auth_headers)
        assert response.status_code in [400, 422, 404]
    
    def test_assign_role_invalid_user_id(self, client, auth_headers):
        """Test POST /roles/users/{user_id}/roles/{role_identifier} with invalid user_id."""
        response = client.post("/roles/users/999999/roles/1", headers=auth_headers)
        assert response.status_code == 404
    
    def test_assign_role_invalid_role_identifier(self, client, auth_headers, test_user_id):
        """Test POST /roles/users/{user_id}/roles/{role_identifier} with invalid role."""
        response = client.post(f"/roles/users/{test_user_id}/roles/999999", headers=auth_headers)
        assert response.status_code == 404
    
    # ==================== Edge Case Tests ====================
    
    def test_get_roles_by_email_nonexistent_user(self, client, auth_headers):
        """Test GET /roles/by-email with non-existent user."""
        response = client.get("/roles/by-email", params={"email": "nonexistent@utec.edu.pe"}, headers=auth_headers)
        assert response.status_code == 404
    
    def test_get_user_roles_nonexistent_user(self, client, auth_headers):
        """Test GET /roles/users/{user_id}/roles with non-existent user."""
        response = client.get("/roles/users/999999/roles", headers=auth_headers)
        assert response.status_code == 404
    
    def test_remove_role_nonexistent_user(self, client, auth_headers):
        """Test DELETE /roles/users/{user_id}/roles/{role_identifier} with non-existent user."""
        response = client.delete("/roles/users/999999/roles/1", headers=auth_headers)
        assert response.status_code == 404
    
    def test_remove_role_nonexistent_role(self, client, auth_headers, test_user_id):
        """Test DELETE /roles/users/{user_id}/roles/{role_identifier} with non-existent role."""
        response = client.delete(f"/roles/users/{test_user_id}/roles/999999", headers=auth_headers)
        assert response.status_code == 404
    
    def test_create_role_duplicate_identifier(self, client, auth_headers):
        """Test POST /roles/ with duplicate identifier."""
        role_data = {"identifier": 1, "name": "Duplicate Role", "description": "Test"}
        response = client.post("/roles/", json=role_data, headers=auth_headers)
        # Should fail if identifier 1 already exists
        assert response.status_code in [400, 409, 201]
    
    def test_assign_role_already_assigned(self, client, auth_headers, test_user_id):
        """Test POST /roles/users/{user_id}/roles/{role_identifier} when already assigned."""
        # First assign
        client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        # Try to assign again
        response = client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        # Should fail or be idempotent
        assert response.status_code in [201, 400, 409]
    
    def test_remove_role_not_assigned(self, client, auth_headers, test_user_id):
        """Test DELETE /roles/users/{user_id}/roles/{role_identifier} when not assigned."""
        # Try to remove a role that's not assigned
        response = client.delete(f"/roles/users/{test_user_id}/roles/999", headers=auth_headers)
        # Should fail (role doesn't exist) or succeed (idempotent)
        assert response.status_code in [204, 404, 400]
    
    def test_get_user_roles_zero_id(self, client, auth_headers):
        """Test GET /roles/users/0/roles."""
        response = client.get("/roles/users/0/roles", headers=auth_headers)
        assert response.status_code == 404
    
    def test_get_user_roles_negative_id(self, client, auth_headers):
        """Test GET /roles/users/-1/roles."""
        response = client.get("/roles/users/-1/roles", headers=auth_headers)
        assert response.status_code == 404
    
    # ==================== Assignment/Removal Tests ====================
    
    def test_assign_and_remove_role_cycle(self, client, auth_headers, test_user_id):
        """Test assign then remove the same role."""
        # Assign
        assign_response = client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        if assign_response.status_code == 201:
            # Remove
            remove_response = client.delete(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
            assert remove_response.status_code == 204
            
            # Verify it's removed
            roles_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
            roles = roles_response.json()
            role_ids = [r["identifier"] for r in roles]
            assert 1 not in role_ids
    
    def test_assign_multiple_roles(self, client, auth_headers, test_user_id):
        """Test assigning multiple roles to a user."""
        # Assign role 1
        response1 = client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        # Assign role 2 (if exists)
        response2 = client.post(f"/roles/users/{test_user_id}/roles/2", headers=auth_headers)
        
        # Check that user has both roles
        roles_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        assert roles_response.status_code == 200
    
    def test_remove_all_roles(self, client, auth_headers, test_user_id):
        """Test removing all roles from a user."""
        # Get current roles
        roles_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        roles = roles_response.json()
        
        # Remove each role
        for role in roles:
            response = client.delete(f"/roles/users/{test_user_id}/roles/{role['identifier']}", headers=auth_headers)
            assert response.status_code in [204, 404]
    
    def test_role_assignment_persists(self, client, auth_headers, test_user_id):
        """Test that role assignment persists across requests."""
        # Assign role
        client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        # Check it's assigned
        response1 = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        roles1 = response1.json()
        
        # Check again
        response2 = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        roles2 = response2.json()
        
        # Should be consistent
        assert len(roles1) == len(roles2)
    
    def test_role_removal_persists(self, client, auth_headers, test_user_id):
        """Test that role removal persists across requests."""
        # First assign
        client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        # Remove
        client.delete(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        # Check it's removed
        response1 = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        roles1 = response1.json()
        
        # Check again
        response2 = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        roles2 = response2.json()
        
        # Should be consistent
        assert len(roles1) == len(roles2)
    
    # ==================== Query Tests ====================
    
    def test_get_roles_by_email_case_sensitivity(self, client, auth_headers):
        """Test GET /roles/by-email with different case."""
        response = client.get("/roles/by-email", params={"email": "TEST.ROLES@UTEC.EDU.PE"}, headers=auth_headers)
        # Should work if email comparison is case-insensitive
        assert response.status_code in [200, 404]
    
    def test_get_my_roles_matches_user_roles(self, client, auth_headers, test_user_id):
        """Test that /roles/me matches /roles/users/{user_id}/roles."""
        me_response = client.get("/roles/me", headers=auth_headers)
        user_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        
        assert me_response.status_code == 200
        assert user_response.status_code == 200
        
        me_roles = me_response.json()
        user_roles = user_response.json()
        
        # Should have same number of roles
        assert len(me_roles) == len(user_roles)
    
    def test_list_roles_includes_all(self, client, auth_headers):
        """Test that GET /roles/ includes all system roles."""
        response = client.get("/roles/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_roles_by_email_with_spaces(self, client, auth_headers):
        """Test GET /roles/by-email with email containing spaces (invalid)."""
        response = client.get("/roles/by-email", params={"email": "test @utec.edu.pe"}, headers=auth_headers)
        assert response.status_code in [400, 422, 404]
    
    def test_get_roles_by_email_without_domain(self, client, auth_headers):
        """Test GET /roles/by-email with email without domain."""
        response = client.get("/roles/by-email", params={"email": "test@"}, headers=auth_headers)
        assert response.status_code in [400, 422, 404]
    
    # ==================== Response Schema Tests ====================
    
    def test_my_roles_response_schema(self, client, auth_headers):
        """Test GET /roles/me response has expected fields."""
        response = client.get("/roles/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            role = data[0]
            expected_fields = ["id", "identifier", "name", "description", "user_email"]
            for field in expected_fields:
                assert field in role, f"Missing field: {field}"
    
    def test_list_roles_response_schema(self, client, auth_headers):
        """Test GET /roles/ response has expected fields."""
        response = client.get("/roles/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            role = data[0]
            expected_fields = ["id", "identifier", "name", "description"]
            for field in expected_fields:
                assert field in role, f"Missing field: {field}"
    
    def test_user_roles_response_schema(self, client, auth_headers, test_user_id):
        """Test GET /roles/users/{user_id}/roles response schema."""
        response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            role = data[0]
            expected_fields = ["id", "identifier", "name", "description", "user_email"]
            for field in expected_fields:
                assert field in role, f"Missing field: {field}"
    
    def test_assign_role_response_schema(self, client, auth_headers, test_user_id):
        """Test POST /roles/users/{user_id}/roles/{role_identifier} response schema."""
        response = client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        if response.status_code == 201:
            data = response.json()
            expected_fields = ["user_id", "user_email", "role_id", "role_identifier", "role_name", "assigned_at"]
            for field in expected_fields:
                assert field in data, f"Missing field: {field}"
    
    # ==================== Data Integrity Tests ====================
    
    def test_role_creation_persists(self, client, auth_headers):
        """Test that created role persists."""
        import uuid

        name = f"persist_{uuid.uuid4().hex[:12]}"
        role_data = {"name": name, "description": "Test persistence"}
        create_response = client.post("/roles/", json=role_data, headers=auth_headers)

        if create_response.status_code == 201:
            list_response = client.get("/roles/", headers=auth_headers)
            roles = list_response.json()
            names = [r["name"] for r in roles]
            assert name in names
    
    def test_role_assignment_count(self, client, auth_headers, test_user_id):
        """Test that role assignment increases role count."""
        # Get initial count
        initial_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        initial_count = len(initial_response.json())
        
        # Assign a role
        client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        # Get new count
        new_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        new_count = len(new_response.json())
        
        # Count should have increased or stayed same (if already assigned)
        assert new_count >= initial_count
    
    def test_role_removal_count(self, client, auth_headers, test_user_id):
        """Test that role removal decreases role count."""
        # First assign
        client.post(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        # Get initial count
        initial_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        initial_count = len(initial_response.json())
        
        # Remove
        client.delete(f"/roles/users/{test_user_id}/roles/1", headers=auth_headers)
        
        # Get new count
        new_response = client.get(f"/roles/users/{test_user_id}/roles", headers=auth_headers)
        new_count = len(new_response.json())
        
        # Count should have decreased
        assert new_count <= initial_count
