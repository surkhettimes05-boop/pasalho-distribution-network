Param(
  [string]$Remote = 'gdrive',
  [string]$RemotePath = 'pasalho-backups',
  [string]$OutDir = '.',
  [string]$ConnString = $env:DATABASE_URL
)

if (-not $ConnString) {
  $ConnString = 'postgresql://postgres:pkdon123@localhost:5432/pasalho'
}

function ExitWith($code, $msg) {
  Write-Error $msg
  exit $code
}

# Ensure pg_dump exists
$pgdump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgdump) {
  ExitWith 2 "pg_dump not found. Ensure PostgreSQL client is installed and on PATH."
}

# Ensure rclone exists
$rclone = Get-Command rclone -ErrorAction SilentlyContinue
if (-not $rclone) {
  ExitWith 3 "rclone not found. Install rclone and run 'rclone config' before using this script."
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outFile = Join-Path (Resolve-Path $OutDir) "pasalho_$timestamp.dump"

Write-Output "Creating pg dump to $outFile"
try {
  & pg_dump -Fc $ConnString -f $outFile
} catch {
  ExitWith 4 "pg_dump failed: $_"
}

Write-Output "Uploading $outFile to $Remote:$RemotePath"
try {
  & rclone copy $outFile "$Remote:$RemotePath" --progress
} catch {
  ExitWith 5 "rclone upload failed: $_"
}

Write-Output "Upload complete. Removing local file $outFile"
Remove-Item $outFile -Force

Write-Output "Backup finished successfully."
