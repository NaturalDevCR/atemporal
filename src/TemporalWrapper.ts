/**
 * @file This file defines the TemporalWrapper class, which is the public-facing,
 * chainable, and immutable interface for the atemporal library. It wraps the
 * native Temporal.ZonedDateTime object to provide a more ergonomic API.
 */

import { Temporal } from '@js-temporal/polyfill';
import { TemporalUtils } from './TemporalUtils';
import type { DateInput, TimeUnit, SettableUnit, FormatTokenMap } from './types';

/**
 * Converts a library time unit to its plural form for the Temporal API.
 * @internal
 */
function getDurationUnit(unit: TimeUnit): string {
    if (unit === 'millisecond') return 'milliseconds';
    return `${unit}s`;
}

/**
 * Creates and caches a map of formatting tokens to their corresponding string values for a given instance.
 * @internal
 */
const formatReplacementsCache = new WeakMap<TemporalWrapper, FormatTokenMap>();

function createTokenReplacements(instance: TemporalWrapper, locale?: string): FormatTokenMap {
    if (formatReplacementsCache.has(instance)) {
        return formatReplacementsCache.get(instance)!;
    }
    const replacements: FormatTokenMap = {
        YYYY: () => instance.year.toString(),
        YY: () => instance.year.toString().slice(-2),
        MM: () => instance.month.toString().padStart(2, '0'),
        M: () => instance.month.toString(),
        DD: () => instance.day.toString().padStart(2, '0'),
        D: () => instance.day.toString(),
        HH: () => instance.hour.toString().padStart(2, '0'),
        H: () => instance.hour.toString(),
        mm: () => instance.minute.toString().padStart(2, '0'),
        m: () => instance.minute.toString(),
        ss: () => instance.second.toString().padStart(2, '0'),
        s: () => instance.second.toString(),
        SSS: () => instance.millisecond.toString().padStart(3, '0'),
        dddd: () => instance.dayOfWeekName,
        ddd: () => instance.raw.toLocaleString(locale || TemporalUtils.getDefaultLocale(), { weekday: 'short' }),
        // Timezone tokens
        Z: () => instance.raw.offset, // e.g., +01:00
        ZZ: () => instance.raw.offset.replace(':', ''), // e.g., +0100,
        z: () => instance.raw.timeZoneId,
    };
    formatReplacementsCache.set(instance, replacements);
    return replacements;
}

/**
 * The core class of the Atemporal library. It provides an immutable, chainable
 * API for date-time manipulation, wrapping a `Temporal.ZonedDateTime` object.
 */
export class TemporalWrapper {
    private readonly _datetime: Temporal.ZonedDateTime | null;
    private readonly _isValid: boolean;

    /**
     * The constructor is private to ensure all instances are created through
     * controlled static methods, which handle parsing and validation.
     * @private
     */
    private constructor(input: DateInput, timeZone?: string) {
        try {
            this._datetime = TemporalUtils.from(input, timeZone);
            this._isValid = true;
        } catch (e) {
            this._datetime = null;
            this._isValid = false;
        }
    }

    /**
     * Creates a new TemporalWrapper instance from a variety of inputs.
     * This is the primary static method for creating objects.
     * @param input - The date-time input. Can be a string, number, Date, or another TemporalWrapper.
     * @param tz - An optional IANA time zone string.
     * @returns A new TemporalWrapper instance.
     */
    static from(input: DateInput, tz?: string): TemporalWrapper {
        return new TemporalWrapper(input, tz);
    }

    /**
     * Creates a new TemporalWrapper instance from a Unix timestamp (seconds since epoch).
     * @param timestampInSeconds - The number of seconds since 1970-01-01T00:00:00Z.
     * @returns A new TemporalWrapper instance.
     */
    static unix(timestampInSeconds: number): TemporalWrapper {
        const timestampInMs = timestampInSeconds * 1000;
        return new TemporalWrapper(timestampInMs);
    }

    /**
     * Creates a new instance from an existing ZonedDateTime, bypassing the parsing logic for efficiency.
     * @internal
     */
    private static _fromZonedDateTime(dateTime: Temporal.ZonedDateTime): TemporalWrapper {
        const wrapper = Object.create(TemporalWrapper.prototype);
        wrapper._datetime = dateTime;
        wrapper._isValid = true;
        return wrapper;
    }

