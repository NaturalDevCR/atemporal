/**
 * @file This is the main entry point for the 'atemporal' library.
 * It sets up the main factory function, attaches static utility methods,
 * and handles the plugin system, making it the central hub for all functionality.
 */

// Import the Temporal polyfill to ensure the API is available in all environments.
import '@js-temporal/polyfill';

import { Temporal } from "@js-temporal/polyfill";
import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
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
    // If the input is already an atemporal instance, clone it.
    // If a new timezone is provided, apply it; otherwise, return the clone.
    if (input instanceof TemporalWrapper) {
        return timeZone ? input.timeZone(timeZone) : input;
    }

    // Handle the case where atemporal() is called without arguments.
    if (input === undefined) {
        // Create an instance representing the current moment in the configured default timezone.
        const now = Temporal.Now.zonedDateTimeISO(TemporalUtils.defaultTimeZone);
        return new TemporalWrapper(now);
    }

    // For all other valid inputs, pass them directly to the constructor.
    // TypeScript knows 'input' is no longer undefined here, ensuring type safety.
    return new TemporalWrapper(input, timeZone);
};

// Augment the core function with static properties to create the final factory object.
// This pattern allows calling `atemporal()` as a function while also accessing utils like `atemporal.isValid()`.
const atemporal = atemporalFn as AtemporalFactory;

/**
 * Checks if a given input can be parsed into a valid date.
 * The function signature is inferred from `TemporalUtils.isValid`.
 */
atemporal.isValid = TemporalUtils.isValid;

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