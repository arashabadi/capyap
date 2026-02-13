"""Transcript loading endpoints for onboarding and workspace flows."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .schemas import (
    TranscriptChapter,
    TranscriptChunk,
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
    service = get_transcript_service()

    try:
        if payload.transcript_text is not None:
            transcript = service.load_from_text(
                source_label=payload.source,
                transcript_text=payload.transcript_text,
                chunk_words=payload.chunk_words or settings.chunk_words,
            )
        else:
            transcript = service.load_or_create(
                source=payload.source,
                languages=payload.languages or settings.languages,
                chunk_words=payload.chunk_words or settings.chunk_words,
            )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    meta = TranscriptMeta(
        transcript_id=transcript["transcript_id"],
        source_label=transcript["source_label"],
        source_title=transcript.get("source_title"),
        source_url=transcript.get("source_url"),
        chunk_count=len(transcript["chunks"]),
        total_words=transcript["total_words"],
    )
    chunks = [TranscriptChunk(**chunk) for chunk in transcript["chunks"]]
    chapters = [TranscriptChapter(**item) for item in transcript.get("chapters", [])]
    return TranscriptLoadResponse(transcript=meta, chunks=chunks, chapters=chapters)
