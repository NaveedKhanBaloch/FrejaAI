from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _running_in_container() -> bool:
    return Path("/.dockerenv").exists()


def _localize_container_hostname(value: object, service: str) -> object:
    if _running_in_container() or not isinstance(value, str):
        return value
    return value.replace(f"@{service}:", "@localhost:").replace(f"//{service}:", "//localhost:")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Freja AI"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://freja:freja@localhost:5432/freja"
    redis_url: RedisDsn = RedisDsn("redis://localhost:6379/0")
    dashboard_origin: str = "http://localhost:3000"
    backend_url: AnyHttpUrl = AnyHttpUrl("http://localhost:8000")
    next_public_api_url: str = "http://localhost:8000"
    n8n_webhook_url: AnyHttpUrl | None = None

    vonage_api_key: str = "local"
    vonage_api_secret: str = "local-development-secret"
    vonage_app_id: str = "local"
    vonage_private_key_path: str = "./vonage.key"

    deepgram_api_key: str = "local"
    openai_api_key: str = "local"
    elevenlabs_api_key: str = "local"
    elevenlabs_agent_id: str | None = None
    elevenlabs_tool_secret: str | None = None
    demo_restaurant_name: str = "Pizza Palazzo"
    demo_restaurant_phone: str = "+46101234567"
    demo_restaurant_vonage_number: str = "+46107654321"
    demo_elevenlabs_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"

    jwt_private_key: str | None = None
    jwt_public_key: str | None = None
    jwt_secret: str = Field(default="local-development-secret", min_length=16)
    jwt_expiry_hours: int = 12

    stt_confidence_threshold: float = 0.65
    language_confidence_threshold: float = 0.70
    max_audio_queue_size: int = 50
    session_ttl_seconds: int = 60 * 60 * 6

    @field_validator("n8n_webhook_url", mode="before")
    @classmethod
    def empty_url_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def localize_database_url(cls, value: object) -> object:
        return _localize_container_hostname(value, "postgres")

    @field_validator("redis_url", mode="before")
    @classmethod
    def localize_redis_url(cls, value: object) -> object:
        return _localize_container_hostname(value, "redis")


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
