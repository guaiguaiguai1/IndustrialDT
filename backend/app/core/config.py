import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Industrial Digital Twin Platform"
    APP_VERSION: str = "1.0.0"
    DATABASE_URL: str = "sqlite:///./industrial_dt.db"
    SECRET_KEY: str = ""  # Must be set via environment variable
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour (reduced from 24 hours)
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SECRET_KEY:
            self.SECRET_KEY = secrets.token_urlsafe(32)
            print("WARNING: SECRET_KEY not set in environment. Using random key (tokens will be invalid on restart).")


settings = Settings()
