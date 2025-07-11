/**
 * @file This is the main entry point for the 'atemporal' library.
 * It sets up the main factory function, attaches static utility methods,
 * and handles the plugin system, making it the central hub for all functionality.
 */

// Import the Temporal polyfill to ensure the API is available in all environments.
import '@js-temporal/polyfill';

import { Temporal } from '@js-temporal/polyfill';
import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
import {
    isAtemporal,
    isValid,
    isDuration,
    isValidTimeZone,
    isValidLocale,
    isPlugin
} from './typeGuards';
import type { DateInput, Plugin, AtemporalFactory, AtemporalFunction } from './types';

// Re-export the main wrapper class and utility types for direct use by consumers.
export { TemporalWrapper as Atemporal };
export type { DateInput, TimeUnit, SettableUnit, Plugin } from './types';

/**
 * The core factory function for creating atemporal instances.
 * It can be called with various date inputs or with no arguments to get the current time.
 *
 * The function is fully typed by the `AtemporalFunction` type, so JSDoc param/returns are not needed.
 */
const atemporalFn: AtemporalFunction = (input?: DateInput, timeZone?: string) => {
    // If the input is already an atemporal instance, clone it or change its timezone.
    if (input instanceof TemporalWrapper) {
        return timeZone ? input.timeZone(timeZone) : input.clone();
    }

    if (input === undefined) {
        // When no input is provided, create an instance for the current moment.
        const nowTemporal = Temporal.Now.zonedDateTimeISO(timeZone || TemporalUtils.defaultTimeZone);
        return TemporalWrapper.from(nowTemporal);
    }

    // At this point, `input` is guaranteed to be a valid `DateInput` type, so the call is safe.
    return TemporalWrapper.from(input, timeZone);
};

// Augment the core function with static properties to create the final factory object.
const atemporal = atemporalFn as AtemporalFactory;

// --- Attach all static methods from TemporalWrapper and TemporalUtils ---

atemporal.duration = (durationLike: Temporal.DurationLike | string): Temporal.Duration => {
    return Temporal.Duration.from(durationLike);
};

/**
 * Creates a new TemporalWrapper instance.
 * The function signature is inferred from `TemporalWrapper.from`.
 */
atemporal.from = TemporalWrapper.from;

/**
 * Creates a new TemporalWrapper instance from a Unix timestamp (seconds since epoch).
 * The function signature is inferred from `TemporalWrapper.unix`.
 */
atemporal.unix = TemporalWrapper.unix;

/**
 * Checks if a given input can be parsed into a valid date.
 * The function signature is inferred from `TemporalUtils.isValid`.
 */
atemporal.isValid = isValid;

/**
 * Checks if a given input is an instance of an atemporal object.
 * This acts as a TypeScript type guard.
 */
atemporal.isAtemporal = isAtemporal;

/**
 * Checks if a given input is an instance of Temporal.Duration.
 */
atemporal.isDuration = isDuration;

/**
 * Checks if a string is a valid and supported IANA time zone identifier.
 */
atemporal.isValidTimeZone = isValidTimeZone;

/**
 * Checks if a string is a structurally valid locale identifier.
 */
atemporal.isValidLocale = isValidLocale;

/**
 * Checks if a given function has the shape of an atemporal plugin.
 */
atemporal.isPlugin = isPlugin as (input: any) => input is Plugin;

/**
 * Sets the default locale for all new atemporal instances. Used for formatting.
 * The function signature is inferred from `TemporalUtils.setDefaultLocale`.
 */
atemporal.setDefaultLocale = TemporalUtils.setDefaultLocale;

/**
 * Sets the default IANA time zone for all new atemporal instances.
 * The function signature is inferred from `TemporalUtils.setDefaultTimeZone`.
 */
atemporal.setDefaultTimeZone = TemporalUtils.setDefaultTimeZone;

/**
 * Gets the currently configured default locale.
 * The function signature is inferred from `TemporalUtils.getDefaultLocale`.
 */
atemporal.getDefaultLocale = TemporalUtils.getDefaultLocale;

/**
 * Extends atemporal's functionality with a plugin.
 * The function signature is defined by its implementation.
 */
atemporal.extend = (plugin: Plugin, options) => {
    plugin(TemporalWrapper, atemporal, options);
};

// Export the final, augmented factory function as the default export of the library.
export default atemporal;