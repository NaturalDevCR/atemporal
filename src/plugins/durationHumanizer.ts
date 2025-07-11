/**
 * @file This plugin adds a `humanize` static method to the atemporal factory,
 * allowing for the conversion of `Temporal.Duration` objects into human-readable,
 * localized strings (e.g., "2 hours and 30 minutes").
 */

import { Temporal } from '@js-temporal/polyfill';
import type { Plugin } from '../types';

/**
 * Defines the options for customizing the output of the `humanize` function.
 */
interface HumanizeOptions {
    /** The locale to use for formatting (e.g., 'en-US', 'es-CR'). Defaults to 'en'. */
    locale?: string;
    /** The style for formatting the list of duration parts, per `Intl.ListFormat`. */
    listStyle?: 'long' | 'short' | 'narrow';
    /** The display style for the units, per `Intl.NumberFormat`. */
    unitDisplay?: 'long' | 'short' | 'narrow';
}

/**
 * A list of `Temporal.Duration` units, intentionally ordered by magnitude.
 * This constant is kept local to the plugin because its primary purpose is to
 * define a specific visual order for humanization, which is a concern
 * exclusive to this plugin.
 */
const DURATION_UNITS_ORDERED: (keyof Temporal.DurationLike)[] = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];

/**
 * Converts a `Temporal.Duration` or a duration-like object into a human-readable string.
 *
 * @param durationLike The duration object or a plain object like `{ hours: 2 }`.
 * @param options - Optional configuration for localization and formatting.
 * @returns A formatted, human-readable string representing the duration.
 * @example
 * atemporal.humanize({ years: 1, months: 6 }); // "1 year and 6 months"
 * atemporal.humanize({ minutes: 5 }, { locale: 'es' }); // "5 minutos"
 */
function humanize(durationLike: Temporal.Duration | Temporal.DurationLike, options: HumanizeOptions = {}): string {
    // Guard to robustly handle null, undefined, or empty object inputs.
    // It specifically checks that the input is not a valid Duration instance before checking its keys.
    if (!durationLike || (!(durationLike instanceof Temporal.Duration) && typeof durationLike === 'object' && Object.keys(durationLike).length === 0)) {
        try {
            const { locale = 'en', unitDisplay = 'long' } = options;
            const nf = new Intl.NumberFormat(locale, { style: 'unit', unit: 'second', unitDisplay });
            return nf.format(0);
        } catch (e) {
            return '0 seconds'; // Final fallback
        }
    }

    const duration = Temporal.Duration.from(durationLike);
    const { locale = 'en', listStyle = 'long', unitDisplay = 'long' } = options;

    const parts: string[] = [];

    for (const unit of DURATION_UNITS_ORDERED) {
        const value = duration[unit as keyof typeof duration];

        if (typeof value === 'number' && value !== 0) {
            // `Intl.NumberFormat` requires the singular form of the unit.
            const singularUnit = unit.endsWith('s') ? unit.slice(0, -1) : unit;
            try {
                // The 'unit' must be passed to the constructor, not to `.format()`.
                const nf = new Intl.NumberFormat(locale, {
                    style: 'unit',
                    unit: singularUnit,
                    unitDisplay,
                });
                // `.format()` only receives the numeric value.
                parts.push(nf.format(value));
            } catch (e) {
                // Fallback for units not supported by Intl.NumberFormat (e.g., 'week').
                // This provides a simple pluralization that works for English.
                const plural = value !== 1 ? 's' : '';
                parts.push(`${value} ${singularUnit}${plural}`);
            }
        }
    }

    if (parts.length === 0) {
        // Handles cases like `{ seconds: 0 }` where the duration is valid but has no value.
        try {
            const nf = new Intl.NumberFormat(locale, { style: 'unit', unit: 'second', unitDisplay });
            return nf.format(0);
        } catch (e) {
            return '0 seconds';
        }
    }

    // Use `Intl.ListFormat` to join the parts in a localized way (e.g., using "and", "y", ",").
    const listFormatter = new Intl.ListFormat(locale, { style: listStyle, type: 'conjunction' });
    return listFormatter.format(parts);
}

/**
 * The plugin object that conforms to the `Plugin` type.
 * It extends the `atemporal` factory with the `humanize` static method.
 */
const durationHumanizer: Plugin = (Atemporal, atemporal) => {
    atemporal.humanize = humanize;
};

/**
 * Augments the `AtemporalFactory` interface via TypeScript's module declaration merging.
 * This makes the new `humanize` method visible and type-safe on the `atemporal` factory.
 */
declare module '../types' {
    interface AtemporalFactory {
        humanize(durationLike: Temporal.Duration | Temporal.DurationLike, options?: HumanizeOptions): string;
    }
}

export default durationHumanizer;