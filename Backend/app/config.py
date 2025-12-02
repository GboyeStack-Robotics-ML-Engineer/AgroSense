from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Keys
    gemini_api_key: Optional[str] = 'AIzaSyAr6bYUY9bZRt-keEuoVbVY-kcDpfk6ncM'
    
    # Database
    database_url: str = "sqlite:///./agrosense.db"
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
