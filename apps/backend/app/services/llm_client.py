"""OpenAI-compatible HTTP client used by LangGraph agent nodes."""

from __future__ import annotations

from typing import Any

import requests

from ..api.schemas import LLMSettings


SYSTEM_PROMPT = (
    "You are Capyap's grounded transcript assistant. "
    "Respond in English only. "
    "Keep responses short, direct, and plain text. "
    "Avoid markdown formatting, bullet lists, and decorative symbols. "
    "Use only transcript evidence from provided chunks. "
    "If evidence is weak, clearly state uncertainty."
)


def resolve_api_token(api_token: str | None) -> str:
    """Resolve session-only API token."""
    token = (api_token or "").strip()
    if token:
        return token
    raise RuntimeError(
        "Missing API token for this session. "
        "Provide your key in the UI session field and try again."
    )


def chat_completion(
    *,
    settings: LLMSettings,
    api_token: str | None,
    messages: list[dict[str, str]],
) -> str:
    """Call OpenAI-compatible /chat/completions endpoint and return text output."""
    base = settings.base_url.rstrip("/")
    endpoint = base if base.endswith("/chat/completions") else f"{base}/chat/completions"

    token = resolve_api_token(api_token)
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
