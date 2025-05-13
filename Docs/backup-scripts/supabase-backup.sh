#!/bin/bash
# Supabase Database Backup Script

# Configuration
SUPABASE_DB_HOST="db.YOUR_PROJECT_REF.supabase.co"
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_PASSWORD="your_db_password"
BACKUP_DIR="/path/to/backups"
BACKUP_RETENTION=10  # Number of backups to keep
GPG_RECIPIENT="admin@atrocitee.com"  # GPG key for encryption
LOG_FILE="${BACKUP_DIR}/backup_log.txt"
STATUS_JSON="${BACKUP_DIR}/backup_status.json"  # JSON file to store backup status

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Set date format for the backup file
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/atrocitee_backup_${DATE}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.gz.gpg"
SUCCESS=false
START_TIME=$(date +%s)

# Log backup start
echo "$(date): Starting database backup" >> "${LOG_FILE}"

# Export using pg_dump (Full backup)
echo "Running pg_dump..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
  -h "${SUPABASE_DB_HOST}" \
  -p "${SUPABASE_DB_PORT}" \
  -d "${SUPABASE_DB_NAME}" \
  -U "${SUPABASE_DB_USER}" \
  -F p > "${BACKUP_FILE}"

# Check if the backup was successful
if [ $? -ne 0 ]; then
  echo "$(date): Backup failed" >> "${LOG_FILE}"
  STATUS="failed"
  ERROR_MSG="pg_dump command failed"
  # Update status JSON
  update_status_json
  exit 1
fi

# Compress the backup
echo "Compressing backup..."
gzip "${BACKUP_FILE}"
COMPRESSED_BACKUP="${BACKUP_FILE}.gz"

# Encrypt the backup
echo "Encrypting backup..."
gpg --batch --yes --encrypt --recipient "${GPG_RECIPIENT}" "${COMPRESSED_BACKUP}"

# Remove the unencrypted compressed file
rm "${COMPRESSED_BACKUP}"

# Get backup size
BACKUP_SIZE=$(du -h "${ENCRYPTED_FILE}" | cut -f1)

# Remove old backups, keeping only the most recent ones
echo "Cleaning up old backups..."
ls -t "${BACKUP_DIR}"/*.gz.gpg | tail -n +$((BACKUP_RETENTION + 1)) | xargs -r rm

# Log backup completion
echo "$(date): Backup completed successfully. File: ${ENCRYPTED_FILE}" >> "${LOG_FILE}"
echo "Backup size: ${BACKUP_SIZE}" >> "${LOG_FILE}"

# Verify the backup
if [ -s "${ENCRYPTED_FILE}" ]; then
  echo "$(date): Backup verification passed" >> "${LOG_FILE}"
  STATUS="success"
  SUCCESS=true
else
  echo "$(date): Backup verification failed - file is empty or missing" >> "${LOG_FILE}"
  STATUS="failed"
  ERROR_MSG="Verification failed - file is empty or missing"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Function to update status JSON file
update_status_json() {
  # Get list of all backup files within retention
  BACKUP_FILES=$(ls -t "${BACKUP_DIR}"/*.gz.gpg | head -n "${BACKUP_RETENTION}")
  
  # Start building the JSON array of backups
  BACKUPS_JSON="["
  for file in ${BACKUP_FILES}; do
    filename=$(basename "${file}")
    filesize=$(du -h "${file}" | cut -f1)
    filetime=$(stat -c "%Y" "${file}")
    
    # Add comma if not the first element
    if [ "${BACKUPS_JSON}" != "[" ]; then
      BACKUPS_JSON="${BACKUPS_JSON},"
    fi
    
    # Add this backup to the JSON array
    BACKUPS_JSON="${BACKUPS_JSON}{\"filename\":\"${filename}\",\"size\":\"${filesize}\",\"timestamp\":${filetime}}"
  done
  BACKUPS_JSON="${BACKUPS_JSON}]"
  
  # Create the full status JSON
  cat > "${STATUS_JSON}" << EOF
{
  "last_backup": {
    "timestamp": "$(date +%s)",
    "date": "$(date)",
    "status": "${STATUS}",
    "filename": "$(basename "${ENCRYPTED_FILE}")",
    "size": "${BACKUP_SIZE}",
    "duration_seconds": ${DURATION}
    ${SUCCESS || ",\"error\": \"${ERROR_MSG}\""}
  },
  "backups": ${BACKUPS_JSON},
  "retention_days": ${BACKUP_RETENTION},
  "backup_dir": "${BACKUP_DIR}"
}
EOF
}

# Update status JSON
update_status_json

# Optional: Send status to website
WEBSITE_STATUS_ENDPOINT="https://atrocitee.com/api/backup-status"
if [ -n "${WEBSITE_STATUS_ENDPOINT}" ]; then
  echo "Sending backup status to website..."
  curl -X POST "${WEBSITE_STATUS_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -d @"${STATUS_JSON}" \
    --silent
fi

echo "Backup process completed." 