"""FastAPI entrypoint for Capyap local backend."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes_agent import router as agent_router
from .api.routes_settings import router as settings_router
from .api.routes_transcripts import router as transcripts_router
from .core.config import APP_NAME, APP_VERSION, get_frontend_dist_dir
from .web.spa import register_spa

app = FastAPI(title=APP_NAME, version=APP_VERSION)

# Local desktop + web clients run on localhost ports and need CORS in dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings_router)
app.include_router(transcripts_router)
app.include_router(agent_router)


@app.get("/health")
def health() -> dict[str, str]:
    """Simple health endpoint for local orchestration checks."""
    return {"status": "ok"}


register_spa(app, get_frontend_dist_dir())
