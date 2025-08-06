/**
 * @file This plugin adds the ability to parse a date from a string
 * that follows a specific format, similar to `customParseFormat` from Day.js.
 */

import { Temporal } from '@js-temporal/polyfill';
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
    // Longer tokens first to prevent conflicts
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
    
    // 12-hour format and AM/PM
    hh: '(0[1-9]|1[0-2])',        // Hours 01-12
    h: '([1-9]|1[0-2])',          // Hours 1-12
    A: '(AM|PM)',                 // AM/PM uppercase
    a: '(am|pm)',                 // am/pm lowercase
    
    // Day of year
    DDD: '(00[1-9]|0[1-9]\\d|[12]\\d\\d|3[0-5]\\d|36[0-6])', // Day of year 001-366
    DDDD: '([1-9]|[1-9]\\d|[12]\\d\\d|3[0-5]\\d|36[0-6])',    // Day of year 1-366
    
    // Week-based tokens (commented out for now - require complex implementation)
    // ww: '(0[1-9]|[1-4]\\d|5[0-3])', // Week of year 01-53
    // w: '([1-9]|[1-4]\\d|5[0-3])',   // Week of year 1-53
    // dd: '(0[0-6])',               // Day of week 00-06
    // d: '([0-6])',                 // Day of week 0-6
    
    // Month names
    MMMM: '(January|February|March|April|May|June|July|August|September|October|November|December)',
    MMM: '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)',
};

// Order tokens by length (longer ones first) to avoid parsing conflicts
import { RegexCache } from '../RegexCache';

