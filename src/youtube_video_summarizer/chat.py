"""Interactive chat over YouTube transcripts using OpenAI-compatible APIs."""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from typing import Any

import requests

from .cli import STOPWORDS, fetch_transcript_text, parse_video_id


DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful assistant that answers questions using the provided "
    "YouTube transcript excerpts. If the transcript does not contain the answer, "
    "say you are unsure. Cite chunk ids like [chunk-3] when useful."
)


def tokenize(text: str) -> list[str]:
    """Tokenize text for lightweight retrieval scoring."""
    return re.findall(r"[A-Za-z][A-Za-z0-9'-]*", text.lower())


def chunk_transcript(text: str, words_per_chunk: int = 220) -> list[str]:
    """Split transcript into fixed-size chunks for retrieval."""
    words = text.split()
    chunks: list[str] = []
    for start in range(0, len(words), words_per_chunk):
        snippet = words[start : start + words_per_chunk]
        if len(snippet) < 20:
            continue
        chunks.append(" ".join(snippet))
    return chunks


def select_relevant_chunks(
    chunks: list[str],
    query: str,
    top_k: int,
) -> list[tuple[int, str]]:
    """Return top-k chunks by lexical overlap with the user query."""
    query_terms = {
        token
        for token in tokenize(query)
        if token not in STOPWORDS and len(token) >= 3
    }
    if not query_terms:
        return [(idx, chunk) for idx, chunk in enumerate(chunks[:top_k], start=1)]

    scored: list[tuple[int, int]] = []
    for idx, chunk in enumerate(chunks, start=1):
        chunk_terms = {
            token
            for token in tokenize(chunk)
            if token not in STOPWORDS and len(token) >= 3
        }
        overlap = len(query_terms & chunk_terms)
        scored.append((idx, overlap))

    ranked = sorted(scored, key=lambda item: item[1], reverse=True)
    selected_ids = [idx for idx, score in ranked if score > 0][:top_k]
    if not selected_ids:
        selected_ids = [idx for idx, _ in ranked[:top_k]]

    selected_ids = sorted(selected_ids)
    return [(idx, chunks[idx - 1]) for idx in selected_ids]


def _resolve_api_token(api_token: str | None, token_env: str) -> str:
    if api_token:
        return api_token

    from_env = os.getenv(token_env)
    if from_env:
        return from_env

    fallback = os.getenv("OPENAI_API_KEY")
    if fallback:
        return fallback

    raise RuntimeError(
        "Missing API token. Set --api-token, or export "
        f"{token_env}, or export OPENAI_API_KEY."
    )


def _chat_completions_endpoint(base_url: str) -> str:
    base = base_url.rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    return base + "/chat/completions"


def call_openai_compatible(
    *,
    base_url: str,
    model: str,
    api_token: str,
    messages: list[dict[str, str]],
    temperature: float,
    timeout: float,
) -> str:
    """Call an OpenAI-compatible chat completion endpoint."""
    endpoint = _chat_completions_endpoint(base_url)
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
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

    if not isinstance(content, str):
        return str(content)

    return content.strip()


def load_transcript(
    source: str,
    languages: str,
    save_transcript_to: str | None,
) -> tuple[str, str]:
    """Load transcript from local file or fetch from YouTube."""
    path = Path(source)
    if path.exists() and path.is_file():
        transcript = path.read_text(encoding="utf-8")
        return transcript, f"file:{path}"

    language_tuple = tuple(lang.strip() for lang in languages.split(",") if lang.strip())
    video_id = parse_video_id(source)
    transcript = fetch_transcript_text(video_id, languages=language_tuple)

    if save_transcript_to:
        out_path = Path(save_transcript_to)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(transcript + "\n", encoding="utf-8")

    return transcript, f"youtube:{video_id}"


