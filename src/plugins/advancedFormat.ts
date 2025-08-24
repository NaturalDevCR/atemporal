/**
 * @file This plugin extends the format method to support advanced ordinal tokens.
 * Optimized with caching systems and enhanced error handling for better performance.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { RegexCache } from '../RegexCache';
import { TemporalUtils, IntlCache, LRUCache, GlobalCacheCoordinator } from '../TemporalUtils';
import { LocaleUtils } from '../core/locale';
import type { AtemporalFactory, Plugin } from '../types';
import { Temporal } from '@js-temporal/polyfill';

// Augment the JSDoc to reflect only the tokens this plugin provides.
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Formats the date using a token string or Intl options.
         * This method is extended by the advancedFormat plugin to support:
         * - `Do`: Day of month with ordinal (e.g., "1st", "22nd")
         * - `Qo`: Quarter of year with ordinal (e.g., "1st", "3rd")
         */
        format(templateOrOptions?: string | Intl.DateTimeFormatOptions, localeCode?: string): string;
    }
}




/**
 * Cache for ordinal generation results to improve performance.
 * @internal
 */
class OrdinalCache {
    private static readonly MAX_SIZE = 200;
    private static cache = new LRUCache<string, string>(OrdinalCache.MAX_SIZE);
    
    /**
     * Gets cached ordinal or generates and caches new one.
     * @param num - Number to get ordinal for
     * @param locale - Locale code
     * @returns Ordinal string (e.g., "1st", "2nd")
     */
    static getOrdinal(num: number, locale: string): string {
        const key = `${num}:${locale}`;
        
        let result = this.cache.get(key);
        if (result === undefined) {
            result = this.generateOrdinal(num, locale);
            this.cache.set(key, result);
        }
        
        return result;
    }
    
    /**
     * Generates ordinal string for a number and locale.
     * @param num - Number to generate ordinal for
     * @param locale - Locale code
     * @returns Generated ordinal string
     */
    private static generateOrdinal(num: number, locale: string): string {
        try {
            // Use centralized locale validation
            const normalizedLocale = LocaleUtils.validateAndNormalize(locale);
            const baseLang = LocaleUtils.getBaseLanguage(normalizedLocale);
            const suffixes = ordinalSuffixes[baseLang];
            
            // If locale is not supported, return just the number
            if (!suffixes) {
                return num.toString();
            }
            
            const pr = new Intl.PluralRules(normalizedLocale, { type: 'ordinal' });
            const rule = pr.select(num);
            const suffix = suffixes[rule] || suffixes.other || '';
            
            // Handle prefix languages (like Chinese)
            if (baseLang === 'zh') {
                return `${suffix}${num}`;
            }
            
            return `${num}${suffix}`;
        } catch {
            // Fallback for unsupported locales or errors
            return num.toString();
        }
    }
    
    /**
     * Clears the ordinal cache.
     */
    static clear(): void {
        this.cache.clear();
    }
    
    /**
     * Gets cache statistics.
     */
    static getStats() {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE
        };
    }
}

/**
 * Cache for timezone name formatting results.
 * @internal
 */
class TimezoneCache {
    private static readonly MAX_SIZE = 100;
    private static cache = new LRUCache<string, string>(TimezoneCache.MAX_SIZE);
    
    /**
     * Gets cached timezone name or generates and caches new one.
     * @param zdt - ZonedDateTime instance
     * @param locale - Locale code
     * @param nameType - Type of timezone name ('short' or 'long')
     * @returns Timezone name string
     */
    static getTimezoneName(zdt: Temporal.ZonedDateTime, locale: string, nameType: 'short' | 'long'): string {
        const key = `${zdt.timeZoneId}:${locale}:${nameType}:${zdt.toInstant().epochMilliseconds}`;
        
        let result = this.cache.get(key);
        if (result === undefined) {
            result = this.generateTimezoneName(zdt, locale, nameType);
            this.cache.set(key, result);
        }
        
        return result;
    }
    
    /**
     * Generates timezone name for given parameters.
     * @param zdt - ZonedDateTime instance
     * @param locale - Locale code
     * @param nameType - Type of timezone name ('short' or 'long')
     * @returns Generated timezone name
     */
    private static generateTimezoneName(zdt: Temporal.ZonedDateTime, locale: string, nameType: 'short' | 'long'): string {
        try {
            // Use centralized locale validation
            const normalizedLocale = LocaleUtils.validateAndNormalize(locale);
            
            // Use cached DateTimeFormat for better performance
            const formatter = IntlCache.getDateTimeFormatter(normalizedLocale, {
                timeZone: zdt.timeZoneId,
                timeZoneName: nameType,
            });
            const parts = formatter.formatToParts(zdt.toInstant().epochMilliseconds);
            const tzPart = parts.find(p => p.type === 'timeZoneName');
            return tzPart?.value || zdt.timeZoneId;
        } catch (error) {
            // Enhanced error handling: log the error for debugging
            console.warn(`TimezoneCache: Error formatting timezone for ${zdt.timeZoneId} with locale ${locale}:`, error);
            return zdt.timeZoneId;
        }
    }
    
