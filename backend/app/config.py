import json
import logging
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from pathlib import Path

logger = logging.getLogger("lifecraft.config")

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./lifecraft.db"
    SUPABASE_PROJECT_NAME: str = "LifeCraft"
    SUPABASE_DB_PASSWORD: Optional[str] = None
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    SUPABASE_SECRET_KEY: Optional[str] = None
    SUPABASE_PROJECT_REF: Optional[str] = None
    SUPABASE_URL: Optional[str] = None

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
        Returns the active database URL.
        If DATABASE_URL is set to a valid remote PostgreSQL URL, uses it directly.
        If SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD are provided, builds
        the IPv4-compatible Supabase connection pooler URL.
        Otherwise falls back to SQLite.
        """
        url = (self.DATABASE_URL or "").strip()
        if (
            url
            and url.startswith("postgresql")
            and "[project-ref]" not in url
            and "[password]" not in url
            and "YOUR_PROJECT_REF" not in url
        ):
            return url

        if (
            self.SUPABASE_PROJECT_REF
            and self.SUPABASE_PROJECT_REF.strip()
            and self.SUPABASE_DB_PASSWORD
            and self.SUPABASE_DB_PASSWORD.strip()
        ):
            ref = self.SUPABASE_PROJECT_REF.strip()
            pw = self.SUPABASE_DB_PASSWORD.strip()
            return f"postgresql://postgres.{ref}:{pw}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

        if not url or "sqlite" in url or "[project-ref]" in url or "[password]" in url or "YOUR_PROJECT_REF" in url:
            logger.info("Using local SQLite database: sqlite:///./lifecraft.db")
            return "sqlite:///./lifecraft.db"
        return url

    model_config = SettingsConfigDict(
        env_file=[str(BASE_DIR / ".env"), ".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
