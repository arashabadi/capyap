# Backend (LangGraph + FastAPI)

Local-first API for onboarding, transcript ingestion, and timestamp-cited agent chat.

## Run

```bash
conda activate capyap
cd apps/backend
uvicorn app.main:app --reload --port 8000
```

## Key endpoints

- `GET /health`
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/transcripts/load`
- `POST /api/agent/chat`
