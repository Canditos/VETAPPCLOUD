#!/bin/bash
# Deploy VETAPPCLOUD via Coolify API
# Usage: bash deploy-vet.sh

TOKEN="$COOLIFY_TOKEN"

if [ -z "$TOKEN" ]; then
  if [ -f ~/.coolify-token ]; then
    TOKEN=$(cat ~/.coolify-token | tr -d '\n')
  fi
fi

if [ -z "$TOKEN" ]; then
  echo "ERRO: Define COOLIFY_TOKEN ou cria ~/.coolify-token"
  exit 1
fi

echo "=== Deploy VETAPPCLOUD ==="
cd /c/Users/marco/VETAPPCLOUD

echo "[1/3] Push para GitHub..."
git push origin master
if [ $? -ne 0 ]; then
  echo "ERRO: Push falhou"
  exit 1
fi

echo "[2/3] Trigger deploy no Coolify..."
curl -s -X POST "http://192.168.0.166:8000/api/v1/deploy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"raw","deployment_uuid":"","force":false,"rollback":false}' && echo ""

echo "[3/3] Deploy triggerado!"
echo "Status: http://192.168.0.166:8000"
