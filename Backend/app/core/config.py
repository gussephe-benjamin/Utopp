from pydantic_settings import BaseSettings
from pydantic import model_validator


class Settings(BaseSettings):
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    JWT_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GOOGLE_CLIENT_ID: str = ""
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
