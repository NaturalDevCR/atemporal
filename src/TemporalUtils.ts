/**
 * @file This file provides a collection of low-level, static utility functions
 * for creating and manipulating Temporal objects. It serves as the internal
 * engine for the atemporal library, handling parsing, formatting, and comparisons.
 */

import { Temporal } from '@js-temporal/polyfill';
import type { DateInput, TimeUnit, PlainDateTimeObject } from './types';
import { InvalidTimeZoneError, InvalidDateError } from './errors';

// Variable to hold the start of the week setting. Default to 1 (Monday) for ISO 8601 compliance.
let weekStart = 1;

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
            throw new InvalidTimeZoneError(`Invalid time zone: ${tz}`);
        }
    }

    /**
     * Gets the currently configured default time zone.
     */
    static get defaultTimeZone() {
        return TemporalUtils._defaultTimeZone;
    }

    /**
     * The core parsing engine, rewritten for clarity and robustness.
     * Each input type is handled in a self-contained block that returns directly.
     * The string parsing logic is now more defensive.
     */
    static from(input?: DateInput, timeZone?: string): Temporal.ZonedDateTime {
        const tz = timeZone || TemporalUtils.defaultTimeZone;

        if (input === undefined || input === null) {
            return Temporal.Now.zonedDateTimeISO(tz);
        }

        // Handle objects that are already Temporal types or our wrapper
        if (input instanceof Temporal.ZonedDateTime) {
            return timeZone && input.timeZoneId !== timeZone ? input.withTimeZone(timeZone) : input;
        }
        if (typeof input === 'object' && 'raw' in input && (input as any).raw instanceof Temporal.ZonedDateTime) {
            const raw = (input as any).raw as Temporal.ZonedDateTime;
            return timeZone && raw.timeZoneId !== timeZone ? raw.withTimeZone(timeZone) : raw;
        }
        if (input instanceof Temporal.PlainDateTime) {
            return input.toZonedDateTime(tz);
        }

        // Handle standard JavaScript Date
        if (input instanceof Date) {
            return Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO(tz);
        }

        // Handle Firebase Timestamp instances or compatible objects.
        // This is the most reliable check: a real Firebase Timestamp has these properties and methods.
        if (
            typeof input === 'object' &&
            input !== null &&
            'seconds' in input &&
            'nanoseconds' in input &&
            typeof (input as any).toDate === 'function'
        ) {
            try {
                // Use Firebase's own .toDate() method for perfect accuracy, then convert.
                const jsDate = (input as any).toDate();
                return Temporal.Instant.fromEpochMilliseconds(jsDate.getTime()).toZonedDateTimeISO(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid Firebase Timestamp object: ${JSON.stringify(input)}`);
            }
        }

        // Handle plain objects that mimic a Firebase Timestamp (e.g., from JSON).
        if (
            typeof input === 'object' &&
            input !== null &&
            'seconds' in input &&
            'nanoseconds' in input &&
            !('year' in input) // Differentiates from a PlainDateTimeObject
        ) {
            try {
                const { seconds, nanoseconds } = input as { seconds: number; nanoseconds: number };
                const totalNanoseconds = BigInt(seconds) * 1_000_000_000n + BigInt(nanoseconds);
                const instant = Temporal.Instant.fromEpochNanoseconds(totalNanoseconds);
                return instant.toZonedDateTimeISO(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid Firebase-like Timestamp object: ${JSON.stringify(input)}`);
            }
        }

        // Handle Array inputs: [YYYY, MM, DD, hh, mm, ss]
        if (Array.isArray(input)) {
            const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0] = input;
            try {
                // --- FIX: Add overflow: 'reject' to enforce strict validation ---
                const pdt = Temporal.PlainDateTime.from({ year, month, day, hour, minute, second, millisecond }, { overflow: 'reject' });
                return pdt.toZonedDateTime(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid date array: [${input.join(', ')}]`);
            }
        }

        // Handle Object inputs: { year: YYYY, month: MM, ... }
        // This check is carefully placed to not catch other object types like Date or our wrapper.
        if (typeof input === 'object' && 'year' in input) {
            try {
                // --- FIX: Add overflow: 'reject' to enforce strict validation ---
                const pdt = Temporal.PlainDateTime.from(input as PlainDateTimeObject, { overflow: 'reject' });
                return pdt.toZonedDateTime(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid date object: ${JSON.stringify(input)}`);
            }
        }



        // Handle string inputs with a more robust strategy
        if (typeof input === 'string') {
            try {
                // STRATEGY 1: Try parsing as an Instant. This is the most robust way for
                // full ISO strings that contain timezone information (like 'Z' or offsets).
                const instant = Temporal.Instant.from(input);

                // Detect explicit offset in the string
                const offsetMatch = input.match(/([+-]\d{2}:\d{2})/);
                const hasOffset = offsetMatch !== null;

                if (hasOffset && !timeZone) {
                    const offset = offsetMatch![1];
                    return instant.toZonedDateTimeISO(offset);
                }

                return instant.toZonedDateTimeISO(tz);
            } catch (e) {
                try {
                    // STRATEGY 2: If it's not an Instant, it might be a "plain" date string
                    // without timezone info (e.g., "2023-10-27 10:00:00").
                    const pdt = Temporal.PlainDateTime.from(input);
                    return pdt.toZonedDateTime(tz);
                } catch (e2) {
                    // If both parsing attempts fail, the string is truly invalid.
                    throw new InvalidDateError(`Invalid date string: ${input}`);
                }
            }
        }

        // Handle number inputs (as epoch milliseconds)
        if (typeof input === 'number') {
            return Temporal.Instant.fromEpochMilliseconds(input).toZonedDateTimeISO(tz);
        }

        // If the input type is none of the above, it's unsupported.
        throw new InvalidDateError(`Unsupported date input type: ${typeof input}`);
    }

    /**
     * Converts a Temporal.ZonedDateTime object back to a legacy JavaScript Date.
     */
    static toDate(temporal: Temporal.ZonedDateTime): Date {
        return new Date(temporal.epochMilliseconds);
    }

    /**
     * Sets the global start of the week.
     * @param day - The day to set as the start of the week (0 for Sunday, 1 for Monday, etc.).
     */
    static setWeekStartsOn(day: 0 | 1 | 2 | 3 | 4 | 5 | 6): void {
        if (day >= 0 && day <= 6) {
            weekStart = day;
        }
    }

    /**
     * Gets the currently configured start of the week.
     * @returns The start of the week (0 for Sunday, 1 for Monday, etc.).
     */
    static getWeekStartsOn(): number {
        return weekStart;
    }

    /**
     * Calculates the difference between two dates in a specified unit.
     */
    static diff(a: DateInput, b: DateInput, unit: TimeUnit = 'millisecond'): number {
        const d1 = TemporalUtils.from(a);
        const d2 = TemporalUtils.from(b);

        type TotalUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

        // Use the robust `since().total()` method for ALL units for calendar-aware accuracy.
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
     * Checks if date `a` is the same as or before date `b`.
     */
    static isSameOrBefore(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) <= 0;
    }

    /**
     * Checks if date `a` is the same as or after date `b`.
     */
    static isSameOrAfter(a: DateInput, b: DateInput): boolean {
        return Temporal.ZonedDateTime.compare(TemporalUtils.from(a), TemporalUtils.from(b)) >= 0;
    }

    /**
     * Checks if date `a` is on the same calendar day as date `b`, ignoring time and timezone.
     */
    static isSameDay(a: DateInput, b: DateInput): boolean {
        return TemporalUtils.from(a).toPlainDate().equals(TemporalUtils.from(b).toPlainDate());
    }
}


