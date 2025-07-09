// src/types.ts

import { Temporal } from '@js-temporal/polyfill';
import { TemporalWrapper } from './TemporalWrapper';

/**
 * Represents the various types of input that can be parsed into an atemporal instance.
 */
export type DateInput = string | number | Date | Temporal.ZonedDateTime | Temporal.PlainDateTime | TemporalWrapper;

/**
 * Defines the units of time that can be used for durations and differences.
 */
export type TimeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

/**
 * Defines the units of time that can be set on an atemporal instance.
 */
export type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

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
export type Plugin = (Atemporal: typeof TemporalWrapper, atemporal: AtemporalFactory, options?: any) => void;