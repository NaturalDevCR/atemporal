import type { Temporal } from '@js-temporal/polyfill';
import type { TemporalWrapper } from './TemporalWrapper';

/**
 * Represents a plain object that can be used to construct a date-time.
 * This makes the API more flexible, similar to other date libraries.
 */
export interface PlainDateTimeObject {
    year: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
}

/**
 * Represents the structure of a Firebase Timestamp object.
 */
export interface FirebaseTimestampLike {
    seconds: number;
    nanoseconds: number;
}

/**
 * Options for the .range() method.
 */
export interface RangeOptions {
    /** Defines if the start and end dates are included. Defaults to '[]'. */
    inclusivity?: '()' | '[]' | '(]' | '[)';
    /** If provided, returns an array of formatted strings instead of atemporal instances. */
    format?: string | Intl.DateTimeFormatOptions;
}

export type StartOfUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';


/**
 * Represents the various types of input that can be parsed into an atemporal instance.
 * Now includes support for arrays and plain objects.
 */
export type DateInput =
    | string
    | number
    | Date
    | Temporal.ZonedDateTime
    | Temporal.PlainDateTime
    | TemporalWrapper
    | PlainDateTimeObject
    | number[]
    | FirebaseTimestampLike
    | undefined
    | null;

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
     * Loads a plugin lazily (on-demand) when needed.
     * This reduces the initial bundle size by only loading plugins when they are required.
     * @param pluginName - Name of the plugin to load (without the path)
     * @param options - Optional options for the plugin
     * @returns A promise that resolves when the plugin has been loaded and applied
     */
    lazyLoad: (pluginName: string, options?: any) => Promise<void>;

    /**
     * Checks if a specific plugin has already been loaded.
     * @param pluginName - Name of the plugin to check
     * @returns true if the plugin has been loaded, false otherwise
     */
    isPluginLoaded: (pluginName: string) => boolean;

    /**
     * Gets the list of all plugins that have been loaded.
     * @returns An array with the names of the loaded plugins
     */
    getLoadedPlugins: () => string[];

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