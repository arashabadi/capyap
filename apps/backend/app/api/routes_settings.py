"""Onboarding and provider settings endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from .schemas import OllamaStatusResponse, SaveSettingsRequest, SettingsResponse
from ..core.dependencies import get_ollama_service, get_store

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings() -> SettingsResponse:
    """Return currently saved non-secret settings for onboarding/UI bootstrap."""
    store = get_store()
    settings = store.load_settings()
    return SettingsResponse(settings=settings, is_configured=store.has_settings())


@router.post("", response_model=SettingsResponse)
def save_settings(payload: SaveSettingsRequest) -> SettingsResponse:
    """Persist onboarding settings without any API token."""
    saved = get_store().save_settings(payload.settings)
    return SettingsResponse(settings=saved, is_configured=True)


@router.get("/ollama/status", response_model=OllamaStatusResponse)
def get_ollama_status(base_url: str | None = None) -> OllamaStatusResponse:
    """Check whether local Ollama is reachable and has installed models."""
    status = get_ollama_service().get_status(base_url=base_url)
    return OllamaStatusResponse(**status)
