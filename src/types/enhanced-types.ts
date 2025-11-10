/**
 * @file Enhanced TypeScript types with stricter generics and specific error types
 */

import type { Temporal } from '@js-temporal/polyfill';
import type { FirebaseTimestampLike } from '../types';

/**
 * Strict input types for parsing operations
 */
export type TemporalInput = 
  | undefined
  | null
  | string
  | number
  | Date
  | Temporal.ZonedDateTime
  | Temporal.PlainDateTime
  | Temporal.PlainDate
  | Temporal.PlainTime
  | Temporal.Instant
  | TemporalWrapper
  | FirebaseTimestamp
  | TemporalLike
  | ArrayLike<number>
  | Record<string, unknown>;

/**
 * Firebase Timestamp interface - supports both standard and underscore formats
 */
export interface FirebaseTimestamp {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
  toDate(): Date;
}

/**
 * Helper type to extract timestamp values from either format
 */
export type FirebaseTimestampValues = {
  seconds: number;
  nanoseconds: number;
};

/**
 * Helper function to extract timestamp values from either format
 * Supports both standard format (seconds/nanoseconds) and underscore format (_seconds/_nanoseconds)
 */
export function extractFirebaseTimestampValues(value: unknown): FirebaseTimestampValues | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  
  const obj = value as Record<string, unknown>;
  
  // Check for standard format (seconds/nanoseconds)
  if ('seconds' in obj && 'nanoseconds' in obj &&
      typeof obj.seconds === 'number' && 
      typeof obj.nanoseconds === 'number') {
    return {
      seconds: obj.seconds,
      nanoseconds: obj.nanoseconds
    };
  }
  
  // Check for underscore format (_seconds/_nanoseconds)
  if ('_seconds' in obj && '_nanoseconds' in obj &&
      typeof obj._seconds === 'number' && 
      typeof obj._nanoseconds === 'number') {
    return {
      seconds: obj._seconds,
      nanoseconds: obj._nanoseconds
    };
  }
  
  return null;
}

/**
 * Temporal-like object interface
 */
export interface TemporalLike {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
  microsecond?: number;
  nanosecond?: number;
  timeZone?: string;
  calendar?: string;
}

/**
 * Array-like interface for temporal inputs
 */
export interface ArrayLike<T> {
  readonly length: number;
  readonly [n: number]: T;
}

/**
 * Specific error types for better error handling
 */
export class TemporalParseError extends Error {
  readonly code: string;
  readonly input: unknown;
  readonly context?: string;
  
  constructor(message: string, input: unknown, code: string = 'PARSE_ERROR', context?: string) {
    super(message);
    this.name = 'TemporalParseError';
    this.code = code;
    this.input = input;
    this.context = context;
  }
}

export class TemporalTimezoneError extends Error {
  readonly code: string;
  readonly timezone: string;
  readonly suggestion?: string;
  
  constructor(message: string, timezone: string, code: string = 'TIMEZONE_ERROR', suggestion?: string) {
    super(message);
    this.name = 'TemporalTimezoneError';
    this.code = code;
    this.timezone = timezone;
    this.suggestion = suggestion;
  }
}

export class TemporalFormatError extends Error {
  readonly code: string;
  readonly format: string;
  readonly position?: number;
  
  constructor(message: string, format: string, code: string = 'FORMAT_ERROR', position?: number) {
    super(message);
    this.name = 'TemporalFormatError';
    this.code = code;
    this.format = format;
    this.position = position;
  }
}

export class TemporalCacheError extends Error {
  readonly code: string;
  readonly operation: string;
  readonly cacheType?: string;
  
  constructor(message: string, operation: string, code: string = 'CACHE_ERROR', cacheType?: string) {
    super(message);
    this.name = 'TemporalCacheError';
    this.code = code;
    this.operation = operation;
    this.cacheType = cacheType;
  }
}

/**
 * Union type for all temporal errors
 */
export type TemporalError = 
  | TemporalParseError
  | TemporalTimezoneError
  | TemporalFormatError
  | TemporalCacheError;

/**
 * Result type for operations that can fail
 */
export type TemporalResult<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: TemporalError };

/**
 * Strict locale type
 */
