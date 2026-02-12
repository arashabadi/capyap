"""OpenAI-compatible HTTP client used by LangGraph agent nodes."""

from __future__ import annotations

import os
from typing import Any

import requests

from ..api.schemas import LLMSettings


SYSTEM_PROMPT = (
    "You are a grounded video assistant. "
    "Use only transcript evidence from provided chunks. "
    "When helpful, cite chunk ids like [chunk-2]. "
    "If evidence is weak, explicitly say what is uncertain."
)


def resolve_api_token(settings: LLMSettings) -> str:
    """Resolve API token from saved settings or environment variables."""
    if settings.api_token:
        return settings.api_token

    from_env = os.getenv(settings.token_env)
    if from_env:
        return from_env

    fallback = os.getenv("OPENAI_API_KEY")
    if fallback:
        return fallback

    raise RuntimeError(
        "No API token configured. Save token in onboarding, "
        f"or set {settings.token_env} / OPENAI_API_KEY."
    )


def chat_completion(
    *,
    settings: LLMSettings,
    messages: list[dict[str, str]],
) -> str:
    """Call OpenAI-compatible /chat/completions endpoint and return text output."""
    base = settings.base_url.rstrip("/")
    endpoint = base if base.endswith("/chat/completions") else f"{base}/chat/completions"

    token = resolve_api_token(settings)
    payload: dict[str, Any] = {
        "model": settings.model,
        "messages": messages,
        "temperature": settings.temperature,
    }

    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=settings.timeout,
    )

    if response.status_code >= 400:
        detail = response.text.strip()
        if len(detail) > 600:
            detail = detail[:600] + "..."
        raise RuntimeError(
            f"LLM API request failed ({response.status_code}). Response: {detail}"
        )

    data = response.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected API response shape: {data}") from exc

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(parts).strip()

    if isinstance(content, str):
        return content.strip()

    return str(content)
