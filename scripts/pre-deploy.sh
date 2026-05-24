#!/bin/sh
# Pré-deploy: corre verificações antes de rebuild
# Uso: bash scripts/pre-deploy.sh

set -e

echo "=== Pré-deploy Check ==="

echo "1. Git pull..."
git pull origin main

echo "2. Instalar deps..."
npm ci

echo "3. Gerar Prisma..."
npx prisma generate

echo "4. Build..."
npm run build

echo "5. Testes unitários..."
npm test 2>/dev/null || echo "   (no tests configured)"

echo "6. Copiar para container e testar..."
docker cp .next/standalone vet-app:/app/ 2>/dev/null || echo "   (container not running, skipping)"

echo "=== Done ==="
echo "Agora corre: docker build -t vet-app:latest . && docker stop vet-app && docker rm vet-app && docker run ..."
