/**
 * @file High-performance comparison engine with optimized strategies
 */

import type { Temporal } from '@js-temporal/polyfill';
import type {
  ComparisonResult,
  ComparisonOptions,
  ComparisonContext,
  ComparisonType,
  ComparisonStrategy,
  FastPathResult,
  OptimizationHints,
  TimeUnit,
  ComparisonMetrics
} from './comparison-types';
import { TIME_UNIT_FACTORS, COMPARISON_THRESHOLDS } from './comparison-types';
import { ComparisonCache } from './comparison-cache';
import { CacheKeys } from '../caching/cache-keys';

/**
 * Fast path strategy for simple comparisons
 */
class FastPathStrategy implements ComparisonStrategy {
  priority = 100;
  
  canHandle(context: ComparisonContext): boolean {
    const { date1, date2, type, options } = context;
    
    // Fast path for all comparison types without unit precision
    if (!options.unit && ['isBefore', 'isAfter', 'isSame', 'isSameOrBefore', 'isSameOrAfter'].includes(type)) {
      return true;
    }
    
    return false;
  }
  
  execute(context: ComparisonContext): ComparisonResult {
    const { date1, date2, type } = context;
    const startTime = performance.now();
    
    let result: boolean;
    
    if (date1.epochNanoseconds === date2.epochNanoseconds) {
      result = ['isSame', 'isSameOrBefore', 'isSameOrAfter'].includes(type);
    } else {
      const diff = date1.epochNanoseconds - date2.epochNanoseconds;
      switch (type) {
        case 'isBefore':
          result = diff < 0;
          break;
        case 'isAfter':
          result = diff > 0;
          break;
        case 'isSame':
          result = diff === BigInt(0);
          break;
        case 'isSameOrBefore':
          result = diff <= 0;
          break;
        case 'isSameOrAfter':
          result = diff >= 0;
          break;
        default:
          result = false;
      }
    }
    
    return {
      result,
      type,
      precision: 'exact',
      cached: false,
      computeTime: performance.now() - startTime
    };
  }
}

/**
 * Unit-based comparison strategy
 */
class UnitComparisonStrategy implements ComparisonStrategy {
  priority = 80;
  
  canHandle(context: ComparisonContext): boolean {
    return !!context.options.unit && context.type !== 'diff';
  }
  
  execute(context: ComparisonContext): ComparisonResult {
    const { date1, date2, type, options } = context;
    const startTime = performance.now();
    const unit = options.unit!;
    
    let result: boolean;
    
    // Truncate both dates to the specified unit
    const truncated1 = this.truncateToUnit(date1, unit);
    const truncated2 = this.truncateToUnit(date2, unit);
    
    const diff = truncated1.epochNanoseconds - truncated2.epochNanoseconds;
    
    switch (type) {
      case 'isSame':
        result = diff === BigInt(0);
        break;
      case 'isBefore':
        result = diff < BigInt(0);
        break;
      case 'isAfter':
        result = diff > BigInt(0);
        break;
      case 'isSameOrBefore':
        result = diff <= BigInt(0);
        break;
      case 'isSameOrAfter':
        result = diff >= BigInt(0);
        break;
      default:
        result = false;
    }
    
    return {
      result,
      type,
      unit,
      precision: 'truncated',
      cached: false,
      computeTime: performance.now() - startTime
    };
  }
  
