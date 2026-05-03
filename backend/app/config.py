import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Load .env from project root
ROOT_DIR = Path(__file__).parent.parent.parent
env_path = ROOT_DIR / ".env"
if not env_path.exists():
    # Try database/.env as fallback
    env_path = ROOT_DIR / "database" / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Coffee Manager API"
    
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "coffee_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    
    SQLALCHEMY_DATABASE_URI: str | None = None
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SQLALCHEMY_DATABASE_URI:
            self.SQLALCHEMY_DATABASE_URI = f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        case_sensitive = True
        env_file = str(env_path) if env_path.exists() else ".env"

settings = Settings()
