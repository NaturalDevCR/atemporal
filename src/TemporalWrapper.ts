/**
 * @file This file defines the TemporalWrapper class, which is the public-facing,
 * chainable, and immutable interface for the atemporal library. It wraps the
 * native Temporal.ZonedDateTime object to provide a more ergonomic API.
 */

import { Temporal } from '@js-temporal/polyfill';
import { TemporalUtils } from './TemporalUtils';
import type {DateInput, TimeUnit, SettableUnit, FormatTokenMap} from './types';

/**
 * A private helper function to get the correct plural unit name required
 * by the Temporal.Duration object.
 */
function getDurationUnit(unit: TimeUnit): string {
    // 'millisecond' is a special case; the rest just need an 's'.
    if (unit === 'millisecond') return 'milliseconds';
    return `${unit}s`;
}

/**
 * Creates a map of supported formatting tokens to their replacement functions.
 * This is a private helper for the .format() method.
 * @param instance The TemporalWrapper instance to format.
 * @param locale An optional locale for localized tokens.
 */
function createTokenReplacements(instance: TemporalWrapper, locale?: string): FormatTokenMap {
    return {
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
        dddd: () => instance.dayOfWeekName,
        // We need to access the raw datetime for this localized format
        ddd: () => instance.raw.toLocaleString(locale || TemporalUtils.getDefaultLocale(), { weekday: 'short' }),
    };
}

export class TemporalWrapper {
    // --- Internal State ---
    // _datetime can be null if the input date was invalid.
    // _isValid stores the validity state of the instance.
    private readonly _datetime: Temporal.ZonedDateTime | null;
    private readonly _isValid: boolean;

    constructor(input: DateInput, timeZone: string = TemporalUtils.defaultTimeZone) {
        // --- Error-Proof Constructor ---
        try {
            // Attempt to create the date using the low-level utility.
            this._datetime = TemporalUtils.from(input, timeZone);
            this._isValid = true;
        } catch (e) {
            // If TemporalUtils.from throws, we catch the error here.
            // Instead of crashing, we mark the instance as invalid.
            this._datetime = null;
            this._isValid = false;
        }
    }

    // --- Core API Methods ---

    /**
     * Checks if the atemporal instance represents a valid date and time.
     * This is the primary way to handle potentially invalid date inputs gracefully.
     */
    isValid(): boolean {
        return this._isValid;
    }

    /**
     * A protected getter for the internal Temporal.ZonedDateTime object.
     * This ensures that we don't accidentally try to operate on a null object.
     * Public methods should use `isValid()` to avoid triggering this error.
     */
    get datetime(): Temporal.ZonedDateTime {
        if (!this._isValid || !this._datetime) {
            throw new Error("Cannot perform operations on an invalid Atemporal object.");
        }
        return this._datetime;
    }

    /**
     * A static factory method to create a new TemporalWrapper instance.
     * Provides an alternative to calling the main factory function.
     */
    static from(input: DateInput, tz?: string) {
        return new TemporalWrapper(input, tz);
    }

    /**
     * Returns a new atemporal instance with a different time zone.
     */
    timeZone(tz: string): TemporalWrapper {
        if (!this.isValid()) return this; // Return the same invalid instance
        return new TemporalWrapper(this.datetime.withTimeZone(tz));
    }

    /**
     * Returns a new atemporal instance with the specified amount of time added.
     */
    add(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.add(duration);
        return new TemporalWrapper(newDate);
    }

    /**
     * Returns a new atemporal instance with the specified amount of time subtracted.
     */
    subtract(value: number, unit: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;
        const duration = { [getDurationUnit(unit)]: value };
        const newDate = this.datetime.subtract(duration);
        return new TemporalWrapper(newDate);
    }

    /**
     * Returns a new atemporal instance with a specific unit of time set to a new value.
     */
    set(unit: SettableUnit, value: number): TemporalWrapper {
        if (!this.isValid()) return this;
        const newDate = this.datetime.with({ [unit]: value });
        return new TemporalWrapper(newDate);
    }

