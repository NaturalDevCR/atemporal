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
     * Gets the localized short time zone name (e.g., "EST", "GMT-5").
     * @internal
     */
    static getShortTimeZoneName(zdt: Temporal.ZonedDateTime, locale = TemporalUtils._defaultLocale): string {
        try {
            const formatter = new Intl.DateTimeFormat(locale, {
                timeZone: zdt.timeZoneId,
                timeZoneName: 'short',
            });
            // Convert Instant to milliseconds, which is what `formatToParts` expects.
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
    static getLongTimeZoneName(zdt: Temporal.ZonedDateTime, locale = TemporalUtils._defaultLocale): string {
        try {
            const formatter = new Intl.DateTimeFormat(locale, {
                timeZone: zdt.timeZoneId,
                timeZoneName: 'long',
            });
            // Convert Instant to milliseconds, which is what `formatToParts` expects.
            const parts = formatter.formatToParts(zdt.toInstant().epochMilliseconds);
            const tzPart = parts.find(p => p.type === 'timeZoneName');
            return tzPart?.value || zdt.timeZoneId;
        } catch {
            return zdt.timeZoneId;
        }
    }

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

        // Handle Firebase Timestamp-like objects: { seconds, nanoseconds }
        // This check is specific and must come before the generic object check.
        if (typeof input === 'object' && input !== null && 'seconds' in input && 'nanoseconds' in input) {
            try {
                const { seconds, nanoseconds } = input as { seconds: number; nanoseconds: number };
                // FIX: Use `fromEpochNanoseconds` with BigInt for precision and compatibility.
                const totalNanoseconds = BigInt(seconds) * 1_000_000_000n + BigInt(nanoseconds);
                const instant = Temporal.Instant.fromEpochNanoseconds(totalNanoseconds);
                return instant.toZonedDateTimeISO(tz);
            } catch (e) {
                throw new InvalidDateError(`Invalid Firebase Timestamp object: ${JSON.stringify(input)}`);
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
}