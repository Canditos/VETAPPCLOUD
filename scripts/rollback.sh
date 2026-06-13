#!/bin/bash
# VetConnect - Rollback para Versão Anterior
# Usage: ./scripts/rollback.sh

set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
APP_NAME="vetconnect"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"; }

# Verificar se existe versão anterior
if [ ! -f ".last_version" ]; then
    error "Não foi encontrada versão anterior!"
    
    # Tentar listar versões disponíveis
    log "Versões disponíveis:"
    docker images "$APP_NAME" --format "{{.Tag}}" | head -5
    
    read -p "Introduza a versão para rollback: " VERSION
    if [ -z "$VERSION" ]; then
        error "Versão não especificada!"
        exit 1
    fi
else
    VERSION=$(cat .last_version)
    log "Versão anterior encontrada: $VERSION"
fi

# Confirmar
read -p "⚠️  Fazer rollback para $VERSION? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log "Rollback cancelado."
    exit 0
fi

# Fazer backup antes do rollback
log "A fazer backup antes do rollback..."
if [ -f "scripts/backup.sh" ]; then
    ./scripts/backup.sh || warn "Backup falhou, continuando..."
fi

# Atualizar docker-compose
log "A atualizar docker-compose para $VERSION..."
sed -i "s|image: $APP_NAME:.*|image: $APP_NAME:$VERSION|" "$COMPOSE_FILE"

# Fazer rollback
log "A fazer rollback..."
docker-compose -f "$COMPOSE_FILE" up -d --no-deps app

# Health check
log "A verificar se a aplicação está OK..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
        log "✅ Rollback concluído com sucesso!"
        log "Versão: $VERSION"
        exit 0
    fi
    sleep 1
    echo -n "."
done

error "❌ Rollback concluído, mas a aplicação não responde!"
error "Verifique os logs: docker-compose logs app"
exit 1
