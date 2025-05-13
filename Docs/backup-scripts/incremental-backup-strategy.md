# Incremental Backup Strategy for Supabase

While the full backup script provides a solid foundation, you can implement a more efficient incremental backup strategy by combining full and incremental backups.

## Understanding Backup Types

1. **Full Backup**: Complete copy of the entire database
   - Advantages: Simple to restore, self-contained
   - Disadvantages: Time-consuming, storage-intensive

2. **Incremental Backup**: Only changes since the last backup
   - Advantages: Faster, less storage required
   - Disadvantages: More complex restoration, depends on previous backups

## Implementing Incremental Backups with PostgreSQL

PostgreSQL doesn't have a built-in incremental backup feature like some other databases, but you can achieve similar results using:

### Option 1: Write-Ahead Logs (WAL) Archiving

This is the most efficient approach but requires configuration that might not be accessible in Supabase:

```sql
-- These would need to be set by Supabase
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /path/to/archive/%f';
```

### Option 2: Logical Replication Slots (More feasible with Supabase)

1. **Create a replication slot** (once only):
```sql
SELECT pg_create_logical_replication_slot('atrocitee_backup_slot', 'pgoutput');
```

2. **Capture changes using pg_recvlogical** (in your script):
```bash
pg_recvlogical -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT -d $SUPABASE_DB_NAME -U $SUPABASE_DB_USER \
  --slot=atrocitee_backup_slot --start -o format=json -f changes.json
```

### Option 3: Time-Based Schema + Data Dump Strategy

This is the most practical approach with Supabase:

1. **Weekly Full Backup**: Complete database dump every Sunday
2. **Daily Schema-Only Backup**: Structure without data
3. **Daily Changed-Tables Backup**: Only backup tables with recent changes

## Practical Implementation Example

Here's how to script a selective table backup based on recently modified data:

```bash
#!/bin/bash
# Identify recently modified tables
MODIFIED_TABLES=$(PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" \
  -d "$SUPABASE_DB_NAME" -U "$SUPABASE_DB_USER" \
  -t -c "SELECT table_name FROM information_schema.tables 
         WHERE table_schema='public' 
         AND EXISTS (
           SELECT 1 FROM pg_stat_user_tables 
           WHERE schemaname='public' 
           AND relname=table_name 
           AND last_vacuum > now() - interval '1 day'
         )")

# Backup only modified tables
for TABLE in $MODIFIED_TABLES; do
  PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
    -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" \
    -d "$SUPABASE_DB_NAME" -U "$SUPABASE_DB_USER" \
    -t "$TABLE" -F c -f "${BACKUP_DIR}/${TABLE}_${DATE}.backup"
done
```

## Recommended Hybrid Approach for Atrocitee

1. **Sunday**: Full database backup
2. **Monday-Saturday**: 
   - Schema-only backup (quick and small)
   - Backup of tables modified in the last 24 hours
   - Trigger special backups before/after significant data operations

3. **Retention Policy**:
   - Keep 4 weekly full backups
   - Keep 14 days of incremental backups
   - Keep monthly archives for 12 months

## Monitoring Changes

You can track changes to determine which tables need backing up:

```sql
-- Query to find recently modified tables
SELECT relname AS table_name, 
       last_vacuum, 
       last_autovacuum,
       last_analyze,
       last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND (last_vacuum > now() - interval '1 day' 
     OR last_autovacuum > now() - interval '1 day'
     OR last_analyze > now() - interval '1 day'
     OR last_autoanalyze > now() - interval '1 day');
```

## Implementation Steps

1. Create a cron job for the full weekly backup on Sundays
2. Create a separate cron job for the daily incremental backups
3. Set up notifications for backup status
4. Periodically test restoration process 