    /**
     * Clones the current instance with a new ZonedDateTime object.
     * @internal
     */
    private _cloneWith(newDateTime: Temporal.ZonedDateTime): TemporalWrapper {
        return TemporalWrapper._fromZonedDateTime(newDateTime);
    }

    /**
     * Checks if the Atemporal instance holds a valid date.
     * @returns `true` if the date is valid, `false` otherwise.
     */
    isValid(): boolean {
        return this._isValid;
    }

    /**
     * The "escape hatch" to the underlying `Temporal.ZonedDateTime` object.
     * Throws an error if the instance is invalid.
     * @throws {Error} If the instance is invalid.
     */
    get datetime(): Temporal.ZonedDateTime {
        if (!this.isValid() || !this._datetime) {
            throw new Error("Cannot perform operations on an invalid Atemporal object.");
        }
        return this._datetime;
    }

    /**
     * Returns a new instance with the time zone changed to the specified IANA time zone.
     * @param tz - The target IANA time zone string (e.g., 'America/New_York').
     * @returns A new TemporalWrapper instance in the new time zone.
     */
    timeZone(tz: string): TemporalWrapper {
        if (!this.isValid()) return this;
        return new TemporalWrapper(this.datetime.withTimeZone(tz));
    }

    /**
     * Returns a new instance with the specified amount of time added.
     * @param value - The number of units to add.
     * @param unit - The unit of time to add.
     * @returns A new TemporalWrapper instance.
     */
    add(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.add(duration);
        return this._cloneWith(newDate);
    }

    /**
     * Returns a new instance with the specified amount of time subtracted.
     * @param value - The number of units to subtract.
     * @param unit - The unit of time to subtract.
     * @returns A new TemporalWrapper instance.
     */
    subtract(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.subtract(duration);
        return this._cloneWith(newDate);
    }

    /**
     * Returns a new instance with a specific unit of time set to a new value.
     * @param unit - The unit of time to set.
     * @param value - The new value for the unit.
     * @returns A new TemporalWrapper instance.
     * @example atemporal().set('hour', 9); // Sets the hour to 9 AM.
     */
    set(unit: SettableUnit, value: number): TemporalWrapper {
        if (!this.isValid()) return this;
        const newDate = this.datetime.with({ [unit]: value });
        return this._cloneWith(newDate);
    }

