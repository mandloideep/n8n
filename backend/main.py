import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pythonjsonlogger.json import JsonFormatter

from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from asgi_correlation_id import CorrelationIdMiddleware, CorrelationIdFilter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from core.config import settings
from core.limiter import limiter
from routers import auth, credential, webhook, workflow

logger = logging.getLogger(__name__)


def _run_migrations() -> None:
    cfg = AlembicConfig("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    alembic_command.upgrade(cfg, "head")


def _configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.addFilter(CorrelationIdFilter(uuid_length=32, default_value="-"))
    handler.setFormatter(
        JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(correlation_id)s %(message)s",
            rename_fields={"asctime": "timestamp", "levelname": "level"},
        )
    )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)


_configure_logging()

_is_prod = settings.ENV == "production"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Alembic's env.py drives `asyncio.run()` internally for the async engine
    # bridge; that conflicts with FastAPI's running event loop. Push it onto
    # a worker thread where it can own a fresh loop.
    await asyncio.to_thread(_run_migrations)
    logger.info("startup_complete", extra={"env": settings.ENV})
    yield
    logger.info("shutdown")


app = FastAPI(
    title="Workflow Builder",
    description="A visual workflow automation tool, inspired by n8n.",
    version="0.1.0",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
# Add correlation-id LAST so it runs FIRST on the inbound side and the
# request_id contextvar is set before any other middleware logs.
app.add_middleware(CorrelationIdMiddleware)


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "unhandled_exception",
        extra={"path": str(request.url.path), "method": request.method},
    )
    return JSONResponse(status_code=500, content={"detail": "internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(credential.router, prefix="/credential")
app.include_router(webhook.router, prefix="/webh")
app.include_router(workflow.router, prefix="/workf")


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    if os.path.isdir(settings.STATIC_DIR):
        return FileResponse(f"{settings.STATIC_DIR}/index.html")
    return {"message": "Welcome to the Workflow Builder API"}


_assets_dir = f"{settings.STATIC_DIR}/assets"
if os.path.isdir(_assets_dir):
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")


if os.path.isdir(settings.STATIC_DIR):
    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        return FileResponse(f"{settings.STATIC_DIR}/index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=not _is_prod,
    )
