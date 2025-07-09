/**
 * @file This file contains all the core type definitions for the atemporal library.
 * It establishes the contracts for date inputs, time units, the plugin system,
 * and the main factory function, ensuring type safety across the entire project.
 */

import { Temporal } from '@js-temporal/polyfill';
import { TemporalWrapper } from './TemporalWrapper';

// --- General Purpose Types ---

/**
 * Represents all valid inputs that can be parsed by the atemporal factory function.
 * This union type allows for flexibility when creating new atemporal instances.
 */
export type DateInput = Date | string | Temporal.PlainDateTime | Temporal.ZonedDateTime | TemporalWrapper;

/**
 * Defines the units of time that can be used in manipulation methods like `add`, `subtract`, and `diff`.
 */
export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

/**
 * Defines the units of time that can be directly set on an atemporal instance using the `.set()` method.
 */
export type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

// --- Plugin System Types ---

/**
 * Represents the TemporalWrapper class itself, used by plugins to extend its prototype.
 */
export type AtemporalClass = typeof TemporalWrapper;

/**
 * Defines the signature for a valid atemporal plugin.
 * A plugin is a function that receives the main class and factory to add new functionality.
 * @template T - The type for optional plugin options.
 */
export type Plugin<T = any> = (cls: AtemporalClass, factory: AtemporalFactory, options?: T) => void;

// --- Factory Function Types ---

/**
 * Defines the signature of the core `atemporal()` function when it is called.
 */
export type AtemporalFunction = (input?: DateInput, tz?: string) => TemporalWrapper;

/**
 * Defines the static properties and methods that are attached to the core `atemporal` function.
 */
export type AtemporalStatics = {
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
export type AtemporalFactory = AtemporalFunction & AtemporalStatics;


export type FormatTokenMap = Record<string, () => string>;