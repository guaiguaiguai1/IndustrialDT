from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Industrial Digital Twin Platform"
    APP_VERSION: str = "1.0.0"
    DATABASE_URL: str = "sqlite:///./industrial_dt.db"
    SECRET_KEY: str = "industrial-dt-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
