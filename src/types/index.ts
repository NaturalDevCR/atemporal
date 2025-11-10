/**
 * @file Enhanced TypeScript types and type registry for temporal operations
 */

// Export all enhanced types
export type {
  TemporalInput,
  FirebaseTimestamp,
  TemporalLike,
  ArrayLike,
  TemporalWrapper,
  TemporalError,
  TemporalResult,
  LocaleString,
  TimezoneString,
  CalendarString,
  TimeUnit,
  SingularTimeUnit,
  PluralTimeUnit,
  RoundingMode,
  OverflowBehavior,
  Disambiguation,
  OffsetBehavior,
  StrictTemporalOptions,
  StrictParsingOptions,
  StrictFormattingOptions,
  StrictComparisonOptions,
  StrictDiffOptions,
  ExtractTimeUnit,
  NormalizeTimeUnit,
  FormatResult,
  DiffResult,
  ValidatedInput,
  ParsedTemporal,
  CachedResult,
  GlobalTemporalConfig,
  TemporalPlugin,
  PerformanceMetrics
} from './enhanced-types';

// Import Temporal polyfill
import { Temporal } from '@js-temporal/polyfill';

// Import error classes, types, and type guards for use in assertion functions
import {
  TemporalParseError,
  TemporalTimezoneError,
  TemporalFormatError,
  TemporalCacheError,
  isTemporalWrapper,
  isTemporalError,
  isFirebaseTimestamp,
  isFirebaseTimestampLike,
  isTemporalLike,
  isArrayLike
} from './enhanced-types';
import type { 
  GlobalTemporalConfig, 
  TemporalError, 
  TemporalResult,
  TemporalInput,
  CachedResult,
  ParsedTemporal,
  ValidatedInput,
  TimeUnit,
  SingularTimeUnit,
  PluralTimeUnit,
  LocaleString,
  TimezoneString
} from './enhanced-types';

// Export type guards and utility functions
export {
  isTemporalWrapper,
  isTemporalError,
  isFirebaseTimestamp,
  isFirebaseTimestampLike,
  hasFirebaseTimestampStructure,
  extractFirebaseTimestampValues,
  isTemporalLike,
  isArrayLike
} from './enhanced-types';

// Error classes are exported directly from enhanced-types.ts
// Import them directly from './enhanced-types' where needed

// Export type registry types and classes
export type {
  TypeValidationResult,
  TypeConverter,
  TypeValidator,
  TypeNormalizer,
  TypeRegistryEntry
} from './type-registry';

export {
  TemporalTypeRegistry,
  globalTypeRegistry,
  validateType,
  inferInputType,
  convertType,
  normalizeInput,
  registerCustomType
} from './type-registry';

// Re-export commonly used Temporal types for convenience
export { Temporal } from '@js-temporal/polyfill';

/**
 * Type utility functions for better developer experience
 */

/**
 * Create a branded type for validated inputs
 */
export function createValidatedInput<T extends TemporalInput>(input: T): ValidatedInput {
  return input as ValidatedInput;
}

/**
 * Create a branded type for parsed temporal values
 */
export function createParsedTemporal(temporal: Temporal.ZonedDateTime): ParsedTemporal {
  return temporal as ParsedTemporal;
}

/**
 * Create a branded type for cached results
 */
export function createCachedResult<T>(result: T): CachedResult<T> {
  return result as CachedResult<T>;
}

/**
 * Type assertion helpers
 */
export function assertTemporalInput(input: unknown): asserts input is TemporalInput {
  if (input === null || input === undefined) {
    return; // null and undefined are valid TemporalInput
  }
  
  const validTypes = [
    'string',
    'number'
  ];
  
  if (validTypes.includes(typeof input)) {
    return;
  }
  
  if (input instanceof Date ||
      isTemporalWrapper(input) ||
      isFirebaseTimestamp(input) ||
      isTemporalLike(input) ||
      isArrayLike(input)) {
    return;
  }
  
  // Check for Temporal types
  if (typeof input === 'object' && input !== null) {
    const proto = Object.getPrototypeOf(input);
    const constructorName = proto?.constructor?.name;
    
    if (constructorName && [
      'ZonedDateTime',
      'PlainDateTime', 
      'PlainDate',
      'PlainTime',
      'Instant'
    ].includes(constructorName)) {
      return;
    }
    
    // Allow complex objects and circular references to pass through
    // They might be temporal-like objects or contain temporal data
    return;
  }
  
  throw new TemporalParseError(
    `Invalid temporal input type: ${typeof input}`,
    input,
    'INVALID_INPUT_TYPE'
  );
}