    /**
     * Returns a new instance set to the start of a given unit of time.
     * Note: `startOf('week')` assumes the week starts on Monday (ISO 8601 standard).
     * @param unit - The unit to set to the start of.
     * @returns A new TemporalWrapper instance.
     */
    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        if (!this.isValid()) return this;
        switch (unit) {
            case 'year':
                return this._cloneWith(this.datetime.with({ month: 1, day: 1 }).startOfDay());
            case 'month':
                return this._cloneWith(this.datetime.with({ day: 1 }).startOfDay());
            case 'week':
                const daysToSubtract = this.datetime.dayOfWeek - 1;
                return this._cloneWith(this.datetime.subtract({ days: daysToSubtract }).startOfDay());
            case 'day':
                return this._cloneWith(this.datetime.startOfDay());
            case 'hour':
            case 'minute':
            case 'second':
                return this._cloneWith(this.datetime.round({ smallestUnit: unit, roundingMode: 'floor' }));
        }
    }

    /**
     * Returns a new instance set to the end of a given unit of time (e.g., 23:59:59.999).
     * @param unit - The unit to set to the end of.
     * @returns A new TemporalWrapper instance.
     */
    endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        if (!this.isValid()) return this;
        const start = this.startOf(unit);
        const nextStart = start.add(1, unit);
        return nextStart.subtract(1, 'millisecond');
    }

    /**
     * Creates a deep copy of the Atemporal instance.
     * @returns A new, identical TemporalWrapper instance.
     */
    clone(): TemporalWrapper {
        if (!this.isValid()) return this;
        return this._cloneWith(this.datetime);
    }

    /**
     * Gets the value of a specific unit of time.
     * @param unit - The unit to retrieve.
     * @returns The numeric value of the unit, or `NaN` if the instance is invalid.
     */
    get(unit: SettableUnit): number {
        if (!this.isValid()) return NaN;
        return this.datetime[unit];
    }

    // --- Getters ---
    /** The 4-digit year. */
    get year(): number { return this.isValid() ? this.datetime.year : NaN; }
    /** The month of the year (1-12). */
    get month(): number { return this.isValid() ? this.datetime.month : NaN; }
    /** The day of the month (1-31). */
    get day(): number { return this.isValid() ? this.datetime.day : NaN; }
    /** The full name of the day of the week (e.g., "Monday"), based on the default locale. */
    get dayOfWeekName(): string {
        if (!this.isValid()) return 'Invalid Date';
        return this.datetime.toLocaleString(TemporalUtils.getDefaultLocale(), { weekday: 'long' });
    }
    /** The hour of the day (0-23). */
    get hour(): number { return this.isValid() ? this.datetime.hour : NaN; }
    /** The minute of the hour (0-59). */
    get minute(): number { return this.isValid() ? this.datetime.minute : NaN; }
    /** The second of the minute (0-59). */
    get second(): number { return this.isValid() ? this.datetime.second : NaN; }
    /** The millisecond of the second (0-999). */
    get millisecond(): number { return this.isValid() ? this.datetime.millisecond : NaN; }
    /** The quarter of the year (1-4). */
    get quarter(): number { return this.isValid() ? Math.ceil(this.datetime.month / 3) : NaN; }
    /** The ISO week number of the year (1-53). */
    get weekOfYear(): number { return this.isValid() ? this.datetime.weekOfYear! : NaN; }

    // --- Formatters ---
    /**
     * Formats the date using a Day.js-style token string.
     * @param formatString - The string of tokens (e.g., 'YYYY-MM-DD').
     * @param localeCode - Optional locale code for localized formats like `dddd`.
     */
    format(formatString: string): string;
    /**
     * Formats the date using the native `Intl.DateTimeFormat` API for advanced localization.
     * @param options - An `Intl.DateTimeFormatOptions` object.
     * @param localeCode - Optional locale code (e.g., 'es-CR').
     */
    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string;
    format(templateOrOptions?: string | Intl.DateTimeFormatOptions, localeCode?: string): string {
        if (!this.isValid()) {
            return 'Invalid Date';
        }

        if (typeof templateOrOptions === 'string') {
            const formatString = templateOrOptions;
            const replacements = createTokenReplacements(this, localeCode);
            const tokenRegex = /\[([^\]]+)]|YYYY|YY|MM|M|DD|D|HH|H|mm|m|SSS|ss|s|dddd|ddd|z|Z|ZZ/g;

            return formatString.replace(tokenRegex, (match, literal) => {
                if (literal) return literal;
                if (match in replacements) return (replacements)[match]();
                return match;
            });
        }

        const options = templateOrOptions as Intl.DateTimeFormatOptions;
        const locale = localeCode || TemporalUtils.getDefaultLocale();

        if (options && ('dateStyle' in options || 'timeStyle' in options)) {
            return new Intl.DateTimeFormat(locale, {
                timeZone: this.datetime.timeZoneId,
                ...options
            }).format(this.toDate());
        }

        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };

        return new Intl.DateTimeFormat(locale, {
            timeZone: this.datetime.timeZoneId,
            ...defaultOptions,
            ...options
        }).format(this.toDate());
    }

    // --- Comparison & Conversion Methods ---
    /**
     * Calculates the difference between the current instance and another date.
     * By default, the result is a truncated integer, representing the number of whole units of difference.
     *
     * @param other - The date to compare against. Can be any valid `DateInput`.
     * @param unit - The unit of time to calculate the difference in. Defaults to `'millisecond'`.
     * @param float - If `true`, returns the exact floating-point difference. If `false` (default), returns a truncated integer.
     * @returns The difference in the specified unit, or `NaN` if the operation is invalid.
     *
     * @example
     * const d1 = atemporal('2024-01-01T12:00:00Z');
     * const d2 = atemporal('2024-01-02T18:00:00Z'); // 30 hours later
     *
     * // Default behavior (truncated integer)
     * d2.diff(d1, 'day'); // => 1
     * d2.diff(d1, 'hour'); // => 30
     *
     * // With float = true
     * d2.diff(d1, 'day', true); // => 1.25
     */
    diff(other: DateInput, unit: TimeUnit = 'millisecond', float = false): number {
        if (!this.isValid()) return NaN;
        try {
            const result = TemporalUtils.diff(this.datetime, other, unit);
            if (float) return result;
            return Math.trunc(result);
        } catch {
            return NaN;
        }
    }

    /**
     * Converts the Atemporal instance to a legacy JavaScript `Date` object.
     * @returns A `Date` object, or an invalid Date if the instance is invalid.
     */
    toDate(): Date {
        if (!this.isValid()) return new Date(NaN);
        return TemporalUtils.toDate(this.datetime);
    }

    /**
     * Returns the canonical ISO 8601 string representation of the date-time.
     * Uses 'Z' for UTC and includes a zero-padded three-digit millisecond part if applicable.
     * @returns The formatted ISO string.
     */
    toString(): string {
        if (!this.isValid()) return 'Invalid Date';

        type FractionalDigits = 0 | 3;
        const hasFractional = this.datetime.millisecond > 0 || this.datetime.microsecond > 0 || this.datetime.nanosecond > 0;
        const fractionalSecondDigits: FractionalDigits = hasFractional ? 3 : 0;

        if (this.datetime.timeZoneId === 'UTC') {
            return this.datetime.toInstant().toString({ fractionalSecondDigits });
        }

        return this.datetime.toString({
            offset: 'auto',
            timeZoneName: 'never',
            fractionalSecondDigits
        });
    }

    /**
     * An alias for the `datetime` getter. Provides direct access to the underlying `Temporal.ZonedDateTime` object.
     * @throws {Error} If the instance is invalid.
     */
    get raw(): Temporal.ZonedDateTime {
        return this.datetime;
    }

    /**
     * Checks if the current instance is before another date.
     * @param other - The date to compare against.
     * @returns `true` if the current instance is before the other date.
     */
    isBefore(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isBefore(this.datetime, other);
        } catch {
            return false;
        }
    }

    /**
     * Checks if the current instance is after another date.
     * @param other - The date to compare against.
     * @returns `true` if the current instance is after the other date.
     */
    isAfter(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isAfter(this.datetime, other);
        } catch {
            return false;
        }
    }

    /**
     * Checks if the current instance is between two other dates.
     * @param start - The start of the range.
     * @param end - The end of the range.
     * @param inclusivity - Defines if the start and end dates are inclusive. '[]' (default), '()', '[)', '(]'.
     * @returns `true` if the current instance is within the range.
     */
    isBetween(start: DateInput, end: DateInput, inclusivity: '()' | '[]' | '(]' | '[)' = '[]'): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isBetween(this.datetime, start, end, inclusivity);
        } catch (e) {
            return false;
        }
    }

    /**
     * Checks if the current instance is the same as another date, optionally to a specific unit.
     * @param otherDate - The date to compare against.
     * @param unit - If provided, compares up to this unit ('year', 'month', or 'day'). If omitted, compares to the millisecond.
     * @returns `true` if the dates are the same.
     */
    isSame(otherDate: DateInput, unit?: 'year' | 'month' | 'day'): boolean {
        if (!this.isValid()) return false;
        try {
            const otherDateTime = TemporalUtils.from(otherDate, this.datetime.timeZoneId);
            switch (unit) {
                case 'year':
                    return this.datetime.year === otherDateTime.year;
                case 'month':
                    return this.datetime.year === otherDateTime.year && this.datetime.month === otherDateTime.month;
                case 'day':
                    return this.datetime.toPlainDate().equals(otherDateTime.toPlainDate());
                default:
                    return this.datetime.epochMilliseconds === otherDateTime.epochMilliseconds;
            }
        } catch {
            return false;
        }
    }

    /**
     * A convenience method to check if the current instance is on the same day as another date.
     * @param other - The date to compare against.
     * @returns `true` if they are on the same calendar day.
     */
    isSameDay(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isSameDay(this.datetime, other);
        } catch {
            return false;
        }
    }

    /**
     * Checks if the year of the current instance is a leap year.
     * @returns `true` if it is a leap year.
     */
    isLeapYear(): boolean {
        if (!this.isValid()) return false;
        return this.datetime.inLeapYear;
    }
}