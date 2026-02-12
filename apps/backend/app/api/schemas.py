"""Pydantic API schema definitions."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LLMSettings(BaseModel):
    """User-configurable provider settings for the agent."""

    provider_name: str = Field(default="OpenAI-compatible")
    base_url: str = Field(default="https://api.openai.com/v1")
    model: str = Field(default="gpt-4o-mini")
    token_env: str = Field(default="LLM_API_TOKEN")
    api_token: str | None = Field(
        default=None,
        description="Optional token stored locally for desktop-only convenience.",
    )
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    timeout: float = Field(default=90.0, ge=5.0, le=300.0)
    top_k: int = Field(default=6, ge=1, le=20)
    chunk_words: int = Field(default=220, ge=80, le=600)
    languages: str = Field(default="en,en-US")


class SettingsResponse(BaseModel):
    """Response payload for onboarding and settings UI."""

    settings: LLMSettings
    has_token: bool


class SaveSettingsRequest(BaseModel):
    """Request payload for saving onboarding settings."""

    settings: LLMSettings
    store_token: bool = False


class TranscriptLoadRequest(BaseModel):
    """Request payload for loading transcript data."""

    source: str
    languages: str | None = None
    chunk_words: int | None = Field(default=None, ge=80, le=600)


class TranscriptMeta(BaseModel):
    """Stored transcript metadata returned to clients."""

    transcript_id: str
    source_label: str
    source_url: str | None = None
    chunk_count: int
    total_words: int


class TranscriptLoadResponse(BaseModel):
    """Response payload after loading or refreshing transcript."""

    transcript: TranscriptMeta


class ChatTurn(BaseModel):
    """Message in rolling conversation history."""

    role: str
    content: str


class AgentChatRequest(BaseModel):
    """Request payload for the LangGraph agent."""

    question: str = Field(min_length=1)
    source: str | None = None
    transcript_id: str | None = None
    top_k: int | None = Field(default=None, ge=1, le=20)
    history_turns: int = Field(default=3, ge=0, le=10)
    history: list[ChatTurn] = Field(default_factory=list)


class Citation(BaseModel):
    """Evidence citation for a generated answer."""

    chunk_id: int
    score: float
    start_seconds: float
    end_seconds: float
    start_label: str
    end_label: str
    text: str


class AgentChatResponse(BaseModel):
    """Response payload from the LangGraph agent."""

    answer: str
    transcript_id: str
    source_label: str
    source_url: str | None = None
    citations: list[Citation]
