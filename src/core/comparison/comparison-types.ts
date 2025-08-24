/**
 * @file Type definitions for comparison operations
 */

import type { Temporal } from '@js-temporal/polyfill';

/**
 * Time units for comparison operations
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
 * Types of comparison operations
 */
export type ComparisonType = 
  | 'isBefore'
  | 'isAfter'
  | 'isSame'
  | 'isSameOrBefore'
  | 'isSameOrAfter'
  | 'isBetween'
  | 'diff'
  | 'duration';

/**
 * Result of a comparison operation
 */
export interface ComparisonResult {
  result: boolean | number | Temporal.Duration;
  type: ComparisonType;
  unit?: TimeUnit;
  precision: 'exact' | 'truncated' | 'rounded';
  cached: boolean;
  computeTime: number;
}

/**
 * Options for comparison operations
 */
export interface ComparisonOptions {
  unit?: TimeUnit;
  precision?: 'exact' | 'truncated' | 'rounded';
  useCache?: boolean;
  timezone?: string;
  calendar?: string;
  largestUnit?: TimeUnit;
  smallestUnit?: TimeUnit;
  roundingMode?: 'ceil' | 'floor' | 'trunc' | 'halfExpand';
}

/**
 * Performance metrics for comparison operations
 */
export interface ComparisonMetrics {
  totalComparisons: number;
  cacheHits: number;
  cacheMisses: number;
  averageComputeTime: number;
  fastPathHits: number;
  operationBreakdown: Record<ComparisonType, number>;
  unitBreakdown: Record<TimeUnit, number>;
}

/**
 * Context for comparison operations
 */
export interface ComparisonContext {
  date1: Temporal.ZonedDateTime;
  date2: Temporal.ZonedDateTime;
  type: ComparisonType;
  options: ComparisonOptions;
  cacheKey?: string;
}

/**
 * Comparison strategy interface
 */
export interface ComparisonStrategy {
  canHandle(context: ComparisonContext): boolean;
  execute(context: ComparisonContext): ComparisonResult;
  priority: number;
}

/**
 * Fast path comparison result
 */
export interface FastPathResult {
  result: boolean | number | Temporal.Duration;
  wasUsed: boolean;
  reason?: string;
}

/**
 * Diff calculation options
 */
export interface DiffOptions extends ComparisonOptions {
  absolute?: boolean;
  asObject?: boolean;
  includePartial?: boolean;
}

/**
 * Duration breakdown for detailed diff results
 */
export interface DurationBreakdown {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  microseconds: number;
  nanoseconds: number;
  total: {
    years: number;
    months: number;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    microseconds: number;
    nanoseconds: number;
  };
}

/**
 * Comparison optimization hints
 */
export interface OptimizationHints {
  sameTimeZone: boolean;
  sameCalendar: boolean;
  sameYear: boolean;
  sameMonth: boolean;
  sameDay: boolean;
  orderOfMagnitude: 'nanoseconds' | 'microseconds' | 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years';
}

/**
 * Comparison cache entry
 */
export interface ComparisonCacheEntry {
  result: ComparisonResult;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

/**
 * Comparison cache statistics
 */
export interface ComparisonCacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  hitRatio: number;
  hitRate: number;
  averageAccessTime: number;
  efficiency: number;
}

/**
 * Comparison performance profile
 */
export interface ComparisonProfile {
  operation: ComparisonType;
  averageTime: number;
  cacheHitRatio: number;
  fastPathRatio: number;
  recommendedStrategy: string;
}

/**
 * Time unit conversion factors (to nanoseconds)
 */
export const TIME_UNIT_FACTORS = {
  nanosecond: 1,
  nanoseconds: 1,
  microsecond: 1000,
  microseconds: 1000,
  millisecond: 1000000,
  milliseconds: 1000000,
  second: 1000000000,
  seconds: 1000000000,
  minute: 60000000000,
  minutes: 60000000000,
  hour: 3600000000000,
  hours: 3600000000000,
  day: 86400000000000,
  days: 86400000000000,
  week: 604800000000000,
  weeks: 604800000000000,
  // Approximate values for months and years (variable duration)
  month: 2629746000000000, // Average month (30.44 days)
  months: 2629746000000000,
  year: 31556952000000000, // Average year (365.25 days)
  years: 31556952000000000,
} as const;

/**
 * Common comparison thresholds for optimization
 */
export const COMPARISON_THRESHOLDS = {
  SAME_INSTANT_NS: 0,
  SAME_SECOND_NS: 1000000000,
  SAME_MINUTE_NS: 60000000000,
  SAME_HOUR_NS: 3600000000000,
  SAME_DAY_NS: 86400000000000,
  FAST_PATH_MAX_DIFF_DAYS: 365 * 10, // 10 years
  CACHE_WORTHINESS_THRESHOLD_NS: 1000000, // 1ms
} as const;

/**
 * Precision levels for different operations
 */
export const PRECISION_LEVELS = {
  exact: {
    description: 'Exact nanosecond precision',
    tolerance: 0
  },
  truncated: {
    description: 'Truncated to specified unit',
    tolerance: 'unit-dependent'
  },
  rounded: {
    description: 'Rounded to nearest unit',
    tolerance: 'unit-dependent'
  }
} as const;