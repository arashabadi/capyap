# Capyap

Local-first YouTube transcript assistant with citation-grounded answers.

Capyap gives non-coder users a simple desktop/web workflow:
- paste a YouTube link (or transcript file)
- ask questions
- get answers with timestamp evidence

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
- `npm run build` installs frontend deps and builds static assets once
- `capyap start` launches local backend + UI and opens your browser automatically

## First Run in the App

1. Enter your LLM provider settings in onboarding:
- base URL
- model
- token (or env var name)
2. Paste a YouTube URL or local transcript `.txt` path.
3. Ask questions and review timestamp citations.
4. Use `Talk to Agent` for multi-turn follow-up chat.

## Daily Usage

```bash
conda activate capyap
capyap start
```

Useful flags:
- `capyap start --no-browser`
- `capyap start --port 8080`
- `capyap start --host 0.0.0.0`

## Local Files and Clean Git

Generated files stay local and are ignored:
- `apps/frontend/node_modules/`
- `apps/frontend/dist/`
- `apps/desktop/node_modules/`
- `.capyap/`

The source tree remains lightweight for commits and PRs.

## Project Structure

- `apps/backend/`: FastAPI + LangGraph agent backend
- `apps/frontend/`: React/Vite UI (onboarding, Q/A workspace, talk-to-agent popup)
- `apps/desktop/`: Tauri desktop shell (macOS/Windows/Linux)
- `src/youtube_video_summarizer/`: Python package and CLI entrypoints
- `apps/UI_LLM_BRIEF.md`: page-by-page product/UI brief for design LLMs

## Developer Mode (Optional)

For separate backend/frontend/desktop development flow, see:
- `apps/README.md`

## Legacy CLI Tools (Optional)

Capyap still exposes the original transcript CLI commands:
- `yt-extract-summarize`
- `yt-transcript-chat`

Usage docs:
- `docs/LEGACY_CLI.md`

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
