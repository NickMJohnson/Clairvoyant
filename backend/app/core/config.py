from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://clairvoyant:clairvoyant@localhost:5432/clairvoyant"
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day
    demo_email: str = "demo@videosearch.io"
    demo_password: str = "demo123"
    data_dir: str = "/data"

    class Config:
        env_file = ".env"

settings = Settings()
