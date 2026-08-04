"""Tests de integración para imágenes por URL externa (Parte A).

Cubre:
  (a) una URL externa válida se guarda con source_type='external_url' y se
      puede recuperar (tanto en el listado de imágenes como embebida en el post).
  (b) una URL con formato inválido es rechazada con 422 (sin fetch server-side).
  (c) el flujo de upload existente (source_type omitido / 'upload') sigue
      funcionando exactamente igual que antes (regresión).
"""

import time
import uuid

import httpx
import pytest

from config import API_BASE_URL
from auth_helpers import with_legal_ids


class TestPostImagesExternalUrl:
    """Integration tests for external-URL post images (Parte A)."""

    @pytest.fixture(scope="module")
    def client(self):
        with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as client:
            yield client

    @pytest.fixture
    def create_user_and_token(self, client):
        def _create_user_and_token():
            suffix = f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
            email = f"test.extimg.{suffix}@utec.edu.pe"
            password = "TestPassword123!"

            register_response = client.post(
                "/auth/register",
                json=with_legal_ids(
                    client,
                    {"email": email, "password": password, "full_name": "Test External Image"},
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

            me = client.get("/auth/me", headers=headers)
            assert me.status_code == 200, me.text
            return {"id": me.json()["user"]["id"], "headers": headers}

        return _create_user_and_token

    @pytest.fixture
    def create_post(self, client):
        def _create_post(owner_headers):
            payload = {
                "title": f"Post {uuid.uuid4().hex[:6]}",
                "description": "Post for external image tests",
                "post_type": "event",
                "subtype": "conferencia",
                "tags": ["images"],
                "specific_fields": {},
            }
            response = client.post("/posts/", json=payload, headers=owner_headers)
            assert response.status_code == 201, response.text
            return response.json()["id"]

        return _create_post

    @pytest.fixture
    def post_context(self, create_user_and_token, create_post):
        owner = create_user_and_token()
        post_id = create_post(owner["headers"])
        return {"owner": owner, "post_id": post_id}

    # ==================== (a) URL externa válida ====================

    def test_create_external_url_image_success(self, client, post_context):
        payload = {
            "source_type": "external_url",
            "url": "https://picsum.photos/800/600",
            "position": 0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["url"] == payload["url"]
        assert data["source_type"] == "external_url"
        # cloudinary_id sintético generado por el backend (no fetch, no vacío, no None)
        assert data["cloudinary_id"]
        assert data["cloudinary_id"].startswith("external:")

    def test_external_url_image_recoverable_via_list(self, client, post_context):
        url = "https://picsum.photos/seed/utopp-test/800/600"
        created = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={"source_type": "external_url", "url": url, "position": 0},
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201, created.text

        listed = client.get(f"/posts/{post_context['post_id']}/images")
        assert listed.status_code == 200
        urls = [img["url"] for img in listed.json()]
        assert url in urls

    def test_external_url_image_recoverable_via_post_detail(self, client, post_context):
        url = "https://picsum.photos/seed/utopp-test-detail/800/600"
        created = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={"source_type": "external_url", "url": url, "position": 0},
            headers=post_context["owner"]["headers"],
        )
        assert created.status_code == 201, created.text

        post_detail = client.get(f"/posts/{post_context['post_id']}")
        assert post_detail.status_code == 200
        images = post_detail.json()["images"]
        assert any(img["url"] == url and img["source_type"] == "external_url" for img in images)

    def test_external_url_image_backend_never_fetches_url(self, client, post_context):
        """La URL puede ser inalcanzable/inexistente: el backend no la descarga, solo valida el formato."""
        payload = {
            "source_type": "external_url",
            "url": "https://this-domain-almost-certainly-does-not-exist-utopp.example/img.jpg",
            "position": 0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
        assert response.json()["url"] == payload["url"]

    def test_external_url_image_explicit_cloudinary_id_is_respected(self, client, post_context):
        custom_id = f"custom-{uuid.uuid4().hex}"
        payload = {
            "source_type": "external_url",
            "cloudinary_id": custom_id,
            "url": "https://picsum.photos/seed/utopp-custom-id/800/600",
            "position": 0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
        assert response.json()["cloudinary_id"] == custom_id

    def test_two_external_urls_get_different_synthetic_ids(self, client, post_context):
        r1 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={"source_type": "external_url", "url": "https://picsum.photos/seed/aaa/800/600", "position": 0},
            headers=post_context["owner"]["headers"],
        )
        r2 = client.post(
            f"/posts/{post_context['post_id']}/images",
            json={"source_type": "external_url", "url": "https://picsum.photos/seed/bbb/800/600", "position": 1},
            headers=post_context["owner"]["headers"],
        )
        assert r1.status_code == 201, r1.text
        assert r2.status_code == 201, r2.text
        assert r1.json()["cloudinary_id"] != r2.json()["cloudinary_id"]

    # ==================== (b) URL mal formada rechazada ====================

    def test_external_url_missing_scheme_rejected(self, client, post_context):
        payload = {"source_type": "external_url", "url": "www.example.com/imagen.jpg", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_external_url_plain_string_rejected(self, client, post_context):
        payload = {"source_type": "external_url", "url": "no-es-una-url", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_external_url_with_spaces_rejected(self, client, post_context):
        payload = {"source_type": "external_url", "url": "https://example.com/mi imagen.jpg", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_invalid_source_type_rejected(self, client, post_context):
        payload = {"source_type": "ftp_upload", "url": "https://picsum.photos/800/600", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    # ==================== (c) Regresión: upload existente sigue igual ====================

    def test_upload_flow_without_source_type_defaults_to_upload(self, client, post_context):
        """Si el cliente no envía source_type (comportamiento histórico), debe tratarse como 'upload'."""
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/regression.jpg",
            "position": 0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["source_type"] == "upload"
        assert data["cloudinary_id"] == payload["cloudinary_id"]
        assert data["url"] == payload["url"]

    def test_upload_flow_still_requires_cloudinary_id(self, client, post_context):
        """source_type='upload' (explícito o por default) sigue exigiendo cloudinary_id."""
        payload = {"source_type": "upload", "url": "https://res.cloudinary.com/demo/image/upload/v123/no-id.jpg", "position": 0}
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 422

    def test_upload_flow_with_explicit_source_type_upload(self, client, post_context):
        payload = {
            "source_type": "upload",
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://res.cloudinary.com/demo/image/upload/v123/explicit.jpg",
            "position": 0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
        assert response.json()["source_type"] == "upload"

    def test_upload_flow_url_is_not_restricted_to_cloudinary_domain(self, client, post_context):
        """Nota de diseño: el backend nunca exigió dominio Cloudinary; esto ya funcionaba antes de la Parte A."""
        payload = {
            "cloudinary_id": f"cid-{uuid.uuid4().hex}",
            "url": "https://not-cloudinary-at-all.example.com/img.jpg",
            "position": 0,
        }
        response = client.post(
            f"/posts/{post_context['post_id']}/images",
            json=payload,
            headers=post_context["owner"]["headers"],
        )
        assert response.status_code == 201, response.text
