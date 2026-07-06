/**
 * Lightweight structured logger. Writes to the console (prefixed for easy
 * filtering in DevTools) and, for warnings/errors, appends to the local
 * activity log repository so issues are visible in the dashboard even after
 * the console has been cleared.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogSink = (level: LogLevel, message: string, context?: Record<string, unknown>) => void;

const sinks: LogSink[] = [];

/** Register an additional destination for log records (e.g. the activity log repository). */
export function addLogSink(sink: LogSink): void {
  sinks.push(sink);
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const prefix = `[SMS Pro]`;
  const consoleMethod = level === 'debug' ? 'log' : level;
  // eslint-disable-next-line no-console
  (console[consoleMethod as 'log'] ?? console.log)(prefix, message, context ?? '');
  for (const sink of sinks) {
    try {
      sink(level, message, context);
    } catch {
      // Logging must never throw and break the caller's control flow.
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
};
