# Supabase Database Backup System

This backup system provides automated database backups for the Atrocitee application and integrates with the admin panel to display backup status information.

## Setup Instructions

### 1. Configure Environment Variables

Add these variables to your `.env` file:

```
# Backup API token (generate a secure random string)
BACKUP_API_TOKEN=your_secure_random_token

# Set in your shell where the backup script runs
SUPABASE_DB_HOST=db.YOUR_PROJECT_REF.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_db_password
BACKUP_DIR=/path/to/backups
API_TOKEN=your_secure_random_token  # Same as BACKUP_API_TOKEN
```

### 2. Create Supabase Table

Run the migration script to create the backup_status table:

```bash
psql postgresql://postgres:password@db.YOUR_PROJECT_REF.supabase.co:5432/postgres -f supabase-migration.sql
```

### 3. Configure Backup Script

Edit `supabase-backup.sh` to update:
- Database connection details
- Backup directory
- GPG recipient for encryption
- Website endpoint URL (if different from default)

### 4. Set Up Scheduled Backups

Add to your crontab:

```
# Full backup every day at 2:00 AM
0 2 * * * /path/to/supabase-backup.sh >> /path/to/backups/cron.log 2>&1
```

## Features

### Backup Script

The backup script:
1. Creates a full database backup using pg_dump
2. Compresses and encrypts the backup with GPG
3. Maintains a retention policy for old backups
4. Logs status information
5. Sends backup status to the admin panel

### Admin Panel Integration

The admin panel shows:
- Status of the most recent backup
- List of available backup files
- Backup size and date information
- Error details if backups failed

## Security Notes

- The API token should be kept secure and randomized
- Database credentials should never be committed to version control
- GPG encryption provides additional security for backups
- Consider storing backups in a separate location for disaster recovery

## Troubleshooting

If backups aren't showing in the admin panel:
1. Check that the `BACKUP_API_TOKEN` matches in both environments
2. Verify the backup script has network access to your website
3. Look at the backup logs for curl errors
4. Check Supabase permissions for the backup_status table 