/**
 * @file This file defines the TemporalWrapper class, which is the public-facing,
 * chainable, and immutable interface for the atemporal library. It wraps the
 * native Temporal.ZonedDateTime object to provide a more ergonomic API.
 */

import { getCachedTemporalAPI } from './core/temporal-detection';
// Import Temporal types for TypeScript compilation
import type { Temporal } from '@js-temporal/polyfill';

// Get the appropriate Temporal API (native or polyfilled)
const { Temporal: TemporalAPI } = getCachedTemporalAPI();
import { TemporalUtils } from './TemporalUtils';
import type {DateInput, TimeUnit, SettableUnit, StartOfUnit} from './types';
import { InvalidAtemporalInstanceError } from './errors';
import { FormattingEngine, legacyFormat } from './core/formatting';
import type { FormattingOptions } from './core/formatting/formatting-types';

/**
 * Maps a flexible TimeUnit to the strict unit required by startOf/endOf.
 * @internal
 */
function toStartOfUnit(unit: TimeUnit): StartOfUnit | null {
    const u = unit.toLowerCase();
    if (u.startsWith('year')) return 'year';
    if (u.startsWith('month')) return 'month';
    if (u.startsWith('week')) return 'week';
    if (u.startsWith('day')) return 'day';
    if (u.startsWith('hour')) return 'hour';
    if (u.startsWith('minute')) return 'minute';
    if (u.startsWith('second')) return 'second';
    return null; // Non supported units by startOf as 'millisecond'
}

/**
 * Normalizes and pluralizes a library time unit to its corresponding form for the Temporal API.
 * Accepts singular, plural, and short-hand aliases (e.g., 'hour', 'hours', 'h' all become 'hours').
 * @internal
 */
function getDurationUnit(unit: TimeUnit): string {
    const u = unit.toLowerCase();
    switch (u) {
        case 'year':
        case 'years':
        case 'y':
            return 'years';
        case 'month':
        case 'months':
            return 'months';
        case 'week':
        case 'weeks':
        case 'w':
            return 'weeks';
        case 'day':
        case 'days':
        case 'd':
            return 'days';
        case 'hour':
        case 'hours':
        case 'h':
            return 'hours';
        case 'minute':
        case 'minutes':
        case 'm':
            return 'minutes';
        case 'second':
        case 'seconds':
        case 's':
            return 'seconds';
        case 'millisecond':
        case 'milliseconds':
        case 'ms':
            return 'milliseconds';
        // This default case should ideally not be reached if using TypeScript types,
        // but it's a safeguard.
        default:
            return u;
    }
}

/**
 * The core class of the Atemporal library. It provides an immutable, chainable
 * API for date-time manipulation, wrapping a `Temporal.ZonedDateTime` object.
 */
