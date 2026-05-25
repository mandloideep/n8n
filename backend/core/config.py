from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    ENV: str = "development"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    DATABASE_URL: str
    SECRET_KEY: str

    ALLOWED_ORIGINS: str

    OPENAI_API_KEY: str = ""

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: int = 0

    STATIC_DIR: str = "static"

    @field_validator("ALLOWED_ORIGINS")
    def parsed_allowed_origins(cls, v: str) -> List[str]:
        return [o.strip() for o in v.split(",") if o.strip()] if v else []

    @field_validator("SECRET_KEY")
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
