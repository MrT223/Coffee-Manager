from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Coffee Manager API"
    SQLALCHEMY_DATABASE_URI: str = "postgresql://postgres:postgres@localhost:5432/coffee_db"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE"  # In development
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
