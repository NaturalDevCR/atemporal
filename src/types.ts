import type { Temporal } from '@js-temporal/polyfill';
import type { TemporalWrapper } from './TemporalWrapper';

/**
 * Represents the various types of input that can be parsed into an atemporal instance.
 */
export type DateInput = string | number | Date | Temporal.ZonedDateTime | Temporal.PlainDateTime | TemporalWrapper;

/**
 * Defines the units of time that can be used for durations and differences.
 */
export type TimeUnit =
    | 'year' | 'years' | 'y'
    | 'month' | 'months' // 'm' is ambiguous with minute, so we omit it for month
    | 'week' | 'weeks' | 'w'
    | 'day' | 'days' | 'd'
    | 'hour' | 'hours' | 'h'
    | 'minute' | 'minutes' | 'm'
    | 'second' | 'seconds' | 's'
    | 'millisecond' | 'milliseconds' | 'ms';

/**
 * Defines the units of time that can be set on an atemporal instance.
 */
export type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond' | 'quarter';

/**
 * A map of format tokens to their string replacement functions. Used by the `.format()` method.
 */
export type FormatTokenMap = {
    [key: string]: () => string;
};

/**
 * The type for the core `atemporal` function before static properties are attached.
 */
export type AtemporalFunction = (input?: DateInput, timeZone?: string) => TemporalWrapper;

/**
 * The main factory for creating atemporal instances.
 * This is an interface so that plugins can augment it with new static methods.
 */
export interface AtemporalFactory {
    /**
     * Creates a new atemporal instance.
     * @param input The date/time input. Defaults to now.
     * @param timeZone The IANA time zone identifier.
     */
    (input?: DateInput, timeZone?: string): TemporalWrapper;

    from(input: DateInput, tz?: string): TemporalWrapper;

    unix(timestampInSeconds: number): TemporalWrapper;

    /**
     * Checks if a given input can be parsed into a valid date.
     */
    isValid: (input: any) => boolean;

    /**
     * Checks if a given input is an instance of an atemporal object.
     * This acts as a TypeScript type guard.
     */
    isAtemporal: (input: any) => input is TemporalWrapper;

    /**
     * Checks if a given input is an instance of Temporal.Duration.
     */
    isDuration: (input: any) => input is Temporal.Duration;

    /**
     * Checks if a string is a valid and supported IANA time zone identifier.
     */
    isValidTimeZone: (tz: string) => boolean;

    /**
     * Checks if a string is a structurally valid locale identifier.
     */
    isValidLocale: (code: string) => boolean;

    /**
     * Checks if a given function has the shape of an atemporal plugin.
     */
    isPlugin: (input: any) => input is Plugin;

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


    /**
     * Creates a Temporal.Duration object from a duration-like object or an ISO 8601 string.
     * @param durationLike - An object like `{ hours: 2, minutes: 30 }` or a string like `'PT2H30M'`.
     * @returns A Temporal.Duration instance.
     */
    duration(durationLike: Temporal.DurationLike | string): Temporal.Duration;
}

/**
 * Defines the shape of a plugin for atemporal.
 */
export type Plugin = (Atemporal: typeof TemporalWrapper, atemporal: AtemporalFactory, options?: any) => void;