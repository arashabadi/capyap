# Capyap CLI

This repo includes two script-friendly CLI commands for transcript workflows.

## Install

Use the main project environment:

```bash
conda env create -f capyap.yml
conda activate capyap
```

## CLI Commands

### 1) Extract + Summarize

```bash
yt-extract-summarize "https://youtu.be/ZbTVXrhesJY" --summary-sentences 10 --out-dir output
```

Outputs:
- `output/<video_id>.transcript.txt`
- `output/<video_id>.summary.txt`

### 2) Chat with Transcript

Set token with env var at runtime:

macOS/Linux:

```bash
export LLM_API_TOKEN="your_token_here"
```

Windows PowerShell:

```powershell
$env:LLM_API_TOKEN="your_token_here"
```

OpenAI example:

```bash
yt-transcript-chat "https://youtu.be/ZbTVXrhesJY" \
  --model gpt-4o-mini \
  --base-url https://api.openai.com/v1
```

OpenRouter example:

```bash
yt-transcript-chat "https://youtu.be/ZbTVXrhesJY" \
  --model openai/gpt-4o-mini \
  --base-url https://openrouter.ai/api/v1
```

Local OpenAI-compatible server example:

```bash
yt-transcript-chat output/ZbTVXrhesJY.transcript.txt \
  --model your-local-model \
  --base-url http://localhost:1234/v1 \
  --api-token not-used
```

One-shot Q/A mode:

```bash
yt-transcript-chat output/ZbTVXrhesJY.transcript.txt \
  --question "What are the main points?" \
  --model gpt-4o-mini \
  --base-url https://api.openai.com/v1
```

## Export Options (UI)

The web/desktop app export menu supports:

- `Clean Text (.txt)`
- `With Timestamps (.txt)`
- `Raw JSON (.json)`
- `HTML (.html)` with chapter sidebar, chapter `View` links, segment `View` buttons, and timestamp anchors

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
