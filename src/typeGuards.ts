
import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
// Import Temporal types for TypeScript compilation
import type { Temporal } from '@js-temporal/polyfill';
import { getCachedTemporalAPI } from './core/temporal-detection';

// Get the appropriate Temporal API (native or polyfilled)
const { Temporal: TemporalAPI } = getCachedTemporalAPI();
/**
 * Checks if a given input is an instance of TemporalWrapper.
 * This acts as a TypeScript type guard.
 */
export function isAtemporal(input: any): input is TemporalWrapper {
    return input instanceof TemporalWrapper;
}
/**
 * Checks if a given input can be parsed into a valid date without throwing an error.
 */
export function isValid(input: any): boolean {
    if (input === null || input === undefined) {
        return false;
    }
    try {
        // We use the core parsing engine to determine validity.
        TemporalUtils.from(input);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Checks if a given input is an instance of Temporal.Duration.
 */
export function isDuration(input: any): input is Temporal.Duration {
    return input instanceof TemporalAPI.Duration;
}

/**
 * Checks if a string is a valid and supported IANA time zone identifier.
 */
export function isValidTimeZone(tz: string): boolean {
    try {
        // The standard way to check for time zone support is to try to use it.
        // If it's invalid, the constructor will throw a RangeError.
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks if a string is a structurally valid locale identifier.
 * Note: This doesn't guarantee the environment has full localization data for it,
 * but it confirms the structure is valid (e.g., 'en-US', 'fr', 'es-CR').
 */
export function isValidLocale(code: string): boolean {
    try {
        // The Intl.Locale API is designed for this kind of validation.
        new Intl.Locale(code);
        return true;
    } catch {
        return false;
    }
}

/**
 * Internal sentinel property used to reliably identify atemporal plugins.
 * External plugin authors can use `markAsPlugin()` to stamp their plugin.
 */
export const PLUGIN_SENTINEL = Symbol('atemporal.plugin');

/**
 * Stamps a function as a verified atemporal plugin.
 * Recommended for plugin authors distributing via npm so that `isPlugin()`
 * always returns `true` regardless of arity.
 *
 * @example
 * const myPlugin = markAsPlugin((Atemporal, atemporal) => { ... });
 */
export function markAsPlugin<T extends (...args: any[]) => void>(fn: T): T {
    (fn as any)[PLUGIN_SENTINEL] = true;
    return fn;
}

/**
 * Checks if a given value is an atemporal plugin.
 *
 * Detection order:
 * 1. Checks for the `PLUGIN_SENTINEL` symbol (stamped by `markAsPlugin()`).
 * 2. Falls back to duck-typing: must be a function with exactly 2 or 3
 *    parameters AND must not be a plain arrow function with a generic name,
 *    ensuring common utility functions like `(a, b) => a + b` are rejected.
 */
export function isPlugin(input: any): boolean {
    if (typeof input !== 'function') return false;
    // Explicit sentinel check (most reliable)
    if ((input as any)[PLUGIN_SENTINEL] === true) return true;
    // Duck-typing fallback: plugins always receive (Atemporal, atemporal[, options])
    // and are typically named or have a meaningful function name.
    return (input.length === 2 || input.length === 3) && input.name !== '';
}