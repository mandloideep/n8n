import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from core.config import settings
from db.database import create_table
from routers import auth, credential, webhook, workflow

create_table()

_is_prod = settings.ENV == "production"

app = FastAPI(
    title="Workflow Builder",
    description="A visual workflow automation tool, inspired by n8n.",
    version="0.1.0",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
)

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
