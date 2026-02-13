# Capyap

Local-first YouTube transcript assistant with citation-grounded answers.

Capyap gives non-coder users a simple local workflow:
- paste a YouTube link (or transcript file)
- ask questions in the AI panel
- get answers with timestamp evidence
- click timestamps to open YouTube at the exact moment
- export an iPad-friendly `.html` transcript with clickable timestamps

Privacy rule:
- Your API key is used directly for this session and is never stored on disk. Capyap runs locally on your machine.

## Quickstart (Recommended)

```bash
git clone https://github.com/arashabadi/capyap.git
cd capyap
conda env create -f capyap.yml
conda activate capyap
npm run build
capyap start
```

What happens:
- `npm run build` installs frontend deps only if needed, then builds static assets
- `capyap start` launches local backend + UI and opens your browser automatically

## First Run in the App

1. Paste a YouTube URL or local transcript `.txt` path.
2. Click `Start AI Analysis`.
3. Choose provider and paste your API key for this session.
4. Ask questions and review timestamp citations.

## Daily Usage

```bash
conda activate capyap
capyap start
```

Useful flags:
- `capyap start --no-browser`
- `capyap start --port 8080`
- `capyap start --host 0.0.0.0`

## Project Structure

- `apps/backend/`: FastAPI + LangGraph agent backend
- `apps/frontend/`: React/Vite UI (source loader + transcript + AI panel)
- `apps/desktop/`: Tauri desktop shell (macOS/Windows/Linux)
- `src/youtube_video_summarizer/`: Python package and CLI entrypoints
- `apps/UI_LLM_BRIEF.md`: page-by-page product/UI brief for design LLMs

## Docs

- `docs/README.md`
- `docs/AGENTIC_SYSTEM_ARCHITECTURE.md`
- `docs/DEVELOPMENT_GUIDE.md`
- `docs/SECURITY_AND_PRIVACY.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/LEGACY_CLI.md`

## Developer Mode (Optional)

For separate backend/frontend/desktop development flow, see:
- `apps/README.md`

## Legacy CLI Tools (Optional)

Capyap still exposes the original transcript CLI commands:
- `yt-extract-summarize`
- `yt-transcript-chat`

## Troubleshooting

- `capyap: command not found`
  - Ensure env is active: `conda activate capyap`
  - Reinstall package in env: `python -m pip install -e .`

- `Frontend build not found`
  - Run once from repo root: `npm run build`

- Port already in use
  - Use another port: `capyap start --port 8080`

## Contributing

See `CONTRIBUTING.md`.

## License

MIT
