# Contributing

## Development setup

```bash
conda env create -f capyap.yml
conda activate capyap
```

## Local install

```bash
python -m pip install -e .
```

## Build web assets (once per dependency change)

```bash
npm run build
```

## Basic checks

```bash
python -m py_compile src/youtube_video_summarizer/cli.py src/youtube_video_summarizer/chat.py src/youtube_video_summarizer/capyap_cli.py src/youtube_video_summarizer/capyap_start.py
capyap --help
yt-extract-summarize --help
yt-transcript-chat --help
```

## Pull requests

- Keep changes focused and documented
- Add or update tests when behavior changes
- Update docs (`README.md`, `docs/CAPYAP_CLI.md`, `apps/README.md`) for CLI/flag changes
