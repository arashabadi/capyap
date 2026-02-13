# Security and Privacy

## Rule

Your API key is used directly for this session and is never stored on disk. Capyap runs locally on your machine.

## Enforcement Points

### Frontend

- API key is held in memory session state only.
- API key is passed directly to `/api/agent/chat`.
- No `localStorage`/`sessionStorage` persistence for keys.

Relevant files:

- `apps/frontend/src/components/ApiKeyModal.tsx`
- `apps/frontend/src/views/Workspace.tsx`
- `apps/frontend/src/services/api.ts`

### Backend

- `/api/agent/chat` requires `api_token` in request body.
- Missing session key is rejected with a clear error.
- LLM calls use only the provided session token.

Relevant files:

- `apps/backend/app/api/routes_agent.py`
- `apps/backend/app/services/llm_client.py`
- `apps/backend/app/agent/nodes.py`

### Persistence Layer

- Settings persistence contains non-secret config only.
- Legacy key fields are stripped if found from old versions.
- Transcript cache contains transcript metadata/chunks only.

Relevant file:

- `apps/backend/app/services/storage.py`

## What Is Stored Locally

- Non-secret model/provider/runtime settings.
- Transcript chunks and metadata cache.
- Frontend build artifacts and local dependencies.

## What Is Not Stored Locally

- API keys/tokens.
- Request-scoped session auth secrets.

## Legacy CLI Note

Legacy CLI commands (`yt-extract-summarize`, `yt-transcript-chat`) may read API keys from environment variables at runtime; they do not persist keys to disk.
