#!/bin/bash
# VetConnect PostgreSQL Backup Script
# Usage: ./scripts/backup.sh
# Run via cron: 0 2 */2 * * /home/canditos/VETAPPCLOUD/scripts/backup.sh
# Frequência: a cada 2 dias às 02:00
# Retenção: mantém apenas os 2 backups mais recentes

set -euo pipefail

# Configuração
BACKUP_DIR="/home/canditos/backups/vetconnect"
DB_CONTAINER="wjmxjm6fcy47sb7g0qg6a472"
DB_NAME="postgres"
DB_USER="postgres"
RETENTION_DAYS=2

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
FILENAME="vetconnect_backup_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$FILENAME"

# Fazer backup
if docker ps --format "{{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
    echo "[$(date)] A fazer backup de $DB_NAME..."
    docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_PATH"
    
    # Comprimir
    gzip -f "$BACKUP_PATH"
    
    # Verificar tamanho
    SIZE=$(du -h "$BACKUP_PATH.gz" | cut -f1)
    echo "[$(date)] Backup concluído: $BACKUP_PATH.gz ($SIZE)"
    
    # Limpar backups antigos — manter apenas os 2 mais recentes
    ls -t "$BACKUP_DIR"/vetconnect_backup_*.sql.gz 2>/dev/null | tail -n +3 | xargs -r rm -f
    
    # Contar backups existentes
    COUNT=$(ls -1 "$BACKUP_DIR"/vetconnect_backup_*.sql.gz 2>/dev/null | wc -l)
    echo "[$(date)] Total backups: $COUNT"
    
    # Guardar info no ficheiro de estado
    cat > "$BACKUP_DIR/last-backup.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "file": "$FILENAME.gz",
  "size": "$SIZE",
  "total": $COUNT
}
EOF
    
    echo "[$(date)] Backup OK"
else
    echo "[$(date)] ERRO: Container $DB_CONTAINER não encontrado!"
    exit 1
fi
