import { Pool, type PoolConfig } from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const isLocal = connectionString ? (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) : true;

const poolConfig: PoolConfig = connectionString
  ? {
      connectionString,
      ssl:
        !isLocal || process.env.POSTGRES_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined
    }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB || 'postgres'
    };

export const pool = new Pool(poolConfig);

export async function testDatabaseConnection() {
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT NOW() AS current_time');
    return {
      ok: true,
      currentTime: result.rows[0]?.current_time as string | undefined
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  } finally {
    client.release();
  }
}

// Start automated database backup daemon in the background
if (typeof global !== 'undefined' && !(global as any).backupIntervalStarted) {
  (global as any).backupIntervalStarted = true;
  
  const intervalMins = Number(process.env.BACKUP_INTERVAL_MINUTES || 60);
  if (intervalMins > 0) {
    const intervalMs = intervalMins * 60 * 1000;
    console.log(`[Backup Daemon] Scheduled backup daemon to run every ${intervalMins} minutes.`);
    
    // We delay the first backup check slightly after startup to avoid slowing down server boot
    setTimeout(() => {
      setInterval(async () => {
        try {
          console.log('[Backup Daemon] Running scheduled automated database backup...');
          const backupScriptPath = require('path').join(process.cwd(), 'scripts/backup_to_drive.js');
          const { runBackup } = require(backupScriptPath);
          const outputPath = await runBackup();
          console.log(`[Backup Daemon] Scheduled backup successfully saved to: ${outputPath}`);
        } catch (err: any) {
          console.error('[Backup Daemon] Scheduled backup failed:', err.message || err);
        }
      }, intervalMs);
    }, 10000); // 10 seconds delay
  }
}
