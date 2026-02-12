"""Chunk construction with timestamp metadata for citation-ready retrieval."""

from __future__ import annotations

from typing import TypedDict

from .text_utils import format_timestamp


class TranscriptSegment(TypedDict):
    """A normalized transcript segment."""

    text: str
    start_seconds: float
    duration_seconds: float


class TranscriptChunk(TypedDict):
    """A retrieval chunk with timestamp boundaries."""

    chunk_id: int
    text: str
    start_seconds: float
    end_seconds: float
    start_label: str
    end_label: str


def chunk_segments(
    segments: list[TranscriptSegment],
    words_per_chunk: int,
) -> list[TranscriptChunk]:
    """Create fixed-size chunks preserving start/end timeline metadata."""
    chunks: list[TranscriptChunk] = []
    acc_words: list[str] = []
    chunk_start = 0.0
    chunk_end = 0.0

    def flush_chunk(next_chunk_id: int) -> int:
        nonlocal acc_words, chunk_start, chunk_end
        if not acc_words:
            return next_chunk_id

        text = " ".join(acc_words).strip()
        if not text:
            acc_words = []
            return next_chunk_id

        start = chunk_start
        end = max(chunk_end, start)
        chunks.append(
            {
                "chunk_id": next_chunk_id,
                "text": text,
                "start_seconds": start,
                "end_seconds": end,
                "start_label": format_timestamp(start),
                "end_label": format_timestamp(end),
            }
        )

        acc_words = []
        return next_chunk_id + 1

    chunk_id = 1
    word_budget = max(80, words_per_chunk)

    for segment in segments:
        words = segment["text"].split()
        if not words:
            continue

        if not acc_words:
            chunk_start = max(0.0, float(segment["start_seconds"]))

        segment_end = float(segment["start_seconds"]) + float(segment["duration_seconds"])

        acc_words.extend(words)
        chunk_end = max(chunk_end, segment_end)

        if len(acc_words) >= word_budget:
            chunk_id = flush_chunk(chunk_id)

    flush_chunk(chunk_id)
    return chunks