export type LocaleString = 
  | 'en-US' | 'en-GB' | 'en-CA' | 'en-AU'
  | 'es-ES' | 'es-MX' | 'es-AR'
  | 'fr-FR' | 'fr-CA'
  | 'de-DE' | 'de-AT' | 'de-CH'
  | 'it-IT'
  | 'pt-BR' | 'pt-PT'
  | 'ru-RU'
  | 'ja-JP'
  | 'ko-KR'
  | 'zh-CN' | 'zh-TW'
  | 'ar-SA'
  | 'hi-IN'
  | string; // Allow custom locales

/**
 * Strict timezone type (common timezones)
 */
export type TimezoneString = 
  | 'UTC'
  | 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles'
  | 'America/Toronto' | 'America/Vancouver'
  | 'America/Mexico_City' | 'America/Sao_Paulo' | 'America/Buenos_Aires'
  | 'Europe/London' | 'Europe/Paris' | 'Europe/Berlin' | 'Europe/Rome' | 'Europe/Madrid'
  | 'Europe/Amsterdam' | 'Europe/Stockholm' | 'Europe/Moscow'
  | 'Asia/Tokyo' | 'Asia/Seoul' | 'Asia/Shanghai' | 'Asia/Hong_Kong' | 'Asia/Singapore'
  | 'Asia/Mumbai' | 'Asia/Dubai' | 'Asia/Bangkok'
  | 'Australia/Sydney' | 'Australia/Melbourne' | 'Australia/Perth'
  | 'Pacific/Auckland'
  | string; // Allow custom timezones

/**
 * Calendar type
 */
export type CalendarString = 
  | 'iso8601'
  | 'gregory'
  | 'buddhist'
  | 'chinese'
  | 'coptic'
  | 'dangi'
  | 'ethioaa'
  | 'ethiopic'
  | 'hebrew'
  | 'indian'
  | 'islamic'
  | 'islamic-umalqura'
  | 'islamic-tbla'
  | 'islamic-civil'
  | 'islamic-rgsa'
  | 'iso8601'
  | 'japanese'
  | 'persian'
  | 'roc'
  | string; // Allow custom calendars

/**
 * Time unit with strict typing
 */
export type TimeUnit = 
  | 'year' | 'years'
  | 'month' | 'months'
  | 'week' | 'weeks'
  | 'day' | 'days'
  | 'hour' | 'hours'
  | 'minute' | 'minutes'
  | 'second' | 'seconds'
  | 'millisecond' | 'milliseconds'
  | 'microsecond' | 'microseconds'
  | 'nanosecond' | 'nanoseconds';

/**
 * Singular time units only
 */
export type SingularTimeUnit = 
  | 'year' | 'month' | 'week' | 'day'
  | 'hour' | 'minute' | 'second'
  | 'millisecond' | 'microsecond' | 'nanosecond';

/**
 * Plural time units only
 */
export type PluralTimeUnit = 
  | 'years' | 'months' | 'weeks' | 'days'
  | 'hours' | 'minutes' | 'seconds'
  | 'milliseconds' | 'microseconds' | 'nanoseconds';

/**
 * Rounding mode for temporal operations
 */
export type RoundingMode = 
  | 'ceil'
  | 'floor'
  | 'trunc'
  | 'halfExpand'
  | 'halfEven'
  | 'halfTrunc'
  | 'halfCeil'
  | 'halfFloor';

/**
 * Overflow behavior for temporal operations
 */
export type OverflowBehavior = 'constrain' | 'reject';

/**
 * Disambiguation for timezone operations
 */
export type Disambiguation = 'compatible' | 'earlier' | 'later' | 'reject';

/**
 * Offset behavior for timezone operations
 */
export type OffsetBehavior = 'prefer' | 'use' | 'ignore' | 'reject';

/**
 * Strict options for temporal operations
 */
export interface StrictTemporalOptions {
  readonly locale?: LocaleString;
  readonly timeZone?: TimezoneString;
  readonly calendar?: CalendarString;
  readonly overflow?: OverflowBehavior;
  readonly disambiguation?: Disambiguation;
  readonly offset?: OffsetBehavior;
  readonly roundingMode?: RoundingMode;
  readonly smallestUnit?: TimeUnit;
  readonly largestUnit?: TimeUnit;
  readonly roundingIncrement?: number;
}

/**
 * Parsing options with strict typing
 */
