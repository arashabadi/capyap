"""Onboarding and provider settings endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from .schemas import SaveSettingsRequest, SettingsResponse
from ..core.dependencies import get_store

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
