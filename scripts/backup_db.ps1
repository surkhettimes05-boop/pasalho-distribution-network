param(
  [string]$CONN = 'postgresql://postgres:pkdon123@localhost:5432/pasalho',
  [string]$OUT = 'pasalho_backup.dump'
)

pg_dump -Fc $CONN -f $OUT
Write-Host "Backup written to $OUT"
