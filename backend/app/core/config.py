from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./cadarena.db"
    
    # Security - JWT
    SECRET_KEY: str = "your-secret-key-change-in-production-use-random-string"
    REFRESH_SECRET_KEY: str = "your-refresh-secret-key-change-in-production"
    SESSION_SECRET_KEY: str = "your-session-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_EXPIRE_DAYS: int = 30  # Session cookie expiration
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # AI Provider Configuration
    AI_PROVIDER: str = "ollama"  # Options: "ollama", "custom"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # Custom Provider Configuration (for future use)
    CUSTOM_PROVIDER_API_KEY: str = ""
    CUSTOM_PROVIDER_URL: str = ""
    
    # Email Configuration (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@cadarena.com"
    SMTP_FROM_NAME: str = "CadArena"
    EMAIL_ENABLED: bool = False  # Set to True when SMTP is configured
    
    # Frontend URL (for email verification links)
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Security Settings
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
