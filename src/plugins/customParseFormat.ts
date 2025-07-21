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

// A map of format tokens to their corresponding regular expressions with improved precision.
const tokenMap: { [key: string]: string } = {
    YYYY: '(\\d{4})',
    YY: '(\\d{2})',
    MM: '(0[1-9]|1[0-2])',        // Months 01-12
    M: '([1-9]|1[0-2])',          // Months 1-12
    DD: '(0[1-9]|[12]\\d|3[01])', // Days 01-31
    D: '([1-9]|[12]\\d|3[01])',   // Days 1-31
    HH: '([01]\\d|2[0-3])',       // Hours 00-23
    H: '([0-9]|1\\d|2[0-3])',     // Hours 0-23
    mm: '([0-5]\\d)',            // Minutes 00-59
    m: '([0-9]|[1-5]\\d)',       // Minutes 0-59
    ss: '([0-5]\\d)',            // Seconds 00-59
    s: '([0-9]|[1-5]\\d)',       // Seconds 0-59
    SSS: '(\\d{3})',             // Milliseconds 000-999
    SS: '(\\d{2})',              // Centiseconds 00-99
    S: '(\\d{1})',               // Deciseconds 0-9
};

// Order tokens by length (longer ones first) to avoid parsing conflicts
const tokenRegex = /YYYY|MM|DD|HH|mm|ss|SSS|SS|YY|M|D|H|m|s|S/g;

// Cache para expresiones regulares y resultados de formato
class FormatCache {
    private static readonly MAX_SIZE = 100;
    private static regexCache = new Map<string, { regex: RegExp, tokens: string[] }>();
    
    static getRegexForFormat(formatString: string): { regex: RegExp, tokens: string[] } | null {
        // Verificar si ya existe en el cache
        if (this.regexCache.has(formatString)) {
            // Mover al final para implementar LRU
            const entry = this.regexCache.get(formatString)!;
            this.regexCache.delete(formatString);
            this.regexCache.set(formatString, entry);
            return entry;
        }
        
        // Si el cache está lleno, eliminar la entrada más antigua
        if (this.regexCache.size >= this.MAX_SIZE) {
            const oldestKey = this.regexCache.keys().next().value;
            if (oldestKey !== undefined) {
                this.regexCache.delete(oldestKey);
            }
        }
        
        try {
            const formatTokens: string[] = [];
            // Escape regex special characters in the format string (like '.', '/') to prevent interference.
            const safeFormatString = formatString.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

            const regexString = safeFormatString.replace(tokenRegex, (match) => {
                formatTokens.push(match);
                return tokenMap[match];
            });

            // The regex is anchored to ensure the entire string must match the format.
            const valueRegex = new RegExp(`^${regexString}$`);
            
            const entry = { regex: valueRegex, tokens: formatTokens };
            this.regexCache.set(formatString, entry);
            return entry;
        } catch (e) {
            return null;
        }
    }
    
    static clearCache(): void {
        this.regexCache.clear();
    }
    
    static getCacheSize(): number {
        return this.regexCache.size;
    }
}

/**
 * Validates parsed date parts to ensure they are within valid ranges.
 * @param dateParts Object containing parsed date components
 * @returns true if all parts are valid, false otherwise
 */
function validateDateParts(dateParts: { [key: string]: string }): boolean {
    // Validate month
    const month = parseInt(dateParts.MM || dateParts.M || '1');
    if (month < 1 || month > 12) return false;

    // Validate day
    const day = parseInt(dateParts.DD || dateParts.D || '1');
    if (day < 1 || day > 31) return false;

    // Validate hour
    const hour = parseInt(dateParts.HH || dateParts.H || '0');
    if (hour < 0 || hour > 23) return false;

    // Validate minutes
    const minute = parseInt(dateParts.mm || dateParts.m || '0');
    if (minute < 0 || minute > 59) return false;

    // Validate seconds
    const second = parseInt(dateParts.ss || dateParts.s || '0');
    if (second < 0 || second > 59) return false;

    // Validate milliseconds
    if (dateParts.SSS) {
        const ms = parseInt(dateParts.SSS);
        if (ms < 0 || ms > 999) return false;
    }
    if (dateParts.SS) {
        const cs = parseInt(dateParts.SS);
        if (cs < 0 || cs > 99) return false;
    }
    if (dateParts.S) {
        const ds = parseInt(dateParts.S);
        if (ds < 0 || ds > 9) return false;
    }

    return true;
}

