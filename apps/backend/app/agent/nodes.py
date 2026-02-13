"""LangGraph node functions for transcript-grounded QA."""

from __future__ import annotations

import re

from ..services.llm_client import SYSTEM_PROMPT, chat_completion
from ..services.retrieval import select_relevant_chunks
from .state import AgentState

_CHUNK_TAG_PATTERN = re.compile(r"\[chunk-(\d+)\]")


def _strip_markdown_noise(text: str) -> str:
    """Remove common markdown artifacts so UI output stays clean."""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n").strip()

    # Remove fenced code blocks and inline markdown emphasis markers.
    cleaned = re.sub(r"```[\s\S]*?```", "", cleaned)
    cleaned = re.sub(r"`([^`]*)`", r"\1", cleaned)
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
    cleaned = re.sub(r"__([^_]+)__", r"\1", cleaned)
    cleaned = re.sub(r"_([^_]+)_", r"\1", cleaned)

    # Remove heading and list syntax at line start.
    cleaned = re.sub(r"(?m)^\s*#{1,6}\s*", "", cleaned)
    cleaned = re.sub(r"(?m)^\s*[-*•]\s+", "", cleaned)
    cleaned = re.sub(r"(?m)^\s*\d+\.\s+", "", cleaned)

    # Remove source/chunk tag lines and inline chunk markers.
    cleaned = re.sub(
        r"(?im)^\s*(sources?|evidence)\s*:\s*(?:\s*\[chunk-\d+\][,\s]*)+\s*$",
        "",
        cleaned,
    )
    cleaned = re.sub(r"\s*\[chunk-\d+\]\s*", " ", cleaned)

    # Normalize whitespace while preserving paragraph breaks.
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", cleaned) if p.strip()]
    normalized = []
    for para in paragraphs:
        lines = [re.sub(r"\s+", " ", ln).strip() for ln in para.splitlines() if ln.strip()]
        if lines:
            normalized.append(" ".join(lines))
    return "\n\n".join(normalized).strip()


def _truncate_words(text: str, max_words: int = 110) -> str:
    """Keep answers short if the model still returns long content."""
    words = text.split()
    if len(words) <= max_words:
        return text

    shortened = " ".join(words[:max_words]).rstrip(" ,;:")
    if shortened and not shortened.endswith((".", "!", "?")):
        shortened += "."
    return f"{shortened}\n\nShort answer shown. Ask for more detail if needed."


def _add_line_spacing(text: str) -> str:
    """Insert lightweight paragraph spacing for easier reading in chat UI."""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if len(sentences) <= 1:
        return text

    blocks = []
    for idx, sentence in enumerate(sentences, start=1):
        blocks.append(sentence)
        if idx % 2 == 0 and idx < len(sentences):
            blocks.append("")

    return "\n".join(blocks).strip()


def retrieve_chunks_node(state: AgentState) -> dict:
    """Select the most relevant transcript chunks for the question."""
    selected = select_relevant_chunks(
        chunks=state["chunks"],
        query=state["question"],
        top_k=state["top_k"],
    )
    return {"selected_chunks": selected}


def build_prompt_node(state: AgentState) -> dict:
    """Build an answer prompt with retrieval context and timeline metadata."""
    selected = state.get("selected_chunks", [])

    if not selected:
        context = "No transcript chunks were retrieved."
    else:
        context = "\n\n".join(
            (
                f"[chunk-{chunk['chunk_id']}] "
                f"[{chunk['start_label']}-{chunk['end_label']}] "
                f"{chunk['text']}"
            )
            for chunk in selected
        )

    prompt = (
        "Transcript excerpts:\n"
        f"{context}\n\n"
        "User question:\n"
        f"{state['question']}\n\n"
        "Response requirements:\n"
        "- English only.\n"
        "- Keep it short and direct (max 110 words unless the user explicitly asks for depth).\n"
        "- Plain text only. No markdown symbols, no bullet lists, no asterisks.\n"
        "- Use short sentences and clear paragraph spacing.\n"
        "- Base claims only on transcript evidence; if unsure, say so briefly.\n"
        "- If helpful, include chunk tags like [chunk-2] for evidence tracking."
    )

    return {"prompt": prompt}


def call_model_node(state: AgentState) -> dict:
    """Call LLM provider to generate grounded answer."""
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    history_turns = max(0, state["history_turns"])
    if history_turns > 0 and state["history"]:
        messages.extend(state["history"][-2 * history_turns :])

    messages.append({"role": "user", "content": state["prompt"]})

    answer = chat_completion(
        settings=state["settings"],
        api_token=state["session_api_token"],
        messages=messages,
    )
    return {"answer": answer}


def extract_citations_node(state: AgentState) -> dict:
    """Attach citation objects from selected chunks, preferring explicit model citations."""
    selected = state.get("selected_chunks", [])
    raw_answer = state.get("answer", "")
    cleaned_answer = _add_line_spacing(_truncate_words(_strip_markdown_noise(raw_answer)))
    if not cleaned_answer:
        cleaned_answer = (
            "I could not find a clear answer in the transcript.\n\n"
            "Try a more specific question."
        )

    if not selected:
        return {"citations": [], "answer": cleaned_answer}

    max_citations = 3
    cited_ids = {
        int(match)
        for match in _CHUNK_TAG_PATTERN.findall(raw_answer)
    }

    if cited_ids:
        citations = [chunk for chunk in selected if chunk["chunk_id"] in cited_ids][
            :max_citations
        ]
    else:
        citations = selected[: min(max_citations, len(selected))]

    return {"citations": citations, "answer": cleaned_answer}
