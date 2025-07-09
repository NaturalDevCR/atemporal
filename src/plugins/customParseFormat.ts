/**
 * @file This plugin adds the ability to parse a date from a string
 * that follows a specific format, similar to `customParseFormat` from Day.js.
 */

import { TemporalWrapper } from '../TemporalWrapper';
import type { AtemporalFactory, Plugin } from '../types';

// Extend the `atemporal` factory interface to add our new static method.
declare module '../types' {
    interface AtemporalFactory {
        /**
         * Creates an atemporal instance from a string and a specific format.
         * @param dateString The date string to parse.
         * @param formatString The format that the date string follows (e.g., 'YYYY-MM-DD').
         * @param timeZone The timezone to apply. If not provided, uses the default.
         * @returns A new TemporalWrapper instance.
         * @example
         * atemporal.fromFormat('12-25-2023', 'MM-DD-YYYY');
         * atemporal.fromFormat('2023/01/15 14:30', 'YYYY/MM/DD HH:mm', 'America/New_York');
         */
        fromFormat(dateString: string, formatString: string, timeZone?: string): TemporalWrapper;
    }
}

// A map of format tokens to their corresponding regular expressions.
const tokenMap: { [key: string]: string } = {
    YYYY: '(\\d{4})',
    YY: '(\\d{2})',
    MM: '(\\d{1,2})',
    M: '(\\d{1,2})',
    DD: '(\\d{1,2})',
    D: '(\\d{1,2})',
    HH: '(\\d{1,2})',
    H: '(\\d{1,2})',
    mm: '(\\d{1,2})',
    m: '(\\d{1,2})',
    ss: '(\\d{1,2})',
    s: '(\\d{1,2})',
};

const tokenRegex = /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g;

/**
 * Helper function that converts a string and its format into an ISO 8601 string.
 * The ISO format is the most robust for `Temporal` to parse.
 * @returns A string in ISO 8601 format or `null` if parsing fails.
 */
function parseToISO(dateString: string, formatString: string): string | null {
    const formatTokens: string[] = [];
    // Escape regex special characters in the format string (like '.', '/') to prevent interference.
    const safeFormatString = formatString.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    const regexString = safeFormatString.replace(tokenRegex, (match) => {
        formatTokens.push(match);
        return tokenMap[match];
    });

    // The regex is anchored to ensure the entire string must match the format.
    const valueRegex = new RegExp(`^${regexString}$`);
    const values = dateString.match(valueRegex);

    if (!values) {
        return null;
    }

    const dateParts: { [key: string]: string } = {};
    formatTokens.forEach((token, index) => {
        // values[0] is the full match, so captured groups start at index 1.
        dateParts[token] = values[index + 1];
    });

    // The 'YY' token assumes the 21st century. This is a common and acceptable simplification.
    const year = dateParts.YYYY || (dateParts.YY ? `20${dateParts.YY}` : null);

    // A year is essential for a valid ISO date. If not present in the format, parsing fails.
    if (!year) {
        return null;
    }

    // Build the rest of the ISO string, providing default values for time parts if they are missing.
    const month = (dateParts.MM || dateParts.M || '01').padStart(2, '0');
    const day = (dateParts.DD || dateParts.D || '01').padStart(2, '0');
    const hour = (dateParts.HH || dateParts.H || '00').padStart(2, '0');
    const minute = (dateParts.mm || dateParts.m || '00').padStart(2, '0');
    const second = (dateParts.ss || dateParts.s || '00').padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}


const customParseFormatPlugin: Plugin = (Atemporal, atemporal: AtemporalFactory) => {
    atemporal.fromFormat = function (
        dateString: string,
        formatString: string,
        timeZone?: string
    ): TemporalWrapper {
        const isoString = parseToISO(dateString, formatString);

        // If parsing fails, create an invalid instance, maintaining API consistency.
        if (!isoString) {
            return TemporalWrapper.from('Invalid Date');
        }

        // If parsing succeeds, use the normal factory with the robust ISO string.
        return TemporalWrapper.from(isoString, timeZone);
    };
};

export default customParseFormatPlugin;