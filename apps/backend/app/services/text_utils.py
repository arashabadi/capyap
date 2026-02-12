"""Text processing helpers used by retrieval and transcript prep."""

from __future__ import annotations

import re

STOPWORDS = {
    "a",
    "about",
    "after",
    "all",
    "also",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "been",
    "before",
    "between",
    "both",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "for",
    "from",
    "had",
    "has",
    "have",
    "he",
    "her",
    "here",
    "him",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "just",
    "me",
    "more",
    "most",
    "my",
    "no",
    "not",
    "of",
    "on",
    "one",
    "only",
    "or",
    "our",
    "out",
    "over",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "too",
    "up",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "will",
    "with",
    "you",
    "your",
}


def normalize_text(raw: str) -> str:
    """Normalize caption text from transcript snippets."""
    text = re.sub(r"\[[^\]]+\]", "", raw)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> list[str]:
    """Tokenize text for lexical retrieval scoring."""
    return re.findall(r"[A-Za-z][A-Za-z0-9'-]*", text.lower())


def content_terms(text: str) -> set[str]:
    """Return filtered content terms for overlap scoring."""
    return {
        token
        for token in tokenize(text)
        if token not in STOPWORDS and len(token) >= 3 and not token.isdigit()
    }


def format_timestamp(seconds: float) -> str:
    """Format seconds into a YouTube-style timestamp label."""
    total = max(0, int(seconds))
    hours = total // 3600
    minutes = (total % 3600) // 60
    secs = total % 60

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
