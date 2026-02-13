"""Helpers for checking local Ollama availability."""

from __future__ import annotations

from typing import Any

import requests

DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434"
RECOMMENDED_OLLAMA_MODEL = "llama3.1"


class OllamaService:
    """Query local Ollama runtime for onboarding and diagnostics."""

    def __init__(self, timeout: float = 2.5) -> None:
        self._timeout = timeout

    def get_status(self, base_url: str | None = None) -> dict[str, Any]:
        """Return runtime status and available local model names."""
        base = self._normalize_base_url(base_url)
        version_payload = self._get_json(f"{base}/api/version")
        tags_payload = self._get_json(f"{base}/api/tags")

        reachable = version_payload is not None or tags_payload is not None
        models = self._extract_model_names(tags_payload)
        has_models = bool(models)
        version = self._extract_version(version_payload)

        if not reachable:
            message = (
                "Ollama is not reachable. Install Ollama, start it, then pull a model "
                "with `ollama pull llama3.1`."
            )
        elif not has_models:
            message = (
                "Ollama is running but no local models were found. Run "
                "`ollama pull llama3.1` and then re-check."
            )
        else:
            message = f"Ollama is ready with {len(models)} local model(s)."

        return {
            "reachable": reachable,
            "base_url": base,
            "version": version,
            "has_models": has_models,
            "models": models,
            "recommended_model": RECOMMENDED_OLLAMA_MODEL,
            "install_url": "https://ollama.com/download",
            "message": message,
        }

    def _normalize_base_url(self, base_url: str | None) -> str:
        raw = (base_url or DEFAULT_OLLAMA_BASE_URL).strip()
        if not raw:
            raw = DEFAULT_OLLAMA_BASE_URL

        normalized = raw.rstrip("/")
        if normalized.endswith("/v1"):
            normalized = normalized[:-3].rstrip("/")
        return normalized or DEFAULT_OLLAMA_BASE_URL

    def _get_json(self, url: str) -> dict[str, Any] | None:
        try:
            response = requests.get(url, timeout=self._timeout)
            if response.status_code >= 400:
                return None
            payload = response.json()
            if isinstance(payload, dict):
                return payload
        except Exception:
            return None
        return None

    @staticmethod
    def _extract_version(payload: dict[str, Any] | None) -> str | None:
        if not isinstance(payload, dict):
            return None
        value = payload.get("version")
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return None

    @staticmethod
    def _extract_model_names(payload: dict[str, Any] | None) -> list[str]:
        if not isinstance(payload, dict):
            return []

        rows = payload.get("models")
        if not isinstance(rows, list):
            return []

        names: list[str] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            value = row.get("name")
            if isinstance(value, str):
                cleaned = value.strip()
                if cleaned:
                    names.append(cleaned)

        # Keep stable order while removing duplicates.
        deduped: list[str] = []
        seen: set[str] = set()
        for name in names:
            if name in seen:
                continue
            seen.add(name)
            deduped.append(name)
        return deduped
