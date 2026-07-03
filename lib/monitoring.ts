// Lightweight monitoring/logging helper. Integrate Sentry or other tools here.
export function logInfo(msg: string, meta?: any) {
  console.log('[info]', msg, meta || '');
}

export function logError(msg: string, meta?: any) {
  console.error('[error]', msg, meta || '');
}
