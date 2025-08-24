/**
 * @file Core parsing module - exports for optimized temporal input parsing
 */

// Core parsing engine and components
export { ParseEngine } from './parse-engine';
export { ParseCache } from './parse-cache';
export { ParseOptimizer } from './parse-optimizer';
export { ParseCoordinator } from './parse-coordinator';

// Parsing strategies
export {
  StringParseStrategy,
  NumberParseStrategy,
  DateParseStrategy,
  TemporalWrapperStrategy,
  FirebaseTimestampStrategy,
  ArrayLikeStrategy,
  FallbackStrategy,
  STRATEGY_REGISTRY,
  getAvailableStrategyTypes,
  createStrategy,
  createDefaultStrategies,
  getStrategyInfo,
  getAllStrategyInfo
} from './strategies/index';

// Parsing types and utilities
export type {
  ParseStrategy,
  ParseContext,
  ParseResult,
  ParseValidationResult,
  ParseNormalizationResult,
  ParseOptimizationHints,
  FastPathResult,
  ParseStrategyType,
  ParseStatus,
  ParseOptions,
  ParseMetrics,
  ParseProfile,
  ParseCacheEntry,
  ParseStrategyConfig,
  ParseEngineConfig,
  ParsePerformanceReport
} from './parsing-types';

export {
  createParseContext,
  createParseResult,
  createParseError,
  isParseSuccess,
  isParseError,
  normalizeParseInput,
  validateParseOptions,
  getStrategyInfo as getParseStrategyInfo,
  sortStrategiesByPriority,
  matchesPattern,
  inferStrategyType,
  PARSE_STRATEGIES,
  PARSE_PRIORITIES,
  PARSE_THRESHOLDS,
  PARSE_PATTERNS
} from './parsing-types';

// Optimization types
export type { ParseOptimizationRecommendation } from './parse-optimizer';
export type { ParseCoordinatorConfig } from './parse-coordinator';