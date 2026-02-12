#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

conda run -n capyap_apps uvicorn app.main:app --reload --port 8000 --host 127.0.0.1 --app-dir apps/backend &
BACKEND_PID=$!

echo "Backend started on http://127.0.0.1:8000"

npm --prefix apps/frontend run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo "Frontend started on http://127.0.0.1:5173"

echo "Press Ctrl+C to stop both services."
wait
