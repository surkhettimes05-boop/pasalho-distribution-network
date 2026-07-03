import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';
import { runBackup } from '@/scripts/backup_to_drive';

export async function GET(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backupDir = process.env.GOOGLE_DRIVE_BACKUP_PATH || path.join(process.cwd(), 'backups');
  const pathExists = fs.existsSync(backupDir);

  let backups: any[] = [];
  if (pathExists) {
    try {
      backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('pasalho_backup_') && f.endsWith('.sql'))
        .map(f => {
          const filePath = path.join(backupDir, f);
          const stats = fs.statSync(filePath);
          return {
            filename: f,
            sizeBytes: stats.size,
            createdAt: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err: any) {
      return NextResponse.json({ error: 'Failed to read backup directory: ' + err.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    configuredPath: backupDir,
    pathExists,
    backups
  });
}

export async function POST(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`Backup triggered via API by representative: ${current.name} (${current.email})`);
    const outputPath = await runBackup();
    
    return NextResponse.json({
      success: true,
      message: 'Database backup completed successfully.',
      filename: path.basename(outputPath),
      path: outputPath
    });
  } catch (error: any) {
    console.error('API backup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown backup error'
    }, { status: 500 });
  }
}
