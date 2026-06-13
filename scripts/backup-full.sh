#!/bin/bash
# VetConnect Full Backup Script
# Backup: PostgreSQL + Uploads + Configs
# Destino: local disk + cloud (optional via rclone)

set -euo pipefail

# === CONFIG ===
BACKUP_DIR="${BACKUP_DIR:-/home/canditos/backups/vetconnect}"
DB_CONTAINER="${DB_CONTAINER:-wjmxjm6fcy47sb7g0qg6a472}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
APP_DIR="${APP_DIR:-/home/canditos/VETAPPCLOUD}"
UPLOADS_DIR="${UPLOADS_DIR:-/app/uploads}"
RETENTION_COUNT="${RETENTION_COUNT:-2}"
CLOUD_REMOTE="${CLOUD_REMOTE:-}"  # e.g., "b2:vetconnect-backups"
LOG_FILE="$BACKUP_DIR/backup.log"

# === UTILS ===
log() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="vetconnect_backup_${TIMESTAMP}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# === 1. BACKUP DATABASE ===
log "=== BACKUP START: $TIMESTAMP ==="
log "Step 1: Database backup..."

if ! docker ps --format "{{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
    log "ERROR: DB container $DB_CONTAINER not found!"
    exit 1
fi

DB_FILE="$BACKUP_PATH/db.sql"
mkdir -p "$BACKUP_PATH"

docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$DB_FILE"
gzip -f "$DB_FILE"
log "Database: $(du -h "$DB_FILE.gz" | cut -f1)"

# === 2. BACKUP UPLOADS ===
log "Step 2: Uploads backup..."
UPLOADS_FILE="$BACKUP_PATH/uploads.tar.gz"

if [ -d "$UPLOADS_DIR" ]; then
    tar -czf "$UPLOADS_FILE" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
    log "Uploads: $(du -h "$UPLOADS_FILE" | cut -f1)"
else
    log "WARNING: Uploads dir not found: $UPLOADS_DIR"
    touch "$UPLOADS_FILE"
fi

# === 3. BACKUP CONFIGS ===
log "Step 3: Configs backup..."
CONFIG_FILE="$BACKUP_PATH/configs.tar.gz"

tar -czf "$CONFIG_FILE" -C "$APP_DIR" \
    .env.local \
    .env \
    prisma/schema.prisma \
    scripts/ \
    2>/dev/null || true

log "Configs: $(du -h "$CONFIG_FILE" | cut -f1)"

# === 4. CREATE MANIFEST ===
MANIFEST="$BACKUP_PATH/manifest.json"
cat > "$MANIFEST" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "version": "$(git -C "$APP_DIR" rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "files": {
    "database": "$BACKUP_NAME/db.sql.gz",
    "uploads": "$BACKUP_NAME/uploads.tar.gz",
    "configs": "$BACKUP_NAME/configs.tar.gz"
  },
  "sizes": {
    "database": "$(du -b "$DB_FILE.gz" 2>/dev/null | cut -f1 || echo 0)",
    "uploads": "$(du -b "$UPLOADS_FILE" 2>/dev/null | cut -f1 || echo 0)",
    "configs": "$(du -b "$CONFIG_FILE" 2>/dev/null | cut -f1 || echo 0)"
  }
}
EOF

# === 5. ARCHIVE FULL BACKUP ===
log "Step 4: Creating full archive..."
FULL_ARCHIVE="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
tar -czf "$FULL_ARCHIVE" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

TOTAL_SIZE=$(du -h "$FULL_ARCHIVE" | cut -f1)
log "Full backup: $FULL_ARCHIVE ($TOTAL_SIZE)"

# === 6. CLEANUP OLD BACKUPS ===
log "Step 5: Cleanup (keep $RETENTION_COUNT)..."
ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | while read f; do
    log "Removing: $f"
    rm -f "$f"
done

# === 7. CLOUD UPLOAD (optional) ===
if [ -n "$CLOUD_REMOTE" ] && command -v rclone >/dev/null 2>&1; then
    log "Step 6: Uploading to cloud: $CLOUD_REMOTE"
    rclone copy "$FULL_ARCHIVE" "$CLOUD_REMOTE" --progress 2>&1 | tee -a "$LOG_FILE"
    log "Cloud upload complete"
else
    log "Step 6: No cloud config (set CLOUD_REMOTE and install rclone)"
fi

# === 8. SAVE STATUS ===
STATUS_FILE="$BACKUP_DIR/last-backup.json"
cat > "$STATUS_FILE" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "file": "${BACKUP_NAME}.tar.gz",
  "size": "$TOTAL_SIZE",
  "totalLocal": $(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l),
  "cloudRemote": "$CLOUD_REMOTE",
  "nextBackup": "$(date -d '+2 days' -Iseconds)",
  "components": ["database", "uploads", "configs"]
}
EOF

log "=== BACKUP OK: $TOTAL_SIZE ==="
