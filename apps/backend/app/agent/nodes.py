"""LangGraph node functions for transcript-grounded QA."""

from __future__ import annotations

import re

from ..services.llm_client import SYSTEM_PROMPT, chat_completion
from ..services.retrieval import select_relevant_chunks
from .state import AgentState


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
        "Answer clearly and ground claims in transcript evidence."
    )

    return {"prompt": prompt}


def call_model_node(state: AgentState) -> dict:
    """Call LLM provider to generate grounded answer."""
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    history_turns = max(0, state["history_turns"])
    if history_turns > 0 and state["history"]:
        messages.extend(state["history"][-2 * history_turns :])

    messages.append({"role": "user", "content": state["prompt"]})

    answer = chat_completion(settings=state["settings"], messages=messages)
    return {"answer": answer}


def extract_citations_node(state: AgentState) -> dict:
    """Attach citation objects from selected chunks, preferring explicit model citations."""
    selected = state.get("selected_chunks", [])
    if not selected:
        return {"citations": []}

    cited_ids = {
        int(match)
        for match in re.findall(r"\[chunk-(\d+)\]", state.get("answer", ""))
    }

    if cited_ids:
        citations = [chunk for chunk in selected if chunk["chunk_id"] in cited_ids]
    else:
        citations = selected[: min(3, len(selected))]

    return {"citations": citations}