// Usar las expresiones regulares precompiladas
const tokenRegex = RegexCache.getPrecompiled('customFormatTokenRegex')!;

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
            const escapeRegexChars = RegexCache.getPrecompiled('escapeRegexChars')!;
            const safeFormatString = formatString.replace(escapeRegexChars, '\\$&');
            
            // Add debug logging
            console.log('Debug - Format string:', formatString);
            console.log('Debug - Safe format string:', safeFormatString);
            
            const tokenRegexPattern = RegexCache.getPrecompiled('customFormatTokenRegex')!;
            
            // Build the regex pattern for the format
            const regexString = safeFormatString.replace(tokenRegexPattern, (match, literal) => {
                // If this is a bracketed literal, return the literal content without escaping
                if (literal) {
                    console.log('Debug - Literal found:', literal);
                    // Remove all backslashes used for escaping
                    return literal.replace(/\\/g, '');
                }
                
                // Otherwise, it's a token - replace with regex pattern
                formatTokens.push(match);
                console.log('Debug - Token found:', match, '-> Regex:', tokenMap[match]);
                return tokenMap[match];
            });
            
            console.log('Debug - Regex string before flexible whitespace:', regexString);
            console.log('Debug - Format tokens:', formatTokens);
    
            // The regex is anchored to ensure the entire string must match the format.
            // Allow flexible whitespace matching by replacing spaces with \s+
            const flexibleRegexString = regexString.replace(/ /g, '\\s+');
            console.log('Debug - Flexible regex string:', flexibleRegexString);
            
            const valueRegex = new RegExp(`^${flexibleRegexString}$`);
            console.log('Debug - Final regex:', valueRegex);
            
            const entry = { regex: valueRegex, tokens: formatTokens };
            this.regexCache.set(formatString, entry);
            return entry;
        } catch (e) {
            console.log('Debug - Error in regex generation:', e);
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
/**
 * Enhanced validation function that uses Temporal API for accurate date validation
 * including proper leap year and month-specific day validation
 * @param dateParts - Parsed date components
 * @param formatString - Original format string for error context
 * @param dateString - Original date string for error context
 * @returns boolean indicating if the date parts are valid
 */
function validateDateParts(
    dateParts: { [key: string]: string }, 
    formatString: string, 
    dateString: string
): boolean {
    try {
        // Get current date for missing components
        const current = getCurrentDateFn();
        
        // Parse and validate year
        let year = current.year;
        if (dateParts.YYYY) {
            year = parseInt(dateParts.YYYY, 10);
        } else if (dateParts.YY) {
            const twoDigitYear = parseInt(dateParts.YY, 10);
            year = twoDigitYear <= 68 ? 2000 + twoDigitYear : 1900 + twoDigitYear;
        }
        
        // Parse and validate month
        let month = current.month;
        if (dateParts.MM || dateParts.M) {
            month = parseInt(dateParts.MM || dateParts.M, 10);
        } else if (dateParts.MMMM || dateParts.MMM) {
            const monthName = dateParts.MMMM || dateParts.MMM;
            const monthFromName = getMonthFromName(monthName);
            if (!monthFromName) return false;
            month = monthFromName;
        }
        
        // Parse and validate day
        let day = current.day;
        if (dateParts.DD || dateParts.D) {
            day = parseInt(dateParts.DD || dateParts.D, 10);
        } else if (dateParts.DDD || dateParts.DDDD) {
            // Handle day of year
            const dayOfYear = parseInt(dateParts.DDD || dateParts.DDDD, 10);
            const dayFromDayOfYear = getDayFromDayOfYear(dayOfYear, year);
            if (!dayFromDayOfYear) return false;
            month = dayFromDayOfYear.month;
            day = dayFromDayOfYear.day;
        }
        
        // Parse and validate hour (24-hour format)
        let hour = 0;
        if (dateParts.HH || dateParts.H) {
            hour = parseInt(dateParts.HH || dateParts.H, 10);
        } else if (dateParts.hh || dateParts.h) {
            // 12-hour format
            hour = parseInt(dateParts.hh || dateParts.h, 10);
            const ampm = dateParts.A || dateParts.a;
            if (!ampm) return false; // AM/PM is required with 12-hour format
            
            // Convert to 24-hour format
            if (hour === 12) {
                hour = ampm.toUpperCase() === 'AM' ? 0 : 12;
            } else {
                hour = ampm.toUpperCase() === 'PM' ? hour + 12 : hour;
            }
        }
        
        // Parse and validate minute
        let minute = 0;
        if (dateParts.mm || dateParts.m) {
            minute = parseInt(dateParts.mm || dateParts.m, 10);
        }
        
        // Parse and validate second
        let second = 0;
        if (dateParts.ss || dateParts.s) {
            second = parseInt(dateParts.ss || dateParts.s, 10);
        }
        
        // Parse and validate millisecond
        let millisecond = 0;
        if (dateParts.SSS) {
            millisecond = parseInt(dateParts.SSS, 10);
        } else if (dateParts.SS) {
            millisecond = parseInt(dateParts.SS, 10) * 10;
        } else if (dateParts.S) {
            millisecond = parseInt(dateParts.S, 10) * 100;
        }
        
        // Validate ranges
        if (hour < 0 || hour > 23) return false;
        if (minute < 0 || minute > 59) return false;
        if (second < 0 || second > 59) return false;
        if (millisecond < 0 || millisecond > 999) return false;
        
        // Use Temporal API for accurate date validation
        Temporal.PlainDate.from({ year, month, day });
        
        return true;
    } catch {
        return false;
    }
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
    const cachedFormat = FormatCache.getRegexForFormat(formatString);
    if (!cachedFormat) {
        console.log('Failed to generate regex for format:', formatString);
        return null;
    }

    const { regex: valueRegex, tokens: formatTokens } = cachedFormat;
    console.log('Generated regex:', valueRegex);
    console.log('Format tokens:', formatTokens);
    console.log('Testing string:', dateString);
    
    const values = dateString.match(valueRegex);
    console.log('Match result:', values);

    if (!values) {
        console.log('Regex match failed');
        return null;
    }

    const dateParts: { [key: string]: string } = {};
    formatTokens.forEach((token, index) => {
        // values[0] is the full match, so captured groups start at index 1.
        dateParts[token] = values[index + 1];
    });

    // Improved range validation - Fixed: Added missing parameters
    if (!validateDateParts(dateParts, formatString, dateString)) {
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

    // Handle month parsing (numeric or name-based)
    let month: number;
    if (dateParts.MM) {
        month = parseInt(dateParts.MM);
    } else if (dateParts.M) {
        month = parseInt(dateParts.M);
    } else if (dateParts.MMMM) {
        const monthFromName = getMonthFromName(dateParts.MMMM);
        if (monthFromName === null) return null;
        month = monthFromName;
    } else if (dateParts.MMM) {
        const monthFromName = getMonthFromName(dateParts.MMM);
        if (monthFromName === null) return null;
        month = monthFromName;
    } else {
        month = current.month;
    }

    // Handle day parsing (regular day or day-of-year)
    let day: number;
    if (dateParts.DD) {
        day = parseInt(dateParts.DD);
    } else if (dateParts.D) {
        day = parseInt(dateParts.D);
    } else if (dateParts.DDD) {
        const dayOfYear = parseInt(dateParts.DDD);
        const dayFromDayOfYear = getDayFromDayOfYear(dayOfYear, year);
        if (dayFromDayOfYear === null) return null;
        month = dayFromDayOfYear.month;
        day = dayFromDayOfYear.day;
    } else if (dateParts.DDDD) {
        const dayOfYear = parseInt(dateParts.DDDD);
        const dayFromDayOfYear = getDayFromDayOfYear(dayOfYear, year);
        if (dayFromDayOfYear === null) return null;
        month = dayFromDayOfYear.month;
        day = dayFromDayOfYear.day;
    } else {
        day = current.day;
    }

    // Handle hour parsing (24-hour or 12-hour format)
    let hour: number;
    if (dateParts.HH) {
        hour = parseInt(dateParts.HH);
    } else if (dateParts.H) {
        hour = parseInt(dateParts.H);
    } else if (dateParts.hh || dateParts.h) {
        // 12-hour format
        let hour12 = dateParts.hh ? parseInt(dateParts.hh) : parseInt(dateParts.h);
        const ampm = dateParts.A || dateParts.a;
        
        if (!ampm) {
            // 12-hour format requires AM/PM
            return null;
        }
        
        // Convert 12-hour to 24-hour format
        if (ampm.toLowerCase() === 'am') {
            hour = hour12 === 12 ? 0 : hour12;
        } else { // PM
            hour = hour12 === 12 ? 12 : hour12 + 12;
        }
    } else {
        hour = 0;
    }

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

/**
 * Helper function to convert month names to month numbers
 * @param monthName - Full or abbreviated month name
 * @returns Month number (1-12) or null if invalid
 */
function getMonthFromName(monthName: string): number | null {
    const monthMap: { [key: string]: number } = {
        // Full names
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12,
        // Abbreviated names
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 
        'Jun': 6, 'Jul': 7, 'Aug': 8,
        'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    return monthMap[monthName] || null;
}

/**
 * Helper function to get day and month from day of year
 * @param dayOfYear - Day of year (1-366)
 * @param year - Year for leap year calculation
 * @returns Object with month and day, or null if invalid
 */
function getDayFromDayOfYear(dayOfYear: number, year: number): { month: number; day: number } | null {
    try {
        // Validate day of year range first
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const maxDayOfYear = isLeapYear ? 366 : 365;
        
        if (dayOfYear < 1 || dayOfYear > maxDayOfYear) {
            return null;
        }
        
        // Use Temporal API to handle leap years correctly
        const date = Temporal.PlainDate.from({ year, month: 1, day: 1 }).add({ days: dayOfYear - 1 });
        return { month: date.month, day: date.day };
    } catch {
        return null;
    }
}