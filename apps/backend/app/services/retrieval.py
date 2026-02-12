"""Lexical retrieval for timestamped transcript chunks."""

from __future__ import annotations

from typing import TypedDict

from .text_utils import content_terms


class RankedChunk(TypedDict):
    """A selected chunk paired with retrieval score."""

    chunk_id: int
    text: str
    start_seconds: float
    end_seconds: float
    start_label: str
    end_label: str
    score: float


def select_relevant_chunks(
    chunks: list[dict],
    query: str,
    top_k: int,
) -> list[RankedChunk]:
    """Rank and select top-k chunks by lexical overlap."""
    desired = max(1, top_k)
    query_terms = content_terms(query)

    if not chunks:
        return []

    if not query_terms:
        return [
            {
                **chunk,
                "score": 0.01,
            }
            for chunk in chunks[:desired]
        ]

    scored: list[RankedChunk] = []
    for chunk in chunks:
        chunk_terms = content_terms(chunk["text"])
        if not chunk_terms:
            overlap = 0
            density = 0.0
        else:
            overlap = len(query_terms & chunk_terms)
            density = overlap / len(chunk_terms)

        coverage = overlap / max(len(query_terms), 1)
        score = float(overlap) + density + coverage

        scored.append(
            {
                **chunk,
                "score": round(score, 5),
            }
        )

    scored.sort(key=lambda item: (item["score"], -item["chunk_id"]), reverse=True)

    positive = [row for row in scored if row["score"] > 0][:desired]
    if positive:
        return sorted(positive, key=lambda row: row["chunk_id"])

    return sorted(scored[:desired], key=lambda row: row["chunk_id"])
