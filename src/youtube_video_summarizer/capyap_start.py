"""Runtime launcher for CapYap local web app."""

from __future__ import annotations

import os
import sys
import threading
import time
import webbrowser
from pathlib import Path


def project_root() -> Path:
    """Resolve repository root from editable install layout."""
    return Path(__file__).resolve().parents[2]


def backend_dir() -> Path:
    """Return backend app source directory."""
    return project_root() / "apps" / "backend"


def frontend_dist_dir() -> Path:
    """Return frontend build output path used for local web serving."""
    return project_root() / "apps" / "frontend" / "dist"


def ensure_frontend_build_exists() -> None:
    """Validate that web assets are available before launching server."""
    index_file = frontend_dist_dir() / "index.html"
    if not index_file.exists():
        raise RuntimeError(
            "Frontend build not found. Run `npm run build` from the repo root first."
        )


def _prepare_env() -> None:
    root = project_root()
    os.environ.setdefault("CAPYAP_PROJECT_ROOT", str(root))
    os.environ.setdefault("CAPYAP_DATA_DIR", str(root / ".capyap"))
    os.environ.setdefault("CAPYAP_FRONTEND_DIST", str(frontend_dist_dir()))


def _import_fastapi_app():
    backend = backend_dir()
    if str(backend) not in sys.path:
        sys.path.insert(0, str(backend))

    from app.main import app

    return app


def _open_browser_later(url: str, delay_seconds: float = 0.8) -> None:
    def _runner() -> None:
        time.sleep(delay_seconds)
        webbrowser.open(url)

    thread = threading.Thread(target=_runner, daemon=True)
    thread.start()


def start_local_server(
    host: str = "127.0.0.1",
    port: int = 8000,
    open_browser: bool = True,
) -> None:
    """Start local CapYap server and optionally open browser."""
    import uvicorn

    ensure_frontend_build_exists()
    _prepare_env()
    app = _import_fastapi_app()

    url = f"http://{host}:{port}"
    if open_browser:
        _open_browser_later(url)

    uvicorn.run(app, host=host, port=port)
