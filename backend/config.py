"""
LifeSync AI — Application Configuration
Loads all settings from environment variables with validation.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    app_name: str = "LifeSync AI"
    app_version: str = "1.0.0"
    environment: str = "development"
    log_level: str = "INFO"

    # Security
    secret_key: str = "change-me-in-production-use-secrets-token-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # URLs
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/callback"

    # Google Gemini
    gemini_api_key: str = ""

    # Google Maps (REST API key — separate from OAuth)
    google_maps_api_key: str = ""

    # Google Scopes (comma-separated)
    google_scopes: str = (
        "openid,email,profile,"
        "https://www.googleapis.com/auth/gmail.readonly,"
        "https://www.googleapis.com/auth/gmail.compose,"
        "https://www.googleapis.com/auth/calendar,"
        "https://www.googleapis.com/auth/drive.readonly,"
        "https://www.googleapis.com/auth/fitness.activity.read,"
        "https://www.googleapis.com/auth/spreadsheets,"
        "https://www.googleapis.com/auth/forms.body.readonly,"
        "https://www.googleapis.com/auth/documents,"
        "https://www.googleapis.com/auth/tasks"
    )

    @property
    def scopes_list(self) -> List[str]:
        return [s.strip() for s in self.google_scopes.split(",")]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
