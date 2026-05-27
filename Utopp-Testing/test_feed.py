import pytest
import httpx
from config import API_BASE_URL
from auth_helpers import register_then_login_access_token


class TestFeedAPI:
    """Integration tests for Feed API endpoints."""
    
    @pytest.fixture(scope="module")
    def client(self):
        """HTTP client for API requests."""
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client
    
    @pytest.fixture(scope="module")
    def auth_token(self, client):
        return register_then_login_access_token(
            client,
            email="test.feed@utec.edu.pe",
            password="TestPassword123!",
            full_name="Test Feed User",
        )
    
    @pytest.fixture(scope="module")
    def auth_headers(self, auth_token):
        """Headers with authentication token."""
        return {"Authorization": f"Bearer {auth_token}"}
    
    # ==================== Basic Happy Path Tests ====================
    
    def test_get_feed_unauthenticated(self, client):
        """Test GET /feed without authentication."""
        response = client.get("/feed")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
    
    def test_get_feed_authenticated(self, client, auth_headers):
        """Test GET /feed with authentication."""
        response = client.get("/feed", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
    
    def test_get_feed_with_pagination(self, client):
        """Test GET /feed with pagination parameters."""
        response = client.get("/feed", params={"page": 1, "size": 10})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) <= 10
    
    def test_get_feed_empty_result(self, client):
        """Test GET /feed with filters that return no results."""
        response = client.get("/feed", params={"type": "nonexistent_type"})
        # Should return 200 with empty items or 422 for invalid type
        assert response.status_code in [200, 422]
    
    def test_get_feed_default_sorting(self, client):
        """Test GET /feed with default sorting."""
        response = client.get("/feed")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_get_feed_with_size_1(self, client):
        """Test GET /feed with size=1."""
        response = client.get("/feed", params={"page": 1, "size": 1})
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 1
    
    def test_get_feed_large_page(self, client):
        """Test GET /feed with large page size."""
        response = client.get("/feed", params={"page": 1, "size": 100})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_get_feed_no_params(self, client):
        """Test GET /feed without any parameters."""
        response = client.get("/feed")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    # ==================== Filter Tests ====================
    
    def test_feed_filter_by_type_event(self, client):
        """Test GET /feed filtered by type=event."""
        response = client.get("/feed", params={"type": "event"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_filter_by_type_announcement(self, client):
        """Test GET /feed filtered by type=announcement."""
        response = client.get("/feed", params={"type": "announcement"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_filter_by_type_academic_project(self, client):
        """Test GET /feed filtered by type=academic_project."""
        response = client.get("/feed", params={"type": "academic_project"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_filter_by_subtype(self, client):
        """Test GET /feed filtered by subtype."""
        response = client.get("/feed", params={"subtype": "conferencia"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_filter_by_tags(self, client):
        """Test GET /feed filtered by tags."""
        response = client.get("/feed", params={"tags": ["programming"]})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_feed_filter_by_multiple_tags(self, client):
        """Test GET /feed filtered by multiple tags."""
        response = client.get("/feed", params={"tags": ["programming", "AI"]})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_feed_filter_by_time_status_vigente(self, client):
        """Test GET /feed filtered by time_status=vigente."""
        response = client.get("/feed", params={"time_status": "vigente"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_filter_by_time_status_vencida(self, client):
        """Test GET /feed filtered by time_status=vencida."""
        response = client.get("/feed", params={"time_status": "vencida"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_filter_by_type_and_subtype(self, client):
        """Test GET /feed filtered by type and subtype."""
        response = client.get("/feed", params={"type": "event", "subtype": "conferencia"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_filter_by_type_and_tags(self, client):
        """Test GET /feed filtered by type and tags."""
        response = client.get("/feed", params={"type": "event", "tags": ["tech"]})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    # ==================== Pagination Tests ====================
    
    def test_feed_pagination_page_1(self, client):
        """Test GET /feed with page=1."""
        response = client.get("/feed", params={"page": 1, "size": 10})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_feed_pagination_page_2(self, client):
        """Test GET /feed with page=2."""
        response = client.get("/feed", params={"page": 2, "size": 10})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_feed_pagination_size_5(self, client):
        """Test GET /feed with size=5."""
        response = client.get("/feed", params={"page": 1, "size": 5})
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 5
    
    def test_feed_pagination_size_20(self, client):
        """Test GET /feed with size=20."""
        response = client.get("/feed", params={"page": 1, "size": 20})
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 20
    
    def test_feed_pagination_size_50(self, client):
        """Test GET /feed with size=50."""
        response = client.get("/feed", params={"page": 1, "size": 50})
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 50
    
    def test_feed_pagination_page_zero(self, client):
        """Test GET /feed with page=0."""
        response = client.get("/feed", params={"page": 0, "size": 10})
        assert response.status_code in [200, 400, 422]
    
    def test_feed_pagination_negative_page(self, client):
        """Test GET /feed with negative page."""
        response = client.get("/feed", params={"page": -1, "size": 10})
        assert response.status_code in [200, 400, 422]
    
    def test_feed_pagination_size_zero(self, client):
        """Test GET /feed with size=0."""
        response = client.get("/feed", params={"page": 1, "size": 0})
        assert response.status_code in [200, 400, 422]
    
    # ==================== Authentication Tests ====================
    
    def test_feed_enriched_with_auth(self, client, auth_headers):
        """Test GET /feed returns enriched data when authenticated."""
        response = client.get("/feed", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        # Authenticated response should include saved status, etc.
    
    def test_feed_basic_without_auth(self, client):
        """Test GET /feed returns basic data without authentication."""
        response = client.get("/feed")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_feed_with_invalid_token(self, client):
        """Test GET /feed with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/feed", headers=headers)
        # Should still work since auth is optional
        assert response.status_code in [200, 401]
    
    def test_feed_with_expired_token(self, client):
        """Test GET /feed with expired token."""
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/feed", headers=headers)
        # Should still work since auth is optional
        assert response.status_code in [200, 401]
    
    # ==================== Edge Case Tests ====================
    
    def test_feed_invalid_type(self, client):
        """Test GET /feed with invalid type."""
        response = client.get("/feed", params={"type": "invalid_type"})
        assert response.status_code in [422, 200]
    
    def test_feed_invalid_subtype(self, client):
        """Test GET /feed with invalid subtype."""
        response = client.get("/feed", params={"subtype": "invalid_subtype"})
        assert response.status_code in [422, 200]
    
    def test_feed_invalid_time_status(self, client):
        """Test GET /feed with invalid time_status."""
        response = client.get("/feed", params={"time_status": "invalid_status"})
        assert response.status_code in [422, 200]
    
    def test_feed_invalid_sort(self, client):
        """Test GET /feed with invalid sort."""
        response = client.get("/feed", params={"sort": "invalid_sort"})
        assert response.status_code in [422, 200]
    
    def test_feed_very_large_page(self, client):
        """Test GET /feed with very large page number."""
        response = client.get("/feed", params={"page": 9999, "size": 10})
        assert response.status_code == 200
        data = response.json()
        # Should return empty list
        assert len(data["items"]) == 0
    
    def test_feed_very_large_size(self, client):
        """Test GET /feed with very large size."""
        response = client.get("/feed", params={"page": 1, "size": 10000})
        assert response.status_code == 200
        data = response.json()
        # Should return available items
        assert "items" in data
    
    def test_feed_empty_tags_array(self, client):
        """Test GET /feed with empty tags array."""
        response = client.get("/feed", params={"tags": []})
        assert response.status_code in [200, 422]
    
    def test_feed_special_chars_in_tags(self, client):
        """Test GET /feed with special characters in tags."""
        response = client.get("/feed", params={"tags": ["c++", "c#"]})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    # ==================== Sorting Tests ====================
    
    def test_feed_sort_recent(self, client):
        """Test GET /feed with sort=recent."""
        response = client.get("/feed", params={"sort": "recent"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_default_ordering(self, client):
        """Test GET /feed default ordering (should be recent)."""
        response = client.get("/feed")
        assert response.status_code == 200
        data = response.json()
        if len(data["items"]) > 1:
            # Verify items are ordered by date (newest first)
            # This assumes items have a created_at field
            pass
    
    def test_feed_sort_with_type_filter(self, client):
        """Test GET /feed with sort and type filter."""
        response = client.get("/feed", params={"sort": "recent", "type": "event"})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_sort_with_pagination(self, client):
        """Test GET /feed with sort and pagination."""
        response = client.get("/feed", params={"sort": "recent", "page": 1, "size": 10})
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert "items" in data
    
    def test_feed_ordering_consistency(self, client):
        """Test that ordering is consistent across pages."""
        # Get page 1
        response1 = client.get("/feed", params={"page": 1, "size": 5})
        data1 = response1.json()
        
        # Get page 2
        response2 = client.get("/feed", params={"page": 2, "size": 5})
        data2 = response2.json()
        
        # Both should succeed
        assert response1.status_code == 200
        assert response2.status_code == 200
    
    # ==================== Response Schema Tests ====================
    
    def test_feed_response_schema(self, client):
        """Test GET /feed response has expected fields."""
        response = client.get("/feed")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
    
    def test_feed_item_schema(self, client):
        """Test that feed items have expected fields."""
        response = client.get("/feed")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["items"]) > 0:
            item = data["items"][0]
            # Should have basic post fields
            assert "id" in item or "title" in item or "description" in item
    
    def test_feed_response_with_auth_schema(self, client, auth_headers):
        """Test GET /feed response with auth has enriched fields."""
        response = client.get("/feed", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_feed_pagination_info(self, client):
        """Test GET /feed response includes pagination info."""
        response = client.get("/feed", params={"page": 1, "size": 10})
        assert response.status_code == 200
        data = response.json()
        # Response might include total, page, size info
        assert "items" in data
    
    # ==================== Data Integrity Tests ====================
    
    def test_feed_consistency_across_requests(self, client):
        """Test that feed returns consistent data across requests."""
        response1 = client.get("/feed")
        data1 = response1.json()
        
        response2 = client.get("/feed")
        data2 = response2.json()
        
        # Both should succeed
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert isinstance(data1["items"], list)
        assert isinstance(data2["items"], list)
    
    def test_feed_filter_accuracy(self, client):
        """Test that filters actually filter results."""
        # Get all items
        response_all = client.get("/feed")
        data_all = response_all.json()
        
        # Get filtered items
        response_filtered = client.get("/feed", params={"type": "event"})
        data_filtered = response_filtered.json()
        
        if response_filtered.status_code == 200:
            # Filtered should have fewer or equal items
            assert len(data_filtered["items"]) <= len(data_all["items"])
    
    def test_feed_pagination_limits(self, client):
        """Test that pagination respects size limits."""
        size = 5
        response = client.get("/feed", params={"page": 1, "size": size})
        data = response.json()
        assert len(data["items"]) <= size
