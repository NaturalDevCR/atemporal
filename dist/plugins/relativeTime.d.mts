import { P as Plugin } from '../TemporalWrapper-bEri8xHN.mjs';
import '@js-temporal/polyfill';

/**
 * @file This plugin extends the TemporalWrapper class with relative time formatting,
 * allowing for human-readable strings like "5 minutes ago" or "in 2 hours".
 * It leverages the native `Intl` APIs for robust localization.
 */

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
declare const relativeTimePlugin: Plugin;

export { relativeTimePlugin as default };
