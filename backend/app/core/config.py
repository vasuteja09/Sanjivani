import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    DATABASE_URL: str = "sqlite:///./sanjivani.db"
    MAX_UPLOAD_SIZE_MB: int = 1
    SCAN_TIMEOUT_SECONDS: int = 30

    # AI Configuration (Optional OpenAI-compatible)
    AI_API_KEY: str = ""
    AI_BASE_URL: str = "https://api.openai.com/v1"
    AI_MODEL: str = "gpt-4o-mini"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
