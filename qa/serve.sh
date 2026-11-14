#!/usr/bin/env bash
# Restarts the production server for QA with throwaway credentials and data.
# Usage: qa/serve.sh <data-dir> [port]
set -euo pipefail
DATA="${1:?data dir}"; PORT="${2:-3000}"
pkill -f next-server 2>/dev/null || true
for _ in $(seq 1 20); do (exec 3<>/dev/tcp/127.0.0.1/$PORT) 2>/dev/null || break; sleep 0.3; done
ADMIN_PASSWORD="${ADMIN_PASSWORD:-qa-admin-pass}" SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -hex 32)}" \
CONTRIBUTOR_CODE="${CONTRIBUTOR_CODE:-sao12a3}" DATA_DIR="$DATA" ALLOW_INSECURE_COOKIE=1 \
  nohup npx next start -p "$PORT" > "$DATA/../server.log" 2>&1 &
for _ in $(seq 1 40); do curl -sf -o /dev/null "http://localhost:$PORT/quyen-rieng-tu" && { echo "server up on $PORT"; exit 0; }; sleep 0.5; done
echo "server failed"; tail -20 "$DATA/../server.log"; exit 1