/**
 * Cache for Intl objects to improve performance by avoiding repeated instantiation.
 * @internal
 */
class IntlCache {
    private static dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
    private static relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();
    private static numberFormatters = new Map<string, Intl.NumberFormat>();
    private static listFormatters = new Map<string, Intl.ListFormat>();

    /**
     * Gets a cached DateTimeFormat instance or creates a new one.
     */
    static getDateTimeFormatter(locale: string, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        if (!this.dateTimeFormatters.has(key)) {
            this.dateTimeFormatters.set(key, new Intl.DateTimeFormat(locale, options));
        }
        return this.dateTimeFormatters.get(key)!;
    }

    /**
     * Gets a cached RelativeTimeFormat instance or creates a new one.
     */
    static getRelativeTimeFormatter(locale: string, options: Intl.RelativeTimeFormatOptions = {}): Intl.RelativeTimeFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        if (!this.relativeTimeFormatters.has(key)) {
            this.relativeTimeFormatters.set(key, new Intl.RelativeTimeFormat(locale, options));
        }
        return this.relativeTimeFormatters.get(key)!;
    }

    /**
     * Gets a cached NumberFormat instance or creates a new one.
     */
    static getNumberFormatter(locale: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        if (!this.numberFormatters.has(key)) {
            this.numberFormatters.set(key, new Intl.NumberFormat(locale, options));
        }
        return this.numberFormatters.get(key)!;
    }

    /**
     * Gets a cached ListFormat instance or creates a new one.
     */
    static getListFormatter(locale: string, options: Intl.ListFormatOptions = {}): Intl.ListFormat {
        const key = `${locale}-${JSON.stringify(options)}`;
        if (!this.listFormatters.has(key)) {
            this.listFormatters.set(key, new Intl.ListFormat(locale, options));
        }
        return this.listFormatters.get(key)!;
    }

    /**
     * Clears all caches. Useful for testing or memory management.
     */
    static clearAll(): void {
        this.dateTimeFormatters.clear();
        this.relativeTimeFormatters.clear();
        this.numberFormatters.clear();
        this.listFormatters.clear();
    }

    /**
     * Gets cache statistics for monitoring.
     */
    static getStats() {
        return {
            dateTimeFormatters: this.dateTimeFormatters.size,
            relativeTimeFormatters: this.relativeTimeFormatters.size,
            numberFormatters: this.numberFormatters.size,
            listFormatters: this.listFormatters.size,
            total: this.dateTimeFormatters.size + this.relativeTimeFormatters.size + 
                   this.numberFormatters.size + this.listFormatters.size
        };
    }
}

// Exportar la clase para uso en plugins
export { IntlCache };