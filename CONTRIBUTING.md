# Contributing

## Development setup

```bash
conda env create -f environment.yml
conda activate yt_video_summary
```

## Local install

```bash
python -m pip install -e .
```

## Basic checks

```bash
python -m py_compile src/youtube_video_summarizer/cli.py src/youtube_video_summarizer/chat.py
yt-extract-summarize --help
yt-transcript-chat --help
```

## Pull requests

- Keep changes focused and documented
- Add or update tests when behavior changes
- Update `README.md` for any CLI/flag changes
