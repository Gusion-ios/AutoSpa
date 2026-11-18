FROM postgres:18-alpine

RUN apk add --no-cache curl

COPY backup-once.sh /usr/local/bin/backup-once
COPY backup-loop.sh /usr/local/bin/backup-loop
COPY restore.sh /usr/local/bin/restore-backup

RUN chmod 0755 /usr/local/bin/backup-once /usr/local/bin/backup-loop /usr/local/bin/restore-backup

ENTRYPOINT ["/usr/local/bin/backup-loop"]
