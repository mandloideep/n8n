from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    ENV: str = "development"
    API_PREFIX: str = "/api"

    DATABASE_URL: str
    SECRET_KEY: str

    ALLOWED_ORIGINS: str

    CREDENTIALS_ENCRYPTION_KEY: str

    OPENAI_API_KEY: str = ""

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: int = 0

    STATIC_DIR: str = "static"

    @field_validator("ALLOWED_ORIGINS")
    def parsed_allowed_origins(cls, v: str) -> List[str]:
        origins = [o.strip() for o in v.split(",") if o.strip()] if v else []
        if not origins:
            raise ValueError("ALLOWED_ORIGINS must not be empty")
        if "*" in origins:
            raise ValueError(
                "ALLOWED_ORIGINS cannot include '*' — the app uses cookie auth with "
                "allow_credentials=True; browsers reject the wildcard+credentials combo."
            )
        return origins

    @field_validator("SECRET_KEY")
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v

    @field_validator("CREDENTIALS_ENCRYPTION_KEY")
    def validate_encryption_key(cls, v: str) -> str:
        from cryptography.fernet import Fernet

        try:
            Fernet(v.encode() if isinstance(v, str) else v)
        except Exception as exc:
            raise ValueError(
                "CREDENTIALS_ENCRYPTION_KEY must be a valid Fernet key (32 url-safe "
                "base64-encoded bytes). Generate with "
                "`python -c 'from cryptography.fernet import Fernet; "
                "print(Fernet.generate_key().decode())'`."
            ) from exc
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
