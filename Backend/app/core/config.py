import logging
import os
from urllib.parse import urlparse

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger("utopp.api")

_LOCAL_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

_KNOWN_PRODUCTION_CORS_ORIGINS = [
    "https://utopp-fronted.onrender.com",
    "https://www.utopp.app",
    "https://utopp.app",
    "https://formulario.utopp.app",
    "https://www.formulario.utopp.app",
    "https://forms.utopp.app",
    "https://www.forms.utopp.app",
]

_DEFAULT_LOCAL_REDIRECT_URI = "http://localhost:8000/auth/google/callback"
_DEFAULT_LOCAL_FRONTEND_URL = "http://localhost:5173"
_KNOWN_PRODUCTION_FRONTEND_URL = "https://utopp-fronted.onrender.com"


def _is_localhost_url(url: str) -> bool:
    host = (urlparse(url.strip()).hostname or "").lower()
    return host in {"", "localhost", "127.0.0.1"}


class Settings(BaseSettings):
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    JWT_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    SESSION_EXCHANGE_TOKEN_EXPIRE_SECONDS: int = 120
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = _DEFAULT_LOCAL_REDIRECT_URI
    FRONTEND_URL: str = _DEFAULT_LOCAL_FRONTEND_URL
    UF_FRONTEND_URL: str = "http://localhost:5174"
    BACKEND_PUBLIC_URL: str = ""
    FRONTEND_PUBLIC_URL: str = ""
    ALLOWED_ORIGINS: str = ""
    SESSION_COOKIE_NAME: str = "utopp_session"
    OAUTH_STATE_COOKIE_NAME: str = "utopp_oauth_state"
    OAUTH_PKCE_COOKIE_NAME: str = "utopp_oauth_pkce"
    OAUTH_PENDING_COOKIE_NAME: str = "utopp_oauth_pending"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    ENABLE_ADMIN_BOOTSTRAP: bool = False
    BOOTSTRAP_ADMIN_TOKEN: str = ""

    @field_validator("COOKIE_SAMESITE", mode="before")
    @classmethod
    def _normalize_samesite(cls, value: object) -> str:
        if value is None:
            return "lax"
        normalized = str(value).strip().lower()
        if normalized not in {"lax", "strict", "none"}:
            return "lax"
        return normalized

    @model_validator(mode="after")
    def _set_jwt_secret(self) -> "Settings":
        if not self.JWT_SECRET_KEY:
            self.JWT_SECRET_KEY = self.SECRET_KEY
        return self

    @model_validator(mode="after")
    def _apply_deployment_defaults(self) -> "Settings":
        """En Render (RENDER_EXTERNAL_URL) corrige localhost heredado del .env local."""
        render_url = os.getenv("RENDER_EXTERNAL_URL", "").strip().rstrip("/")
        backend_public = (
            self.BACKEND_PUBLIC_URL.strip().rstrip("/")
            or render_url
        )

        if backend_public and _is_localhost_url(self.GOOGLE_REDIRECT_URI):
            self.GOOGLE_REDIRECT_URI = f"{backend_public}/auth/google/callback"

        if render_url and _is_localhost_url(self.FRONTEND_URL):
            self.FRONTEND_URL = (
                self.FRONTEND_PUBLIC_URL.strip().rstrip("/")
                or _KNOWN_PRODUCTION_FRONTEND_URL
            )

        on_render = bool(render_url or os.getenv("RENDER"))
        redirect_host = urlparse(self.GOOGLE_REDIRECT_URI).netloc
        frontend_host = urlparse(self.FRONTEND_URL).netloc
        cross_origin_deploy = (
            on_render
            and redirect_host
            and frontend_host
            and redirect_host != frontend_host
        )

        if cross_origin_deploy or (on_render and backend_public.startswith("https://")):
            self.COOKIE_SECURE = True

        if cross_origin_deploy:
            self.COOKIE_SAMESITE = "none"

        return self

    def cors_origins(self) -> list[str]:
        """Orígenes permitidos para CORS (FRONTEND_URL + ALLOWED_ORIGINS + defaults)."""
        origins: set[str] = set(_LOCAL_CORS_ORIGINS + _KNOWN_PRODUCTION_CORS_ORIGINS)

        frontend = self.FRONTEND_URL.strip().rstrip("/")
        if frontend:
            origins.add(frontend)

        if self.ALLOWED_ORIGINS.strip():
            for origin in self.ALLOWED_ORIGINS.split(","):
                cleaned = origin.strip().rstrip("/")
                if cleaned:
                    origins.add(cleaned)

        return sorted(origins)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


def validate_deployment_settings() -> None:
    """Advertencias al arranque si la configuración OAuth/CORS parece inconsistente."""
    frontend = settings.FRONTEND_URL.strip().rstrip("/")
    redirect = settings.GOOGLE_REDIRECT_URI.strip()

    if frontend.startswith("https://") and "localhost" in redirect:
        logger.warning(
            "Configuración OAuth inconsistente: FRONTEND_URL=%s pero GOOGLE_REDIRECT_URI=%s "
            "apunta a localhost. En Render, usa la URL pública del backend en GOOGLE_REDIRECT_URI.",
            frontend,
            redirect,
        )

    redirect_host = urlparse(redirect).netloc
    frontend_host = urlparse(frontend).netloc if frontend else ""
    if (
        frontend_host
        and redirect_host
        and frontend_host != redirect_host
        and settings.COOKIE_SAMESITE == "lax"
        and frontend.startswith("https://")
    ):
        logger.warning(
            "Frontend y backend en hosts distintos (%s vs %s) con COOKIE_SAMESITE=lax. "
            "En producción cross-origin (p. ej. dos servicios Render) usa COOKIE_SAMESITE=none y COOKIE_SECURE=true.",
            frontend_host,
            redirect_host,
        )

    if settings.COOKIE_SAMESITE == "none" and not settings.COOKIE_SECURE:
        logger.warning(
            "COOKIE_SAMESITE=none requiere COOKIE_SECURE=true para que el navegador acepte las cookies."
        )

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        logger.warning("GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados; OAuth Google deshabilitado.")

    logger.info(
        "OAuth config: redirect_uri=%s frontend_url=%s cookie_secure=%s cookie_samesite=%s cors_origins=%s",
        redirect,
        frontend or "(vacío)",
        settings.COOKIE_SECURE,
        settings.COOKIE_SAMESITE,
        settings.cors_origins(),
    )
