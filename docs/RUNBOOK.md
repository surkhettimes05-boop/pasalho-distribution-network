# Disaster Recovery Runbook

This runbook outlines the standard operating procedures for restoring the Pasalho Distribution Network database from automated backups.

## Automated Backups Overview
The system runs an automated backup daemon (configured in `lib/db.ts`) which periodically dumps the PostgreSQL database into a `.sql` file and uploads it securely to Google Drive using the `scripts/backup_to_drive.js` script.

## Scenario: Restoring a Database Backup

If the production database crashes or suffers data corruption, follow these steps to restore the most recent backup:

### 1. Locate the Latest Backup
1. Navigate to the configured Google Drive Backup folder.
2. Download the most recent `.sql` backup file (e.g., `pasalho_backup_2026-07-06T12_00_00.sql`).

### 2. Prepare the Database Environment
Ensure your PostgreSQL instance is running and you have `psql` installed.

Drop the existing corrupted tables or recreate the database (CAUTION: This destroys current data! Ensure you have an offline copy if you wish to analyze the corruption later).
```bash
# Drop and recreate the database
psql -U postgres -c "DROP DATABASE pasalho;"
psql -U postgres -c "CREATE DATABASE pasalho;"
```

### 3. Restore the SQL Dump
Run the following command to import the SQL dump into the freshly created database:

```bash
# Restore the backup (replace filename with your downloaded backup)
psql -U postgres -d pasalho -f /path/to/pasalho_backup_2026-07-06.sql
```

### 4. Re-Initialize Application State
Since this is a Prisma-managed database, you should also ensure the Prisma Client matches the schema and the materialized views are functioning.

1. **Apply Migrations (if needed)**: `npx prisma generate`
2. **Refresh Materialized Views**: Connect to the DB and execute the view refresh manually to warm up the cache:
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_view;
   REFRESH MATERIALIZED VIEW CONCURRENTLY top_products_view;
   ```

### 5. Verify Health
Start the application locally or verify the production endpoint:
```bash
npm run dev
# or check the health/monitoring dashboard
```
Verify that the admin dashboard loads correctly and recent data matches expectations from the time of the backup.
