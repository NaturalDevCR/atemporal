import { Temporal } from '@js-temporal/polyfill';

/**
 * @file This file contains all the core type definitions for the atemporal library.
 * It establishes the contracts for date inputs, time units, the plugin system,
 * and the main factory function, ensuring type safety across the entire project.
 */

/**
 * Represents all valid inputs that can be parsed by the atemporal factory function.
 * This union type allows for flexibility when creating new atemporal instances.
 */
type DateInput = Date | string | Temporal.PlainDateTime | Temporal.ZonedDateTime | TemporalWrapper;
/**
 * Defines the units of time that can be used in manipulation methods like `add`, `subtract`, and `diff`.
 */
type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
/**
 * Defines the units of time that can be directly set on an atemporal instance using the `.set()` method.
 */
type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
/**
 * Represents the TemporalWrapper class itself, used by plugins to extend its prototype.
 */
type AtemporalClass = typeof TemporalWrapper;
/**
 * Defines the signature for a valid atemporal plugin.
 * A plugin is a function that receives the main class and factory to add new functionality.
 * @template T - The type for optional plugin options.
 */
type Plugin<T = any> = (cls: AtemporalClass, factory: AtemporalFactory, options?: T) => void;
/**
 * Defines the signature of the core `atemporal()` function when it is called.
 */
type AtemporalFunction = (input?: DateInput, tz?: string) => TemporalWrapper;
/**
 * Defines the static properties and methods that are attached to the core `atemporal` function.
 */
type AtemporalStatics = {
    extend: (plugin: Plugin, options?: any) => void;
    isValid: (input: any) => boolean;
    setDefaultLocale: (code: string) => void;
    setDefaultTimeZone: (tz: string) => void;
    getDefaultLocale: () => string;
};
/**
 * Represents the final, complete `atemporal` object.
 * It's an intersection type that combines the callable function signature (`AtemporalFunction`)
 * with its static properties (`AtemporalStatics`), creating a powerful and flexible factory object.
 */
type AtemporalFactory = AtemporalFunction & AtemporalStatics;

/**
 * @file This file defines the TemporalWrapper class, which is the public-facing,
 * chainable, and immutable interface for the atemporal library. It wraps the
 * native Temporal.ZonedDateTime object to provide a more ergonomic API.
 */

declare class TemporalWrapper {
    private readonly _datetime;
    private readonly _isValid;
    constructor(input: DateInput, timeZone?: string);
    /**
     * Checks if the atemporal instance represents a valid date and time.
     * This is the primary way to handle potentially invalid date inputs gracefully.
     */
    isValid(): boolean;
    /**
     * A protected getter for the internal Temporal.ZonedDateTime object.
     * This ensures that we don't accidentally try to operate on a null object.
     * Public methods should use `isValid()` to avoid triggering this error.
     */
    get datetime(): Temporal.ZonedDateTime;
    /**
     * A static factory method to create a new TemporalWrapper instance.
     * Provides an alternative to calling the main factory function.
     */
    static from(input: DateInput, tz?: string): TemporalWrapper;
    /**
     * Returns a new atemporal instance with a different time zone.
     */
    timeZone(tz: string): TemporalWrapper;
    /**
     * Returns a new atemporal instance with the specified amount of time added.
     */
    add(value: number, unit: TimeUnit): TemporalWrapper;
    /**
     * Returns a new atemporal instance with the specified amount of time subtracted.
     */
    subtract(value: number, unit: TimeUnit): TemporalWrapper;
    /**
     * Returns a new atemporal instance with a specific unit of time set to a new value.
     */
    set(unit: SettableUnit, value: number): TemporalWrapper;
    /**
     * Returns a new atemporal instance set to the beginning of a specified unit of time.
     */
    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;
    /**
     * Returns a new atemporal instance set to the end of a specified unit of time.
     */
    endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;
    /**
     * Returns a new, cloned instance of the atemporal object.
     */
    clone(): TemporalWrapper;
    /**
     * Gets a specific unit of time from the instance.
     */
    get(unit: SettableUnit): number;
    get year(): number;
    get month(): number;
    get day(): number;
    get dayOfWeekName(): string;
    get hour(): number;
    get minute(): number;
    get second(): number;
    get millisecond(): number;
    get quarter(): number;
    get weekOfYear(): number;
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
     * Calculates the difference between this instance and another date.
     */
    diff(other: DateInput, unit?: TimeUnit): number;
    /**
     * Converts the atemporal instance to a legacy JavaScript Date object.
     */
    toDate(): Date;
    /**
     * Returns the full ISO 8601 string representation of the date.
     */
    toString(): string;
    /**
     * Provides direct, "raw" access to the underlying Temporal.ZonedDateTime object.
     * This is the only getter that will throw an error if the instance is invalid.
     */
    get raw(): Temporal.ZonedDateTime;
    /**
     * Checks if this instance is before another date.
     */
    isBefore(other: DateInput): boolean;
    /**
     * Checks if this instance is after another date.
     */
    isAfter(other: DateInput): boolean;
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
    isBetween(start: DateInput, end: DateInput, inclusivity?: '()' | '[]' | '(]' | '[)'): boolean;
    /**
     * Checks if this instance is the same as another date, optionally to a specific unit.
     */
    isSame(otherDate: DateInput, unit?: 'year' | 'month' | 'day'): boolean;
    /**
     * Checks if this instance is on the same calendar day as another date.
     */
    isSameDay(other: DateInput): boolean;
    /**
     * Checks if the instance's year is a leap year.
     */
    isLeapYear(): boolean;
}

export { type AtemporalFactory as A, type DateInput as D, type Plugin as P, type SettableUnit as S, TemporalWrapper as T, type TimeUnit as a };
