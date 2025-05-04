from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "flowmind"
    
    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    
    # Qdrant settings
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    
    # JWT settings
    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OAuth2 settings
    OAUTH2_SECRET: str = "your-oauth2-secret"
    GOOGLE_CLIENT_ID: str = "placeholder"
    GOOGLE_CLIENT_SECRET: str = "placeholder"
    FRONTEND_URL: str = "http://localhost:5173"
    
    # AI Model API Keys 
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    COHERE_API_KEY: Optional[str] = None
    PERPLEXITY_API_KEY: Optional[str] = None
    XAI_API_KEY: Optional[str] = None
    
    # AWS Bedrock Settings
    AWS_ACCESS_KEY: Optional[str] = None
    AWS_SECRET_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    # Azure OpenAI Settings
    AZURE_API_KEY: Optional[str] = None
    AZURE_ENDPOINT: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()