export interface StrictParsingOptions extends StrictTemporalOptions {
  readonly strict?: boolean;
  readonly fallbackTimeZone?: TimezoneString;
  readonly validateInput?: boolean;
  readonly throwOnInvalid?: boolean;
}

/**
 * Formatting options with strict typing
 */
export interface StrictFormattingOptions extends StrictTemporalOptions {
  readonly format?: string;
  readonly useCache?: boolean;
  readonly poolTokens?: boolean;
  readonly precompile?: boolean;
}

/**
 * Comparison options with strict typing
 */
export interface StrictComparisonOptions extends StrictTemporalOptions {
  readonly unit?: TimeUnit;
  readonly precision?: 'exact' | 'truncated' | 'rounded';
  readonly useCache?: boolean;
  readonly absolute?: boolean;
}

/**
 * Diff options with strict typing
 */
export interface StrictDiffOptions extends StrictComparisonOptions {
  readonly asObject?: boolean;
  readonly includePartial?: boolean;
}

/**
 * Generic wrapper for temporal operations
 */
export interface TemporalWrapper {
  readonly _temporal: Temporal.ZonedDateTime;
  readonly _isTemporalWrapper: true;
  
  // Core methods
  format(format?: string, options?: StrictFormattingOptions): string;
  add(amount: number | Temporal.Duration, unit?: TimeUnit): TemporalWrapper;
  subtract(amount: number | Temporal.Duration, unit?: TimeUnit): TemporalWrapper;
  diff(other: TemporalInput, unit?: TimeUnit, options?: StrictDiffOptions): number | Temporal.Duration;
  
  // Comparison methods
  isBefore(other: TemporalInput, unit?: TimeUnit): boolean;
  isAfter(other: TemporalInput, unit?: TimeUnit): boolean;
  isSame(other: TemporalInput, unit?: TimeUnit): boolean;
  isSameOrBefore(other: TemporalInput, unit?: TimeUnit): boolean;
  isSameOrAfter(other: TemporalInput, unit?: TimeUnit): boolean;
  isBetween(start: TemporalInput, end: TemporalInput, unit?: TimeUnit): boolean;
  
  // Manipulation methods
  startOf(unit: TimeUnit): TemporalWrapper;
  endOf(unit: TimeUnit): TemporalWrapper;
  set(values: Partial<TemporalLike>): TemporalWrapper;
  with(values: Partial<TemporalLike>): TemporalWrapper;
  
  // Conversion methods
  toDate(): Date;
  toISOString(): string;
  toString(): string;
  valueOf(): number;
  toJSON(): string;
  
  // Timezone methods
  withTimeZone(timeZone: TimezoneString): TemporalWrapper;
  withCalendar(calendar: CalendarString): TemporalWrapper;
  
  // Getters
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  readonly microsecond: number;
  readonly nanosecond: number;
  readonly dayOfWeek: number;
  readonly dayOfYear: number;
  readonly weekOfYear: number;
  readonly daysInMonth: number;
  readonly daysInYear: number;
  readonly inLeapYear: boolean;
  readonly timeZoneId: string;
  readonly calendarId: string;
  readonly epochNanoseconds: bigint;
  readonly epochMicroseconds: number;
  readonly epochMilliseconds: number;
  readonly epochSeconds: number;
}

/**
 * Type guard functions
 */
export function isTemporalWrapper(value: unknown): value is TemporalWrapper {
  return typeof value === 'object' && 
         value !== null && 
         '_isTemporalWrapper' in value && 
         (value as any)._isTemporalWrapper === true;
}

export function isTemporalError(error: unknown): error is TemporalError {
  return error instanceof Error && 
         (error instanceof TemporalParseError ||
          error instanceof TemporalTimezoneError ||
          error instanceof TemporalFormatError ||
          error instanceof TemporalCacheError);
}

export function isFirebaseTimestamp(value: unknown): value is FirebaseTimestamp {
  return typeof value === 'object' &&
         value !== null &&
         ('toDate' in value && typeof (value as any).toDate === 'function') &&
         (('seconds' in value && 'nanoseconds' in value) || 
          ('_seconds' in value && '_nanoseconds' in value));
}

