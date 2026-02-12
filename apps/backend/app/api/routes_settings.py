"""Onboarding and provider settings endpoints."""

from __future__ import annotations

import os

from fastapi import APIRouter

from .schemas import SaveSettingsRequest, SettingsResponse
from ..core.dependencies import get_store

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _has_available_token(token_env: str, saved_token: str | None) -> bool:
    if saved_token:
        return True
    return bool(os.getenv(token_env) or os.getenv("OPENAI_API_KEY"))


@router.get("", response_model=SettingsResponse)
def get_settings() -> SettingsResponse:
    """Return currently saved settings for onboarding/UI bootstrap."""
    settings = get_store().load_settings()
    return SettingsResponse(
        settings=settings,
        has_token=_has_available_token(settings.token_env, settings.api_token),
    )


@router.post("", response_model=SettingsResponse)
def save_settings(payload: SaveSettingsRequest) -> SettingsResponse:
    """Persist onboarding settings."""
    saved = get_store().save_settings(payload.settings, store_token=payload.store_token)
    return SettingsResponse(
        settings=saved,
        has_token=_has_available_token(saved.token_env, saved.api_token),
    )
