# Development Guide

## Prerequisites

- Conda
- Node.js (managed by `capyap.yml` for standard setup)
- Rust toolchain (only for desktop/Tauri work)

## Standard Local Setup

```bash
git clone https://github.com/arashabadi/capyap.git
cd capyap
conda env create -f capyap.yml
conda activate capyap
npm run build
capyap start
```

## Advanced App Development

Use `apps/environment.yml` for full app development:

```bash
conda env create -f apps/environment.yml
conda activate capyap_apps
```

Run local web mode:

```bash
./scripts/dev-web.sh
```

Run desktop mode:

```bash
./scripts/dev-desktop.sh
```

Run all:

```bash
./scripts/dev-all.sh
```

## Frontend Notes

- Main workspace UI: `apps/frontend/src/views/Workspace.tsx`
- Source loader: `apps/frontend/src/views/SourceLoader.tsx`
- API bridge: `apps/frontend/src/services/api.ts`
- YouTube timestamp deep-link helper: `apps/frontend/src/services/youtube.ts`
- iPad-friendly export generator: `apps/frontend/src/services/export.ts`

## Backend Notes

- FastAPI app: `apps/backend/app/main.py`
- Routes:
  - `apps/backend/app/api/routes_settings.py`
  - `apps/backend/app/api/routes_transcripts.py`
  - `apps/backend/app/api/routes_agent.py`
- LangGraph:
  - `apps/backend/app/agent/state.py`
  - `apps/backend/app/agent/nodes.py`
  - `apps/backend/app/agent/graph.py`

## Security Constraints (Developer)

- Never add persistent API key fields to settings schemas.
- Never write API tokens to disk, logs, or cache files.
- Keep API token request-scoped on `/api/agent/chat`.

See [Security and Privacy](SECURITY_AND_PRIVACY.md) for the full policy.
