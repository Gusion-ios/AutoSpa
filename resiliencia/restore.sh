#!/bin/sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    echo "Usage: restore-backup <dump-file> [new-target-database]" >&2
    exit 2
fi

BACKUP_FILE=$1
TARGET_DATABASE=${2:-"autospa_restore_$(date -u +%Y%m%d_%H%M%S)"}

: "${PGHOST:?PGHOST is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"

case "$TARGET_DATABASE" in
    ''|*[!A-Za-z0-9_]*) echo "Target database may contain only letters, numbers, and underscores." >&2; exit 2 ;;
esac
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE" >&2
    exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ ! -f "$CHECKSUM_FILE" ]; then
    echo "Checksum file not found: $CHECKSUM_FILE" >&2
    exit 1
fi
(cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")")
pg_restore --list "$BACKUP_FILE" >/dev/null

if psql --host="$PGHOST" --port="${PGPORT:-5432}" --username="$PGUSER" \
    --dbname=postgres --tuples-only --no-align \
    --command="SELECT 1 FROM pg_database WHERE datname = '$TARGET_DATABASE'" | grep -q 1; then
    echo "Target database already exists; choose a new name: $TARGET_DATABASE" >&2
    exit 1
fi

echo "Creating isolated restore target: $TARGET_DATABASE"
createdb --host="$PGHOST" --port="${PGPORT:-5432}" --username="$PGUSER" "$TARGET_DATABASE"
pg_restore --exit-on-error --no-owner --no-privileges \
    --host="$PGHOST" --port="${PGPORT:-5432}" --username="$PGUSER" \
    --dbname="$TARGET_DATABASE" "$BACKUP_FILE"
echo "Restore completed into '$TARGET_DATABASE'. The source database was not modified."
