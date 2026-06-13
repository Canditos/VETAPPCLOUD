#!/bin/bash
# VetConnect - Monitorização Contínua
# Usage: ./scripts/monitor.sh
# Recomendado: rodar via cron a cada 5 minutos

set -euo pipefail

URL="${HEALTH_URL:-http://localhost:3000/api/health}"
TIMEOUT="${TIMEOUT:-10}"
LOG_FILE="${LOG_FILE:-/var/log/vetconnect-monitor.log}"
RESTART_ON_FAILURE="${RESTART_ON_FAILURE:-true}"
NOTIFY_ON_FAILURE="${NOTIFY_ON_FAILURE:-true}"
NOTIFICATION_URL="${NOTIFICATION_URL:-}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { 
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}
error() { 
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}
warn() { 
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar se o container existe
if ! docker ps | grep -q "vetconnect"; then
    error "Container vetconnect não encontrado!"
    
    if [ "$RESTART_ON_FAILURE" = true ]; then
        warn "A tentar iniciar container..."
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d app
            sleep 10
        fi
    fi
    exit 1
fi

# Health check
if ! curl -sf --max-time "$TIMEOUT" "$URL" >/dev/null 2>&1; then
    error "❌ Health check falhou!"
    
    # Notificar
    if [ "$NOTIFY_ON_FAILURE" = true ] && [ -n "$NOTIFICATION_URL" ]; then
        curl -s -X POST "$NOTIFICATION_URL" \
            -H "Content-Type: application/json" \
            -d "{\"message\":\"ALERTA: VetConnect health check falhou!\",\"timestamp\":\"$(date -Iseconds)\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Tentar reiniciar
    if [ "$RESTART_ON_FAILURE" = true ]; then
        warn "A tentar reiniciar a aplicação..."
        docker restart vetconnect-app 2>/dev/null || true
        
        sleep 10
        
        if curl -sf --max-time "$TIMEOUT" "$URL" >/dev/null 2>&1; then
            log "✅ Aplicação recuperou após restart!"
            exit 0
        else
            error "❌ Aplicação não recuperou! Necessita intervenção manual."
            
            # Tentar rollback
            if [ -f "scripts/rollback.sh" ]; then
                warn "A tentar rollback automático..."
                ./scripts/rollback.sh || true
            fi
            
            exit 1
        fi
    fi
    
    exit 1
fi

# Tudo OK
log "✅ Aplicação está saudável"