    /**
     * Clears the timezone cache.
     */
    static clear(): void {
        this.cache.clear();
    }
    
    /**
     * Gets cache statistics.
     */
    static getStats() {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE
        };
    }
}

/**
 * A map of locale-specific ordinal suffixes for common languages.
 * @internal
 */
const ordinalSuffixes: { [locale: string]: { [rule: string]: string } } = {
    en: { one: 'st', two: 'nd', few: 'rd', other: 'th' },
    es: { one: 'º', other: 'º' },
    fr: { one: 'er', other: 'e' },
    de: { other: '.' },
    it: { one: 'º', other: 'º' },
    pt: { one: 'º', other: 'º' },
    ru: { other: '-й' },
    ja: { other: '番目' },
    ko: { other: '번째' },
    zh: { other: '第' },
    // Add other languages as needed
};



const advancedFormatPlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    // Save the original format method from the prototype before we wrap it.
    const originalFormat = Atemporal.prototype.format;

    // Use the precompiled regex for better performance
    const advancedTokenRegex = RegexCache.getPrecompiled('advancedTokenRegex')!;

    // Replace the original .format() with our new, extended version.
    Atemporal.prototype.format = function (
        this: TemporalWrapper,
        templateOrOptions?: string | Intl.DateTimeFormatOptions,
        localeCode?: string
    ): string {
        // Enhanced validation: check for valid instance and string template
        if (!this.isValid() || typeof templateOrOptions !== 'string') {
            return originalFormat.apply(this, arguments as any);
        }

        const formatString = templateOrOptions;
        const locale = localeCode || TemporalUtils.getDefaultLocale();

        // Create a map of functions to handle this plugin's specific tokens with caching.
        // Use centralized locale validation
        const normalizedLocale = LocaleUtils.validateAndNormalize(locale);
        const ordinalLocale = shouldUseNormalizedLocale(locale) ? normalizedLocale : locale;
        const replacements = {
            Do: () => OrdinalCache.getOrdinal(this.day, ordinalLocale),
            Qo: () => OrdinalCache.getOrdinal(this.quarter(), ordinalLocale),
            zzz: () => TimezoneCache.getTimezoneName(this.raw, normalizedLocale, 'short'),
            zzzz: () => TimezoneCache.getTimezoneName(this.raw, normalizedLocale, 'long'),
        };

        // Replace all advanced tokens, wrapping the result in brackets
        // so the core formatter treats them as literals.
        const partiallyFormatted = formatString.replace(advancedTokenRegex, (match) => {
            const key = match as keyof typeof replacements;
            if (key in replacements) {
                try {
                    // Wrap the result in brackets to protect it from the next formatting step.
                    return `[${replacements[key]()}]`;
                } catch (error) {
                    // Enhanced error handling: log error and return fallback
                    console.warn(`AdvancedFormat: Error processing token ${match}:`, error);
                    return match; // Return original token as fallback
                }
            }
            return match;
        });

        // **Crucially, call the original format method** with the partially processed string.
        // This lets the core handle all other tokens (YYYY, MM, a, etc.).
        return originalFormat.call(this, partiallyFormatted, localeCode);
    };

    // Expose cache management methods for testing and optimization
    if (atemporal) {
        (atemporal as any).clearAdvancedFormatCache = function() {
            OrdinalCache.clear();
            TimezoneCache.clear();
        };
        
        (atemporal as any).getAdvancedFormatCacheStats = function() {
            return {
                ordinal: OrdinalCache.getStats(),
                timezone: TimezoneCache.getStats()
            };
        };
        
        // Integrate with GlobalCacheCoordinator
        (atemporal as any).clearAllCaches = function() {
            GlobalCacheCoordinator.clearAll();
            OrdinalCache.clear();
            TimezoneCache.clear();
        };
        
        (atemporal as any).getAllCacheStats = function() {
            const globalStats = GlobalCacheCoordinator.getAllStats();
            return {
                ...globalStats,
                advancedFormat: {
                    ordinal: OrdinalCache.getStats(),
                    timezone: TimezoneCache.getStats()
                }
            };
        };
    }
};

/**
 * Determines if we should use the normalized locale for ordinal generation.
 * @param locale - Original locale input
 * @returns True if we should use normalized locale, false for truly unsupported locales
 * @internal
 */
function shouldUseNormalizedLocale(locale: any): boolean {
    // Non-string inputs should use normalized locale (fallback to en-US)
    if (!locale || typeof locale !== 'string') {
        return true;
    }
    
    // Underscore formats should use normalized locale
    if (locale.includes('_')) {
        return true;
    }
    
    // Check if it's a supported locale or has a supported base language
    try {
        new Intl.DateTimeFormat(locale);
        return true; // Supported locale
    } catch {
        // Check base language
        const baseLang = locale.split(/[-_]/)[0];
        try {
            new Intl.DateTimeFormat(baseLang);
            return true; // Supported base language
        } catch {
            return false; // Truly unsupported locale
        }
    }
}

// Note: validateAndNormalizeLocale function has been moved to LocaleUtils in TemporalUtils
// for centralized locale handling across all plugins

export default advancedFormatPlugin;