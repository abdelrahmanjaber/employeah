from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "employeah-backend"
    environment: str = "dev"

    database_url: str
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    log_api: bool = True
    log_api_max_bytes: int = 4096

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
