#!/usr/bin/env bash
set -euo pipefail

# Safer deploy for single-host Docker setup.
# Strategy:
# 1) Build image.
# 2) Boot a temporary canary container on localhost:3001 and verify /api/health.
# 3) Replace production container quickly on localhost:3000.
# This does not guarantee full zero-downtime with a single bound host port,
# but it greatly reduces 502 windows by failing early before cutover.

APP_NAME="${APP_NAME:-vet-app}"
IMAGE="${IMAGE:-vet-app:latest}"
NETWORK="${NETWORK:-coolify}"
TMP_NAME="${TMP_NAME:-${APP_NAME}-canary}"
ENV_FILE="${ENV_FILE:-/tmp/${APP_NAME}-env.list}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
TMP_PORT="${TMP_PORT:-3001}"
LIVE_PORT="${LIVE_PORT:-3000}"
MAX_WAIT_SECONDS="${MAX_WAIT_SECONDS:-45}"

if ! docker ps -a --format '{{.Names}}' | grep -q "^${APP_NAME}$"; then
  echo "ERROR: container '${APP_NAME}' not found. Cannot extract env." >&2
  exit 1
fi

echo "[1/6] Refreshing env file from current container..."
docker inspect "${APP_NAME}" --format '{{range .Config.Env}}{{println .}}{{end}}' > "${ENV_FILE}"

echo "[2/6] Building image ${IMAGE}..."
docker build -t "${IMAGE}" .

echo "[3/6] Starting canary container on ${TMP_PORT}..."
docker rm -f "${TMP_NAME}" >/dev/null 2>&1 || true
docker run -d \
  --name "${TMP_NAME}" \
  --restart unless-stopped \
  --network "${NETWORK}" \
  --env-file "${ENV_FILE}" \
  -p "${TMP_PORT}:3000" \
  "${IMAGE}" >/dev/null

echo "[4/6] Waiting for canary health..."
start_ts="$(date +%s)"
while true; do
  if curl -fsS "http://127.0.0.1:${TMP_PORT}${HEALTH_PATH}" >/dev/null; then
    break
  fi

  now_ts="$(date +%s)"
  if [ $((now_ts - start_ts)) -ge "${MAX_WAIT_SECONDS}" ]; then
    echo "ERROR: canary health check timed out." >&2
    docker logs --tail 80 "${TMP_NAME}" || true
    docker rm -f "${TMP_NAME}" >/dev/null 2>&1 || true
    exit 1
  fi

  sleep 1
done

echo "[5/6] Cutover to production port ${LIVE_PORT}..."
docker rm -f "${APP_NAME}" >/dev/null 2>&1 || true
docker run -d \
  --name "${APP_NAME}" \
  --restart unless-stopped \
  --network "${NETWORK}" \
  --env-file "${ENV_FILE}" \
  -p "${LIVE_PORT}:3000" \
  "${IMAGE}" >/dev/null

echo "[6/6] Final health check..."
curl -fsS "http://127.0.0.1:${LIVE_PORT}${HEALTH_PATH}" >/dev/null

docker rm -f "${TMP_NAME}" >/dev/null 2>&1 || true

echo "Deploy successful."
docker ps --filter "name=${APP_NAME}" --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
