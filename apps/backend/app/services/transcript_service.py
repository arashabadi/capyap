"""Transcript loading and cache refresh logic."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests
from youtube_transcript_api import YouTubeTranscriptApi

from .chunking import TranscriptSegment, chunk_segments
from .storage import LocalStore
from .text_utils import format_timestamp, normalize_text


_SHORT_DESCRIPTION_RE = re.compile(
    r'"shortDescription":"((?:\\.|[^"\\])*)"',
    flags=re.DOTALL,
)
_CHAPTER_LINE_RE = re.compile(
    r"^\s*(?P<stamp>(?:\d{1,2}:)?\d{1,2}:\d{2})\s+(?P<title>.+?)\s*$"
)
_CHAPTER_RENDERER_NEEDLE = '"chapterRenderer":'


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
        source_title: str | None = None
        source_url: str | None = None
        chapters: list[dict] = []

        path = Path(source)
        if path.exists() and path.is_file():
            source_label = f"file:{path.resolve()}"
            source_title = path.stem
            segments = self._load_file_segments(path)
        else:
            video_id = self.parse_video_id(source)
            source_label = f"youtube:{video_id}"
            source_url = f"https://www.youtube.com/watch?v={video_id}"
            source_title = self._fetch_youtube_title(video_id)
            lang_tuple = tuple(lang.strip() for lang in languages.split(",") if lang.strip())
            segments = self._fetch_youtube_segments(video_id, lang_tuple)
            raw_chapters = self._fetch_youtube_chapter_markers(video_id)
            transcript_end = (
                max(
                    (
                        float(seg["start_seconds"]) + float(seg["duration_seconds"])
                        for seg in segments
                    ),
                    default=0.0,
                )
                if segments
                else 0.0
            )
            chapters = self._finalize_chapters(raw_chapters, transcript_end, source="youtube")

        chunks = chunk_segments(segments, words_per_chunk=chunk_words)
        word_count = sum(len(chunk["text"].split()) for chunk in chunks)

        payload = {
            "transcript_id": transcript_id,
            "source": source,
            "source_label": source_label,
            "source_title": source_title,
            "source_url": source_url,
            "languages": languages,
            "chunk_words": chunk_words,
            "segments": segments,
            "chunks": chunks,
            "chapters": chapters,
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

    @staticmethod
    def _fetch_youtube_title(video_id: str) -> str | None:
        """Fetch video title using YouTube oEmbed endpoint without API key."""
        watch_url = f"https://www.youtube.com/watch?v={video_id}"
        try:
            response = requests.get(
                "https://www.youtube.com/oembed",
                params={"url": watch_url, "format": "json"},
                timeout=12,
                headers={
                    "User-Agent": "Mozilla/5.0 (Capyap/1.0)",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
        except Exception:
            return None

        if response.status_code >= 400:
            return None

        try:
            payload = response.json()
        except Exception:
            return None

        title = payload.get("title")
        if isinstance(title, str):
            clean = title.strip()
            if clean:
                return clean
        return None

    @staticmethod
    def _fetch_youtube_chapter_markers(video_id: str) -> list[tuple[float, str]]:
        """Parse chapter timestamp markers from YouTube watch-page description."""
        url = (
            "https://www.youtube.com/watch"
            f"?v={video_id}&hl=en&persist_hl=1&gl=US&bpctr=9999999999&has_verified=1"
        )
        try:
            response = requests.get(
                url,
                timeout=20,
                headers={
                    "User-Agent": "Mozilla/5.0 (Capyap/1.0)",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
        except Exception:
            return []

        if response.status_code >= 400:
            return []

        rendered = TranscriptService._extract_chapters_from_renderers(response.text)
        if len(rendered) >= 2:
            return rendered

        description = TranscriptService._extract_short_description(response.text)
        if not description:
            return []

        markers: list[tuple[float, str]] = []
        for line in description.splitlines():
            match = _CHAPTER_LINE_RE.match(line)
            if not match:
                continue

            seconds = TranscriptService._parse_timestamp_to_seconds(match.group("stamp"))
            title = match.group("title").strip().lstrip("-|:–— ").strip()
            if not title:
                continue
            markers.append((seconds, title))

        if len(markers) < 2:
            return []

        unique: dict[int, str] = {}
        for seconds, title in markers:
            key = int(max(0, round(seconds)))
            if key not in unique:
                unique[key] = title

        ordered = sorted(unique.items(), key=lambda item: item[0])
        return [(float(sec), title) for sec, title in ordered]

    @staticmethod
    def _extract_chapters_from_renderers(watch_html: str) -> list[tuple[float, str]]:
        markers: list[tuple[float, str]] = []
        cursor = 0
        while True:
            needle_idx = watch_html.find(_CHAPTER_RENDERER_NEEDLE, cursor)
            if needle_idx < 0:
                break

            object_start = watch_html.find("{", needle_idx + len(_CHAPTER_RENDERER_NEEDLE))
            if object_start < 0:
                break

            raw_obj, object_end = TranscriptService._extract_json_object(
                watch_html, object_start
            )
            if not raw_obj:
                cursor = object_start + 1
                continue

            try:
                payload = json.loads(raw_obj)
            except Exception:
                cursor = object_end
                continue

            title = TranscriptService._chapter_title_from_payload(payload)
            ms_raw = payload.get("timeRangeStartMillis")
            if title and ms_raw is not None:
                try:
                    start = float(ms_raw) / 1000.0
                    markers.append((max(0.0, start), title))
                except Exception:
                    pass

            cursor = object_end

        dedup: dict[int, str] = {}
        for seconds, title in markers:
            key = int(max(0, round(seconds)))
            if key not in dedup:
                dedup[key] = title
        ordered = sorted(dedup.items(), key=lambda item: item[0])
        return [(float(sec), title) for sec, title in ordered]

    @staticmethod
    def _extract_json_object(blob: str, start_idx: int) -> tuple[str, int]:
        if start_idx < 0 or start_idx >= len(blob) or blob[start_idx] != "{":
            return "", start_idx

        depth = 0
        in_string = False
        escaped = False
        idx = start_idx
        while idx < len(blob):
            ch = blob[idx]
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    in_string = False
            else:
                if ch == '"':
                    in_string = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        return blob[start_idx : idx + 1], idx + 1
            idx += 1

        return "", start_idx

    @staticmethod
    def _chapter_title_from_payload(payload: dict) -> str:
        title_data = payload.get("title")
        if not isinstance(title_data, dict):
            return ""

        simple = title_data.get("simpleText")
        if isinstance(simple, str) and simple.strip():
            return simple.strip()

        runs = title_data.get("runs")
        if isinstance(runs, list):
            parts = []
            for row in runs:
                if isinstance(row, dict):
                    text = row.get("text")
                    if isinstance(text, str):
                        parts.append(text.strip())
            joined = " ".join(part for part in parts if part).strip()
            if joined:
                return joined

        return ""

    @staticmethod
    def _extract_short_description(watch_html: str) -> str:
        match = _SHORT_DESCRIPTION_RE.search(watch_html)
        if not match:
            return ""

        encoded = match.group(1)
        try:
            return json.loads(f'"{encoded}"')
        except Exception:
            return ""

    @staticmethod
    def _parse_timestamp_to_seconds(value: str) -> float:
        parts = [int(piece) for piece in value.strip().split(":")]
        if len(parts) == 2:
            minutes, seconds = parts
            return float(minutes * 60 + seconds)
        if len(parts) == 3:
            hours, minutes, seconds = parts
            return float(hours * 3600 + minutes * 60 + seconds)
        return 0.0

    @staticmethod
    def _finalize_chapters(
        markers: list[tuple[float, str]],
        transcript_end: float,
        *,
        source: str,
    ) -> list[dict]:
        if not markers:
            return []

        ordered = sorted(markers, key=lambda item: item[0])
        if ordered[0][0] > 0.0:
            ordered.insert(0, (0.0, "Introduction"))

        end_limit = max(float(transcript_end), ordered[-1][0] + 1.0)
        chapters: list[dict] = []
        for idx, (start, title) in enumerate(ordered, start=1):
            next_start = ordered[idx][0] if idx < len(ordered) else end_limit
            end = max(start + 1.0, next_start)
            chapters.append(
                {
                    "chapter_id": idx,
                    "title": title,
                    "start_seconds": float(start),
                    "end_seconds": float(end),
                    "start_label": format_timestamp(float(start)),
                    "end_label": format_timestamp(float(end)),
                    "source": source,
                }
            )

        return chapters
