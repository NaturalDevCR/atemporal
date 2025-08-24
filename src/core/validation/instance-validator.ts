/**
 * @file Centralized validation utilities for temporal instances
 * Provides consistent validation patterns across the library.
 */

import { Temporal } from '@js-temporal/polyfill';

/**
 * Centralized validation utility for temporal instances and inputs.
 * Provides consistent validation patterns across the library.
 * @internal
 */
export class InstanceValidator {
    /**
     * Checks if a ZonedDateTime instance is valid.
     * @param datetime - The ZonedDateTime instance to validate
     * @returns True if the instance is valid
     */
    static isValidZonedDateTime(datetime: Temporal.ZonedDateTime | null | undefined): boolean {
        if (!datetime) return false;
        
        try {
            // Check if the instance has valid properties
            return (
                typeof datetime.year === 'number' &&
                typeof datetime.month === 'number' &&
                typeof datetime.day === 'number' &&
                !isNaN(datetime.epochMilliseconds)
            );
        } catch {
            return false;
        }
    }

    /**
     * Checks if a date input is valid and can be parsed.
     * @param input - The input to validate
     * @returns True if the input can be parsed into a valid date
     */
    static isValidDateInput(input: any): boolean {
        if (input === null || input === undefined) return false;
        
        try {
            // Check for common valid input types
            if (typeof input === 'string' && input.trim() === '') return false;
            if (typeof input === 'number' && !isFinite(input)) return false;
            if (input instanceof Date && isNaN(input.getTime())) return false;
            
            // For objects, try to access common methods that might throw
            if (typeof input === 'object' && input !== null && !(input instanceof Date)) {
                // Try to call toString() to check if the object throws
                input.toString();
            }
            
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates a timezone identifier.
     * @param timeZone - The timezone identifier to validate
     * @returns True if the timezone is valid
     */
    static isValidTimeZone(timeZone: string): boolean {
        try {
            // First try Intl.supportedValuesOf to validate timezone
            const supportedTimeZones = Intl.supportedValuesOf('timeZone');
            if (supportedTimeZones.includes(timeZone)) {
                return true;
            }
        } catch {
            // supportedValuesOf not available, skip to fallback
        }
        
        // Fallback validation using Intl.DateTimeFormat
        // This handles cases like 'UTC' which may not be in supportedValuesOf
        try {
            new Intl.DateTimeFormat('en', { timeZone });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates a locale string.
     * @param locale - The locale string to validate
     * @returns True if the locale is valid
     */
    static isValidLocale(locale: string): boolean {
        if (!locale || locale.trim() === '') return false;
        
        try {
            // Create a DateTimeFormat and check if the resolved locale matches the input
            const formatter = new Intl.DateTimeFormat(locale);
            const resolvedLocale = formatter.resolvedOptions().locale;
            
            // If the input locale is significantly different from resolved locale,
            // it means the input was invalid and fell back to default
            const normalizedInput = locale.toLowerCase().replace(/_/g, '-');
            const normalizedResolved = resolvedLocale.toLowerCase().replace(/_/g, '-');
            
            // Check if the resolved locale starts with the input locale
            // This handles cases like 'en' resolving to 'en-US'
            return normalizedResolved.startsWith(normalizedInput) || 
                   normalizedInput.startsWith(normalizedResolved.split('-')[0]);
        } catch {
            return false;
        }
    }

    /**
     * Checks if a value is a valid number (not NaN or infinite).
     * @param value - The value to check
     * @returns True if the value is a valid finite number
     */
    static isValidNumber(value: any): boolean {
        return typeof value === 'number' && isFinite(value);
    }

    /**
     * Validates a time unit string.
     * @param unit - The time unit to validate
     * @returns True if the unit is valid
     */
    static isValidTimeUnit(unit: string): boolean {
        const validUnits = [
            'year', 'years',
            'month', 'months', 
            'week', 'weeks',
            'day', 'days',
            'hour', 'hours',
            'minute', 'minutes',
            'second', 'seconds',
            'millisecond', 'milliseconds'
        ];
        
        return validUnits.includes(unit);
    }

    /**
     * Validates an inclusivity string for range operations.
     * @param inclusivity - The inclusivity string to validate
     * @returns True if the inclusivity string is valid
     */
    static isValidInclusivity(inclusivity: string): boolean {
        const validInclusivities = ['()', '[]', '(]', '[)'];
        return validInclusivities.includes(inclusivity);
    }
}