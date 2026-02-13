# Apps (Advanced Development Mode)

This folder contains a local-first product stack:

- `backend/`: FastAPI + LangGraph agent backend
- `frontend/`: localhost web app with onboarding + transcript QA UI
- `desktop/`: Tauri desktop shell for macOS / Windows / Linux
- `UI_LLM_BRIEF.md`: product overview + page-by-page UI design input for LLMs

For complete technical docs, see:
- `../docs/README.md`
- `../docs/DEVELOPMENT_GUIDE.md`
- `../docs/AGENTIC_SYSTEM_ARCHITECTURE.md`

## Fast path for local users

Use the root quickstart instead:

```bash
conda env create -f capyap.yml
conda activate capyap
npm run build
capyap start
```

`capyap start` opens the local web app automatically in your browser.

Privacy rule:
- Your API key is used directly for this session and is never stored on disk. Capyap runs locally on your machine.

## 1) Create advanced dev environment

```bash
conda env create -f apps/environment.yml
conda activate capyap_apps
```

## 2) Run backend + localhost web app

Install JavaScript dependencies once:

```bash
npm --prefix apps/frontend install
npm --prefix apps/desktop install
```

Then run:

```bash
./scripts/dev-web.sh
```

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

## 3) Run desktop app (requires backend running)

```bash
./scripts/dev-desktop.sh
```

## 4) One-command backend + desktop + localhost web

```bash
./scripts/dev-all.sh
```

## First-run onboarding

1. Launch app
2. Paste a YouTube link or transcript file
3. Enter provider + API key in the modal session prompt
4. Ask questions with timestamp-cited answers
5. Click transcript/citation timestamps to open YouTube at that exact moment
