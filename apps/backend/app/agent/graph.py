"""Compiled LangGraph workflow for transcript-grounded QA."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from .nodes import (
    build_prompt_node,
    call_model_node,
    extract_citations_node,
    retrieve_chunks_node,
)
from .state import AgentState


def _build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("retrieve", retrieve_chunks_node)
    builder.add_node("prompt", build_prompt_node)
    builder.add_node("answer", call_model_node)
    builder.add_node("citations", extract_citations_node)

    builder.add_edge(START, "retrieve")
    builder.add_edge("retrieve", "prompt")
    builder.add_edge("prompt", "answer")
    builder.add_edge("answer", "citations")
    builder.add_edge("citations", END)

    return builder.compile()


GRAPH = _build_graph()


def run_agent(state: AgentState) -> AgentState:
    """Run the compiled graph with the provided state payload."""
    return GRAPH.invoke(state)
