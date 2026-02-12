# youtube-video-summarizer

A lightweight open-source CLI package that:

1. Extracts YouTube transcripts
2. Generates a quick summary
3. Lets you chat with any OpenAI-compatible LLM about the transcript

It is pure Python and works on macOS, Linux, and Windows.

## Features

- Cross-platform install (`pip`, `pipx`, `uv`, or conda)
- Minimal dependencies
- OpenAI-compatible chat endpoint support via `--base-url`
- Secure token loading from environment variable
- Works with YouTube URL/ID or local transcript file

## Installation

### Option A: conda (recommended)

```bash
conda env create -f environment.yml
conda activate yt_video_summary
```

### Option B: pip

```bash
python -m pip install .
```

For editable local development:

```bash
python -m pip install -e .
```

After publishing to PyPI, users can install with:

```bash
python -m pip install youtube-video-summarizer
```

### Option C: pipx (isolated global CLI)

```bash
pipx install .
```

### Option D: uv

```bash
uv tool install .
```

## CLI 1: Extract + summarize

```bash
yt-extract-summarize "https://youtu.be/ZbTVXrhesJY" --summary-sentences 10 --out-dir output
```

Outputs:

- `output/<video_id>.transcript.txt`
- `output/<video_id>.summary.txt`

## CLI 2: Chat with transcript using any LLM API

Set token with env var (recommended):

macOS/Linux:

```bash
export LLM_API_TOKEN="your_token_here"
```

Windows PowerShell:

```powershell
$env:LLM_API_TOKEN="your_token_here"
```

### OpenAI example

```bash
yt-transcript-chat "https://youtu.be/ZbTVXrhesJY" \
  --model gpt-4o-mini \
  --base-url https://api.openai.com/v1
```

### OpenRouter example

```bash
yt-transcript-chat "https://youtu.be/ZbTVXrhesJY" \
  --model openai/gpt-4o-mini \
  --base-url https://openrouter.ai/api/v1
```

### Local OpenAI-compatible server (vLLM/LM Studio/Ollama gateway)

```bash
yt-transcript-chat output/ZbTVXrhesJY.transcript.txt \
  --model your-local-model \
  --base-url http://localhost:1234/v1 \
  --api-token not-used
```

### One-shot Q/A mode

```bash
yt-transcript-chat output/ZbTVXrhesJY.transcript.txt \
  --question "What are the main points?" \
  --model gpt-4o-mini \
  --base-url https://api.openai.com/v1
```

## Python API

```python
from youtube_video_summarizer import run

result = run(
    video="https://youtu.be/ZbTVXrhesJY",
    languages="en,en-US",
    summary_sentences=10,
    out_dir="output",
)
print(result["summary_path"])
```

## Product quality checklist (for open-source readiness)

- Keep a stable CLI and semantic versions
- Add CI matrix for macOS/Linux/Windows
- Add tests for parser, transcript fetch mocking, and chat request formatting
- Document provider setup and security practices for API tokens
- Publish to PyPI and add a changelog
- Add issue templates and contribution guide
