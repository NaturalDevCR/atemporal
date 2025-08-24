/**
 * @file Centralized locale validation and normalization utility
 * Provides consistent locale handling across all plugins.
 */

/**
 * Centralized locale validation and normalization utility.
 * Provides consistent locale handling across all plugins.
 * @internal
 */
export class LocaleUtils {
    /**
     * Validates and normalizes locale codes for consistent processing.
     * @param locale - Input locale code
     * @returns Normalized locale code
     */
    static validateAndNormalize(locale: any): string {
        try {
            // Basic validation: check if locale is a valid string
            if (!locale || typeof locale !== 'string') {
                return 'en'; // Default fallback
            }
            
            // Normalize locale format (e.g., 'en_US' -> 'en-US')
            const normalized = locale.replace(/_/g, '-');
            
            // Test if locale is supported by creating a test formatter
            new Intl.NumberFormat(normalized);
            
            return normalized;
        } catch {
            // If locale is invalid, fallback to base language or default
            if (typeof locale === 'string') {
                const baseLang = locale.split(/[-_]/)[0];
                try {
                    new Intl.NumberFormat(baseLang);
                    return baseLang;
                } catch {
                    return 'en'; // Ultimate fallback
                }
            }
            return 'en'; // Ultimate fallback for non-string inputs
        }
    }

    /**
     * Checks if a locale is supported by the Intl API.
     * @param locale - Locale code to check
     * @returns True if locale is supported
     */
    static isSupported(locale: string): boolean {
        try {
            new Intl.NumberFormat(locale);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets the base language from a locale code.
     * @param locale - Full locale code (e.g., 'en-US')
     * @returns Base language code (e.g., 'en')
     */
    static getBaseLanguage(locale: string): string {
        return locale.split(/[-_]/)[0];
    }
}