// Global variable to allow dependency injection in tests
let getCurrentDateFn = () => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate()
    };
};

// Function to inject a custom date function (useful for tests)
export const setCurrentDateFunction = (fn: () => { year: number; month: number; day: number }) => {
    getCurrentDateFn = fn;
};

// Function to restore the default date function
export const resetCurrentDateFunction = () => {
    getCurrentDateFn = () => {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate()
        };
    };
};

/**
 * Helper function that converts a string and its format into an ISO 8601 string.
 * The ISO format is the most robust for `Temporal` to parse.
 * @returns A string in ISO 8601 format or `null` if parsing fails.
 */
function parseToISO(dateString: string, formatString: string): string | null {
    // Early validation for empty inputs
    if (!dateString.trim() || !formatString.trim()) {
        return null;
    }

    // Handle special format Hmm
    if (formatString === 'Hmm') {
        const match = dateString.match(/^(\d{1,2})(\d{2})$/);
        if (!match) return null;
        
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return null;
        }
        
        const current = getCurrentDateFn();
        return `${current.year.toString().padStart(4, '0')}-${current.month.toString().padStart(2, '0')}-${current.day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000`;
    }

    // Usar el cache para obtener la expresión regular y los tokens
    const cachedFormat = FormatCache.getRegexForFormat(formatString);
    if (!cachedFormat) {
        return null; // Error al generar la expresión regular
    }
    
    const { regex: valueRegex, tokens: formatTokens } = cachedFormat;
    const values = dateString.match(valueRegex);

    if (!values) {
        return null;
    }

    const dateParts: { [key: string]: string } = {};
    formatTokens.forEach((token, index) => {
        // values[0] is the full match, so captured groups start at index 1.
        dateParts[token] = values[index + 1];
    });

    // Improved range validation
    if (!validateDateParts(dateParts)) {
        return null;
    }

    const current = getCurrentDateFn();

    // Better handling of 2-digit years with smarter logic
    let year: number;
    if (dateParts.YYYY) {
        year = parseInt(dateParts.YYYY);
    } else if (dateParts.YY) {
        const twoDigitYear = parseInt(dateParts.YY);
        // Years 00-68 -> 2000-2068, years 69-99 -> 1969-1999 (Y2K standard)
        year = twoDigitYear <= 68 ? 2000 + twoDigitYear : 1900 + twoDigitYear;
    } else {
        year = current.year;
    }

    const month = dateParts.MM ? parseInt(dateParts.MM) : (dateParts.M ? parseInt(dateParts.M) : current.month);
    const day = dateParts.DD ? parseInt(dateParts.DD) : (dateParts.D ? parseInt(dateParts.D) : current.day);
    const hour = dateParts.HH ? parseInt(dateParts.HH) : (dateParts.H ? parseInt(dateParts.H) : 0);
    const minute = dateParts.mm ? parseInt(dateParts.mm) : (dateParts.m ? parseInt(dateParts.m) : 0);
    const second = dateParts.ss ? parseInt(dateParts.ss) : (dateParts.s ? parseInt(dateParts.s) : 0);
    
    // Improved support for milliseconds
    let milliseconds = 0;
    if (dateParts.SSS) {
        milliseconds = parseInt(dateParts.SSS);
    } else if (dateParts.SS) {
        milliseconds = parseInt(dateParts.SS) * 10;
    } else if (dateParts.S) {
        milliseconds = parseInt(dateParts.S) * 100;
    }

    return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
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
    
    // Exponer métodos para gestionar el cache (útil para pruebas)
    (atemporal as any).clearFormatCache = function() {
        FormatCache.clearCache();
    };
    
    (atemporal as any).getFormatCacheSize = function() {
        return FormatCache.getCacheSize();
    };
};

export default customParseFormatPlugin;