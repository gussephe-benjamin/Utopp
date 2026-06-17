from pydantic_settings import BaseSettings
from pydantic import model_validator


class Settings(BaseSettings):
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    JWT_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"
    SESSION_COOKIE_NAME: str = "utopp_session"
    OAUTH_STATE_COOKIE_NAME: str = "utopp_oauth_state"
    OAUTH_PENDING_COOKIE_NAME: str = "utopp_oauth_pending"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    ENABLE_ADMIN_BOOTSTRAP: bool = False
    BOOTSTRAP_ADMIN_TOKEN: str = ""

    @model_validator(mode="after")
    def _set_jwt_secret(self) -> "Settings":
        if not self.JWT_SECRET_KEY:
            self.JWT_SECRET_KEY = self.SECRET_KEY
        return self

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
