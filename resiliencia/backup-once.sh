#!/bin/sh
set -eu

: "${PGHOST:?PGHOST is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"

BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
WEEKLY_RETENTION_DAYS=${BACKUP_WEEKLY_RETENTION_DAYS:-28}
TODAY=$(date -u +%Y-%m-%d)
DAILY_FILE="autospa_daily_${TODAY}.dump"
WEEKLY_FILE="autospa_weekly_${TODAY}.dump"

upload_blob() {
    blob_name=$1
    if [ -z "${AZURE_BLOB_CONTAINER_URL:-}" ] && [ -z "${AZURE_BLOB_SAS_TOKEN:-}" ]; then
        return 0
    fi
    if [ -z "${AZURE_BLOB_CONTAINER_URL:-}" ] || [ -z "${AZURE_BLOB_SAS_TOKEN:-}" ]; then
        echo "Both AZURE_BLOB_CONTAINER_URL and AZURE_BLOB_SAS_TOKEN are required for cloud backup." >&2
        return 1
    fi

    case "$AZURE_BLOB_SAS_TOKEN" in
        \?*) sas_query=$AZURE_BLOB_SAS_TOKEN ;;
        *) sas_query="?$AZURE_BLOB_SAS_TOKEN" ;;
    esac

    blob_url="${AZURE_BLOB_CONTAINER_URL%/}/${blob_name}${sas_query}"
    echo "Uploading backup artifact to Azure Blob: $blob_name"
    response_file="/tmp/azure-blob-response-$$.xml"
    if http_status=$(curl --fail --silent --show-error --retry 3 --retry-all-errors --retry-delay 2 \
        --request PUT --upload-file "$blob_name" \
        --header 'x-ms-version: 2023-11-03' \
        --header 'x-ms-blob-type: BlockBlob' \
        --output "$response_file" --write-out '%{http_code}' "$blob_url"); then
        rm -f "$response_file"
    else
        azure_error=$(grep -o '<Code>[^<]*</Code>' "$response_file" 2>/dev/null | head -n 1 | sed 's/<[^>]*>//g' || true)
        rm -f "$response_file"
        echo "Azure Blob upload failed for $blob_name (HTTP ${http_status:-unknown}${azure_error:+, Azure code: $azure_error})." >&2
        return 1
    fi
}

mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

if [ ! -s "$DAILY_FILE" ]; then
    TEMP_FILE="${DAILY_FILE}.partial"
    rm -f "$TEMP_FILE"
    echo "Starting PostgreSQL backup: $DAILY_FILE"
    pg_dump --format=custom --no-owner --no-privileges --file="$TEMP_FILE" \
        --host="$PGHOST" --port="${PGPORT:-5432}" --username="$PGUSER" "$PGDATABASE"
    pg_restore --list "$TEMP_FILE" >/dev/null
    mv "$TEMP_FILE" "$DAILY_FILE"
    sha256sum "$DAILY_FILE" > "${DAILY_FILE}.sha256"
else
    echo "Daily backup already exists: $DAILY_FILE"
    if [ -s "${DAILY_FILE}.sha256" ]; then
        sha256sum -c "${DAILY_FILE}.sha256"
    else
        sha256sum "$DAILY_FILE" > "${DAILY_FILE}.sha256"
    fi
    pg_restore --list "$DAILY_FILE" >/dev/null
fi

# Keep one separate weekly copy, taken on Sundays (UTC).
if [ "$(date -u +%u)" = "7" ] && [ ! -s "$WEEKLY_FILE" ]; then
    cp "$DAILY_FILE" "$WEEKLY_FILE"
    sha256sum "$WEEKLY_FILE" > "${WEEKLY_FILE}.sha256"
    echo "Created weekly backup: $WEEKLY_FILE"
    upload_blob "$WEEKLY_FILE"
    upload_blob "${WEEKLY_FILE}.sha256"
fi

if [ -n "${AZURE_BLOB_CONTAINER_URL:-}" ] || [ -n "${AZURE_BLOB_SAS_TOKEN:-}" ]; then
    upload_blob "$DAILY_FILE"
    upload_blob "${DAILY_FILE}.sha256"
else
    echo "Azure Blob is not configured; the verified backup remains local."
fi

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'autospa_daily_*.dump*' \
    -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'autospa_weekly_*.dump*' \
    -mtime "+${WEEKLY_RETENTION_DAYS}" -delete

echo "Backup verified: $DAILY_FILE"
