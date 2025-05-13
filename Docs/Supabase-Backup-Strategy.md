# Supabase Backup Strategy for Atrocitee

## Supabase Built-in Backup Options

Supabase provides different levels of backup solutions depending on the plan:

### Free Tier
- No point-in-time recovery
- Limited automatic backups retained for 7 days
- No guarantee of recoverability

### Pro Tier and Above
- Point-in-time recovery (PITR) allowing restoration to any moment within the retention period
- Daily backups with longer retention periods (14+ days)
- Better support for recovery operations

## Recommended Backup Strategy

For Atrocitee's production environment, we recommend implementing:

1. **Upgrade to at least Pro Tier** when moving to production to enable PITR
   - Cost: Starting at $25/month
   - Benefit: Enables restoration to any point within the last 7 days

2. **Schedule Regular Database Exports**
   - Frequency: Weekly full exports, daily differential exports
   - Storage: Cloud storage with encryption (AWS S3 with server-side encryption)
   - Retention: 30 days for weekly exports, 14 days for daily exports

3. **Critical Data Snapshots**
   - Before major system changes, export critical tables
   - After major data updates, verify and backup

## Implementation Plan

1. **Set Up Automated Exports**
   ```bash
   # Example script to export database
   #!/bin/bash
   DATE=$(date +%Y-%m-%d)
   pg_dump -h db.YOUR_PROJECT_REF.supabase.co -p 5432 -d postgres -U postgres > atrocitee_backup_$DATE.sql
   
   # Encrypt the backup
   gpg --encrypt --recipient admin@atrocitee.com atrocitee_backup_$DATE.sql
   
   # Upload to secure storage
   aws s3 cp atrocitee_backup_$DATE.sql.gpg s3://atrocitee-backups/
   ```

2. **Validation Procedure**
   - Weekly attempt to restore a backup to test environment
   - Verify data integrity using checksum validation

3. **Emergency Recovery Process**
   - Document detailed recovery procedures for different scenarios
   - Create contact list for escalation
   - Test recovery procedures quarterly

## Development Environment Considerations

For development and staging environments:
- Regular schema-only exports for tracking schema changes
- Data exports before significant development iterations
- Local backups before applying migrations

## Monitoring and Compliance

- Set up alerts for backup failures
- Log all backup operations for audit purposes
- Ensure backups meet any applicable compliance requirements (GDPR, etc.)

## Next Steps

To implement this backup strategy:

1. Evaluate Supabase pricing plans and select appropriate tier
2. Develop and test backup automation scripts
3. Set up secure storage for offsite backups
4. Create detailed recovery documentation
5. Schedule regular backup validation tests 