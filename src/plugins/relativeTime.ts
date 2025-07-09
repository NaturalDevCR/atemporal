/**
 * @file This plugin extends the TemporalWrapper class with relative time formatting,
 * allowing for human-readable strings like "5 minutes ago" or "in 2 hours".
 * It leverages the native `Intl.RelativeTimeFormat` API for robust localization.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import type { AtemporalFactory, Plugin, TimeUnit } from '../types';

// Use TypeScript's module augmentation to add the new methods to the TemporalWrapper interface.
// This provides full type safety and autocompletion for consumers of the plugin.
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Calculates the relative time from the instance to now.
         * @param withoutSuffix - If true, removes the "ago" or "in" prefix/suffix.
         * @example
         * atemporal().subtract(5, 'minutes').fromNow(); // "5 minutes ago"
         * atemporal().add(2, 'hours').fromNow(); // "in 2 hours"
         */
        fromNow(withoutSuffix?: boolean): string;

        /**
         * Calculates the relative time from now to the instance.
         * This is the inverse of `fromNow`.
         * @param withoutSuffix - If true, removes the "ago" or "in" prefix/suffix.
         * @example
         * atemporal().subtract(5, 'minutes').toNow(); // "in 5 minutes"
         * atemporal().add(2, 'hours').toNow(); // "2 hours ago"
         */
        toNow(withoutSuffix?: boolean): string;
    }
}

/**
 * A shared helper function to calculate relative time, avoiding code duplication.
 * @param instance - The atemporal instance to format.
 * @param comparisonDate - The date to compare against (typically "now").
 * @param withoutSuffix - Whether to strip the "ago"/"in" suffix.
 * @param locale - The locale to use for formatting.
 * @returns The formatted relative time string.
 */
const getRelativeTime = (
    instance: TemporalWrapper,
    comparisonDate: TemporalWrapper,
    withoutSuffix: boolean,
    locale: string
): string => {
    if (!instance.isValid()) {
        return 'Invalid Date';
    }

    const UNITS: TimeUnit[] = ['year', 'month', 'day', 'hour', 'minute', 'second'];
    let bestUnit: TimeUnit = 'second';
    let bestDiff = 0;

    // The direction of the comparison is determined by which date is the baseline.
    // `comparisonDate.diff(instance)` gives the duration from `instance` to `comparisonDate`.
    const diffInSeconds = comparisonDate.diff(instance, 'second');

    // Iterate through units to find the largest one with a non-zero difference.
    for (const unit of UNITS) {
        const diff = comparisonDate.diff(instance, unit);
        if (Math.abs(diff) >= 1) {
            bestUnit = unit;
            // We round the difference for a more natural output, e.g., not "1.9 days ago".
            bestDiff = Math.round(diff);
            break;
        }
    }

    // If the difference is less than a second, we can handle it explicitly.
    if (bestUnit === 'second' && Math.abs(diffInSeconds) < 1) {
        bestDiff = Math.round(diffInSeconds);
    }

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (withoutSuffix) {
        // To get the string without the suffix, we format to parts and filter.
        const parts = rtf.formatToParts(bestDiff, bestUnit as Intl.RelativeTimeFormatUnit);
        return parts
            .filter(part => part.type === 'integer' || part.type === 'unit')
            .map(part => part.value)
            .join(' ');
    }

    return rtf.format(bestDiff, bestUnit as Intl.RelativeTimeFormatUnit);
};


const relativeTimePlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    Atemporal.prototype.fromNow = function (this: TemporalWrapper, withoutSuffix = false) {
        const now = atemporal();
        const locale = atemporal.getDefaultLocale();
        // `fromNow` calculates the time from `this` instance to `now`.
        return getRelativeTime(this, now, withoutSuffix, locale);
    };

    Atemporal.prototype.toNow = function (this: TemporalWrapper, withoutSuffix = false) {
        const now = atemporal();
        const locale = atemporal.getDefaultLocale();
        // `toNow` calculates the time from `now` to `this` instance (the inverse).
        return getRelativeTime(now, this, withoutSuffix, locale);
    };
};

export default relativeTimePlugin;