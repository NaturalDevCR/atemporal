
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
 * Checks if a given function has the shape of an atemporal plugin.
 * This is a "duck typing" check based on the function's signature.
 */
export function isPlugin(input: any): boolean {
    // A plugin is a function that accepts 2 or 3 arguments.
    return typeof input === 'function' && (input.length === 2 || input.length === 3);
}