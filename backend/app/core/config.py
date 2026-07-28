"""Centralized, typed configuration loaded from environment / .env.

Keeping settings in one place means ports, secrets and CORS origins are
never hard-coded across the codebase.

This module also enforces the deployment-time security invariants. Failing
fast at import is deliberate: a service that boots with a placeholder signing
key is worse than a service that refuses to boot, because the failure is
silent and every token it ever issues is forgeable.
"""
import secrets
import warnings
from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# The placeholder shipped in .env.example. Anyone with the repository knows it,
# so it must never sign real tokens.
INSECURE_SECRET = "change-me-super-secret-key-please-rotate-in-production"

# HS* only. The app signs with a shared string secret; allowing an RS*/ES*
# name here with a string key is how algorithm-confusion forgeries start.
_ALLOWED_ALGORITHMS = {"HS256", "HS384", "HS512"}

_MIN_SECRET_LENGTH = 32


class Settings(BaseSettings):
    # --- App ---
    app_name: str = "Car Dealership API"
    api_prefix: str = "/api"
    # Deployment environment. Anything other than "development" is treated as
    # production for security purposes (fail-closed default).
    app_env: str = "development"

    # Bind to loopback by default. The previous 0.0.0.0 default published the
    # API — including /docs and the auth endpoints — to every network the host
    # is attached to, which on a laptop means any café Wi-Fi. Set HOST=0.0.0.0
    # explicitly when a container or reverse proxy actually requires it.
    host: str = "127.0.0.1"
    port: int = 8081  # 8080 suele estar ocupado por Apache/XAMPP en Windows

    # --- Security / JWT ---
    secret_key: str = INSECURE_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # --- CORS ---
    frontend_origin: str = "http://localhost:5471"

    # --- Database ---
    database_url: str = "sqlite:///./database.db"

    # --- Seeding ---
    # Demo users have well-known passwords published in the README. They are a
    # development convenience and are hard-blocked outside development below.
    seed_demo_users: bool = True

    # --- Observability ---
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # -- Derived helpers ---------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() not in {"development", "dev", "local", "test"}

    @property
    def cors_origins(self) -> list[str]:
        """Explicit origin allowlist (comma-separated in FRONTEND_ORIGIN)."""
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]

    # -- Invariants --------------------------------------------------------
    @field_validator("algorithm")
    @classmethod
    def _check_algorithm(cls, v: str) -> str:
        if v not in _ALLOWED_ALGORITHMS:
            raise ValueError(
                f"ALGORITHM={v!r} no permitido. Usa uno de {sorted(_ALLOWED_ALGORITHMS)}. "
                "Valores como 'none' desactivarían la verificación de firma."
            )
        return v

    @model_validator(mode="after")
    def _check_security_invariants(self) -> "Settings":
        weak_secret = (
            self.secret_key == INSECURE_SECRET
            or len(self.secret_key) < _MIN_SECRET_LENGTH
        )

        if self.is_production:
            if weak_secret:
                raise ValueError(
                    "SECRET_KEY inseguro (placeholder o < "
                    f"{_MIN_SECRET_LENGTH} caracteres) con APP_ENV="
                    f"{self.app_env!r}. Genera uno con:  openssl rand -hex 32"
                )
            if self.seed_demo_users:
                # Fail closed rather than quietly creating a max-privilege
                # 'desarrollador' account whose password is in the README.
                raise ValueError(
                    "SEED_DEMO_USERS=true está prohibido fuera de desarrollo: "
                    "crearía cuentas con contraseñas públicas y rol elevado."
                )
            if any(o.startswith("http://") for o in self.cors_origins):
                warnings.warn(
                    f"FRONTEND_ORIGIN contiene origen sin TLS: {self.frontend_origin!r}. "
                    "Los tokens viajarían en claro.",
                    stacklevel=2,
                )
        elif weak_secret:
            # Development: don't block the developer, but never sign with the
            # published placeholder. An ephemeral per-boot key means tokens
            # simply stop working on restart, which is the correct signal.
            warnings.warn(
                "SECRET_KEY por defecto/débil detectado. Se generó una clave "
                "efímera para esta ejecución; los tokens se invalidarán al "
                "reiniciar. Define SECRET_KEY en backend/.env "
                "(openssl rand -hex 32).",
                stacklevel=2,
            )
            object.__setattr__(self, "secret_key", secrets.token_hex(32))

        return self


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so the .env file is parsed only once."""
    return Settings()


settings = get_settings()
