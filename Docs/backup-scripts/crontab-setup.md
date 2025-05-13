# Setting Up Scheduled Backups with Cron

This guide shows how to set up the Supabase backup scripts to run automatically using cron jobs on your Linux server.

## Preparation

1. Make sure the backup scripts are executable:

```bash
chmod +x /path/to/supabase-backup.sh
chmod +x /path/to/supabase-incremental-backup.sh  # If you created this script
```

2. Test each script manually to ensure it works correctly:

```bash
/path/to/supabase-backup.sh
```

## Setting Up Cron Jobs

### Editing the Crontab

Open the crontab configuration:

```bash
crontab -e
```

### Example Crontab Configuration

```
# Atrocitee Supabase Backup Schedule

# Full backup every Sunday at 2:00 AM
0 2 * * 0 /path/to/supabase-backup.sh >> /path/to/backups/cron.log 2>&1

# Schema-only backup every day (except Sunday) at 2:00 AM
0 2 * * 1-6 /path/to/supabase-schema-backup.sh >> /path/to/backups/cron.log 2>&1

# Changed-tables backup every day at 3:00 AM
0 3 * * * /path/to/supabase-incremental-backup.sh >> /path/to/backups/cron.log 2>&1

# Backup log rotation weekly
0 0 * * 0 find /path/to/backups/ -name "*.log" -mtime +30 -delete
```

## Monitoring Cron Job Execution

To check if your cron jobs are running:

1. View the system's cron log:
```bash
grep CRON /var/log/syslog
```

2. Check your custom log file:
```bash
tail -f /path/to/backups/cron.log
```

## Email Notifications (Optional)

To receive email notifications about backup status:

1. Install a mail utility:
```bash
sudo apt-get install mailutils
```

2. Configure email in your scripts:
```bash
# Add to the end of your backup scripts
if [ $? -eq 0 ]; then
  echo "Backup completed successfully" | mail -s "Atrocitee Backup Success" admin@example.com
else
  echo "Backup failed - please check logs" | mail -s "ALERT: Atrocitee Backup Failure" admin@example.com
fi
```

## Troubleshooting Cron Jobs

If your cron jobs aren't running:

1. Check the syntax of your crontab
2. Ensure full paths are used for all commands and files
3. Verify the cron service is running: `systemctl status cron`
4. Make sure the user running the cron job has appropriate permissions

## Best Practices

1. Use a dedicated user account for backup operations
2. Store backup scripts outside the backup directory
3. Regularly test the restoration process
4. Monitor disk space to ensure it doesn't run out
5. Implement offsite backup transfer for disaster recovery 