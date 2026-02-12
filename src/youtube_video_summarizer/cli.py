"""CLI for extracting YouTube transcripts and generating a simple summary."""

from __future__ import annotations

import argparse
import math
import re
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi

# Small built-in stopword list to keep dependencies light.
STOPWORDS = {
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "doing",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "itself",
    "just",
    "let",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "now",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
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
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "would",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
}


def parse_video_id(url_or_id: str) -> str:
    """Return a valid 11-char YouTube video ID from URL or raw ID."""
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url_or_id):
        return url_or_id

    parsed = urlparse(url_or_id)

    if parsed.netloc in {"youtu.be", "www.youtu.be"}:
        video_id = parsed.path.lstrip("/").split("/")[0]
        if re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
            return video_id

    if parsed.netloc.endswith("youtube.com"):
        query = parse_qs(parsed.query)
        candidate = query.get("v", [""])[0]
        if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
            return candidate

        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2 and parts[0] in {"shorts", "embed", "live"}:
            candidate = parts[1]
            if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
                return candidate

    raise ValueError(
        "Could not parse a valid YouTube video ID. "
        "Pass a full URL or an 11-character video ID."
    )


def normalize_text(raw: str) -> str:
    """Normalize transcript snippet text."""
    text = raw
    text = re.sub(r"\[[^\]]+\]", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_sentences(text: str) -> list[str]:
    """Split transcript text into sentence-like chunks."""
    chunks = re.split(r"(?<=[.!?])\s+", text)
    sentences: list[str] = []
    for chunk in chunks:
        chunk = chunk.strip()
        if len(chunk) < 30:
            continue

        words = chunk.split()
        if len(words) < 6:
            continue

        if len(words) <= 35:
            sentences.append(chunk)
            continue

        # Captions can become run-on blocks. Split long segments into readable
        # windows so extractive summaries stay concise.
        window = 28
        for start in range(0, len(words), window):
            snippet = words[start : start + window]
            if len(snippet) < 6:
                continue
            sentences.append(" ".join(snippet).strip(" ,;:"))

    return sentences


def top_keywords(text: str, count: int = 12) -> list[tuple[str, int]]:
    """Return top frequent keywords from transcript text."""
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9'-]*", text.lower())
    filtered = [
        t for t in tokens if t not in STOPWORDS and len(t) >= 3 and not t.isdigit()
    ]
    freq = Counter(filtered)
    return freq.most_common(count)


def summarize_text(text: str, max_sentences: int = 8) -> list[str]:
    """Generate a simple extractive summary from transcript text."""
    sentences = split_sentences(text)
    if not sentences:
        return []

    keywords = dict(top_keywords(text, count=200))
    if not keywords:
        return sentences[:max_sentences]

    scores: list[tuple[int, float]] = []
    for idx, sentence in enumerate(sentences):
        tokens = re.findall(r"[A-Za-z][A-Za-z0-9'-]*", sentence.lower())
        if not tokens:
            continue

        weight = sum(keywords.get(token, 0) for token in tokens)
        length_penalty = 1.0 / math.sqrt(max(len(tokens), 1))
        position_boost = 1.1 if 0.1 <= idx / max(len(sentences), 1) <= 0.9 else 1.0
        score = weight * length_penalty * position_boost
        scores.append((idx, score))

    if not scores:
        return sentences[:max_sentences]

    sentence_token_sets: dict[int, set[str]] = {}
    for idx, sentence in enumerate(sentences):
        toks = {
            token
            for token in re.findall(r"[A-Za-z][A-Za-z0-9'-]*", sentence.lower())
            if token not in STOPWORDS and len(token) >= 3
        }
        sentence_token_sets[idx] = toks

    ranked = sorted(scores, key=lambda item: item[1], reverse=True)
    picked: list[int] = []

    for idx, _ in ranked:
        candidate = sentence_token_sets[idx]
        duplicate = False
        for chosen in picked:
            chosen_set = sentence_token_sets[chosen]
            union = candidate | chosen_set
            if not union:
                continue
            overlap = len(candidate & chosen_set) / len(union)
            if overlap >= 0.8:
                duplicate = True
                break
        if duplicate:
            continue

        picked.append(idx)
        if len(picked) >= max_sentences:
            break

    chosen_indexes = sorted(picked)
    return [sentences[i] for i in chosen_indexes]


def fetch_transcript_text(video_id: str, languages: tuple[str, ...]) -> str:
    """Fetch transcript text for a video in preferred languages."""
    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id, languages=languages)
    lines = [normalize_text(snippet.text) for snippet in transcript]
    lines = [line for line in lines if line]
    return " ".join(lines)


def build_parser() -> argparse.ArgumentParser:
    """Build command line parser."""
    parser = argparse.ArgumentParser(
        description="Extract YouTube transcript and generate a concise summary."
    )
    parser.add_argument("video", help="YouTube URL or 11-character video ID")
    parser.add_argument(
        "--languages",
        default="en,en-US",
        help="Comma-separated language preference list (default: en,en-US)",
    )
    parser.add_argument(
        "--summary-sentences",
        type=int,
        default=8,
        help="How many sentences to keep in summary (default: 8)",
    )
    parser.add_argument(
        "--out-dir",
        default="output",
        help="Directory for transcript and summary files (default: output)",
    )
    return parser


def run(video: str, languages: str, summary_sentences: int, out_dir: str) -> dict[str, str]:
    """Run extraction + summary and return output file paths."""
    video_id = parse_video_id(video)
    language_tuple = tuple(
        lang.strip() for lang in languages.split(",") if lang.strip()
    )

    transcript_text = fetch_transcript_text(video_id, languages=language_tuple)
    summary = summarize_text(transcript_text, max_sentences=max(1, summary_sentences))

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    transcript_path = out_path / f"{video_id}.transcript.txt"
    summary_path = out_path / f"{video_id}.summary.txt"

    transcript_path.write_text(transcript_text + "\n", encoding="utf-8")

    with summary_path.open("w", encoding="utf-8") as fh:
        fh.write(f"Video ID: {video_id}\n")
        fh.write(f"Languages: {', '.join(language_tuple)}\n\n")
        fh.write("Summary:\n")
        for idx, sentence in enumerate(summary, start=1):
            fh.write(f"{idx}. {sentence}\n")

    return {
        "video_id": video_id,
        "transcript_path": str(transcript_path),
        "summary_path": str(summary_path),
        "summary": "\n".join(f"{idx}. {item}" for idx, item in enumerate(summary, start=1)),
    }


def main() -> None:
    """Entrypoint for CLI."""
    parser = build_parser()
    args = parser.parse_args()

    results = run(
        video=args.video,
        languages=args.languages,
        summary_sentences=args.summary_sentences,
        out_dir=args.out_dir,
    )

    print(f"Saved transcript: {results['transcript_path']}")
    print(f"Saved summary: {results['summary_path']}")
    print("\nSummary:")
    if results["summary"]:
        print(results["summary"])
    else:
        print("(No summary sentences generated)")


if __name__ == "__main__":
    main()
