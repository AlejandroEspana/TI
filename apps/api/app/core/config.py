from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "MathBoard API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(case_sensitive=True)


settings = Settings()
