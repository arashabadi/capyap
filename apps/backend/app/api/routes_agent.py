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

    session_api_token = (payload.api_token or "").strip()
    if not session_api_token:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing session API token. Your API key is used directly for this session "
                "and is never stored on disk. Capyap runs locally on your machine."
            ),
        )

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

    runtime_settings = settings.model_copy(
        update={
            "model": (payload.model or settings.model).strip(),
            "base_url": (payload.base_url or settings.base_url).strip(),
        }
    )

    try:
        output = run_agent(
            {
                "question": payload.question,
                "session_api_token": session_api_token,
                "history": [turn.model_dump() for turn in payload.history],
                "history_turns": payload.history_turns,
                "settings": runtime_settings,
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
