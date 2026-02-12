#!/usr/bin/env bash
set -euo pipefail

if ! curl -fsS http://127.0.0.1:8000/health >/dev/null; then
  echo "Backend is not running. Start it first with ./scripts/dev-web.sh or a dedicated backend command."
  exit 1
fi

npm --prefix apps/desktop run dev