export function assertTimeUnit(unit: unknown): asserts unit is TimeUnit {
  const validUnits: TimeUnit[] = [
    'year', 'years',
    'month', 'months', 
    'week', 'weeks',
    'day', 'days',
    'hour', 'hours',
    'minute', 'minutes',
    'second', 'seconds',
    'millisecond', 'milliseconds',
    'microsecond', 'microseconds',
    'nanosecond', 'nanoseconds'
  ];
  
  if (typeof unit !== 'string' || !validUnits.includes(unit as TimeUnit)) {
    throw new TemporalParseError(
      `Invalid time unit: ${unit}. Valid units are: ${validUnits.join(', ')}`,
      unit,
      'INVALID_TIME_UNIT'
    );
  }
}

export function assertLocale(locale: unknown): asserts locale is LocaleString {
  if (typeof locale !== 'string') {
    throw new TemporalFormatError(
      `Invalid locale type: ${typeof locale}. Expected string.`,
      String(locale),
      'INVALID_LOCALE_TYPE'
    );
  }
  
  // Basic locale format validation (language-region)
  const localePattern = /^[a-z]{2,3}(-[A-Z]{2})?$/;
  if (!localePattern.test(locale)) {
    // Allow common locales even if they don't match the strict pattern
    const commonLocales = [
      'en-US', 'en-GB', 'en-CA', 'en-AU',
      'es-ES', 'es-MX', 'es-AR',
      'fr-FR', 'fr-CA',
      'de-DE', 'de-AT', 'de-CH',
      'it-IT', 'pt-BR', 'pt-PT',
      'ru-RU', 'ja-JP', 'ko-KR',
      'zh-CN', 'zh-TW', 'ar-SA', 'hi-IN'
    ];
    
    if (!commonLocales.includes(locale)) {
      console.warn(`Potentially invalid locale format: ${locale}`);
    }
  }
}

export function assertTimezone(timezone: unknown): asserts timezone is TimezoneString {
  if (typeof timezone !== 'string') {
    throw new TemporalTimezoneError(
      `Invalid timezone type: ${typeof timezone}. Expected string.`,
      String(timezone),
      'INVALID_TIMEZONE_TYPE'
    );
  }
  
  // Basic timezone validation - allow IANA timezone names and UTC
  if (timezone === 'UTC') {
    return;
  }
  
  // Basic IANA timezone format validation
  const timezonePattern = /^[A-Z][a-z]+\/[A-Z][a-z_]+$/;
  if (!timezonePattern.test(timezone)) {
    // Allow some common variations
    const commonTimezones = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Mumbai',
      'Australia/Sydney', 'Pacific/Auckland'
    ];
    
    if (!commonTimezones.includes(timezone)) {
      console.warn(`Potentially invalid timezone format: ${timezone}`);
    }
  } else {
    // Even if it matches the pattern, warn for obviously invalid ones
    if (timezone.includes('Invalid/')) {
      console.warn(`Potentially invalid timezone format: ${timezone}`);
    }
  }
}

/**
 * Utility functions for working with time units
 */
export function normalizeTimeUnit(unit: TimeUnit): SingularTimeUnit {
  const unitMap: Record<TimeUnit, SingularTimeUnit> = {
    'year': 'year',
    'years': 'year',
    'month': 'month',
    'months': 'month',
    'week': 'week',
    'weeks': 'week',
    'day': 'day',
    'days': 'day',
    'hour': 'hour',
    'hours': 'hour',
    'minute': 'minute',
    'minutes': 'minute',
    'second': 'second',
    'seconds': 'second',
    'millisecond': 'millisecond',
    'milliseconds': 'millisecond',
    'microsecond': 'microsecond',
    'microseconds': 'microsecond',
    'nanosecond': 'nanosecond',
    'nanoseconds': 'nanosecond'
  };
  
  return unitMap[unit];
}