  private truncateToUnit(date: Temporal.ZonedDateTime, unit: TimeUnit): Temporal.ZonedDateTime {
    const plainDateTime = date.toPlainDateTime();
    
    switch (unit) {
      case 'year':
      case 'years':
        return date.with({ month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
      
      case 'month':
      case 'months':
        return date.with({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
      
      case 'day':
      case 'days':
        return date.with({ hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
      
      case 'hour':
      case 'hours':
        return date.with({ minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
      
      case 'minute':
      case 'minutes':
        return date.with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
      
      case 'second':
      case 'seconds':
        return date.with({ millisecond: 0, microsecond: 0, nanosecond: 0 });
      
      case 'millisecond':
      case 'milliseconds':
        return date.with({ microsecond: 0, nanosecond: 0 });
      
      case 'microsecond':
      case 'microseconds':
        return date.with({ nanosecond: 0 });
      
      default:
        return date;
    }
  }
}

/**
 * Diff calculation strategy
 */
class DiffStrategy implements ComparisonStrategy {
  priority = 70;
  
  canHandle(context: ComparisonContext): boolean {
    return context.type === 'diff';
  }
  
  execute(context: ComparisonContext): ComparisonResult {
    const { date1, date2, options } = context;
    const startTime = performance.now();
    
    const diffOptions: any = {};
    
    if (options.largestUnit) {
      diffOptions.largestUnit = options.largestUnit;
    }
    if (options.smallestUnit) {
      diffOptions.smallestUnit = options.smallestUnit;
    }
    if (options.roundingMode) {
      diffOptions.roundingMode = options.roundingMode;
    }
    
    const duration = date1.until(date2, diffOptions);
    
    // If a specific unit is requested, return the value for that unit
    let result: number | Temporal.Duration = duration;
    if (options.unit) {
      result = this.extractUnitValue(duration, options.unit);
      // Negate the result to match expected behavior (negative when date1 < date2)
      if (typeof result === 'number') {
        result = -result;
      }
    }
    
    return {
      result,
      type: 'diff',
      unit: options.unit,
      precision: options.precision || 'exact',
      cached: false,
      computeTime: performance.now() - startTime
    };
  }
  
  private extractUnitValue(duration: Temporal.Duration, unit: TimeUnit): number {
    switch (unit) {
      case 'year':
      case 'years':
        return duration.total({ unit: 'years' });
      case 'month':
      case 'months':
        return duration.total({ unit: 'months' });
      case 'week':
      case 'weeks':
        return duration.total({ unit: 'weeks' });
      case 'day':
      case 'days':
        return duration.total({ unit: 'days' });
      case 'hour':
      case 'hours':
        return duration.total({ unit: 'hours' });
      case 'minute':
      case 'minutes':
        return duration.total({ unit: 'minutes' });
      case 'second':
      case 'seconds':
        return duration.total({ unit: 'seconds' });
      case 'millisecond':
      case 'milliseconds':
        return duration.total({ unit: 'milliseconds' });
      case 'microsecond':
      case 'microseconds':
        return duration.total({ unit: 'microseconds' });
      case 'nanosecond':
      case 'nanoseconds':
        return duration.total({ unit: 'nanoseconds' });
      default:
        return duration.total({ unit: 'seconds' });
    }
  }
}

/**
 * High-performance comparison engine
 */
export class ComparisonEngine {
  private static strategies: ComparisonStrategy[] = [
    new FastPathStrategy(),
    new UnitComparisonStrategy(),
    new DiffStrategy()
  ];
  
  private static cache = new ComparisonCache();
  
  private static metrics: ComparisonMetrics = {
    totalComparisons: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageComputeTime: 0,
    fastPathHits: 0,
    operationBreakdown: {} as Record<ComparisonType, number>,
    unitBreakdown: {} as Record<TimeUnit, number>
  };
  
  private static totalComputeTime = 0;
  
  /**
   * Performs a comparison operation
   */
  static compare(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime,
    type: ComparisonType,
    options: ComparisonOptions = {}
  ): ComparisonResult {
    const startTime = performance.now();
    this.metrics.totalComparisons++;
    
    // Update operation breakdown
    this.metrics.operationBreakdown[type] = (this.metrics.operationBreakdown[type] || 0) + 1;
    if (options.unit) {
      this.metrics.unitBreakdown[options.unit] = (this.metrics.unitBreakdown[options.unit] || 0) + 1;
    }
    
    const context: ComparisonContext = {
      date1,
      date2,
      type,
      options
    };
    
    // Check cache first
    if (options.useCache !== false) {
      const cacheKey = this.generateCacheKey(context);
      context.cacheKey = cacheKey;
      
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return {
          ...cached.result,
          cached: true
        } as ComparisonResult;
      }
      this.metrics.cacheMisses++;
    }
    
    // Find appropriate strategy
    const strategy = this.findStrategy(context);
    if (!strategy) {
      // Fallback to basic comparison for unsupported contexts
      const diff = date1.epochNanoseconds - date2.epochNanoseconds;
      let result: boolean | number | Temporal.Duration;
      
      switch (type) {
        case 'isBefore':
          result = diff < BigInt(0);
          break;
        case 'isAfter':
          result = diff > BigInt(0);
          break;
        case 'isSame':
          result = diff === BigInt(0);
          break;
        case 'isSameOrBefore':
          result = diff <= BigInt(0);
          break;
        case 'isSameOrAfter':
          result = diff >= BigInt(0);
          break;
        default:
          throw new Error(`No strategy found for comparison type: ${type}`);
      }
      
      return {
        result,
        type,
        precision: 'exact',
        cached: false,
        computeTime: performance.now() - startTime
      };
    }
    
    // Execute comparison
    const result = strategy.execute(context);
    
    // Track fast path usage
    if (strategy instanceof FastPathStrategy) {
      this.metrics.fastPathHits++;
    }
    
    // Cache the result
    if (options.useCache !== false && context.cacheKey) {
      const cacheEntry = {
        result: {
          result: result.result,
          type: result.type,
          unit: result.unit,
          precision: result.precision,
          cached: false,
          computeTime: result.computeTime
        },
        timestamp: Date.now(),
        accessCount: 1,
        lastAccess: Date.now()
      };
      this.cache.set(context.cacheKey, cacheEntry);
    }
    
    // Update metrics
    const computeTime = performance.now() - startTime;
    this.totalComputeTime += computeTime;
    this.metrics.averageComputeTime = this.totalComputeTime / this.metrics.totalComparisons;
    
    return result;
  }
  
  /**
   * Convenience method for isBefore comparison
   */
  static isBefore(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime,
    unit?: TimeUnit
  ): boolean {
    const options = unit ? { unit } : {};
    const result = this.compare(date1, date2, 'isBefore', options);
    return result.result as boolean;
  }
  
  /**
   * Convenience method for isAfter comparison
   */
  static isAfter(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime,
    unit?: TimeUnit
  ): boolean {
    const options = unit ? { unit } : {};
    const result = this.compare(date1, date2, 'isAfter', options);
    return result.result as boolean;
  }
  
  /**
   * Convenience method for isSame comparison
   */
  static isSame(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime,
    unit?: TimeUnit
  ): boolean {
    const options = unit ? { unit } : {};
    const result = this.compare(date1, date2, 'isSame', options);
    return result.result as boolean;
  }
  
  /**
   * Convenience method for isSameOrBefore comparison
   */
  static isSameOrBefore(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime,
    unit?: TimeUnit
  ): boolean {
    const options = unit ? { unit } : {};
    const result = this.compare(date1, date2, 'isSameOrBefore', options);
    return result.result as boolean;
  }
  
  /**
   * Convenience method for isSameOrAfter comparison
   */
  static isSameOrAfter(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime,
    unit?: TimeUnit
  ): boolean {
    const options = unit ? { unit } : {};
    const result = this.compare(date1, date2, 'isSameOrAfter', options);
    return result.result as boolean;
  }
  
  /**
   * Convenience method for diff calculation
   */
  static diff(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime,
    unit?: TimeUnit,
    options?: ComparisonOptions
  ): number | Temporal.Duration {
    const result = this.compare(date1, date2, 'diff', { ...options, unit });
    return result.result as number | Temporal.Duration;
  }
  
  /**
   * Finds the best strategy for a comparison context
   */
  private static findStrategy(context: ComparisonContext): ComparisonStrategy | null {
    // Sort strategies by priority (highest first)
    const sortedStrategies = [...this.strategies].sort((a, b) => b.priority - a.priority);
    
    for (const strategy of sortedStrategies) {
      if (strategy.canHandle(context)) {
        return strategy;
      }
    }
    
    return null;
  }
  
  /**
   * Generates a cache key for the comparison context
   */
  private static generateCacheKey(context: ComparisonContext): string {
    const { date1, date2, type, options } = context;
    
    return CacheKeys.comparison(
      date1.epochNanoseconds,
      date2.epochNanoseconds,
      type,
      options.unit,
      options.precision
    );
  }
  
  /**
   * Analyzes optimization hints for the given dates
   */
  static analyzeOptimizationHints(
    date1: Temporal.ZonedDateTime,
    date2: Temporal.ZonedDateTime
  ): OptimizationHints {
    const diff = date1.epochNanoseconds > date2.epochNanoseconds 
      ? date1.epochNanoseconds - date2.epochNanoseconds
      : date2.epochNanoseconds - date1.epochNanoseconds;
    
    let orderOfMagnitude: OptimizationHints['orderOfMagnitude'];
    if (diff < TIME_UNIT_FACTORS.microsecond) {
      orderOfMagnitude = 'nanoseconds';
    } else if (diff < TIME_UNIT_FACTORS.millisecond) {
      orderOfMagnitude = 'microseconds';
    } else if (diff < TIME_UNIT_FACTORS.second) {
      orderOfMagnitude = 'milliseconds';
    } else if (diff < TIME_UNIT_FACTORS.minute) {
      orderOfMagnitude = 'seconds';
    } else if (diff < TIME_UNIT_FACTORS.hour) {
      orderOfMagnitude = 'minutes';
    } else if (diff < TIME_UNIT_FACTORS.day) {
      orderOfMagnitude = 'hours';
    } else if (diff < TIME_UNIT_FACTORS.day * 30) {
      orderOfMagnitude = 'days';
    } else if (diff < TIME_UNIT_FACTORS.day * 365) {
      orderOfMagnitude = 'months';
    } else {
      orderOfMagnitude = 'years';
    }
    
    return {
      sameTimeZone: date1.timeZoneId === date2.timeZoneId,
      sameCalendar: date1.calendarId === date2.calendarId,
      sameYear: date1.year === date2.year,
      sameMonth: date1.year === date2.year && date1.month === date2.month,
      sameDay: date1.year === date2.year && date1.month === date2.month && date1.day === date2.day,
      orderOfMagnitude
    };
  }
  
  /**
   * Registers a custom comparison strategy
   */
  static registerStrategy(strategy: ComparisonStrategy): void {
    this.strategies.push(strategy);
  }
  
  /**
   * Unregisters a comparison strategy
   */
  static unregisterStrategy(strategy: ComparisonStrategy): boolean {
    const index = this.strategies.indexOf(strategy);
    if (index !== -1) {
      this.strategies.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Gets performance metrics
   */
  static getMetrics(): ComparisonMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Gets the maximum cache size
   */
  static getCacheMaxSize(): number {
    return this.cache.getMaxSize();
  }
  
  /**
   * Sets the maximum cache size
   */
  static setCacheMaxSize(size: number): void {
    this.cache.setMaxSize(size);
  }
  
  /**
   * Resets all metrics and caches
   */
  static reset(): void {
    this.metrics = {
      totalComparisons: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageComputeTime: 0,
      fastPathHits: 0,
      operationBreakdown: {} as Record<ComparisonType, number>,
      unitBreakdown: {} as Record<TimeUnit, number>
    };
    this.totalComputeTime = 0;
    this.cache.clear();
  }
  
  /**
   * Gets detailed performance analysis
   */
  static getPerformanceAnalysis() {
    const metrics = this.getMetrics();
    const cacheStats = this.cache.getStats();
    
    return {
      metrics,
      cacheStats,
      efficiency: {
        fastPathRatio: metrics.totalComparisons > 0 
          ? metrics.fastPathHits / metrics.totalComparisons 
          : 0,
        cacheHitRatio: metrics.totalComparisons > 0
          ? metrics.cacheHits / metrics.totalComparisons
          : 0,
        overallEfficiency: metrics.totalComparisons > 0
          ? (metrics.fastPathHits + metrics.cacheHits) / metrics.totalComparisons
          : 0
      },
      recommendations: this.generatePerformanceRecommendations(metrics)
    };
  }
  
  /**
   * Generates performance recommendations
   */
  private static generatePerformanceRecommendations(metrics: ComparisonMetrics): string[] {
    const recommendations: string[] = [];
    
    const fastPathRatio = metrics.totalComparisons > 0 
      ? metrics.fastPathHits / metrics.totalComparisons 
      : 0;
    
    if (fastPathRatio < 0.3) {
      recommendations.push('Consider using simpler comparison operations for better fast-path performance');
    }
    
    const cacheHitRatio = metrics.totalComparisons > 0
      ? metrics.cacheHits / metrics.totalComparisons
      : 0;
    
    if (cacheHitRatio < 0.5 && metrics.totalComparisons > 100) {
      recommendations.push('Cache hit ratio is low - consider enabling caching for repeated comparisons');
    }
    
    if (metrics.averageComputeTime > 0.1) {
      recommendations.push('Average compute time is high - consider optimization');
    }
    
    return recommendations;
  }
}