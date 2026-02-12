"""Runtime configuration for the local-first backend."""

from __future__ import annotations

import os
from pathlib import Path

APP_NAME = "Capyap Local Agent"
APP_VERSION = "0.1.0"

DEFAULT_DATA_DIR = Path(".capyap")


def get_project_root() -> Path:
    """Resolve project root path for local source checkout."""
    configured = os.getenv("CAPYAP_PROJECT_ROOT")
    if configured:
        return Path(configured).expanduser().resolve()

    # apps/backend/app/core/config.py -> project root is 4 parents up.
    return Path(__file__).resolve().parents[4]


def get_data_dir() -> Path:
    """Resolve the local app data directory."""
    configured = os.getenv("CAPYAP_DATA_DIR")
    if configured:
        return Path(configured).expanduser().resolve()
    return (get_project_root() / DEFAULT_DATA_DIR).resolve()


def get_frontend_dist_dir() -> Path:
    """Resolve built frontend asset directory served by backend."""
    configured = os.getenv("CAPYAP_FRONTEND_DIST")
    if configured:
        return Path(configured).expanduser().resolve()
    return (get_project_root() / "apps" / "frontend" / "dist").resolve()


def ensure_data_dirs() -> dict[str, Path]:
    """Create all local storage directories required by the backend."""
    root = get_data_dir()
    transcripts = root / "transcripts"
    root.mkdir(parents=True, exist_ok=True)
    transcripts.mkdir(parents=True, exist_ok=True)
    return {
        "root": root,
        "settings_file": root / "settings.json",
        "transcripts_dir": transcripts,
    }
