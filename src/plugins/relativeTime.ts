/**
 * @file This plugin extends the TemporalWrapper class with relative time formatting,
 * allowing for human-readable strings like "5 minutes ago" or "in 2 hours".
 * It leverages the native `Intl` APIs for robust localization.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { IntlCache, LRUCache, LocaleUtils, GlobalCacheCoordinator } from '../TemporalUtils';
import type { AtemporalFactory, Plugin, TimeUnit } from '../types';

/**
 * Cache for relative time calculations to improve performance.
 * Stores formatted relative time strings with locale-aware keys.
 */
class RelativeTimeCache {
    private static cache = new LRUCache<string, string>(150); // Reasonable size for relative time cache
    private static readonly MAX_SIZE = 150;

    /**
     * Gets a cached relative time result or generates and caches a new one.
     * @param diffSeconds - The difference in seconds
     * @param locale - The locale for formatting
     * @param withoutSuffix - Whether to exclude suffix
     * @returns Formatted relative time string
     */
    static getRelativeTime(
        diffSeconds: number,
        locale: string,
        withoutSuffix: boolean
    ): string | null {
        const normalizedLocale = LocaleUtils.validateAndNormalize(locale);
        const key = `${diffSeconds}:${normalizedLocale}:${withoutSuffix}`;
        const result = this.cache.get(key);
        return result !== undefined ? result : null;
    }

    /**
     * Caches a relative time result.
     * @param diffSeconds - The difference in seconds
     * @param locale - The locale for formatting
     * @param withoutSuffix - Whether to exclude suffix
     * @param result - The formatted result to cache
     */
    static setRelativeTime(
        diffSeconds: number,
        locale: string,
        withoutSuffix: boolean,
        result: string
    ): void {
        const normalizedLocale = LocaleUtils.validateAndNormalize(locale);
        const key = `${diffSeconds}:${normalizedLocale}:${withoutSuffix}`;
        this.cache.set(key, result);
    }

    /**
     * Clears the relative time cache.
     */
    static clear(): void {
        this.cache.clear();
    }

    /**
     * Gets cache statistics.
     * @returns Object with cache size and max size
     */
    static getStats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE
        };
    }
}

// Register with global cache coordinator
GlobalCacheCoordinator.registerCache('relativeTime', {
    clear: () => RelativeTimeCache.clear(),
    getStats: () => RelativeTimeCache.getStats()
});

// Augment the TemporalWrapper interface to include the new methods.
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
 * Optimized thresholds for unit selection, providing more natural language.
 * These are cached as constants for better performance.
 */
const RELATIVE_TIME_THRESHOLDS = {
    SECOND_TO_MINUTE: 45,
    MINUTE_TO_HOUR: 45 * 60,     // 45 minutes in seconds
    HOUR_TO_DAY: 22 * 3600,      // 22 hours in seconds
    DAY_TO_MONTH: 26 * 86400,    // 26 days in seconds
    MONTH_TO_YEAR: 11            // months
} as const;

