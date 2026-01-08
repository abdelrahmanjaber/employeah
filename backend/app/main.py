from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.router import api_router
from app.api_logging import APILoggingMiddleware


app = FastAPI(title=settings.app_name)

app.add_middleware(APILoggingMiddleware, enabled=settings.log_api, max_bytes=settings.log_api_max_bytes)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    return


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api_router)
