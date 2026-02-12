"""Persistent local storage for onboarding settings and transcript cache."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from ..api.schemas import LLMSettings
from ..core.config import ensure_data_dirs


class LocalStore:
    """Simple JSON file persistence under local app data directory."""

    def __init__(self) -> None:
        paths = ensure_data_dirs()
        self._settings_file: Path = paths["settings_file"]
        self._transcripts_dir: Path = paths["transcripts_dir"]

    def load_settings(self) -> LLMSettings:
        """Load saved settings, or return defaults on first run."""
        if not self._settings_file.exists():
            return LLMSettings()

        payload = self._read_json(self._settings_file)
        try:
            return LLMSettings.model_validate(payload)
        except Exception:
            return LLMSettings()

    def save_settings(self, settings: LLMSettings, store_token: bool) -> LLMSettings:
        """Persist settings with optional local token storage."""
        persistable = settings.model_dump()
        if not store_token:
            persistable["api_token"] = None

        self._write_json(self._settings_file, persistable)
        return LLMSettings.model_validate(persistable)

    def build_transcript_id(self, source: str) -> str:
        """Build stable id for a transcript source."""
        digest = hashlib.sha1(source.encode("utf-8")).hexdigest()
        return digest[:16]

    def transcript_path(self, transcript_id: str) -> Path:
        """Resolve transcript cache file path."""
        return self._transcripts_dir / f"{transcript_id}.json"

    def save_transcript(self, transcript_id: str, payload: dict[str, Any]) -> None:
        """Save transcript metadata/chunks to disk."""
        path = self.transcript_path(transcript_id)
        self._write_json(path, payload)

    def load_transcript(self, transcript_id: str) -> dict[str, Any] | None:
        """Load transcript by id if present."""
        path = self.transcript_path(transcript_id)
        if not path.exists():
            return None
        return self._read_json(path)

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    @staticmethod
    def _write_json(path: Path, payload: dict[str, Any]) -> None:
        with path.open("w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, ensure_ascii=True)
