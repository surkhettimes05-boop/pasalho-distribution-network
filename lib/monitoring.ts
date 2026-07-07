/**
 * Simple structured logger tailored for Vercel deployments.
 * Easily swappable for Sentry or Datadog in the future.
 */

export const logger = {
  info: (message: string, context: Record<string, any> = {}) => {
    console.log(JSON.stringify({ level: 'INFO', message, ...context, timestamp: new Date().toISOString() }));
  },
  warn: (message: string, context: Record<string, any> = {}) => {
    console.warn(JSON.stringify({ level: 'WARN', message, ...context, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: any, context: Record<string, any> = {}) => {
    const errorDetails = error ? {
      errorMessage: error.message || error,
      stack: error.stack
    } : {};
    console.error(JSON.stringify({ level: 'ERROR', message, ...errorDetails, ...context, timestamp: new Date().toISOString() }));
    
    // Future: Sentry.captureException(error, { extra: context });
  },
  
  /**
   * Log an API request lifecycle
   */
  logApiRequest: (method: string, path: string, status: number, durationMs: number) => {
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
    const logData = JSON.stringify({
      level,
      type: 'api_request',
      method,
      path,
      status,
      durationMs,
      timestamp: new Date().toISOString()
    });
    
    if (level === 'ERROR') {
      console.error(logData);
    } else {
      console.log(logData);
    }
  }
};

// Backwards compatibility for existing imports
export function logInfo(msg: string, meta?: any) {
  logger.info(msg, meta);
}
export function logError(msg: string, meta?: any) {
  logger.error(msg, null, meta);
}
