#!/bin/bash
# VetConnect Full Restore Script
# Usage: ./scripts/restore-full.sh /home/canditos/backups/vetconnect/vetconnect_backup_YYYY-MM-DD_HHMMSS.tar.gz

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_CONTAINER="${DB_CONTAINER:-wjmxjm6fcy47sb7g0qg6a472}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
APP_DIR="${APP_DIR:-/home/canditos/VETAPPCLOUD}"
UPLOADS_DIR="${UPLOADS_DIR:-/app/uploads}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Backups disponíveis:"
    ls -lt /home/canditos/backups/vetconnect/*.tar.gz 2>/dev/null | awk '{print $9, $5}' || echo "Nenhum backup encontrado"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERRO: Ficheiro não encontrado: $BACKUP_FILE"
    exit 1
fi

# Confirmação
read -p "⚠️  Isto vai APAGAR a base de dados atual e restaurar tudo. Continuar? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelado."
    exit 0
fi

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extrair backup
echo "A extrair backup: $BACKUP_FILE"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Encontrar o manifest
BACKUP_DIR=$(find "$TEMP_DIR" -name "manifest.json" -exec dirname {} \; | head -1)

if [ -z "$BACKUP_DIR" ]; then
    echo "ERRO: Manifest não encontrado no backup"
    exit 1
fi

# Restaurar base de dados
echo "A restaurar base de dados..."
if [ -f "$BACKUP_DIR/db.sql.gz" ]; then
    gunzip -c "$BACKUP_DIR/db.sql.gz" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    echo "✅ Base de dados restaurada"
fi

# Restaurar uploads
if [ -f "$BACKUP_DIR/uploads.tar.gz" ] && [ -d "$UPLOADS_DIR" ]; then
    echo "A restaurar uploads..."
    tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C "$(dirname "$UPLOADS_DIR")"
    echo "✅ Uploads restaurados"
fi

# Restaurar configs
if [ -f "$BACKUP_DIR/configs.tar.gz" ]; then
    echo "A restaurar configs..."
    tar -xzf "$BACKUP_DIR/configs.tar.gz" -C "$APP_DIR"
    echo "✅ Configs restauradas"
fi

echo ""
echo "✅ RESTAURAÇÃO COMPLETA!"
echo "Reinicia a app: docker restart <app-container>"
