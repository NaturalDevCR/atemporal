/**
 * @file This plugin extends the format method to support advanced tokens,
 * including ordinal numbers and full month/day names.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { TemporalUtils } from '../TemporalUtils';
import type { AtemporalFactory, Plugin } from '../types';

// Augment the documentation for the format method to include the new tokens.
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        /**
         * Formats the date using a token string or Intl options.
         * This method is extended by the advancedFormat plugin to support:
         * - `Do`: Day of month with ordinal (e.g., "1st", "22nd")
         * - `Qo`: Quarter of year with ordinal (e.g., "1st", "3rd")
         * - `MMMM`: Full month name (e.g., "January")
         * - `MMM`: Short month name (e.g., "Jan")
         */
        format(templateOrOptions?: string | Intl.DateTimeFormatOptions, localeCode?: string): string;
    }
}

/**
 * A map of locale-specific ordinal suffixes.
 */
const ordinalSuffixes: { [locale: string]: { [rule: string]: string } } = {
    en: { one: 'st', two: 'nd', few: 'rd', other: 'th' },
    es: { one: 'º', other: 'º' },
    fr: { one: 'er', other: 'e' },
};

/**
 * Generates the ordinal string for a given number and locale.
 * @internal
 */
function getOrdinal(num: number, locale: string): string {
    try {
        const pr = new Intl.PluralRules(locale, { type: 'ordinal' });
        const rule = pr.select(num);
        const lang = locale.split('-')[0];
        const suffix = ordinalSuffixes[lang]?.[rule] || '';
        return `${num}${suffix}`;
    } catch (e) {
        // Fallback for unsupported locales or errors
        return num.toString();
    }
}

const advancedFormatPlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    // Save the original format method before replacing it.
    const originalFormat = Atemporal.prototype.format;

    // --- START OF FIX ---
    // This new regex now includes all the tokens this plugin is responsible for.
    const advancedTokenRegex = /MMMM|MMM|Qo|Do/g;
    // --- END OF FIX ---

    // Replace the original .format() with our new, extended version.
    Atemporal.prototype.format = function (
        this: TemporalWrapper,
        templateOrOptions?: string | Intl.DateTimeFormatOptions,
        localeCode?: string
    ): string {
        if (!this.isValid() || typeof templateOrOptions !== 'string') {
            return originalFormat.apply(this, arguments as any);
        }

        // --- START OF FIX ---
        // Test if the format string contains any of our advanced tokens.
        // We must reset the regex index since we're using a global regex.
        advancedTokenRegex.lastIndex = 0;
        if (!advancedTokenRegex.test(templateOrOptions)) {
            return originalFormat.apply(this, arguments as any);
        }
        // --- END OF FIX ---

        const formatString = templateOrOptions;
        const locale = localeCode || TemporalUtils.getDefaultLocale();

        // Create a map of functions to handle each advanced token.
        const replacements = {
            Do: () => getOrdinal(this.day, locale),
            Qo: () => getOrdinal(this.quarter(), locale),
            MMMM: () => this.raw.toLocaleString(locale, { month: 'long' }),
            MMM: () => this.raw.toLocaleString(locale, { month: 'short' }),
        };

        // Replace all advanced tokens in one go.
        const partiallyFormatted = formatString.replace(advancedTokenRegex, (match) => {
            // The type assertion is safe because the regex only matches keys of `replacements`.
            const replacementValue = (replacements as any)[match]();

            return `[${replacementValue}]`;
        });

        // Then, call the original format method with the partially formatted string
        // to let it handle all the standard tokens (YYYY, MM, etc.).
        return originalFormat.call(this, partiallyFormatted, localeCode);
    };
};

export default advancedFormatPlugin;