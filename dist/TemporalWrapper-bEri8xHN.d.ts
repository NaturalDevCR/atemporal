import { Temporal } from '@js-temporal/polyfill';

/**
 * Represents the various types of input that can be parsed into an atemporal instance.
 */
type DateInput = string | number | Date | Temporal.ZonedDateTime | Temporal.PlainDateTime | TemporalWrapper;
/**
 * Defines the units of time that can be used for durations and differences.
 */
type TimeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
/**
 * Defines the units of time that can be set on an atemporal instance.
 */
type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
/**
 * The main factory for creating atemporal instances.
 * This is an interface so that plugins can augment it with new static methods.
 */
interface AtemporalFactory {
    /**
     * Creates a new atemporal instance.
     * @param input The date/time input. Defaults to now.
     * @param timeZone The IANA time zone identifier.
     */
    (input?: DateInput, timeZone?: string): TemporalWrapper;
    /**
     * Checks if a given input can be parsed into a valid date.
     */
    isValid: (input: any) => boolean;
    /**
     * Sets the default locale for all new atemporal instances.
     */
    setDefaultLocale: (code: string) => void;
    /**
     * Sets the default IANA time zone for all new atemporal instances.
     */
    setDefaultTimeZone: (tz: string) => void;
    /**
     * Gets the currently configured default locale.
     */
    getDefaultLocale: () => string;
    /**
     * Extends atemporal's functionality with a plugin.
     */
    extend: (plugin: Plugin, options?: any) => void;
}
/**
 * Defines the shape of a plugin for atemporal.
 */
type Plugin = (Atemporal: typeof TemporalWrapper, atemporal: AtemporalFactory, options?: any) => void;

/**
 * @file This file defines the TemporalWrapper class, which is the public-facing,
 * chainable, and immutable interface for the atemporal library. It wraps the
 * native Temporal.ZonedDateTime object to provide a more ergonomic API.
 */

declare class TemporalWrapper {
    private readonly _datetime;
    private readonly _isValid;
    private constructor();
    /**
     * [NUEVO] Método de fábrica público para crear instancias.
     * Este es ahora el punto de entrada principal.
     */
    static from(input: DateInput, tz?: string): TemporalWrapper;
    /**
     * [NUEVO] Un método estático privado para crear una instancia desde un ZonedDateTime ya existente.
     * Esto es más eficiente y claro que pasar por la lógica de parsing completa.
     */
    private static _fromZonedDateTime;
    /**
     * [MODIFICADO] _cloneWith ahora usa el método estático directo y más eficiente.
     */
    private _cloneWith;
    isValid(): boolean;
    get datetime(): Temporal.ZonedDateTime;
    timeZone(tz: string): TemporalWrapper;
    add(value: number, unit: TimeUnit): TemporalWrapper;
    subtract(value: number, unit: TimeUnit): TemporalWrapper;
    set(unit: SettableUnit, value: number): TemporalWrapper;
    /**
     * ...
     * Note: `startOf('week')` assumes the week starts on Monday (ISO 8601 standard).
     */
    startOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;
    endOf(unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'): TemporalWrapper;
    clone(): TemporalWrapper;
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
    format(formatString: string): string;
    format(options?: Intl.DateTimeFormatOptions, localeCode?: string): string;
    diff(other: DateInput, unit?: TimeUnit): number;
    toDate(): Date;
    toString(): string;
    get raw(): Temporal.ZonedDateTime;
    isBefore(other: DateInput): boolean;
    isAfter(other: DateInput): boolean;
    isBetween(start: DateInput, end: DateInput, inclusivity?: '()' | '[]' | '(]' | '[)'): boolean;
    isSame(otherDate: DateInput, unit?: 'year' | 'month' | 'day'): boolean;
    isSameDay(other: DateInput): boolean;
    isLeapYear(): boolean;
}

export { type AtemporalFactory as A, type DateInput as D, type Plugin as P, type SettableUnit as S, TemporalWrapper as T, type TimeUnit as a };
