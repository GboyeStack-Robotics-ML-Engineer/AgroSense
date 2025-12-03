from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()


class Settings(BaseSettings):
    # API Keys
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    
    # Database
    database_url: str = Field(default="sqlite:///./agrosense.db", env="DATABASE_URL")
    
    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    frontend_url: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
