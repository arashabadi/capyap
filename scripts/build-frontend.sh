#!/usr/bin/env bash
set -euo pipefail

if [ ! -d "apps/frontend/node_modules" ]; then
  npm --prefix apps/frontend install --no-package-lock
fi

npm --prefix apps/frontend run build
