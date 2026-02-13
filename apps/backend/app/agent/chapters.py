"""Chapter generation helper for transcript navigation side panel."""

from __future__ import annotations

import json
import re
from typing import Any

from ..api.schemas import LLMSettings
from ..services.llm_client import chat_completion
from ..services.text_utils import format_timestamp

_JSON_ARRAY_RE = re.compile(r"\[[\s\S]*\]")


def generate_chapters_from_chunks(
    *,
    settings: LLMSettings,
    api_token: str,
    chunks: list[dict[str, Any]],
    max_chapters: int,
) -> list[dict[str, Any]]:
    """Generate coarse chapters from transcript chunks using session LLM."""
    if not chunks:
        return []

    transcript_end = max(float(chunk.get("end_seconds", 0.0) or 0.0) for chunk in chunks)
    capped_max = max(3, min(int(max_chapters), 24))

    context_rows = []
    for chunk in chunks[:160]:
        chunk_id = int(chunk.get("chunk_id", 0) or 0)
        start = chunk.get("start_label", "0:00")
        text = str(chunk.get("text", "")).strip().replace("\n", " ")
        text = text[:240]
        context_rows.append(f"[chunk-{chunk_id}] [{start}] {text}")
    context = "\n".join(context_rows)

    system = (
        "You create chapter timelines for transcript navigation. "
        "Return only valid JSON."
    )
    user = (
        "Create readable chapter titles for this transcript.\n"
        f"Target 6-{capped_max} chapters.\n"
        "Output JSON array only, each object with keys: title, start_seconds.\n"
        "Rules:\n"
        "- start_seconds must be numeric and ascending.\n"
        "- first chapter should start at 0.\n"
        "- concise title (2-8 words).\n"
        "- no markdown, no extra text.\n\n"
        "Transcript context:\n"
        f"{context}"
    )

    raw = chat_completion(
        settings=settings,
        api_token=api_token,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    candidates = _parse_candidates(raw)
    chapters = _finalize_candidates(candidates, transcript_end, capped_max)
    if chapters:
        return chapters

    return _fallback_chapters(chunks, transcript_end, capped_max)


def _parse_candidates(raw: str) -> list[tuple[float, str]]:
    match = _JSON_ARRAY_RE.search(raw)
    if not match:
        return []

    try:
        payload = json.loads(match.group(0))
    except Exception:
        return []

    if not isinstance(payload, list):
        return []

    rows: list[tuple[float, str]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()
        if not title:
            continue

        start_raw = item.get("start_seconds", 0)
        try:
            start = float(start_raw)
        except Exception:
            continue
        rows.append((max(0.0, start), title))

    return rows


def _finalize_candidates(
    rows: list[tuple[float, str]],
    transcript_end: float,
    max_chapters: int,
) -> list[dict[str, Any]]:
    if not rows:
        return []

    dedup: dict[int, str] = {}
    for start, title in rows:
        key = int(round(start))
        if key not in dedup:
            dedup[key] = title

    ordered = sorted(dedup.items(), key=lambda item: item[0])
    if not ordered:
        return []

    if ordered[0][0] > 0:
        ordered.insert(0, (0, "Introduction"))

    ordered = ordered[:max_chapters]
    if len(ordered) < 2:
        return []

    end_limit = max(float(transcript_end), float(ordered[-1][0]) + 1.0)
    chapters: list[dict[str, Any]] = []
    for idx, (start_sec, title) in enumerate(ordered, start=1):
        next_start = ordered[idx][0] if idx < len(ordered) else end_limit
        end_sec = max(float(start_sec) + 1.0, float(next_start))
        start = float(start_sec)
        chapters.append(
            {
                "chapter_id": idx,
                "title": title[:120].strip(),
                "start_seconds": start,
                "end_seconds": end_sec,
                "start_label": format_timestamp(start),
                "end_label": format_timestamp(end_sec),
                "source": "generated",
            }
        )

    return chapters


def _fallback_chapters(
    chunks: list[dict[str, Any]],
    transcript_end: float,
    max_chapters: int,
) -> list[dict[str, Any]]:
    if not chunks:
        return []

    chapter_count = min(max_chapters, 8)
    stride = max(1, len(chunks) // chapter_count)
    starts = []
    for idx in range(0, len(chunks), stride):
        starts.append(float(chunks[idx].get("start_seconds", 0.0) or 0.0))
    starts = sorted({int(round(s)) for s in starts})
    if not starts or starts[0] > 0:
        starts.insert(0, 0)
    starts = starts[:max_chapters]

    end_limit = max(float(transcript_end), float(starts[-1]) + 1.0)
    chapters: list[dict[str, Any]] = []
    for idx, start_sec in enumerate(starts, start=1):
        next_start = starts[idx] if idx < len(starts) else end_limit
        end_sec = max(float(start_sec) + 1.0, float(next_start))
        title = "Introduction" if idx == 1 else f"Section {idx}"
        chapters.append(
            {
                "chapter_id": idx,
                "title": title,
                "start_seconds": float(start_sec),
                "end_seconds": float(end_sec),
                "start_label": format_timestamp(float(start_sec)),
                "end_label": format_timestamp(float(end_sec)),
                "source": "generated",
            }
        )
    return chapters
