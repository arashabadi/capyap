#!/usr/bin/env bash
set -euo pipefail

if [ ! -x "apps/frontend/node_modules/esbuild/bin/esbuild" ]; then
  echo "Missing esbuild binary at apps/frontend/node_modules/esbuild/bin/esbuild"
  echo "Run: npm --prefix apps/frontend install"
  exit 1
fi

TMP_JS="$(mktemp /tmp/capyap-gif.XXXXXX.mjs)"
cleanup() {
  rm -f "$TMP_JS"
}
trap cleanup EXIT

apps/frontend/node_modules/esbuild/bin/esbuild \
  scripts/generate-readme-gif.ts \
  --platform=node \
  --format=esm \
  --outfile="$TMP_JS" \
  --log-level=error

node "$TMP_JS"
