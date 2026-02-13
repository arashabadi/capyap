# Ollama Setup (Local Capyap)

Use this guide if you want Capyap agents to run on local Ollama models for free.

## 1) Install Ollama

- Download installer: <https://ollama.com/download>

## 2) Pull at least one model

Run in Terminal:

```bash
ollama serve
ollama pull llama3.1
```

You can pull other models too (for example `qwen2.5:7b`).

## 3) Start Capyap locally

From the repo root:

```bash
conda activate capyap
capyap start
```

Capyap runs locally and the backend serves the app on localhost.

Desktop app note:
- Packaged desktop builds try to auto-start backend.
- If desktop cannot connect, run this command manually and keep it open:

```bash
capyap start --no-browser
```

## 4) In Capyap, choose Ollama

1. Load a transcript source.
2. Click `Start AI Analysis`.
3. Select `ollama` in the provider picker.
4. Wait for the Ollama status check.
5. Click `Start Analyzing` when status is ready.

Notes:
- No external cloud API key is required for Ollama.
- If Ollama is not detected, use the modal's `Install Ollama` link and `Re-check` button.