    /**
     * Returns a new atemporal instance set to the beginning of a specified unit of time.
     */
    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        if (!this.isValid()) return this;
        switch (unit) {
            case 'year': {
                const pDate = this.datetime.toPlainDate().with({ month: 1, day: 1 });
                return new TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
            }
            case 'month': {
                const pDate = this.datetime.toPlainDate().with({ day: 1 });
                return new TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
            }
            case 'week': {
                // Assuming ISO 8601 week start (Monday = 1).
                const dayOfWeek = this.datetime.dayOfWeek;
                const daysToSubtract = dayOfWeek - 1;
                const pDate = this.datetime.subtract({ days: daysToSubtract }).toPlainDate();
                return new TemporalWrapper(pDate.toZonedDateTime(this.datetime.timeZoneId));
            }
            case 'day':
                return new TemporalWrapper(this.datetime.startOfDay());
            case 'hour':
            case 'minute':
            case 'second':
                const newDate = this.datetime.round({ smallestUnit: unit, roundingMode: 'floor' });
                return new TemporalWrapper(newDate);
        }
    }

    /**
     * Returns a new atemporal instance set to the end of a specified unit of time.
     */
    endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper {
        if (!this.isValid()) return this;
        const start = this.startOf(unit);
        const nextStart = start.add(1, unit);
        return nextStart.subtract(1, 'millisecond');
    }

    /**
     * Returns a new, cloned instance of the atemporal object.
     */
    clone(): TemporalWrapper {
        if (!this.isValid()) return this;
        return new TemporalWrapper(this.datetime);
    }

    /**
     * Gets a specific unit of time from the instance.
     */
    get(unit: SettableUnit): number {
        if (!this.isValid()) return NaN;
        return this.datetime[unit];
    }

    // --- Getters for common date parts ---
    get year(): number { return this.isValid() ? this.datetime.year : NaN; }
    get month(): number { return this.isValid() ? this.datetime.month : NaN; }
    get day(): number { return this.isValid() ? this.datetime.day : NaN; }
    get dayOfWeekName(): string {
        if (!this.isValid()) return 'Invalid Date';
        const locale = TemporalUtils.getDefaultLocale();
        return this.datetime.toLocaleString(locale, { weekday: 'long' });
    }
    get hour(): number { return this.isValid() ? this.datetime.hour : NaN; }
    get minute(): number { return this.isValid() ? this.datetime.minute : NaN; }
    get second(): number { return this.isValid() ? this.datetime.second : NaN; }
    get millisecond(): number { return this.isValid() ? this.datetime.millisecond : NaN; }
    get quarter(): number { return this.isValid() ? Math.ceil(this.datetime.month / 3) : NaN; }
    get weekOfYear(): number { return this.isValid() ? this.datetime.weekOfYear! : NaN; }


    // --- Formatters ---
    /**
     * Formats the date into a string using a token-based template, similar to Day.js.
     *
     * @param formatString - A string with tokens (e.g., 'YYYY-MM-DD HH:mm:ss').
     * @returns A formatted date string.
     * @example
     * atemporal().format('DD/MM/YYYY');
     */
    format(formatString: string): string;

    /**
     * Formats the date into a localized string using the native `Intl.DateTimeFormat` API.
     *
     * @param options - An object with `Intl.DateTimeFormat` formatting options.
     * @param localeCode - Optional locale (e.g., 'es-CR') to override the default.
     * @returns A formatted date string.
     * @example
     * atemporal().format({ dateStyle: 'full' }, 'es-ES');
     */
    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string;

    /**
     * Implementation of the format method.
     */
    format(templateOrOptions?: string | Intl.DateTimeFormatOptions, localeCode?: string): string {
        if (!this.isValid()) {
            return 'Invalid Date';
        }

        // --- Case 1: Token-based formatting (e.g. 'YYYY-MM-DD') ---
        if (typeof templateOrOptions === 'string') {
            const formatString = templateOrOptions;
            const replacements = createTokenReplacements(this, localeCode);
            const tokenRegex = /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|dddd|ddd/g;

            return formatString.replace(tokenRegex, match => {
                if (match in replacements) {
                    // We need to tell TypeScript that `match` is a valid key.
                    return replacements[match]();
                }
                return match;
            });
        }


        // --- Case 2: Intl.DateTimeFormat options object ---
        const options = templateOrOptions;
        const locale = localeCode || TemporalUtils.getDefaultLocale();
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


    // --- Comparison Methods ---
    /**
     * Calculates the difference between this instance and another date.
     */
    diff(other: DateInput, unit: TimeUnit = 'millisecond'): number {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return NaN;
        return TemporalUtils.diff(this.datetime, other, unit);
    }

    /**
     * Converts the atemporal instance to a legacy JavaScript Date object.
     */
    toDate(): Date {
        if (!this.isValid()) return new Date(NaN); // Return a standard invalid Date
        return TemporalUtils.toDate(this.datetime);
    }

    /**
     * Returns the full ISO 8601 string representation of the date.
     */
    toString(): string {
        if (!this.isValid()) return 'Invalid Date';
        return this.datetime.toString();
    }

    /**
     * Provides direct, "raw" access to the underlying Temporal.ZonedDateTime object.
     * This is the only getter that will throw an error if the instance is invalid.
     */
    get raw(): Temporal.ZonedDateTime {
        return this.datetime;
    }

    /**
     * Checks if this instance is before another date.
     */
    isBefore(other: DateInput): boolean {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return false;
        return TemporalUtils.isBefore(this.datetime, other);
    }

    /**
     * Checks if this instance is after another date.
     */
    isAfter(other: DateInput): boolean {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return false;
        return TemporalUtils.isAfter(this.datetime, other);
    }

    /**
     * Checks if the instance's date is between two other dates.
     * @param start - The start date of the range.
     * @param end - The end date of the range.
     * @param inclusivity - A string indicating whether the start and end dates should be included.
     * '[]' means inclusive on both ends (default).
     * '()' means exclusive on both ends.
     * '[)' means inclusive start, exclusive end.
     * '(]' means exclusive start, inclusive end.
     * @example
     * atemporal('2025-01-15').isBetween('2025-01-10', '2025-01-20'); // true
     * atemporal('2025-01-20').isBetween('2025-01-10', '2025-01-20', '[)'); // false
     */
    isBetween(start: DateInput, end: DateInput, inclusivity: '()' | '[]' | '(]' | '[)' = '[]'): boolean {
        // The wrapper's only job is to manage validity and delegate.
        if (!this.isValid()) {
            return false;
        }

        // We don't need to check the validity of start/end here,
        // because the constructor of atemporal handles it. If they are invalid,
        // the call inside TemporalUtils.isBetween will fail gracefully
        // or be handled by the isValid check in the wrapper.
        // Let's delegate directly to the more performant utility function.
        try {
            return TemporalUtils.isBetween(this.datetime, start, end, inclusivity);
        } catch (e) {
            // If start or end are invalid inputs that TemporalUtils.from cannot parse,
            // it will throw. We catch it and return false, which is the expected behavior.
            return false;
        }
    }

    /**
     * Checks if this instance is the same as another date, optionally to a specific unit.
     */
    isSame(otherDate: DateInput, unit?: 'year' | 'month' | 'day'): boolean {
        const other = new TemporalWrapper(otherDate);
        if (!this.isValid() || !other.isValid()) return false;

        switch (unit) {
            case 'year':
                return this.datetime.year === other.datetime.year;
            case 'month':
                return this.datetime.year === other.datetime.year &&
                    this.datetime.month === other.datetime.month;
            case 'day':
                return this.datetime.toPlainDate().equals(other.datetime.toPlainDate());
            default:
                // Compares the exact instant in time.
                return this.datetime.epochMilliseconds === other.datetime.epochMilliseconds;
        }
    }

    /**
     * Checks if this instance is on the same calendar day as another date.
     */
    isSameDay(other: DateInput): boolean {
        const otherAtemporal = new TemporalWrapper(other);
        if (!this.isValid() || !otherAtemporal.isValid()) return false;
        return TemporalUtils.isSameDay(this.datetime, other);
    }

    /**
     * Checks if the instance's year is a leap year.
     */
    isLeapYear(): boolean {
        if (!this.isValid()) return false;
        return this.datetime.inLeapYear;
    }
}