export function isFirebaseTimestampLike(value: unknown): value is FirebaseTimestampLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  // Check for standard format (seconds/nanoseconds)
  const hasStandardFormat = 'seconds' in obj && 'nanoseconds' in obj &&
                           typeof obj.seconds === 'number' && 
                           typeof obj.nanoseconds === 'number';
  
  // Check for underscore format (_seconds/_nanoseconds)
  const hasUnderscoreFormat = '_seconds' in obj && '_nanoseconds' in obj &&
                             typeof obj._seconds === 'number' && 
                             typeof obj._nanoseconds === 'number';
  
  return hasStandardFormat || hasUnderscoreFormat;
}

/**
 * Checks if an object has Firebase Timestamp structure (for confidence evaluation)
 * More lenient than isFirebaseTimestampLike - only checks for property presence
 * Supports both standard format (seconds/nanoseconds) and underscore format (_seconds/_nanoseconds)
 */
export function hasFirebaseTimestampStructure(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  // Check for standard format (seconds/nanoseconds)
  const hasStandardFormat = 'seconds' in obj && 'nanoseconds' in obj;
  
  // Check for underscore format (_seconds/_nanoseconds)
  const hasUnderscoreFormat = '_seconds' in obj && '_nanoseconds' in obj;
  
  return hasStandardFormat || hasUnderscoreFormat;
}

export function isTemporalLike(value: unknown): value is TemporalLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  const temporalKeys = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond', 'timeZone', 'calendar'];
  
  return temporalKeys.some(key => key in obj);
}

export function isArrayLike(value: unknown): value is ArrayLike<number> {
  return typeof value === 'object' &&
         value !== null &&
         'length' in value &&
         typeof (value as any).length === 'number';
}

/**
 * Utility types for better type inference
 */
export type ExtractTimeUnit<T extends string> = T extends `${infer U}s` 
  ? U extends SingularTimeUnit 
    ? U 
    : never
  : T extends SingularTimeUnit 
    ? T 
    : never;

export type NormalizeTimeUnit<T extends TimeUnit> = T extends PluralTimeUnit
  ? ExtractTimeUnit<T>
  : T;

/**
 * Conditional types for better API design
 */
export type FormatResult<T extends StrictFormattingOptions> = 
  T['format'] extends string ? string : string;

export type DiffResult<T extends StrictDiffOptions> = 
  T['unit'] extends TimeUnit 
    ? number 
    : T['asObject'] extends true 
      ? Temporal.Duration 
      : number | Temporal.Duration;

/**
 * Brand types for additional type safety
 */
export type ValidatedInput = TemporalInput & { readonly __validated: unique symbol };
export type ParsedTemporal = Temporal.ZonedDateTime & { readonly __parsed: unique symbol };
export type CachedResult<T> = T & { readonly __cached: unique symbol };

/**
 * Configuration types
 */
export interface GlobalTemporalConfig {
  readonly defaultLocale: LocaleString;
  readonly defaultTimeZone: TimezoneString;
  readonly defaultCalendar: CalendarString;
  readonly enableCaching: boolean;
  readonly enableOptimizations: boolean;
  readonly strictMode: boolean;
  readonly throwOnErrors: boolean;
}

/**
 * Plugin interface for extensibility
 */
export interface TemporalPlugin {
  readonly name: string;
  readonly version: string;
  readonly initialize?: (config: GlobalTemporalConfig) => void;
  readonly destroy?: () => void;
  readonly parsers?: Record<string, (input: unknown) => TemporalResult<Temporal.ZonedDateTime>>;
  readonly formatters?: Record<string, (date: Temporal.ZonedDateTime, options?: any) => string>;
  readonly comparators?: Record<string, (a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime, options?: any) => boolean | number>;
}

/**
 * Performance monitoring types
 */
export interface PerformanceMetrics {
  readonly parsing: {
    readonly totalOperations: number;
    readonly averageTime: number;
    readonly cacheHitRatio: number;
    readonly errorRate: number;
  };
  readonly formatting: {
    readonly totalOperations: number;
    readonly averageTime: number;
    readonly cacheHitRatio: number;
    readonly tokenPoolEfficiency: number;
  };
  readonly comparison: {
    readonly totalOperations: number;
    readonly averageTime: number;
    readonly fastPathRatio: number;
    readonly cacheHitRatio: number;
  };
  readonly memory: {
    readonly totalCacheSize: number;
    readonly estimatedUsage: number;
    readonly efficiency: number;
  };
}