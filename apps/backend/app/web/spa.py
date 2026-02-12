"""Serve built frontend assets from FastAPI for local single-command startup."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


def register_spa(app: FastAPI, dist_dir: Path) -> None:
    """Register static SPA routes when build output exists."""
    dist_root = dist_dir.resolve()
    index_file = dist_root / "index.html"
    assets_dir = dist_root / "assets"

    if not index_file.exists():
        return

    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    def spa_index() -> FileResponse:
        return FileResponse(index_file)

    @app.get("/{path:path}", include_in_schema=False)
    def spa_fallback(path: str) -> FileResponse:
        if path.startswith("api/") or path == "health":
            raise HTTPException(status_code=404, detail="Not Found")

        candidate = (dist_root / path).resolve()
        if candidate.is_file() and candidate.is_relative_to(dist_root):
            return FileResponse(candidate)

        return FileResponse(index_file)
