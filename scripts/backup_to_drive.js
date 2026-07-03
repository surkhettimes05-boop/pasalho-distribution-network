const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Pool } = require('pg');

// 1. Load environment variables manually to avoid external dependencies
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
        // Skip comments and empty lines
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

async function runBackup() {
  console.log('--- Starting Database Backup to Google Drive ---');
  console.log(`Target Directory: ${backupDir}`);

  // Ensure target folder exists
  if (!fs.existsSync(backupDir)) {
    console.log(`Creating directory: ${backupDir}`);
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pasalho_backup_${timestamp}.sql`;
  const outputPath = path.join(backupDir, filename);

  // Try pg_dump first
  let pgDumpSuccess = false;
  try {
    console.log('Attempting to backup using pg_dump...');
    // We try running pg_dump --version to see if it is available
    execSync('pg_dump --version', { stdio: 'ignore' });
    
    // Parse connection string to pass to pg_dump or use it directly
    if (connectionString) {
      execSync(`pg_dump "${connectionString}" -F p -f "${outputPath}"`, { stdio: 'inherit' });
      pgDumpSuccess = true;
      console.log(`✓ Backup created successfully using pg_dump: ${outputPath}`);
    } else {
      console.log('No connection string available for pg_dump.');
    }
  } catch (error) {
    console.log('pg_dump is not available or failed. Falling back to programmatic backup...');
  }

  // Fallback to programmatic backup if pg_dump failed or is unavailable
  if (!pgDumpSuccess) {
    try {
      await runProgrammaticBackup(outputPath);
      console.log(`✓ Programmatic backup created successfully: ${outputPath}`);
    } catch (err) {
      console.error('✗ Backup failed completely:', err.message);
      throw err;
    }
  }

  console.log('--- Backup Process Complete ---');
  return outputPath;
}

async function runProgrammaticBackup(outputPath) {
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

  const tables = [
    'Distributor',
    'SalesRep',
    'Retailer',
    'Product',
    'Order',
    'OrderItem',
    'Inventory',
    'RefreshToken'
  ];

  let sqlOutput = `-- Pasalho Database Programmatic Backup\n`;
  sqlOutput += `-- Created: ${new Date().toISOString()}\n\n`;
  sqlOutput += `SET statement_timeout = 0;\n`;
  sqlOutput += `SET lock_timeout = 0;\n`;
  sqlOutput += `SET client_encoding = 'UTF8';\n\n`;

  // Disable constraints temporarily to prevent ordering issues during import
  sqlOutput += `SET CONSTRAINTS ALL DEFERRED;\n\n`;

  try {
    for (const table of tables) {
      console.log(`Backing up table: ${table}...`);
      // Check if table exists
      const tableExistsCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );`,
        [table]
      );

      if (!tableExistsCheck.rows[0].exists) {
        console.log(`  Table ${table} does not exist, skipping.`);
        continue;
      }

      // Query rows
      const result = await client.query(`SELECT * FROM "${table}"`);
      if (result.rows.length === 0) {
        console.log(`  Table ${table} is empty.`);
        continue;
      }

      sqlOutput += `-- Table Data for "${table}"\n`;
      sqlOutput += `TRUNCATE TABLE "${table}" CASCADE;\n\n`;

      const columns = result.fields.map(f => f.name);
      const colNamesStr = columns.map(c => `"${c}"`).join(', ');

      for (const row of result.rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val.toString();
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          }
          return `'${val.toString().replace(/'/g, "''")}'`;
        });

        sqlOutput += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${values.join(', ')});\n`;
      }
      sqlOutput += `\n`;
    }

    fs.writeFileSync(outputPath, sqlOutput, 'utf8');
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  runBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runBackup };
