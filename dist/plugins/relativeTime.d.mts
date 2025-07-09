import { P as Plugin } from '../TemporalWrapper-Cj9Ommz5.mjs';
import '@js-temporal/polyfill';

/**
 * @file This plugin extends the TemporalWrapper class with relative time formatting,
 * allowing for human-readable strings like "5 minutes ago" or "in 2 hours".
 * It leverages the native `Intl.RelativeTimeFormat` API for robust localization.
 */

declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Calculates the relative time from the instance to now.
         * @param withoutSuffix - If true, removes the "ago" or "in" prefix/suffix.
         * @example
         * atemporal().subtract(5, 'minutes').fromNow(); // "5 minutes ago"
         * atemporal().subtract(5, 'minutes').fromNow(true); // "5 minutes"
         */
        fromNow(withoutSuffix?: boolean): string;
        /**
         * Calculates the relative time from now to the instance. Alias for `fromNow`.
         * @param withoutSuffix - If true, removes the "ago" or "in" prefix/suffix.
         */
        toNow(withoutSuffix?: boolean): string;
    }
}
declare const relativeTimePlugin: Plugin;

export { relativeTimePlugin as default };
