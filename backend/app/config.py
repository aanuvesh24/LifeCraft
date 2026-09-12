import json
import logging
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("lifecraft.config")


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./lifecraft.db"
    SUPABASE_PROJECT_NAME: str = "LifeCraft"
    SUPABASE_DB_PASSWORD: str = "RMbCDEYr92Q8VGbc"
    SUPABASE_PUBLISHABLE_KEY: str = "sb_publishable__TsIeaVC8lapuADbLFIJKg_UGNHbXgh"
    SUPABASE_SECRET_KEY: str = "sb_secret_hapSLOQKzDttn25Z2XBKpw_m9T757Ov"
    SUPABASE_PROJECT_REF: Optional[str] = "llqradcrafoflbgtsiqr"
    SUPABASE_URL: Optional[str] = "https://llqradcrafoflbgtsiqr.supabase.co"

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
        If SUPABASE_PROJECT_REF is provided, builds a direct Supabase connection.
        If DATABASE_URL is valid and non-placeholder, uses it.
        Otherwise falls back to SQLite.
        """
        if self.SUPABASE_PROJECT_REF and self.SUPABASE_PROJECT_REF.strip():
            ref = self.SUPABASE_PROJECT_REF.strip()
            pw = self.SUPABASE_DB_PASSWORD
            return f"postgresql://postgres:{pw}@db.{ref}.supabase.co:5432/postgres"

        url = self.DATABASE_URL.strip()
        if not url or "[project-ref]" in url or "[password]" in url or "YOUR_PROJECT_REF" in url:
            logger.info("Using local SQLite database: sqlite:///./lifecraft.db")
            return "sqlite:///./lifecraft.db"
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
