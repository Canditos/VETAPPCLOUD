#!/bin/bash
# VetConnect - Health Check e Monitorização
# Usage: ./scripts/health-check.sh

set -euo pipefail

URL="${HEALTH_URL:-http://localhost:3000/api/health}"
TIMEOUT="${TIMEOUT:-10}"
RETRIES="${RETRIES:-3}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"; }

# Verificar se o container está a correr
if ! docker ps | grep -q "vetconnect"; then
    error "Container vetconnect não encontrado!"
    exit 1
fi

# Health check
log "A verificar saúde da aplicação..."
for i in $(seq 1 $RETRIES); do
    if curl -sf --max-time $TIMEOUT "$URL" >/dev/null 2>&1; then
        log "✅ Aplicação está saudável!"
        
        # Verificar detalhes
        RESPONSE=$(curl -s --max-time $TIMEOUT "$URL")
        if echo "$RESPONSE" | grep -q '"ok":true'; then
            log "✅ Base de dados acessível"
        else
            warn "⚠️  Base de dados pode estar com problemas"
        fi
        
        # Verificar container principal
        CONTAINER=$(docker ps | grep "vetconnect" | grep -v "canary" | awk '{print $1}' | head -1)
        if [ -n "$CONTAINER" ]; then
            STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER")
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "N/A")
            log "Container: $CONTAINER | Status: $STATUS | Health: $HEALTH"
        fi
        
        exit 0
    fi
    
    warn "Tentativa $i/$RETRIES falhou, a aguardar..."
    sleep 2
done

error "❌ Health check falhou após $RETRIES tentativas!"

# Tentar reiniciar
warn "A tentar reiniciar a aplicação..."
docker restart vetconnect-app 2>/dev/null || docker restart vetconnect-canary 2>/dev/null || true

sleep 5

# Verificar novamente
if curl -sf --max-time $TIMEOUT "$URL" >/dev/null 2>&1; then
    log "✅ Aplicação recuperou após restart!"
    exit 0
else
    error "❌ Aplicação não recuperou! Necessita intervenção manual."
    exit 1
fi
