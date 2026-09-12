import json
import logging
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("lifecraft.config")


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
    SECRET_KEY: str = "lifecraft_super_secret_jwt_key_minecraft_8bit_rpg_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    def get_effective_database_url(self) -> str:
        """
        Returns the database URL. If a template/placeholder is detected in DATABASE_URL,
        falls back to a local SQLite database for local testing and development.
        """
        url = self.DATABASE_URL.strip()
        if not url or "[project-ref]" in url or "[password]" in url:
            logger.warning(
                "Supabase placeholder credentials detected in DATABASE_URL. "
                "Falling back to local SQLite database: sqlite:///./lifecraft.db. "
                "Provide your actual Supabase pooled connection string in backend/.env when ready."
            )
            return "sqlite:///./lifecraft.db"
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
