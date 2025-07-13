/**
 * @file This plugin extends the format method to support advanced ordinal tokens.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import { TemporalUtils } from '../TemporalUtils';
import type { AtemporalFactory, Plugin } from '../types';
import {Temporal} from "@js-temporal/polyfill";

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
 * Gets the localized short time zone name (e.g., "EST", "GMT-5").
 * @internal
 */
function getShortTimeZoneName(zdt: Temporal.ZonedDateTime, locale: string): string {
    try {
        const formatter = new Intl.DateTimeFormat(locale, {
            timeZone: zdt.timeZoneId,
            timeZoneName: 'short',
        });
        const parts = formatter.formatToParts(zdt.toInstant().epochMilliseconds);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        return tzPart?.value || zdt.timeZoneId;
    } catch {
        return zdt.timeZoneId;
    }
}



/**
 * Gets the localized long time zone name (e.g., "Eastern Standard Time").
 * @internal
 */
function getLongTimeZoneName(zdt: Temporal.ZonedDateTime, locale: string): string {
    try {
        const formatter = new Intl.DateTimeFormat(locale, {
            timeZone: zdt.timeZoneId,
            timeZoneName: 'long',
        });
        const parts = formatter.formatToParts(zdt.toInstant().epochMilliseconds);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        return tzPart?.value || zdt.timeZoneId;
    } catch {
        return zdt.timeZoneId;
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
    // Add other languages as needed
};

/**
 * Generates the ordinal string for a given number and locale.
 * @internal
 */
function getOrdinal(num: number, locale: string): string {
    try {
        // Use Intl.PluralRules for robust ordinal logic.
        const pr = new Intl.PluralRules(locale, { type: 'ordinal' });
        const rule = pr.select(num);
        const lang = locale.split('-')[0]; // Use base language (e.g., 'en' from 'en-US')
        const suffix = ordinalSuffixes[lang]?.[rule] || ''; // Fallback to empty string
        return `${num}${suffix}`;
    } catch (e) {
        // Fallback for unsupported locales or errors.
        return num.toString();
    }
}

const advancedFormatPlugin: Plugin = (Atemporal) => {
    // Save the original format method from the prototype before we wrap it.
    const originalFormat = Atemporal.prototype.format;

    // This regex now *only* looks for the tokens this plugin is responsible for.
    const advancedTokenRegex = /Qo|Do|zzzz|zzz/g;

    // Replace the original .format() with our new, extended version.
    Atemporal.prototype.format = function (
        this: TemporalWrapper,
        templateOrOptions?: string | Intl.DateTimeFormatOptions,
        localeCode?: string
    ): string {
        // If the input isn't a string template, or the instance is invalid,
        // just call the original method and exit.
        if (!this.isValid() || typeof templateOrOptions !== 'string') {
            return originalFormat.apply(this, arguments as any);
        }

        const formatString = templateOrOptions;
        const locale = localeCode || TemporalUtils.getDefaultLocale();

        // Create a map of functions to handle this plugin's specific tokens.
        const replacements = {
            Do: () => getOrdinal(this.day, locale),
            Qo: () => getOrdinal(this.quarter(), locale),
            zzz: () => getShortTimeZoneName(this.raw, locale),
            zzzz: () => getLongTimeZoneName(this.raw, locale),
        };

        // Replace all advanced tokens, wrapping the result in brackets
        // so the core formatter treats them as literals.
        const partiallyFormatted = formatString.replace(advancedTokenRegex, (match) => {
            const key = match as keyof typeof replacements;
            if (key in replacements) {
                // Wrap the result in brackets to protect it from the next formatting step.
                return `[${replacements[key]()}]`;
            }
            return match;
        });

        // **Crucially, call the original format method** with the partially processed string.
        // This lets the core handle all other tokens (YYYY, MM, a, etc.).
        return originalFormat.call(this, partiallyFormatted, localeCode);
    };
};

export default advancedFormatPlugin;