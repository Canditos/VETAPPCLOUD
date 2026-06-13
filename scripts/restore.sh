#!/bin/bash
# VetConnect PostgreSQL Restore Script
# Usage: ./scripts/restore.sh /home/canditos/backups/vetconnect/vetconnect_backup_YYYY-MM-DD_HHMMSS.sql.gz

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_CONTAINER="wjmxjm6fcy47sb7g0qg6a472"
DB_NAME="postgres"
DB_USER="postgres"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.sql.gz>"
    echo ""
    echo "Backups disponíveis:"
    ls -la /home/canditos/backups/vetconnect/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERRO: Ficheiro não encontrado: $BACKUP_FILE"
    exit 1
fi

# Atenção
read -p "⚠️  Isto vai APAGAR a base de dados atual e restaurar o backup. Continuar? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelado."
    exit 0
fi

echo "A restaurar backup: $BACKUP_FILE"

# Descomprimir e restaurar
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
else
    cat "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
fi

echo "✅ Restauração concluída!"
