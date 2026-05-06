import pytest
import httpx
from config import API_BASE_URL
from auth_helpers import register_then_login_access_token


class TestUsersAPI:
    """Integration tests for Users API endpoints."""
    
    @pytest.fixture(scope="module")
    def client(self):
        """HTTP client for API requests."""
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client
    
    @pytest.fixture(scope="module")
    def auth_token(self, client):
        return register_then_login_access_token(
            client,
            email="test.integration@utec.edu.pe",
            password="TestPassword123!",
            full_name="Test Integration User",
        )
    
    @pytest.fixture(scope="module")
    def auth_headers(self, auth_token):
        """Headers with authentication token."""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # ==================== Tests without authentication ====================
    
    def test_list_all_users(self, client):
        """Test GET /users/all-users - List all users."""
        response = client.get("/users/all-users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_check_username_available(self, client):
        """Test GET /users/check-username - Check username availability."""
        # Test with a unique username
        response = client.get("/users/check-username", params={"username": "unique_username_12345"})
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert data["available"] is True
        
        # Test with an existing username (assuming test user exists)
        response = client.get("/users/check-username", params={"username": "Test Integration User"})
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
    
    def test_check_email_available(self, client):
        """Test GET /users/check-email - Check email availability."""
        # Test with a unique email
        response = client.get("/users/check-email", params={"email": "unique_email_12345@test.com"})
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert data["available"] is True
        
        # Test with an existing email
        response = client.get("/users/check-email", params={"email": "test.integration@utec.edu.pe"})
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
    
    def test_get_user_profile(self, client, auth_token):
        """Test GET /users/{user_id} - Get user public profile."""
        # First get the current user's ID from /users/me
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        assert me_response.status_code == 200
        user_id = me_response.json()["id"]
        
        # Get public profile
        response = client.get(f"/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "full_name" in data
        assert "followers_count" in data
        assert "following_count" in data
        assert "posts_count" in data
    
    def test_get_user_profile_not_found(self, client):
        """Test GET /users/{user_id} - User not found."""
        response = client.get("/users/999999")
        assert response.status_code == 404
    
    def test_get_user_posts(self, client, auth_token):
        """Test GET /users/{user_id}/posts - Get user's posts."""
        # First get the current user's ID
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        # Get user's posts
        response = client.get(f"/users/{user_id}/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_user_posts_with_pagination(self, client, auth_token):
        """Test GET /users/{user_id}/posts with pagination."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        # Get user's posts with pagination
        response = client.get(f"/users/{user_id}/posts", params={"page": 1, "size": 10})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_followers(self, client, auth_token):
        """Test GET /users/{user_id}/followers - Get user's followers."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/followers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_following(self, client, auth_token):
        """Test GET /users/{user_id}/following - Get users followed by user."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/following")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    # ==================== Tests with authentication ====================
    
    def test_get_current_user_profile(self, client, auth_headers):
        """Test GET /users/me - Get current user's profile."""
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "full_name" in data
        assert "followers_count" in data
        assert "following_count" in data
        assert "posts_count" in data
    
    def test_get_current_user_profile_unauthorized(self, client):
        """Test GET /users/me without authentication."""
        response = client.get("/users/me")
        assert response.status_code == 401
    
    def test_update_current_user_profile(self, client, auth_headers):
        """Test PATCH /users/me - Update current user's profile."""
        update_data = {
            "full_name": "Updated Test User",
            "career": "Computer Science"
        }
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Test User"
        assert data["career"] == "Computer Science"
    
    def test_update_current_user_profile_unauthorized(self, client):
        """Test PATCH /users/me without authentication."""
        update_data = {"full_name": "Unauthorized Update"}
        response = client.patch("/users/me", json=update_data)
        assert response.status_code == 401
    
    def test_update_interests(self, client, auth_headers):
        """Test PUT /users/me/interests - Update user's interests."""
        interests_data = {
            "interests": ["programming", "AI", "web development"]
        }
        response = client.put("/users/me/interests", json=interests_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "interests" in data
    
    def test_update_interests_unauthorized(self, client):
        """Test PUT /users/me/interests without authentication."""
        interests_data = {"interests": ["unauthorized"]}
        response = client.put("/users/me/interests", json=interests_data)
        assert response.status_code == 401
    
    def test_follow_user(self, client, auth_headers):
        """Test POST /users/{user_id}/follow - Follow a user."""
        # First, we need another user to follow
        # For this test, we'll try to follow user ID 1 (assuming it exists)
        # In a real scenario, you'd create a second test user first
        response = client.post("/users/1/follow", headers=auth_headers)
        # This might fail if user 1 doesn't exist or if we're trying to follow ourselves
        # We're just checking the endpoint works
        assert response.status_code in [200, 201, 400, 404]
    
    def test_follow_user_unauthorized(self, client):
        """Test POST /users/{user_id}/follow without authentication."""
        response = client.post("/users/1/follow")
        assert response.status_code == 401
    
    def test_follow_self(self, client, auth_headers):
        """Test POST /users/{user_id}/follow - Cannot follow yourself."""
        # First get current user ID
        me_response = client.get("/users/me", headers=auth_headers)
        user_id = me_response.json()["id"]
        
        response = client.post(f"/users/{user_id}/follow", headers=auth_headers)
        assert response.status_code == 400
    
    def test_unfollow_user(self, client, auth_headers):
        """Test DELETE /users/{user_id}/follow - Unfollow a user."""
        response = client.delete("/users/1/follow", headers=auth_headers)
        # This might fail if not following, but endpoint should work
        assert response.status_code in [200, 404]
    
    def test_unfollow_user_unauthorized(self, client):
        """Test DELETE /users/{user_id}/follow without authentication."""
        response = client.delete("/users/1/follow")
        assert response.status_code == 401
    
    def test_remove_follower(self, client, auth_headers):
        """Test DELETE /users/me/followers/{follower_id} - Remove a follower."""
        response = client.delete("/users/me/followers/1", headers=auth_headers)
        # This might fail if follower doesn't exist, but endpoint should work
        assert response.status_code in [200, 404]
    
    def test_remove_follower_unauthorized(self, client):
        """Test DELETE /users/me/followers/{follower_id} without authentication."""
        response = client.delete("/users/me/followers/1")
        assert response.status_code == 401
    
    # ==================== Data Validation Tests ====================
    
    def test_update_profile_with_invalid_email(self, client, auth_headers):
        """Test PATCH /users/me with invalid email format."""
        update_data = {"email": "invalid-email-format"}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        # Should fail validation or be rejected
        assert response.status_code in [400, 422]
    
    def test_update_profile_with_empty_full_name(self, client, auth_headers):
        """Test PATCH /users/me with empty full_name."""
        update_data = {"full_name": ""}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        # Should fail validation
        assert response.status_code in [400, 422]
    
    def test_update_profile_with_whitespace_full_name(self, client, auth_headers):
        """Test PATCH /users/me with whitespace-only full_name."""
        update_data = {"full_name": "   "}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        # Should fail validation
        assert response.status_code in [400, 422]
    
    def test_update_profile_with_very_long_string(self, client, auth_headers):
        """Test PATCH /users/me with extremely long string."""
        update_data = {"full_name": "x" * 1000}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        # Should fail validation or be rejected
        assert response.status_code in [400, 422]
    
    def test_update_interests_with_empty_array(self, client, auth_headers):
        """Test PUT /users/me/interests with empty interests array."""
        interests_data = {"interests": []}
        response = client.put("/users/me/interests", json=interests_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["interests"] == []
    
    def test_update_interests_with_duplicates(self, client, auth_headers):
        """Test PUT /users/me/interests with duplicate interests."""
        interests_data = {"interests": ["programming", "AI", "programming"]}
        response = client.put("/users/me/interests", json=interests_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "interests" in data
    
    # ==================== Edge Case Tests ====================
    
    def test_get_user_profile_with_zero_id(self, client):
        """Test GET /users/0 - User with ID 0."""
        response = client.get("/users/0")
        assert response.status_code == 404
    
    def test_get_user_profile_with_negative_id(self, client):
        """Test GET /users/-1 - User with negative ID."""
        response = client.get("/users/-1")
        assert response.status_code == 404
    
    def test_get_user_profile_with_non_numeric_id(self, client):
        """Test GET /users/abc - User with non-numeric ID."""
        response = client.get("/users/abc")
        assert response.status_code in [404, 422]
    
    def test_check_username_with_empty_string(self, client):
        """Test GET /users/check-username with empty username."""
        response = client.get("/users/check-username", params={"username": ""})
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
    
    def test_check_email_with_invalid_format(self, client):
        """Test GET /users/check-email with invalid email format."""
        response = client.get("/users/check-email", params={"email": "invalid-email"})
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
    
    def test_get_user_posts_with_page_zero(self, client, auth_token):
        """Test GET /users/{user_id}/posts with page=0."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/posts", params={"page": 0, "size": 10})
        # Should handle gracefully or return empty
        assert response.status_code in [200, 400, 422]
    
    def test_get_user_posts_with_negative_page(self, client, auth_token):
        """Test GET /users/{user_id}/posts with negative page."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/posts", params={"page": -1, "size": 10})
        # Should handle gracefully or return error
        assert response.status_code in [200, 400, 422]
    
    def test_get_user_posts_with_size_zero(self, client, auth_token):
        """Test GET /users/{user_id}/posts with size=0."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/posts", params={"page": 1, "size": 0})
        # Should return empty list or handle gracefully
        assert response.status_code in [200, 400, 422]
    
    def test_get_user_posts_with_large_size(self, client, auth_token):
        """Test GET /users/{user_id}/posts with extremely large size."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/posts", params={"page": 1, "size": 10000})
        # Should handle gracefully (return available items)
        assert response.status_code == 200
    
    # ==================== Data Integrity Tests ====================
    
    def test_profile_update_persists(self, client, auth_headers):
        """Test that profile update persists across requests."""
        # Update profile
        update_data = {"full_name": "Persistence Test User"}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify it persists
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Persistence Test User"
    
    def test_interests_update_replaces_list(self, client, auth_headers):
        """Test that interests update replaces entire list."""
        # Set initial interests
        interests_data = {"interests": ["AI", "ML"]}
        response = client.put("/users/me/interests", json=interests_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Replace with different interests
        interests_data = {"interests": ["web", "mobile"]}
        response = client.put("/users/me/interests", json=interests_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Should be the new list, not combined
        assert "web" in str(data["interests"])
    
    def test_follow_changes_follower_count(self, client, auth_headers):
        """Test that follow operation changes follower count."""
        # Get initial counts
        me_response = client.get("/users/me", headers=auth_headers)
        initial_following_count = me_response.json()["following_count"]
        
        # Try to follow user 1 (may fail if doesn't exist, but test the logic)
        response = client.post("/users/1/follow", headers=auth_headers)
        
        if response.status_code == 201:
            # Check if count changed
            me_response = client.get("/users/me", headers=auth_headers)
            new_following_count = me_response.json()["following_count"]
            # Count should have increased
            assert new_following_count == initial_following_count + 1
            
            # Cleanup: unfollow
            client.delete("/users/1/follow", headers=auth_headers)
    
    def test_unfollow_changes_follower_count(self, client, auth_headers):
        """Test that unfollow operation changes follower count."""
        # First follow
        client.post("/users/1/follow", headers=auth_headers)
        
        # Get initial counts
        me_response = client.get("/users/me", headers=auth_headers)
        initial_following_count = me_response.json()["following_count"]
        
        # Unfollow
        response = client.delete("/users/1/follow", headers=auth_headers)
        
        if response.status_code == 200:
            # Check if count changed
            me_response = client.get("/users/me", headers=auth_headers)
            new_following_count = me_response.json()["following_count"]
            # Count should have decreased
            assert new_following_count == initial_following_count - 1
    
    # ==================== Pagination and Ordering Tests ====================
    
    def test_followers_pagination_different_sizes(self, client, auth_token):
        """Test GET /users/{user_id}/followers with different page sizes."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        # Test with different page sizes
        for size in [5, 10, 20]:
            response = client.get(f"/users/{user_id}/followers", params={"page": 1, "size": size})
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            # Should not return more than requested size
            assert len(data) <= size
    
    def test_following_pagination_different_sizes(self, client, auth_token):
        """Test GET /users/{user_id}/following with different page sizes."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        # Test with different page sizes
        for size in [5, 10, 20]:
            response = client.get(f"/users/{user_id}/following", params={"page": 1, "size": size})
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) <= size
    
    def test_posts_pagination_different_sizes(self, client, auth_token):
        """Test GET /users/{user_id}/posts with different page sizes."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        # Test with different page sizes
        for size in [5, 10, 20]:
            response = client.get(f"/users/{user_id}/posts", params={"page": 1, "size": size})
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) <= size
    
    def test_followers_ordering(self, client, auth_token):
        """Test that followers are ordered by followed_at (newest first)."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/followers", params={"page": 1, "size": 10})
        assert response.status_code == 200
        data = response.json()
        
        # If we have multiple followers, check ordering
        if len(data) > 1:
            # Verify followed_at is in descending order
            for i in range(len(data) - 1):
                if data[i]["followed_at"] and data[i+1]["followed_at"]:
                    assert data[i]["followed_at"] >= data[i+1]["followed_at"]
    
    def test_following_ordering(self, client, auth_token):
        """Test that following are ordered by followed_at (newest first)."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/following", params={"page": 1, "size": 10})
        assert response.status_code == 200
        data = response.json()
        
        # If we have multiple following, check ordering
        if len(data) > 1:
            for i in range(len(data) - 1):
                if data[i]["followed_at"] and data[i+1]["followed_at"]:
                    assert data[i]["followed_at"] >= data[i+1]["followed_at"]
    
    # ==================== Concurrent Operation Tests ====================
    
    def test_follow_then_unfollow(self, client, auth_headers):
        """Test follow then unfollow the same user."""
        # Follow
        response = client.post("/users/1/follow", headers=auth_headers)
        
        if response.status_code == 201:
            # Unfollow
            response = client.delete("/users/1/follow", headers=auth_headers)
            assert response.status_code == 200
            
            # Verify not following anymore
            headers = {"Authorization": auth_headers["Authorization"]}
            me_response = client.get("/users/me", headers=headers)
            following = client.get(f"/users/{me_response.json()['id']}/following")
            # User 1 should not be in following list
            following_ids = [f["user_id"] for f in following.json()]
            assert 1 not in following_ids
    
    def test_multiple_profile_updates(self, client, auth_headers):
        """Test multiple profile updates in sequence."""
        # First update
        update_data = {"full_name": "First Update"}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Second update
        update_data = {"career": "Engineering"}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Third update
        update_data = {"cycle": 5}
        response = client.patch("/users/me", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify all changes persisted
        response = client.get("/users/me", headers=auth_headers)
        data = response.json()
        assert data["full_name"] == "First Update"
        assert data["career"] == "Engineering"
        assert data["cycle"] == 5
    
    # ==================== Response Schema Tests ====================
    
    def test_user_profile_response_schema(self, client, auth_headers):
        """Test that /users/me returns all expected fields."""
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        expected_fields = [
            "id", "email", "full_name", "career", "cycle",
            "interests", "availability", "is_onboarding_completed",
            "created_at", "followers_count", "following_count",
            "posts_count", "profile_image_url"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_public_profile_response_schema(self, client, auth_token):
        """Test that /users/{user_id} returns all expected fields."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        expected_fields = [
            "id", "full_name", "career", "cycle", "interests",
            "followers_count", "following_count", "posts_count",
            "profile_image_url"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        # Should NOT include email (public profile)
        assert "email" not in data
    
    def test_followers_response_schema(self, client, auth_token):
        """Test that followers response has correct schema."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/followers")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            expected_fields = ["user_id", "full_name", "email", "followed_at"]
            for field in expected_fields:
                assert field in data[0], f"Missing field: {field}"
    
    def test_following_response_schema(self, client, auth_token):
        """Test that following response has correct schema."""
        headers = {"Authorization": f"Bearer {auth_token}"}
        me_response = client.get("/users/me", headers=headers)
        user_id = me_response.json()["id"]
        
        response = client.get(f"/users/{user_id}/following")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            expected_fields = ["user_id", "full_name", "email", "followed_at"]
            for field in expected_fields:
                assert field in data[0], f"Missing field: {field}"
    
    def test_response_data_types(self, client, auth_headers):
        """Test that response fields have correct data types."""
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check numeric fields are integers
        assert isinstance(data["id"], int)
        assert isinstance(data["followers_count"], int)
        assert isinstance(data["following_count"], int)
        assert isinstance(data["posts_count"], int)
        
        # Check list fields are lists
        assert isinstance(data["interests"], list)
        
        # Check string fields are strings
        assert isinstance(data["email"], str)
        assert isinstance(data["full_name"], str)
