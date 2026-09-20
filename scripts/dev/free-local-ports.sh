#!/usr/bin/env bash
# Stop stale Kame Finance Next.js listeners so -p 3005 can bind
# (avoids Next silently moving to 3006 when the port is taken).
# Keep in sync with scripts/dev/local-dev-port.mjs
set -euo pipefail

DEV_PORT=3005

pids=$(lsof -ti "tcp:${DEV_PORT}" -sTCP:LISTEN 2>/dev/null || true)
if [[ -z "$pids" ]]; then
  exit 0
fi

echo "free-local-ports: stopping PID(s) on :${DEV_PORT} — ${pids//$'\n'/ }"
# shellcheck disable=SC2086
kill $pids 2>/dev/null || true
sleep 0.3
remaining=$(lsof -ti "tcp:${DEV_PORT}" -sTCP:LISTEN 2>/dev/null || true)
if [[ -n "$remaining" ]]; then
  # shellcheck disable=SC2086
  kill -9 $remaining 2>/dev/null || true
fi
