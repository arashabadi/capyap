# Agentic System Architecture

## Goals

- Local-first transcript analysis for non-coder users.
- Citation-grounded answers using a LangGraph workflow.
- Session-only API key usage (no key persisted on disk).
- Single command launch: `capyap start`.

## Top-Level Apps

- `apps/backend`: FastAPI API + LangGraph orchestration.
- `apps/frontend`: React/Vite local web app.
- `apps/desktop`: Tauri wrapper for desktop packaging.
- `src/youtube_video_summarizer`: CLI entrypoints and launcher.

## Runtime Flow

1. User runs `capyap start`.
2. Launcher verifies frontend build and starts FastAPI.
3. Frontend is served by backend SPA routes.
4. User loads a source (`/api/transcripts/load`).
5. Backend returns native chapters when available.
6. User asks a question (`/api/agent/chat`) with a session API key.
7. Backend runs LangGraph and returns answer + citations.
8. If no native chapters exist, UI can request generated chapters (`/api/agent/chapters`) after API key is provided.

## LangGraph Pipeline

Graph state and nodes are in:

- `apps/backend/app/agent/state.py`
- `apps/backend/app/agent/nodes.py`
- `apps/backend/app/agent/graph.py`

Node order:

1. `retrieve_chunks_node`
2. `build_prompt_node`
3. `call_model_node`
4. `extract_citations_node`

### Retrieval

- Selects top transcript chunks for the user question.
- Uses local transcript chunk cache.

### Chapters

- On transcript load, backend attempts to parse native YouTube chapters.
- If no native chapters are available, UI can call chapter generation after API key entry.
- Generated chapters are cached to the local transcript payload.

### Prompt Construction

- Builds structured context with chunk IDs and timestamp labels.
- Includes only relevant chunks.

### Model Call

- Calls OpenAI-compatible chat endpoint.
- Uses `session_api_token` from request only.

### Citation Extraction

- Prefers explicit `[chunk-x]` mentions in model output.
- Falls back to top selected chunks if explicit references are absent.

## Frontend Interaction Model

- Source loader accepts YouTube URLs or local transcript files.
- Workspace has transcript panel + agent chat panel.
- Citation cards include timestamp jump controls.
- For YouTube sources, clicking transcript/citation timestamps opens browser at exact time.

## Timestamp Deep-Link Behavior

- Deep-link logic: `apps/frontend/src/services/youtube.ts`.
- Wired from workspace click handler:
  - Transcript segment click.
  - Citation jump click in agent responses.
- Uses `t=<seconds>s` query param.

## Data Storage Model

- Persisted:
  - Non-secret settings (provider label, base URL, model, retrieval params).
  - Transcript cache (chunks and metadata).
- Never persisted:
  - API keys.

Storage implementation:

- `apps/backend/app/services/storage.py`

## API Surface

- `GET /health`
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/transcripts/load`
- `POST /api/agent/chat`
- `POST /api/agent/chapters`

## Extensibility

- Add new providers by setting OpenAI-compatible base URL + model at runtime.
- Replace retrieval strategy in `apps/backend/app/services/retrieval.py`.
- Extend graph nodes for tools or multi-agent routing.
