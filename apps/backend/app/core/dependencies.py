"""Dependency providers for FastAPI routers."""

from __future__ import annotations

from functools import lru_cache

from ..services.ollama_service import OllamaService
from ..services.storage import LocalStore
from ..services.transcript_service import TranscriptService


@lru_cache(maxsize=1)
def get_store() -> LocalStore:
    """Provide a singleton local storage adapter."""
    return LocalStore()


@lru_cache(maxsize=1)
def get_transcript_service() -> TranscriptService:
    """Provide a singleton transcript service."""
    return TranscriptService(store=get_store())


@lru_cache(maxsize=1)
def get_ollama_service() -> OllamaService:
    """Provide a singleton Ollama status service."""
    return OllamaService()
