"""Agent chat endpoints backed by a LangGraph workflow."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .schemas import AgentChatRequest, AgentChatResponse, Citation
from ..agent.graph import run_agent
from ..core.dependencies import get_store, get_transcript_service

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/chat", response_model=AgentChatResponse)
def chat_with_agent(payload: AgentChatRequest) -> AgentChatResponse:
    """Answer user questions with timestamp-aware transcript citations."""
    store = get_store()
    transcript_service = get_transcript_service()
    settings = store.load_settings()

    transcript: dict | None = None

    if payload.transcript_id:
        transcript = transcript_service.load_by_id(payload.transcript_id)

    if transcript is None and payload.source:
        transcript = transcript_service.load_or_create(
            source=payload.source,
            languages=settings.languages,
            chunk_words=settings.chunk_words,
        )

    if transcript is None:
        raise HTTPException(
            status_code=400,
            detail="Provide source or transcript_id so the agent can load transcript context.",
        )

    try:
        output = run_agent(
            {
                "question": payload.question,
                "history": [turn.model_dump() for turn in payload.history],
                "history_turns": payload.history_turns,
                "settings": settings,
                "chunks": transcript["chunks"],
                "top_k": payload.top_k or settings.top_k,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    citations = [Citation(**item) for item in output.get("citations", [])]

    return AgentChatResponse(
        answer=output.get("answer", ""),
        transcript_id=transcript["transcript_id"],
        source_label=transcript["source_label"],
        source_url=transcript.get("source_url"),
        citations=citations,
    )
