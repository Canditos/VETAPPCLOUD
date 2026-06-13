#!/bin/bash
# VetConnect - Deploy Automatizado com Zero Downtime
# Usage: ./scripts/deploy.sh [version|tag]

set -euo pipefail

# Configuração
APP_NAME="vetconnect"
COMPOSE_FILE="docker-compose.yml"
HEALTH_CHECK_URL="http://localhost:3000/api/health"
HEALTH_CHECK_TIMEOUT=60
ROLLBACK_ON_FAILURE=true
KEEP_OLD_VERSIONS=2

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"; }

# Verificar se Docker está a correr
if ! docker info >/dev/null 2>&1; then
    error "Docker não está a correr!"
    exit 1
fi

# Verificar se o docker-compose existe
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Ficheiro $COMPOSE_FILE não encontrado!"
    exit 1
fi

# Verificar se o .env existe
if [ ! -f ".env" ]; then
    error "Ficheiro .env não encontrado!"
    exit 1
fi

# Versão a deployar
VERSION="${1:-latest}"
log "A iniciar deploy da versão: $VERSION"

# 1. Guardar versão anterior
CURRENT_VERSION=$(docker images "$APP_NAME" --format "{{.Tag}}" | head -1)
if [ -n "$CURRENT_VERSION" ]; then
    log "Versão anterior: $CURRENT_VERSION"
    echo "$CURRENT_VERSION" > .last_version
fi

# 2. Fazer backup da base de dados antes do deploy
log "A fazer backup da base de dados..."
if [ -f "scripts/backup.sh" ]; then
    ./scripts/backup.sh || warn "Backup falhou, mas continuando..."
else
    warn "Script de backup não encontrado"
fi

# 3. Pull da nova imagem
log "A fazer pull da imagem $APP_NAME:$VERSION..."
if ! docker pull "$APP_NAME:$VERSION" 2>/dev/null; then
    warn "Não foi possível fazer pull, a usar imagem local..."
fi

# 4. Atualizar docker-compose com a nova versão
log "A atualizar docker-compose..."
sed -i "s|image: $APP_NAME:.*|image: $APP_NAME:$VERSION|" "$COMPOSE_FILE"

# 5. Deploy com zero downtime
log "A fazer deploy..."
docker-compose -f "$COMPOSE_FILE" up -d --no-deps --scale app=2 app

# 6. Aguardar health check
log "A aguardar health check ($HEALTH_CHECK_TIMEOUT segundos)..."
for i in $(seq 1 $HEALTH_CHECK_TIMEOUT); do
    if curl -sf "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
        log "✅ Health check OK!"
        break
    fi
    if [ $i -eq $HEALTH_CHECK_TIMEOUT ]; then
        error "❌ Health check falhou após $HEALTH_CHECK_TIMEOUT segundos!"
        
        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
            log "A iniciar rollback..."
            if [ -f ".last_version" ]; then
                LAST_VERSION=$(cat .last_version)
                log "A fazer rollback para $LAST_VERSION..."
                sed -i "s|image: $APP_NAME:.*|image: $APP_NAME:$LAST_VERSION|" "$COMPOSE_FILE"
                docker-compose -f "$COMPOSE_FILE" up -d --no-deps app
                log "Rollback concluído!"
            else
                error "Não foi possível fazer rollback - versão anterior não encontrada!"
            fi
        fi
        exit 1
    fi
    sleep 1
    echo -n "."
done

# 7. Escalar para 1 réplica (remover o antigo)
log "A escalar para 1 réplica..."
docker-compose -f "$COMPOSE_FILE" up -d --no-deps --scale app=1 app

# 8. Limpar imagens antigas
log "A limpar imagens antigas..."
docker images "$APP_NAME" --format "{{.Tag}}" | tail -n +$((KEEP_OLD_VERSIONS + 1)) | while read tag; do
    docker rmi "$APP_NAME:$tag" 2>/dev/null || true
done

# 9. Verificar estado final
log "A verificar estado final..."
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    log "✅ Deploy concluído com sucesso!"
    log "Versão: $VERSION"
    log "URL: https://vet.gatoescondido.com"
    
    # Guardar versão atual
    echo "$VERSION" > .current_version
    
    # Enviar notificação (opcional)
    if [ -n "${NOTIFICATION_URL:-}" ]; then
        curl -s -X POST "$NOTIFICATION_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\":\"Deploy OK: $VERSION\"}" >/dev/null 2>&1 || true
    fi
else
    error "❌ Algo correu mal! Verifica os logs:"
    docker-compose -f "$COMPOSE_FILE" logs app
    exit 1
fi