export class TemporalWrapper {
    private readonly _datetime: Temporal.ZonedDateTime | null;
    private readonly _isValid: boolean;
    readonly _isTemporalWrapper: true = true;

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
        try {
            // Convert seconds to milliseconds, handling floating point precision
            const timestampInMs = Math.round(timestampInSeconds * 1000);
            
            // Create Instant directly to bypass number strategy's seconds/milliseconds detection
            const instant = TemporalAPI.Instant.fromEpochMilliseconds(timestampInMs);
            const timeZone = TemporalUtils.defaultTimeZone;
            const zonedDateTime = instant.toZonedDateTimeISO(timeZone);
            
            // Create wrapper directly from ZonedDateTime
            return TemporalWrapper._fromZonedDateTime(zonedDateTime);
        } catch (e) {
            // Fallback to regular parsing if direct creation fails
            const timestampInMs = Math.round(timestampInSeconds * 1000);
            return new TemporalWrapper(timestampInMs);
        }
    }

    /**
     * Gets formatting performance metrics from the FormattingEngine
     * @returns Comprehensive formatting performance metrics
     */
    static getFormattingMetrics() {
        return FormattingEngine.getMetrics();
    }

    /**
     * Gets a detailed formatting performance report
     * @returns Human-readable performance report
     */
    static getFormattingPerformanceReport(): string {
        const metrics = FormattingEngine.getMetrics();
        const avgFormatTime = metrics.totalFormats > 0 ? metrics.averageFormatTime : 0;
        const cacheHitRatio = metrics.totalFormats > 0 ? 
            ((metrics.cacheHits / metrics.totalFormats) * 100).toFixed(2) : '0.00';
        const fastPathRatio = metrics.totalFormats > 0 ? 
            ((metrics.fastPathHits / metrics.totalFormats) * 100).toFixed(2) : '0.00';
        
        return [
            'Formatting Performance Report:',
            `Total Formats: ${metrics.totalFormats}`,
            `Average Format Time: ${avgFormatTime.toFixed(3)}ms`,
            `Cache Hit Ratio: ${cacheHitRatio}%`,
            `Fast Path Hit Ratio: ${fastPathRatio}%`,
            `Token Pool Stats:`,
            `  - Total Tokens: ${metrics.tokenPoolStats.totalTokens}`,
            `  - Active Tokens: ${metrics.tokenPoolStats.activeTokens}`,
            `  - Pool Hit Ratio: ${(metrics.tokenPoolStats.hitRatio * 100).toFixed(2)}%`,
            `Compilation Stats:`,
            `  - Total Compilations: ${metrics.compilationStats.totalCompilations}`,
            `  - Compilation Cache Hit Ratio: ${(metrics.compilationStats.cacheHitRatio * 100).toFixed(2)}%`,
            `  - Average Compile Time: ${metrics.compilationStats.averageCompileTime.toFixed(3)}ms`
        ].join('\n');
    }

    /**
     * Clears all formatting caches and resets metrics
     */
    static resetFormattingSystem(): void {
        FormattingEngine.reset();
    }

    /**
     * Pre-warms the formatting system with common patterns
     */
    static prewarmFormattingSystem(): void {
        FormattingEngine.initialize();
    }

    /**
     * Creates a new instance from an existing ZonedDateTime, bypassing the parsing logic for efficiency.
     * @internal
     */
    private static _fromZonedDateTime(dateTime: Temporal.ZonedDateTime): TemporalWrapper {
        const wrapper = Object.create(TemporalWrapper.prototype);
        wrapper._datetime = dateTime;
        wrapper._isValid = true;
        wrapper._isTemporalWrapper = true;
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
     * @throws {InvalidAtemporalInstanceError} If the instance is invalid.
     */
    get datetime(): Temporal.ZonedDateTime {
        if (!this.isValid() || !this._datetime) {
            throw new InvalidAtemporalInstanceError("Cannot perform operations on an invalid Atemporal object.");
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
        return this._cloneWith(this.datetime.withTimeZone(tz));
    }

    /**
     * Returns a new instance with the specified duration added.
     * @param duration - A `Temporal.Duration` object to add.
     * @returns A new TemporalWrapper instance.
     * @example atemporal().add(atemporal.duration({ hours: 2, minutes: 30 }));
     */
    add(duration: Temporal.Duration): TemporalWrapper;
    /**
     * Returns a new instance with the specified amount of time added.
     * @param value - The number of units to add.
     * @param unit - The unit of time to add.
     * @returns A new TemporalWrapper instance.
     * @example atemporal().add(5, 'days');
     */
    add(value: number, unit: TimeUnit): TemporalWrapper;
    add(valueOrDuration: number | Temporal.Duration, unit?: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;

        const duration = typeof valueOrDuration === 'number'
            ? { [getDurationUnit(unit!)]: valueOrDuration }
            : valueOrDuration;

        const newDate = this.datetime.add(duration);
        return this._cloneWith(newDate);
    }

    /**
     * Returns a new instance with the specified duration subtracted.
     * @param duration - A `Temporal.Duration` object to subtract.
     * @returns A new TemporalWrapper instance.
     */
    subtract(duration: Temporal.Duration): TemporalWrapper;
    /**
     * Returns a new instance with the specified amount of time subtracted.
     * @param value - The number of units to subtract.
     * @param unit - The unit of time to subtract.
     * @returns A new TemporalWrapper instance.
     */
    subtract(value: number, unit: TimeUnit): TemporalWrapper;
    subtract(valueOrDuration: number | Temporal.Duration, unit?: TimeUnit): TemporalWrapper {
        if (!this.isValid()) return this;

        const duration = typeof valueOrDuration === 'number'
            ? { [getDurationUnit(unit!)]: valueOrDuration }
            : valueOrDuration;

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

        switch (unit) {
            case 'quarter':
                // Delegate to the specialized quarter(value) method
                return this.quarter(value);
            default:
                // For all other units, use the standard .with() method
                const newDate = this.datetime.with({ [unit]: value });
                return this._cloneWith(newDate);
        }
    }

    /**
     * Gets the day of the week (1=Monday, 7=Sunday).
     * @returns The day of the week.
     */
    dayOfWeek(): number;
    /**
     * Returns a new instance adjusted to a specific day of the week within the current week.
     * Follows ISO 8601 standard where Monday is 1 and Sunday is 7.
     * @param day - The target day of the week (1-7).
     * @returns A new TemporalWrapper instance.
     * @example
     * const wednesday = atemporal('2024-08-14'); // A Wednesday
     * wednesday.dayOfWeek(5); // Returns a date for Friday, Aug 16, 2024
     * wednesday.dayOfWeek(1); // Returns a date for Monday, Aug 12, 2024
     */
    dayOfWeek(day: number): TemporalWrapper;
    dayOfWeek(day?: number): number | TemporalWrapper {
        if (!this.isValid()) {
            return day === undefined ? NaN : this;
        }

        // Getter case
        if (day === undefined) {
            return this.datetime.dayOfWeek;
        }

        // Setter case
        if (day < 1 || day > 7) {
            return this;
        }
        const currentDay = this.datetime.dayOfWeek;
        const diff = day - currentDay;
        return this.add(diff, 'day');
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

        switch (unit) {
            case 'quarter':
                // Delegate to the specialized quarter() method
                return this.quarter();
            default:
                // For all other units, they are valid properties on ZonedDateTime
                return this.datetime[unit];
        }
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
    /** The IANA time zone identifier (e.g., "America/New_York"). */
    get timeZoneName(): string {
        if (!this.isValid()) return 'Invalid TimeZone';
        return this.datetime.timeZoneId;
    }
    /** The IANA time zone identifier (e.g., "America/New_York"). */
    get timeZoneId(): string {
        if (!this.isValid()) return 'Invalid TimeZone';
        return this.datetime.timeZoneId;
    }
    /** The hour of the day (0-23). */
    get hour(): number { return this.isValid() ? this.datetime.hour : NaN; }
    /** The minute of the hour (0-59). */
    get minute(): number { return this.isValid() ? this.datetime.minute : NaN; }
    /** The second of the minute (0-59). */
    get second(): number { return this.isValid() ? this.datetime.second : NaN; }
    /** The millisecond of the second (0-999). */
    get millisecond(): number { return this.isValid() ? this.datetime.millisecond : NaN; }
    /** The ISO week number of the year (1-53). */
    get weekOfYear(): number { return this.isValid() ? this.datetime.weekOfYear! : NaN; }
    get daysInMonth(): number {
        if (!this.isValid()) return NaN;
        return this.datetime.daysInMonth;
    }

    /**
     * Gets the quarter of the year (1-4).
     * @returns The quarter number.
     */
    quarter(): number;
    /**
     * Returns a new instance set to the beginning of the specified quarter.
     * @param quarter The target quarter (1-4).
     * @returns A new TemporalWrapper instance.
     */
    quarter(quarter: number): TemporalWrapper;
    quarter(quarter?: number): number | TemporalWrapper {
        if (!this.isValid()) {
            return quarter === undefined ? NaN : this;
        }

        // Getter case
        if (quarter === undefined) {
            return Math.ceil(this.datetime.month / 3);
        }

        // Setter case
        if (quarter < 1 || quarter > 4) {
            // For invalid quarters, return the instance unmodified.
            return this;
        }

        const startMonthOfQuarter = (quarter - 1) * 3 + 1;
        return this.set('month', startMonthOfQuarter).startOf('month');
    }

    // --- Formatters ---
    /**
     * Formats the date using a Day.js-style token string.
     * @param formatString - The string of tokens (e.g., 'YYYY-MM-DD').
     * @param localeCode - Optional locale code for localized formats like `dddd`.
     */
    format(formatString: string, localeCode?: string): string;
    /**
     * Formats the date using the native `Intl.DateTimeFormat` API for advanced localization.
     * @param options - An `Intl.DateTimeFormatOptions` object.
     * @param localeCode - Optional locale code (e.g., 'es-CR').
     */
    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string;
    /**
     * Formats the date using a Day.js-style token string or native Intl options.
     *
     * @param {string | Intl.DateTimeFormatOptions} [templateOrOptions] - The format string or options object.
     * @param {string} [localeCode] - Optional IANA locale string (e.g., 'es-CR').
     * @returns {string} The formatted date string.
     *
     * @example
     * // Token-based formatting
     * atemporal().format('YYYY-MM-DD hh:mm:ss A');
     * // => "2024-07-16 03:30:15 PM"
     *
     * @example
     * // Intl.DateTimeFormat for advanced localization
     * atemporal().format({ dateStyle: 'full', timeStyle: 'medium' }, 'es');
     * // => "martes, 16 de julio de 2024, 15:30:15"
     *
     * @description
     * ### Supported Format Tokens
     * | Token  | Output Example        | Description                                  |
     * |--------|-----------------------|----------------------------------------------|
     * | `YYYY` | `2024`                | 4-digit year                                 |
     * | `YY`   | `24`                  | 2-digit year                                 |
     * | `MMMM` | `January`             | The full month name                          |
     * | `MMM`  | `Jan`                 | The abbreviated month name                   |
     * | `MM`   | `01`                  | The month, 2-digits (01-12)                  |
     * | `M`    | `1`                   | The month (1-12)                             |
     * | `DD`   | `09`                  | The day of the month, 2-digits (01-31)       |
     * | `D`    | `9`                   | The day of the month (1-31)                  |
     * | `dddd` | `Sunday`              | The name of the day of the week              |
     * | `ddd`  | `Sun`                 | The short name of the day of the week        |
     * | `dd`   | `Su`                  | The min name of the day of the week          |
     * | `d`    | `0`                   | The day of the week, Sunday as 0 (0-6)       |
     * | `HH`   | `15`                  | The hour, 2-digits (00-23)                   |
     * | `H`    | `15`                  | The hour (0-23)                              |
     * | `hh`   | `03`                  | The hour, 12-hour clock, 2-digits (01-12)    |
     * | `h`    | `3`                   | The hour, 12-hour clock (1-12)               |
     * | `mm`   | `05`                  | The minute, 2-digits (00-59)                 |
     * | `m`    | `5`                   | The minute (0-59)                            |
     * | `ss`   | `02`                  | The second, 2-digits (00-59)                 |
     * | `s`    | `2`                   | The second (0-59)                            |
     * | `SSS`  | `123`                 | The millisecond, 3-digits (000-999)          |
     * | `A`    | `PM`                  | AM PM                                        |
     * | `a`    | `pm`                  | am pm                                        |
     * | `Z`    | `+05:30`              | The offset from UTC, ±HH:mm                  |
     * | `ZZ`   | `+0530`               | The offset from UTC, ±HHmm                   |
     * | `z`    | `America/New_York`    | IANA time zone name (Atemporal-specific)     |
     * | `zzz`  | `EST`                 | Short localized time zone name (Atemporal-specific) |
     * | `zzzz` | `Eastern Standard Time` | Long localized time zone name (Atemporal-specific) |
     */
    format(templateOrOptions?: string | Intl.DateTimeFormatOptions, localeCode?: string): string {
        if (!this.isValid()) {
            return 'Invalid Date';
        }

        // --- Path for string-based formatting ---
        if (typeof templateOrOptions === 'string') {
            const formatString = templateOrOptions;
            
            // Use the new high-performance FormattingEngine
            const formattingOptions: FormattingOptions = {
                locale: localeCode || TemporalUtils.getDefaultLocale(),
                timeZone: this.datetime.timeZoneId,
                useCache: true,
                poolTokens: true
            };
            
            try {
                return FormattingEngine.format(this.datetime, formatString, formattingOptions);
            } catch (error) {
                // Fallback to legacy formatting for backward compatibility
                return this._legacyFormat(formatString, localeCode);
            }
        }

        // --- Path for Intl.DateTimeFormatOptions ---
        const options = templateOrOptions;
        const locale = localeCode || TemporalUtils.getDefaultLocale();

        // If the user provides any specific options, use them exclusively.
        if (options && Object.keys(options).length > 0) {
            return new Intl.DateTimeFormat(locale, {
                timeZone: this.datetime.timeZoneId,
                ...options
            }).format(this.toDate());
        }

        // If no options are provided, fall back to a sensible default format.
        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };

        return new Intl.DateTimeFormat(locale, {
            timeZone: this.datetime.timeZoneId,
            ...defaultOptions
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
     * @throws {InvalidAtemporalInstanceError} If the instance is invalid.
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
     * Checks if the current instance is the same as or before another date.
     * @param other - The date to compare against.
     * @returns `true` if the current instance is the same as or before the other date.
     */
    isSameOrBefore(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isSameOrBefore(this.datetime, other);
        } catch {
            return false;
        }
    }

    /**
     * Checks if the current instance is the same as or after another date.
     * @param other - The date to compare against.
     * @returns `true` if the current instance is the same as or after the other date.
     */
    isSameOrAfter(other: DateInput): boolean {
        if (!this.isValid()) return false;
        try {
            return TemporalUtils.isSameOrAfter(this.datetime, other);
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
     * @example
     * atemporal('2024-06-15').isBetween('2024-01-01', '2024-12-31'); // true
     * atemporal('2024-01-01').isBetween('2024-01-01', '2024-12-31', '()'); // false
     */
    isBetween(start: DateInput, end: DateInput, inclusivity: '()' | '[]' | '(]' | '[)' = '[]'): boolean {
        if (!this.isValid()) return false;
        try {
            // Parse start and end dates relative to the instance's timezone for consistency
            const startDateTime = TemporalUtils.from(start, this.datetime.timeZoneId);
            const endDateTime = TemporalUtils.from(end, this.datetime.timeZoneId);

            // Determine comparison logic based on inclusivity
            const afterStart = inclusivity.startsWith('[')
                ? TemporalAPI.ZonedDateTime.compare(this.datetime, startDateTime) >= 0
                : TemporalAPI.ZonedDateTime.compare(this.datetime, startDateTime) > 0;

            const beforeEnd = inclusivity.endsWith(']')
                ? TemporalAPI.ZonedDateTime.compare(this.datetime, endDateTime) <= 0
                : TemporalAPI.ZonedDateTime.compare(this.datetime, endDateTime) < 0;

            return afterStart && beforeEnd;
        } catch (e) {
            return false;
        }
    }

    /**
     * Legacy formatting method for backward compatibility
     * @private
     */
    private _legacyFormat(formatString: string, localeCode?: string): string {
        return legacyFormat(this, formatString, localeCode);
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
     * @returns `true` if they are on the same calendar day in their respective timezones.
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

    // Overload 1: Returns an array of formatted strings
    /**
     * Generates an array of formatted date strings within a given date range.
     * The output type is `string[]` when a `format` option is provided.
     *
     * @param endDate The end date of the range.
     * @param unit The unit of time to increment by (e.g., 'day', 'week').
     * @param options An object containing inclusivity rules and a `format` string or Intl options.
     * @returns An array of formatted date strings.
     * @example
     * const start = atemporal('2023-01-01');
     * const end = atemporal('2023-01-03');
     * start.range(end, 'day', { format: 'YYYY-MM-DD' });
     * // => ['2023-01-01', '2023-01-02', '2023-01-03']
     */
    range(endDate: DateInput, unit: TimeUnit, options: { inclusivity?: '()' | '[]' | '(]' | '[)', format: string | Intl.DateTimeFormatOptions }): string[];

    // Overload 2: Returns an array of atemporal instances
    /**
     * Generates an array of atemporal instances within a given date range.
     * This is the default behavior when no `format` option is provided.
     *
     * @param endDate The end date of the range.
     * @param unit The unit of time to increment by (e.g., 'day', 'week').
     * @param options An object containing inclusivity rules.
     * @returns An array of atemporal instances.
     * @example
     * const start = atemporal('2023-01-01');
     * const end = atemporal('2023-01-03');
     * start.range(end, 'day');
     * // => [Atemporal, Atemporal, Atemporal]
     */
    // ▼▼▼ AQUÍ ESTÁ LA CORRECCIÓN: '[]' fue cambiado a '[)' ▼▼▼
    range(endDate: DateInput, unit: TimeUnit, options?: { inclusivity?: '()' | '[]' | '(]' | '[)' }): TemporalWrapper[];

    // Actual Implementation
    range(
        endDate: DateInput,
        unit: TimeUnit,
        options: any = {}
    ): TemporalWrapper[] | string[] {
        if (!this.isValid()) {
            return [];
        }

        const endAtemporal = endDate instanceof TemporalWrapper ? endDate : TemporalWrapper.from(endDate);
        if (!endAtemporal.isValid() || this.isAfter(endAtemporal)) {
            return [];
        }

        const { inclusivity = '[]', format } = options;
        const results: TemporalWrapper[] = [];
        let cursor = this.clone();

        if (inclusivity.startsWith('(')) {
            cursor = cursor.add(1, unit);
        }

        const isInclusiveEnd = inclusivity.endsWith(']');
        const startOfUnit = toStartOfUnit(unit);

        while (true) {
            let shouldStop = false;
            if (isInclusiveEnd) {
                if (cursor.isAfter(endAtemporal)) {
                    shouldStop = true;
                }
            } else {
                if (startOfUnit) {
                    const endBoundary = endAtemporal.startOf(startOfUnit);
                    if (cursor.isSameOrAfter(endBoundary)) {
                        shouldStop = true;
                    }
                } else {
                    if (cursor.isSameOrAfter(endAtemporal)) {
                        shouldStop = true;
                    }
                }
            }

            if (shouldStop) {
                break;
            }

            results.push(cursor);
            cursor = cursor.add(1, unit);
        }

        if (format) {
            if (typeof format === 'string') {
                return results.map(date => date.format(format));
            } else {
                return results.map(date => date.format(format));
            }
        }

        return results;
    }
}