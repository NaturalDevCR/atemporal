/**
 * @file Core comparison module for optimized date comparisons
 */

export { ComparisonEngine } from './comparison-engine';
export { ComparisonCache } from './comparison-cache';
export { ComparisonOptimizer } from './comparison-optimizer';
export type {
  ComparisonResult,
  ComparisonOptions,
  ComparisonMetrics,
  ComparisonCacheStats,
  ComparisonType,
  TimeUnit,
  ComparisonContext,
  ComparisonStrategy,
  FastPathResult,
  DiffOptions,
  DurationBreakdown,
  OptimizationHints,
  ComparisonCacheEntry,
  ComparisonProfile
} from './comparison-types';