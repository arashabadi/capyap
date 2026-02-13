"""LangGraph state contract for transcript QA."""

from __future__ import annotations

from typing import NotRequired, TypedDict

from ..api.schemas import LLMSettings


class AgentState(TypedDict):
    """Shared graph state across retrieval and answering nodes."""

    question: str
    session_api_token: str
    history: list[dict[str, str]]
    history_turns: int
    settings: LLMSettings
    chunks: list[dict]
    top_k: int
    selected_chunks: NotRequired[list[dict]]
    prompt: NotRequired[str]
    answer: NotRequired[str]
    citations: NotRequired[list[dict]]
