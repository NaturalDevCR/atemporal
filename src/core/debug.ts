/**
 * @file Debug logging utility.
 * @internal
 */

/**
 * Logs a warning message without exposing error stack traces.
 * Uses console.warn but only passes string messages, never Error objects.
 */
export function debugLog(level: 'warn' | 'error', message: string, context?: unknown): void {
    const logFn = level === 'error' ? console.error : console.warn;
    const contextStr = context !== undefined ? ` ${String(context)}` : '';
    logFn(`${message}${contextStr}`);
}
