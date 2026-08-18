from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    Values can be set in backend/.env or passed via Docker Compose environment block.
    """

    # Database
    DATABASE_URL: str

    # Application
    APP_ENV: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Single shared instance — import this everywhere instead of creating new Settings().
settings = Settings()
