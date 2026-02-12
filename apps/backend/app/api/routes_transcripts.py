"""Transcript loading endpoints for onboarding and workspace flows."""

from __future__ import annotations

from fastapi import APIRouter

from .schemas import (
    TranscriptLoadRequest,
    TranscriptLoadResponse,
    TranscriptMeta,
)
from ..core.dependencies import get_store, get_transcript_service

router = APIRouter(prefix="/api/transcripts", tags=["transcripts"])


@router.post("/load", response_model=TranscriptLoadResponse)
def load_transcript(payload: TranscriptLoadRequest) -> TranscriptLoadResponse:
    """Load transcript from source and return cache metadata."""
    settings = get_store().load_settings()

    transcript = get_transcript_service().load_or_create(
        source=payload.source,
        languages=payload.languages or settings.languages,
        chunk_words=payload.chunk_words or settings.chunk_words,
    )

    meta = TranscriptMeta(
        transcript_id=transcript["transcript_id"],
        source_label=transcript["source_label"],
        source_url=transcript.get("source_url"),
        chunk_count=len(transcript["chunks"]),
        total_words=transcript["total_words"],
    )
    return TranscriptLoadResponse(transcript=meta)
