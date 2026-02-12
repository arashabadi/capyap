"""Transcript loading and cache refresh logic."""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi

from .chunking import TranscriptSegment, chunk_segments
from .storage import LocalStore
from .text_utils import normalize_text


class TranscriptService:
    """Load transcript data from YouTube or local files and cache locally."""

    def __init__(self, store: LocalStore) -> None:
        self._store = store

    def load_or_create(
        self,
        source: str,
        languages: str,
        chunk_words: int,
    ) -> dict:
        """Load transcript by source and refresh local cache."""
        transcript_id = self._store.build_transcript_id(source)

        segments: list[TranscriptSegment]
        source_label: str
        source_url: str | None = None

        path = Path(source)
        if path.exists() and path.is_file():
            source_label = f"file:{path.resolve()}"
            segments = self._load_file_segments(path)
        else:
            video_id = self.parse_video_id(source)
            source_label = f"youtube:{video_id}"
            source_url = f"https://www.youtube.com/watch?v={video_id}"
            lang_tuple = tuple(lang.strip() for lang in languages.split(",") if lang.strip())
            segments = self._fetch_youtube_segments(video_id, lang_tuple)

        chunks = chunk_segments(segments, words_per_chunk=chunk_words)
        word_count = sum(len(chunk["text"].split()) for chunk in chunks)

        payload = {
            "transcript_id": transcript_id,
            "source": source,
            "source_label": source_label,
            "source_url": source_url,
            "languages": languages,
            "chunk_words": chunk_words,
            "segments": segments,
            "chunks": chunks,
            "total_words": word_count,
        }

        self._store.save_transcript(transcript_id, payload)
        return payload

    def load_by_id(self, transcript_id: str) -> dict | None:
        """Load cached transcript payload by id."""
        return self._store.load_transcript(transcript_id)

    @staticmethod
    def parse_video_id(url_or_id: str) -> str:
        """Return valid 11-char YouTube ID from URL or raw id."""
        if re.fullmatch(r"[A-Za-z0-9_-]{11}", url_or_id):
            return url_or_id

        parsed = urlparse(url_or_id)

        if parsed.netloc in {"youtu.be", "www.youtu.be"}:
            candidate = parsed.path.lstrip("/").split("/")[0]
            if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
                return candidate

        if parsed.netloc.endswith("youtube.com"):
            query = parse_qs(parsed.query)
            candidate = query.get("v", [""])[0]
            if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
                return candidate

            parts = [piece for piece in parsed.path.split("/") if piece]
            if len(parts) >= 2 and parts[0] in {"shorts", "embed", "live"}:
                candidate = parts[1]
                if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
                    return candidate

        raise ValueError(
            "Could not parse a valid YouTube video ID from source. "
            "Use a full URL or 11-character ID."
        )

    @staticmethod
    def _fetch_youtube_segments(
        video_id: str,
        languages: tuple[str, ...],
    ) -> list[TranscriptSegment]:
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=languages)

        segments: list[TranscriptSegment] = []
        for row in transcript:
            text = normalize_text(row.text)
            if not text:
                continue
            start = float(getattr(row, "start", 0.0) or 0.0)
            duration = float(getattr(row, "duration", 0.0) or 0.0)
            segments.append(
                {
                    "text": text,
                    "start_seconds": start,
                    "duration_seconds": duration,
                }
            )

        return segments

    @staticmethod
    def _load_file_segments(path: Path) -> list[TranscriptSegment]:
        text = path.read_text(encoding="utf-8")
        words = text.split()

        if not words:
            return []

        segments: list[TranscriptSegment] = []
        window = 26
        current_start = 0.0
        for start in range(0, len(words), window):
            snippet = words[start : start + window]
            if not snippet:
                continue
            segments.append(
                {
                    "text": " ".join(snippet),
                    "start_seconds": current_start,
                    "duration_seconds": 12.0,
                }
            )
            current_start += 12.0

        return segments
