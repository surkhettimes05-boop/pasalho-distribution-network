const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Pool } = require('pg');

// Load environment variables manually
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env')
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      content.split('\n').forEach(rawLine => {
        const line = rawLine.trim();
        if (line.startsWith('#') || !line) return;
        const match = line.match(/^([\w.-]+)\s*=\s*(.*)?$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
          if (!process.env[key]) process.env[key] = val;
        }
      });
    }
  }
}

loadEnv();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const backupDir = process.env.GOOGLE_DRIVE_BACKUP_PATH || path.join(__dirname, '../backups');

async function runRestore() {
  console.log('--- Starting Database Restore from Google Drive ---');

  // Accept a file path as an argument, otherwise find the latest backup
  let backupFile = process.argv[2];

  if (!backupFile) {
    console.log(`Scanning backup directory for latest file: ${backupDir}`);
    if (!fs.existsSync(backupDir)) {
      console.error(`✗ Backup directory does not exist: ${backupDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('pasalho_backup_') && f.endsWith('.sql'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.error('✗ No backup files found in directory.');
      process.exit(1);
    }

    backupFile = path.join(backupDir, files[0].name);
  } else {
    // If it's just a file name, resolve it in the backup dir
    if (!path.isAbsolute(backupFile)) {
      const fullPath = path.join(backupDir, backupFile);
      if (fs.existsSync(fullPath)) {
        backupFile = fullPath;
      }
    }
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`✗ Backup file does not exist: ${backupFile}`);
    process.exit(1);
  }

  console.log(`Restoring from backup: ${backupFile}`);

  let psqlSuccess = false;
  try {
    console.log('Attempting restore using psql tool...');
    execSync('psql --version', { stdio: 'ignore' });

    if (connectionString) {
      execSync(`psql "${connectionString}" -f "${backupFile}"`, { stdio: 'inherit' });
      psqlSuccess = true;
      console.log('✓ Database restored successfully using psql.');
    } else {
      console.log('No connection string available for psql.');
    }
  } catch (error) {
    console.log('psql tool is not available or failed. Falling back to programmatic restore...');
  }

  if (!psqlSuccess) {
    try {
      await runProgrammaticRestore(backupFile);
      console.log('✓ Database restored successfully using programmatic client.');
    } catch (err) {
      console.error('✗ Restore failed completely:', err.message);
      process.exit(1);
    }
  }

  console.log('--- Restore Process Complete ---');
  process.exit(0);
}

async function runProgrammaticRestore(backupFile) {
  const poolConfig = connectionString
    ? { connectionString }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: Number(process.env.POSTGRES_PORT || 5432),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        database: process.env.POSTGRES_DB || 'postgres'
      };

  const pool = new Pool(poolConfig);
  const client = await pool.connect();

  try {
    const sql = fs.readFileSync(backupFile, 'utf8');
    
    console.log('Executing backup SQL script...');
    // We execute the entire file. client.query supports executing multiple statements.
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction:', rbErr.message);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  runRestore();
}
