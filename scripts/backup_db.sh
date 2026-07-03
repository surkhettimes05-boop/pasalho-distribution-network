#!/usr/bin/env bash
CONN=${DATABASE_URL:-postgresql://postgres:pkdon123@localhost:5432/pasalho}
OUT=${1:-pasalho_backup.dump}
pg_dump -Fc "$CONN" -f "$OUT"
echo "Backup written to $OUT"
