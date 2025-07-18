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
    MM: '(\\d{2})',      // <-- Cambiado
    M: '(\\d{1,2})',
    DD: '(\\d{2})',      // <-- Cambiado
    D: '(\\d{1,2})',
    HH: '(\\d{2})',      // <-- Cambiado
    H: '(\\d{1,2})',
    mm: '(\\d{2})',      // <-- Cambiado
    m: '(\\d{1,2})',
    ss: '(\\d{2})',      // <-- Cambiado
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

    const now = new Date();
    const defaultYear = now.getFullYear().toString();
    const defaultMonth = (now.getMonth() + 1).toString();
    const defaultDay = now.getDate().toString();


    const year = dateParts.YYYY || (dateParts.YY ? `20${dateParts.YY}` : defaultYear);
    const month = (dateParts.MM || dateParts.M || defaultMonth).padStart(2, '0');
    const day = (dateParts.DD || dateParts.D || defaultDay).padStart(2, '0');
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