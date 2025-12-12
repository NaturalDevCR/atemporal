import { TemporalWrapper } from "./TemporalWrapper";
// Import Temporal types for TypeScript compilation
import type { Temporal } from "@js-temporal/polyfill";

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
 * Supports both standard format (seconds/nanoseconds) and underscore format (_seconds/_nanoseconds)
 */
export interface FirebaseTimestampLike {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
}

/**
 * Options for the .range() method.
 */
export interface RangeOptions {
  /** Defines if the start and end dates are included. Defaults to '[]'. */
  inclusivity?: "()" | "[]" | "(]" | "[)";
  /** If provided, returns an array of formatted strings instead of atemporal instances. */
  format?: string | Intl.DateTimeFormatOptions;
}

export type StartOfUnit =
  | "year"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";

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
  | "year"
  | "years"
  | "y"
  | "month"
  | "months" // 'm' is ambiguous with minute, so we omit it for month
  | "week"
  | "weeks"
  | "w"
  | "day"
  | "days"
  | "d"
  | "hour"
  | "hours"
  | "h"
  | "minute"
  | "minutes"
  | "m"
  | "second"
  | "seconds"
  | "s"
  | "millisecond"
  | "milliseconds"
  | "ms";

/**
 * Defines the units of time that can be set on an atemporal instance.
 */
export type SettableUnit =
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond"
  | "quarter";

/**
 * Represents a date range with start and end dates.
 * Used by the dateRangeOverlap plugin for overlap detection.
 */
export interface DateRange {
  /** The start date of the range */
  start: DateInput;
  /** The end date of the range */
  end: DateInput;
}

/**
 * Result of a date range overlap detection operation.
 * Contains both the overlap status and the overlapping period if any.
 */
export interface OverlapResult {
  /** Whether the two date ranges overlap */
  overlaps: boolean;
  /** The overlapping date range, or null if no overlap exists */
  overlapRange: DateRange | null;
}

/**
 * Configuration options for date range overlap detection.
 * Allows customization of overlap behavior and validation.
 */
export interface OverlapOptions {
  /** Whether touching ranges (sharing a boundary) count as overlap. Defaults to true. */
  includeBoundaries?: boolean;
  /** Timezone for date interpretation. Uses default timezone if not specified. */
  timezone?: string;
  /** Whether to perform strict input validation. Defaults to true. */
  strictValidation?: boolean;
}

/**
 * A map of format tokens to their string replacement functions. Used by the `.format()` method.
 */
export type FormatTokenMap = {
  [key: string]: () => string;
};

/**
 * The type for the core `atemporal` function before static properties are attached.
 */
export type AtemporalFunction = (
  input?: DateInput,
  timeZone?: string
) => TemporalWrapper;

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
   * Returns the earliest date from a list of inputs.
   */
  min: (...args: (DateInput | DateInput[])[]) => TemporalWrapper;

  /**
   * Returns the latest date from a list of inputs.
   */
  max: (...args: (DateInput | DateInput[])[]) => TemporalWrapper;

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
   * Loads multiple plugins asynchronously.
   * @param pluginNames Array of plugin names to load
   * @param options Optional configuration object for each plugin
   */
  lazyLoadMultiple: (
    pluginNames: string[],
    options?: Record<string, any>
  ) => Promise<void>;

  /**
   * Gets the list of all available plugins.
   */
  getAvailablePlugins: () => string[];

  /**
   * Gets information about the current Temporal implementation being used.
   * @returns Object containing information about whether native or polyfilled Temporal is being used
   */
  getTemporalInfo: () => {
    isNative: boolean;
    environment: "browser" | "node" | "unknown";
    version: "native" | "polyfill";
  };

  /**
   * Checks if two date ranges overlap and returns the overlapping period.
   * This method is added by the dateRangeOverlap plugin.
   * @param range1 - First date range for comparison
   * @param range2 - Second date range for comparison
   * @param options - Optional configuration for overlap detection
   * @returns Object containing overlap status and overlapping range if any
   */
  checkDateRangeOverlap?: (
    range1: DateRange,
    range2: DateRange,
    options?: OverlapOptions
  ) => OverlapResult;

  duration(durationLike: Temporal.DurationLike | string): Temporal.Duration;
}

/**
 * Defines the shape of a plugin for atemporal.
 */
export type Plugin = (
  Atemporal: typeof TemporalWrapper,
  atemporal: AtemporalFactory,
  options?: any
) => void;