export function pluralizeTimeUnit(unit: SingularTimeUnit): PluralTimeUnit {
  const pluralMap: Record<SingularTimeUnit, PluralTimeUnit> = {
    'year': 'years',
    'month': 'months',
    'week': 'weeks',
    'day': 'days',
    'hour': 'hours',
    'minute': 'minutes',
    'second': 'seconds',
    'millisecond': 'milliseconds',
    'microsecond': 'microseconds',
    'nanosecond': 'nanoseconds'
  };
  
  return pluralMap[unit];
}

export function isTimeUnitPlural(unit: TimeUnit): unit is PluralTimeUnit {
  return unit.endsWith('s') && unit !== 'nanoseconds' ? 
    unit.slice(0, -1) !== unit : 
    unit.endsWith('s');
}

export function isTimeUnitSingular(unit: TimeUnit): unit is SingularTimeUnit {
  return !isTimeUnitPlural(unit);
}

/**
 * Utility functions for working with temporal results
 */
export function createSuccessResult<T>(data: T): TemporalResult<T> {
  return { success: true, data };
}

export function createErrorResult<T>(error: TemporalError): TemporalResult<T> {
  return { success: false, error };
}

export function isSuccessResult<T>(result: TemporalResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

export function isErrorResult<T>(result: TemporalResult<T>): result is { success: false; error: TemporalError } {
  return result.success === false;
}

/**
 * Default configuration values
 */
export const DEFAULT_TEMPORAL_CONFIG: Readonly<GlobalTemporalConfig> = Object.freeze({
  defaultLocale: 'en-US',
  defaultTimeZone: 'UTC',
  defaultCalendar: 'iso8601',
  enableCaching: true,
  enableOptimizations: true,
  strictMode: false,
  throwOnErrors: true
} as const);

/**
 * Common time unit constants
 */
export const TIME_UNITS = {
  SINGULAR: [
    'year', 'month', 'week', 'day',
    'hour', 'minute', 'second',
    'millisecond', 'microsecond', 'nanosecond'
  ] as const,
  PLURAL: [
    'years', 'months', 'weeks', 'days',
    'hours', 'minutes', 'seconds',
    'milliseconds', 'microseconds', 'nanoseconds'
  ] as const,
  ALL: [
    'year', 'years', 'month', 'months', 'week', 'weeks', 'day', 'days',
    'hour', 'hours', 'minute', 'minutes', 'second', 'seconds',
    'millisecond', 'milliseconds', 'microsecond', 'microseconds',
    'nanosecond', 'nanoseconds'
  ] as const
} as const;

/**
 * Common locale constants
 */
export const COMMON_LOCALES = {
  ENGLISH: ['en-US', 'en-GB', 'en-CA', 'en-AU'] as const,
  SPANISH: ['es-ES', 'es-MX', 'es-AR'] as const,
  FRENCH: ['fr-FR', 'fr-CA'] as const,
  GERMAN: ['de-DE', 'de-AT', 'de-CH'] as const,
  ASIAN: ['ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'] as const,
  ALL: [
    'en-US', 'en-GB', 'en-CA', 'en-AU',
    'es-ES', 'es-MX', 'es-AR',
    'fr-FR', 'fr-CA',
    'de-DE', 'de-AT', 'de-CH',
    'it-IT', 'pt-BR', 'pt-PT',
    'ru-RU', 'ja-JP', 'ko-KR',
    'zh-CN', 'zh-TW', 'ar-SA', 'hi-IN', 'nl-NL'
  ] as const
} as const;

/**
 * Common timezone constants
 */
export const COMMON_TIMEZONES = {
  UTC: 'UTC' as const,
  AMERICA: [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
    'America/Sao_Paulo', 'America/Buenos_Aires'
  ] as const,
  EUROPE: [
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
    'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow'
  ] as const,
  ASIA: [
    'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong',
    'Asia/Singapore', 'Asia/Mumbai', 'Asia/Dubai', 'Asia/Bangkok'
  ] as const,
  OCEANIA: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland'] as const,
  ALL: [
    'UTC',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
    'America/Sao_Paulo', 'America/Buenos_Aires',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
    'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow',
    'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong',
    'Asia/Singapore', 'Asia/Mumbai', 'Asia/Dubai', 'Asia/Bangkok',
    'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland'
  ] as const
} as const;