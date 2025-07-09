/**
 * @file This file provides a collection of low-level, static utility functions
 * for creating and manipulating Temporal objects. It serves as the internal
 * engine for the atemporal library, handling parsing, formatting, and comparisons.
 */

import { Temporal } from '@js-temporal/polyfill';
import type { DateInput, TimeUnit } from './types';

export class TemporalUtils {
    // Private static properties to hold the global default settings.
    private static _defaultTimeZone = 'UTC';
    private static _defaultLocale = 'en-US';

    /**
     * Sets the default locale for all new atemporal instances. Used for formatting.
     */
    static setDefaultLocale(code: string) {
        TemporalUtils._defaultLocale = code;
    }

    /**
     * Gets the currently configured default locale.
     */
    static getDefaultLocale(): string {
        return TemporalUtils._defaultLocale;
    }

    /**
     * Sets the default IANA time zone for all new atemporal instances.
     * It validates the time zone identifier before setting it.
     */
    static setDefaultTimeZone(tz: string) {
        try {
            // Validate the time zone by attempting to use it in a formatter.
            // This is the standard way to check if a time zone is supported.
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            TemporalUtils._defaultTimeZone = tz;
        } catch (e) {
            throw new Error(`Invalid time zone: ${tz}`);
        }
    }

    /**
     * Gets the currently configured default time zone.
     */
    static get defaultTimeZone() {
        return TemporalUtils._defaultTimeZone;
    }

    /**
     * The core parsing engine. Converts any valid DateInput into a Temporal.ZonedDateTime object.
     * This function is designed to be robust and handle various input formats.
     */
    static from(input: DateInput, timeZone: string = TemporalUtils.defaultTimeZone): Temporal.ZonedDateTime {
        // Duck-typing check for an atemporal instance.
        // This is more robust than `instanceof` across different module contexts.
        if (typeof input === 'object' && input !== null && 'raw' in input) {
            // It's a TemporalWrapper, so we can access its internal .raw property.
            return (input as any).raw;
        }

        if (input instanceof Temporal.ZonedDateTime) {
            return input.withTimeZone(timeZone);
        }
        if (input instanceof Temporal.PlainDateTime) {
            return input.toZonedDateTime(timeZone);
        }
        if (input instanceof Date) {
            return Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(timeZone);
        }
        if (typeof input === 'string') {
            try {
                // First, attempt to parse as a ZonedDateTime (expects offset/timezone info).
                return Temporal.ZonedDateTime.from(input).withTimeZone(timeZone);
            } catch (e) {
                // If that fails, it might be a plain string without timezone info.
                try {
                    const plainDateTime = Temporal.PlainDateTime.from(input);
                    return plainDateTime.toZonedDateTime(timeZone);
                } catch (e2) {
                    // If both attempts fail, the string is invalid.
                    throw new Error(`Invalid date string: ${input}`);
                }
            }
        }
        // If the input type is not supported, throw an error.
        throw new Error('Unsupported date input');
    }

    /**
     * Converts a Temporal.ZonedDateTime object back to a legacy JavaScript Date.
     */
    static toDate(temporal: Temporal.ZonedDateTime): Date {
        return new Date(temporal.epochMilliseconds);
    }

    /**
     * Calculates the difference between two dates in a specified unit.
     */
    static diff(a: DateInput, b: DateInput, unit: TimeUnit = 'millisecond'): number {
        const d1 = TemporalUtils.from(a);
        const d2 = TemporalUtils.from(b);

        // The `total` method requires a more specific unit type than our `TimeUnit`.
        // We use a type assertion to satisfy TypeScript.
        type TotalUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
        return d1.since(d2).total({ unit: unit as TotalUnit, relativeTo: d1 });
    }

    /**
     * Checks if date `a` is before date `b`.
     */
    static isBefore(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === -1;
    }

    /**
     * Checks if date `a` is after date `b`.
     */
    static isAfter(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === 1;
    }

    /**
     * Checks if a date `a` is between two other dates, `b` and `c`.
     * This is the low-level implementation.
     */
    static isBetween(a: DateInput, b: DateInput, c: DateInput, inclusivity: '()' | '[]' | '(]' | '[)' = '[]'): boolean {
        const date = TemporalUtils.from(a);
        const start = TemporalUtils.from(b);
        const end = TemporalUtils.from(c);

        // Compare returns -1 (a < b), 0 (a === b), or 1 (a > b)
        const compareWithStart = Temporal.ZonedDateTime.compare(date, start);
        const compareWithEnd = Temporal.ZonedDateTime.compare(date, end);

        const isAfterStart = inclusivity[0] === '['
            ? compareWithStart >= 0 // a >= start
            : compareWithStart > 0;  // a > start

        const isBeforeEnd = inclusivity[1] === ']'
            ? compareWithEnd <= 0 // a <= end
            : compareWithEnd < 0;   // a < end

        return isAfterStart && isBeforeEnd;
    }

    /**
     * Checks if date `a` is the same instant in time as date `b`.
     */
    static isSame(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) === 0;
    }

    /**
     * Checks if date `a` is on the same calendar day as date `b`, ignoring time and timezone.
     */
    static isSameDay(a: DateInput, b: DateInput): boolean {
        return TemporalUtils.from(a).toPlainDate().equals(TemporalUtils.from(b).toPlainDate());
    }

    /**
     * Checks if a given input can be parsed into a valid date without throwing an error.
     * This is used for the static `atemporal.isValid()` method.
     */
    static isValid(input: any): boolean {
        try {
            // Attempt to process the input with our main parsing function.
            // If it doesn't throw, the input is considered valid.
            TemporalUtils.from(input);
            return true;
        } catch (e) {
            // If `from` throws any error, the input is invalid.
            return false;
        }
    }
}