def answer_once(
    *,
    question: str,
    transcript_chunks: list[str],
    system_prompt: str,
    base_url: str,
    model: str,
    api_token: str,
    top_k: int,
    history: list[dict[str, str]],
    history_turns: int,
    temperature: float,
    timeout: float,
) -> str:
    """Answer one user question using retrieved transcript chunks."""
    selected = select_relevant_chunks(transcript_chunks, question, top_k=top_k)
    context_block = "\n\n".join(
        f"[chunk-{idx}] {chunk}" for idx, chunk in selected
    )

    prompt = (
        "Transcript excerpts:\n"
        f"{context_block}\n\n"
        "User question:\n"
        f"{question}\n\n"
        "Answer clearly. If evidence is weak, say what is uncertain."
    )

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    if history_turns > 0 and history:
        messages.extend(history[-2 * history_turns :])
    messages.append({"role": "user", "content": prompt})

    answer = call_openai_compatible(
        base_url=base_url,
        model=model,
        api_token=api_token,
        messages=messages,
        temperature=temperature,
        timeout=timeout,
    )

    history.append({"role": "user", "content": question})
    history.append({"role": "assistant", "content": answer})
    return answer


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Chat with an LLM about a YouTube transcript. "
        "Source can be a YouTube URL/ID or a local transcript file.",
    )
    parser.add_argument("source", help="YouTube URL/ID or local transcript .txt path")
    parser.add_argument(
        "--languages",
        default="en,en-US",
        help="Language priority when source is YouTube URL/ID (default: en,en-US)",
    )
    parser.add_argument(
        "--question",
        default=None,
        help="Single-turn mode. If omitted, starts interactive chat.",
    )
    parser.add_argument(
        "--api-token",
        default=None,
        help="API token (preferred: use env var instead of CLI flag)",
    )
    parser.add_argument(
        "--token-env",
        default="LLM_API_TOKEN",
        help="Environment variable name to read API token from (default: LLM_API_TOKEN)",
    )
    parser.add_argument(
        "--base-url",
        default="https://api.openai.com/v1",
        help="OpenAI-compatible base URL (default: https://api.openai.com/v1)",
    )
    parser.add_argument(
        "--model",
        default="gpt-4o-mini",
        help="Model name for the selected provider",
    )
    parser.add_argument(
        "--chunk-words",
        type=int,
        default=220,
        help="Words per retrieval chunk (default: 220)",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=6,
        help="How many transcript chunks to retrieve per question (default: 6)",
    )
    parser.add_argument(
        "--history-turns",
        type=int,
        default=3,
        help="How many previous Q/A turns to include (default: 3)",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="LLM temperature (default: 0.2)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=90.0,
        help="HTTP timeout in seconds (default: 90)",
    )
    parser.add_argument(
        "--save-transcript-to",
        default=None,
        help="Optional path to save fetched transcript text",
    )
    parser.add_argument(
        "--system-prompt",
        default=DEFAULT_SYSTEM_PROMPT,
        help="Override the system prompt",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    api_token = _resolve_api_token(args.api_token, args.token_env)

    transcript_text, source_label = load_transcript(
        source=args.source,
        languages=args.languages,
        save_transcript_to=args.save_transcript_to,
    )
    transcript_chunks = chunk_transcript(transcript_text, words_per_chunk=args.chunk_words)
    if not transcript_chunks:
        raise RuntimeError("Transcript was empty after preprocessing; nothing to chat with.")

    history: list[dict[str, str]] = []

    if args.question:
        answer = answer_once(
            question=args.question,
            transcript_chunks=transcript_chunks,
            system_prompt=args.system_prompt,
            base_url=args.base_url,
            model=args.model,
            api_token=api_token,
            top_k=max(1, args.top_k),
            history=history,
            history_turns=max(0, args.history_turns),
            temperature=args.temperature,
            timeout=args.timeout,
        )
        print(answer)
        return

    print(f"Loaded transcript source: {source_label}")
    print(
        "Interactive mode started. Type your question, or type 'exit'/'quit' to stop."
    )

    while True:
        try:
            question = input("\nYou: ").strip()
        except EOFError:
            print("\nExiting.")
            break
        except KeyboardInterrupt:
            print("\nExiting.")
            break

        if not question:
            continue
        if question.lower() in {"exit", "quit"}:
            print("Exiting.")
            break

        answer = answer_once(
            question=question,
            transcript_chunks=transcript_chunks,
            system_prompt=args.system_prompt,
            base_url=args.base_url,
            model=args.model,
            api_token=api_token,
            top_k=max(1, args.top_k),
            history=history,
            history_turns=max(0, args.history_turns),
            temperature=args.temperature,
            timeout=args.timeout,
        )
        print(f"\nAssistant: {answer}")


if __name__ == "__main__":
    main()
