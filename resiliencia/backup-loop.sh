#!/bin/sh
set -u

INTERVAL=${BACKUP_INTERVAL_SECONDS:-86400}
case "$INTERVAL" in
    ''|*[!0-9]*) echo "BACKUP_INTERVAL_SECONDS must be a positive integer." >&2; exit 2 ;;
esac
if [ "$INTERVAL" -lt 60 ]; then
    echo "BACKUP_INTERVAL_SECONDS must be at least 60." >&2
    exit 2
fi

while :; do
    if /usr/local/bin/backup-once; then
        sleep "$INTERVAL"
    else
        RETRY_INTERVAL=${BACKUP_RETRY_SECONDS:-300}
        echo "Backup attempt failed; retrying in ${RETRY_INTERVAL} seconds." >&2
        sleep "$RETRY_INTERVAL"
    fi
done
