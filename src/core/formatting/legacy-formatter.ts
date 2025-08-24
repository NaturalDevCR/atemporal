/**
 * @file Legacy formatting utilities for backward compatibility
 * Contains the original token-based formatting system used by TemporalWrapper
 */

import { RegexCache } from '../../RegexCache';
import { TemporalUtils } from '../../TemporalUtils';
import type { FormatTokenMap } from '../../types';

// Get the precompiled regular expression (lazy loading for testability)
function getTokenRegex(): RegExp {
    const regex = RegexCache.getPrecompiled('tokenRegex');
    if (!regex) {
        throw new Error('Token regex not found in precompiled cache');
    }
    return regex;
}

/**
 * Creates and caches a map of formatting tokens to their corresponding string values.
 * The cache is a two-level map: WeakMap<Instance, Map<Locale, Replacements>>
 * to ensure that replacements are correctly cached per instance AND per locale.
 * @internal
 */
const formatReplacementsCache = new WeakMap<any, Map<string, FormatTokenMap>>();

/**
 * Creates token replacements for legacy formatting
 * @param instance - The TemporalWrapper instance
 * @param locale - Optional locale code
 * @returns Map of format tokens to their replacement functions
 */
export function createTokenReplacements(instance: any, locale?: string): FormatTokenMap {
    const currentLocale = locale || TemporalUtils.getDefaultLocale();
    const localeCache = formatReplacementsCache.get(instance);

    // Return from cache if available for this instance and locale.
    if (localeCache?.has(currentLocale)) {
        return localeCache.get(currentLocale)!;
    }

    // --- Token Implementations ---
    const safeHour = instance.hour ?? 0;
    const h12 = safeHour % 12 === 0 ? 12 : safeHour % 12;

    const replacements: FormatTokenMap = {
        // --- Year ---
        /** Four-digit year (e.g., 2024) */
        YYYY: () => (instance.year ?? 0).toString(),
        /** Two-digit year (e.g., 24) */
        YY: () => (instance.year ?? 0).toString().slice(-2),

        // --- Month ---
        /** The full month name (e.g., "January") */
        MMMM: () => instance.raw?.toLocaleString?.(currentLocale, { month: 'long' }) ?? 'January',
        /** The abbreviated month name (e.g., "Jan") */
        MMM: () => instance.raw?.toLocaleString?.(currentLocale, { month: 'short' }) ?? 'Jan',
        /** The month, 2-digits (e.g., 01-12) */
        MM: () => (instance.month ?? 1).toString().padStart(2, '0'),
        /** The month, 1-12 */
        M: () => (instance.month ?? 1).toString(),

        // --- Day of Month ---
        /** The day of the month, 2-digits (e.g., 01-31) */
        DD: () => (instance.day ?? 1).toString().padStart(2, '0'),
        /** The day of the month, 1-31 */
        D: () => (instance.day ?? 1).toString(),

        // --- Day of Week ---
        /** The name of the day of the week (e.g., "Sunday") */
        dddd: () => instance.raw?.toLocaleString?.(currentLocale, { weekday: 'long' }) ?? 'Sunday',
        /** The short name of the day of the week (e.g., "Sun") */
        ddd: () => instance.raw?.toLocaleString?.(currentLocale, { weekday: 'short' }) ?? 'Sun',
        /** The min name of the day of the week (e.g., "Su") */
        dd: () => instance.raw?.toLocaleString?.(currentLocale, { weekday: 'narrow' }) ?? 'Su',
        /** The day of the week, with Sunday as 0 (e.g., 0-6) */
        d: () => ((instance.raw?.dayOfWeek ?? 0) % 7).toString(),

        // --- Hour ---
        /** The hour, 2-digits (00-23) */
        HH: () => (instance.hour ?? 0).toString().padStart(2, '0'),
        /** The hour (0-23) */
        H: () => (instance.hour ?? 0).toString(),
        /** The hour, 12-hour clock, 2-digits (01-12) */
        hh: () => h12.toString().padStart(2, '0'),
        /** The hour, 12-hour clock (1-12) */
        h: () => h12.toString(),

        // --- Minute ---
        /** The minute, 2-digits (00-59) */
        mm: () => (instance.minute ?? 0).toString().padStart(2, '0'),
        /** The minute (0-59) */
        m: () => (instance.minute ?? 0).toString(),

        // --- Second ---
        /** The second, 2-digits (00-59) */
        ss: () => (instance.second ?? 0).toString().padStart(2, '0'),
        /** The second (0-59) */
        s: () => (instance.second ?? 0).toString(),

        // --- Millisecond ---
        /** The millisecond, 3-digits (000-999) */
        SSS: () => (instance.millisecond ?? 0).toString().padStart(3, '0'),

        // --- AM/PM ---
        /** AM PM */
        A: () => ((instance.hour ?? 0) < 12 ? 'AM' : 'PM'),
        /** am pm */
        a: () => ((instance.hour ?? 0) < 12 ? 'am' : 'pm'),

        // --- Timezone ---
        /** The offset from UTC, ±HH:mm (e.g., +05:00) */
        Z: () => instance.raw?.offset ?? '+00:00',
        /** The offset from UTC, ±HHmm (e.g., +0500) */
        ZZ: () => (instance.raw?.offset ?? '+00:00').replace(':', ''),
        /** The IANA time zone name (e.g., "America/New_York") */
        z: () => instance.raw?.timeZoneId ?? 'UTC'
    };

    if (!localeCache) {
        formatReplacementsCache.set(instance, new Map([[currentLocale, replacements]]));
    } else {
        localeCache.set(currentLocale, replacements);
    }

    return replacements;
}

/**
 * Legacy formatting method for backward compatibility
 * @param instance - The TemporalWrapper instance
 * @param formatString - The format string with tokens
 * @param localeCode - Optional locale code
 * @returns Formatted string
 */
export function legacyFormat(instance: any, formatString: string, localeCode?: string): string {
    const replacements = createTokenReplacements(instance, localeCode);
    const tokenRegex = getTokenRegex();
    
    return formatString.replace(tokenRegex, (match, literal) => {
        if (literal) return literal;
        if (match in replacements) return (replacements)[match]();
        return match;
    });
}

/**
 * Gets the token regex for legacy formatting
 * @returns The compiled token regex
 */
export { getTokenRegex };

/**
 * Clears the legacy formatting cache
 * Note: WeakMaps cannot be cleared directly, so this function has limited effect.
 * The cache will be naturally garbage collected when instances are no longer referenced.
 */
export function clearLegacyFormattingCache(): void {
    // WeakMaps don't have a clear() method and cannot be cleared directly.
    // The cache entries will be automatically garbage collected when the
    // instances they're keyed by are no longer referenced.
    // This function is kept for API compatibility but has no implementation.
}