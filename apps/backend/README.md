# Backend (LangGraph + FastAPI)

Local-first API for onboarding, transcript ingestion, and timestamp-cited agent chat.

Security rule:
- API keys are session-scoped in `/api/agent/chat` and are never persisted by backend storage.

Related docs:
- `../../docs/AGENTIC_SYSTEM_ARCHITECTURE.md`
- `../../docs/SECURITY_AND_PRIVACY.md`

## Run

```bash
conda activate capyap
cd apps/backend
uvicorn app.main:app --reload --port 8000
```

## Key endpoints

- `GET /health`
- `GET /api/settings`
- `GET /api/settings/ollama/status`
- `POST /api/settings`
- `POST /api/transcripts/load`
- `POST /api/agent/chat`