/**
 * A robust helper function to calculate relative time with intelligent caching.
 * This version uses optimized threshold-based logic and caches results for performance.
 *
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
    if (!instance.isValid() || !comparisonDate.isValid()) {
        return 'Invalid Date';
    }

    try {
        const normalizedLocale = LocaleUtils.validateAndNormalize(locale);
        
        // Calculate difference in seconds for efficient threshold checking
        const diffSeconds = instance.diff(comparisonDate, 'second', true);
        const roundedDiffSeconds = Math.round(diffSeconds);
        
        // Check cache first for performance
        const cachedResult = RelativeTimeCache.getRelativeTime(
            roundedDiffSeconds,
            normalizedLocale,
            withoutSuffix
        );
        
        if (cachedResult !== null) {
            return cachedResult;
        }

        const absDiffSeconds = Math.abs(diffSeconds);
        let bestUnit: Intl.RelativeTimeFormatUnit;
        let bestDiff: number;

        // Optimized threshold checking using pre-calculated constants
        if (absDiffSeconds < RELATIVE_TIME_THRESHOLDS.SECOND_TO_MINUTE) {
            bestUnit = 'second';
            bestDiff = roundedDiffSeconds;
        } else if (absDiffSeconds < RELATIVE_TIME_THRESHOLDS.MINUTE_TO_HOUR) {
            bestUnit = 'minute';
            bestDiff = Math.round(diffSeconds / 60);
        } else if (absDiffSeconds < RELATIVE_TIME_THRESHOLDS.HOUR_TO_DAY) {
            bestUnit = 'hour';
            bestDiff = Math.round(diffSeconds / 3600);
        } else if (absDiffSeconds < RELATIVE_TIME_THRESHOLDS.DAY_TO_MONTH) {
            bestUnit = 'day';
            bestDiff = Math.round(diffSeconds / 86400);
        } else {
            // For longer periods, use specific diff methods with enhanced error handling
            try {
                const diffMonths = instance.diff(comparisonDate, 'month', true);
                if (Math.abs(diffMonths) < RELATIVE_TIME_THRESHOLDS.MONTH_TO_YEAR) {
                    bestUnit = 'month';
                    bestDiff = Math.round(diffMonths);
                } else {
                    const diffYears = instance.diff(comparisonDate, 'year', true);
                    bestUnit = 'year';
                    bestDiff = Math.round(diffYears);
                }
            } catch (e) {
                console.warn('RelativeTime: Error calculating long-term diff:', e);
                // Fallback to day calculation
                bestUnit = 'day';
                bestDiff = Math.round(diffSeconds / 86400);
            }
        }

        let result: string;

        if (withoutSuffix) {
            try {
                // Use cached Intl.NumberFormat for better performance
                const nf = IntlCache.getNumberFormatter(normalizedLocale, {
                    style: 'unit',
                    unit: bestUnit,
                    unitDisplay: 'long',
                });
                result = nf.format(Math.abs(bestDiff));
            } catch (e) {
                console.warn('RelativeTime: Error formatting number:', e);
                // Simple fallback
                const absValue = Math.abs(bestDiff);
                const unitName = bestUnit + (absValue !== 1 ? 's' : '');
                result = `${absValue} ${unitName}`;
            }
        } else {
            try {
                // Use cached Intl.RelativeTimeFormat for better performance
                const rtf = IntlCache.getRelativeTimeFormatter(normalizedLocale, { numeric: 'auto' });
                result = rtf.format(bestDiff, bestUnit);
            } catch (e) {
                console.warn('RelativeTime: Error formatting relative time:', e);
                // Simple fallback with basic logic
                const absValue = Math.abs(bestDiff);
                const unitName = bestUnit + (absValue !== 1 ? 's' : '');
                const suffix = bestDiff < 0 ? ' ago' : '';
                const prefix = bestDiff > 0 ? 'in ' : '';
                result = `${prefix}${absValue} ${unitName}${suffix}`;
            }
        }

        // Cache the result for future use
        RelativeTimeCache.setRelativeTime(
            roundedDiffSeconds,
            normalizedLocale,
            withoutSuffix,
            result
        );

        return result;
    } catch (error) {
        console.warn('RelativeTime: Unexpected error:', error);
        return 'Invalid Date';
    }
};


const relativeTimePlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    Atemporal.prototype.fromNow = function (this: TemporalWrapper, withoutSuffix = false) {
        const now = atemporal();
        const locale = LocaleUtils.validateAndNormalize(atemporal.getDefaultLocale());
        return getRelativeTime(this, now, withoutSuffix, locale);
    };

    Atemporal.prototype.toNow = function (this: TemporalWrapper, withoutSuffix = false) {
        const now = atemporal();
        const locale = LocaleUtils.validateAndNormalize(atemporal.getDefaultLocale());
        return getRelativeTime(now, this, withoutSuffix, locale);
    };
    
    // Expose cache management methods for testing and optimization
    if (atemporal) {
        (atemporal as any).clearRelativeTimeCache = function() {
            RelativeTimeCache.clear();
        };
        
        (atemporal as any).getRelativeTimeCacheStats = function() {
            return {
                relativeTime: RelativeTimeCache.getStats()
            };
        };
    }
};

/**
 * Augments the `AtemporalFactory` interface via TypeScript's module declaration merging.
 * This makes the cache management methods visible and type-safe on the `atemporal` factory.
 */
declare module '../types' {
    interface AtemporalFactory {
        clearRelativeTimeCache?(): void;
        getRelativeTimeCacheStats?(): { relativeTime: { size: number; maxSize: number } };
    }
}

export default relativeTimePlugin;