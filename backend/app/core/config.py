"""Centralized, typed configuration loaded from environment / .env.

Keeping settings in one place means ports, secrets and CORS origins are
never hard-coded across the codebase.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    app_name: str = "Car Dealership API"
    api_prefix: str = "/api"
    host: str = "0.0.0.0"
    port: int = 8081  # 8080 suele estar ocupado por Apache/XAMPP en Windows

    # --- Security / JWT ---
    secret_key: str = "change-me-super-secret-key-please-rotate-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # --- CORS ---
    frontend_origin: str = "http://localhost:5471"

    # --- Database ---
    database_url: str = "sqlite:///./database.db"

    # --- Seeding ---
    seed_demo_users: bool = True

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so the .env file is parsed only once."""
    return Settings()


settings = get_settings()
