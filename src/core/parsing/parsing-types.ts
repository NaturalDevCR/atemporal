/**
 * @file Types and interfaces for the type-first parsing strategy system
 */

import '@js-temporal/polyfill';
import { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  TemporalError,
  StrictParsingOptions,
  TimezoneString,
  LocaleString,
  CalendarString
} from '../../types/index';
import type { TemporalParseError } from '../../types/enhanced-types';

/**
 * Parse strategy types
 */
export type ParseStrategyType = 
  | 'string'
  | 'number'
  | 'date'
  | 'temporal-zoned'
  | 'temporal-plain-datetime'
  | 'temporal-plain-date'
  | 'temporal-instant'
  | 'firebase-timestamp'
  | 'temporal-wrapper'
  | 'temporal-like'
  | 'array-like'
  | 'fallback';

/**
 * Parse result status
 */
export type ParseStatus = 'success' | 'error' | 'fallback' | 'cached';

/**
 * Parse context for strategy execution
 */
export interface ParseContext {
  readonly input: TemporalInput;
  readonly options: StrictParsingOptions;
  readonly inferredType: ParseStrategyType;
  readonly confidence: number;
  readonly startTime: number;
  readonly cacheKey?: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Parse result from strategy execution
 */
export interface ParseResult {
  readonly success: boolean;
  readonly data?: Temporal.ZonedDateTime;
  readonly error?: TemporalError;
  readonly status: ParseStatus;
  readonly strategy: ParseStrategyType;
  readonly executionTime: number;
  readonly fromCache: boolean;
  readonly confidence: number;
  readonly metadata: Record<string, unknown>;
}

/**
 * Fast path result for simple cases
 */
export interface FastPathResult {
  readonly canUseFastPath: boolean;
  readonly data?: Temporal.ZonedDateTime;
  readonly strategy: ParseStrategyType;
  readonly confidence: number;
}

/**
 * Parse validation result
 */
export interface ParseValidationResult {
  readonly isValid: boolean;
  readonly normalizedInput: TemporalInput;
  readonly suggestedStrategy: ParseStrategyType;
  readonly confidence: number;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Parse normalization result
 */
export interface ParseNormalizationResult {
  readonly normalizedInput: TemporalInput;
  readonly appliedTransforms: string[];
  readonly metadata: Record<string, unknown>;
}

/**
 * Parse conversion result
 */
export interface ParseConversionResult {
  readonly result: Temporal.ZonedDateTime;
  readonly intermediateSteps: string[];
  readonly appliedOptions: StrictParsingOptions;
  readonly metadata: Record<string, unknown>;
}

/**
 * Parse strategy interface
 */
export interface ParseStrategy {
  readonly type: ParseStrategyType;
  readonly priority: number;
  readonly description: string;
  
  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean;
  
  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number;
  
  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult;
  
  /**
   * Normalize input for parsing
   */
  normalize(input: TemporalInput, context: ParseContext): ParseNormalizationResult;
  
  /**
   * Parse input to ZonedDateTime
   */
  parse(input: TemporalInput, context: ParseContext): ParseResult;
  
  /**
   * Check if fast path can be used
   */
  checkFastPath?(input: TemporalInput, context: ParseContext): FastPathResult;
  
  /**
   * Get optimization hints
   */
  getOptimizationHints?(input: TemporalInput, context: ParseContext): ParseOptimizationHints;
}

/**
 * Parse options with enhanced configuration
 */
export interface ParseOptions extends StrictParsingOptions {
  readonly enableFastPath?: boolean;
  readonly enableCaching?: boolean;
  readonly enableOptimization?: boolean;
  readonly maxRetries?: number;
  readonly fallbackStrategy?: ParseStrategyType;
  readonly customStrategies?: ParseStrategy[];
  readonly debugMode?: boolean;
  readonly performanceTracking?: boolean;
}

/**
 * Parse metrics for performance monitoring
 */
export interface ParseMetrics {
  readonly totalParses: number;
  readonly successfulParses: number;
  readonly failedParses: number;
  readonly cachedParses: number;
  readonly fastPathParses: number;
  readonly averageExecutionTime: number;
  readonly strategyBreakdown: Record<ParseStrategyType, number>;
  readonly errorBreakdown: Record<string, number>;
  readonly performanceProfile: ParseProfile;
}

/**
 * Parse performance profile
 */
export interface ParseProfile {
  readonly fastest: { strategy: ParseStrategyType; time: number };
  readonly slowest: { strategy: ParseStrategyType; time: number };
  readonly mostUsed: { strategy: ParseStrategyType; count: number };
  readonly mostSuccessful: { strategy: ParseStrategyType; rate: number };
  readonly recommendations: string[];
}

/**
 * Parse cache entry
 */
export interface ParseCacheEntry {
  readonly result: Temporal.ZonedDateTime;
  readonly strategy: ParseStrategyType;
  readonly executionTime: number;
  readonly timestamp: number;
  readonly accessCount: number;
  readonly lastAccessed: number;
  readonly metadata: Record<string, unknown>;
}

/**
 * Parse optimization hints
 */
export interface ParseOptimizationHints {
  readonly preferredStrategy: ParseStrategyType;
  readonly shouldCache: boolean;
  readonly canUseFastPath: boolean;
  readonly estimatedComplexity: 'low' | 'medium' | 'high';
  readonly suggestedOptions: Partial<ParseOptions>;
  readonly warnings: string[];
}

/**
 * Parse strategy configuration
 */
export interface ParseStrategyConfig {
  readonly enabled: boolean;
  readonly priority: number;
  readonly options: Record<string, unknown>;
  readonly customValidator?: (input: TemporalInput) => boolean;
  readonly customNormalizer?: (input: TemporalInput) => TemporalInput;
}

/**
 * Parse engine configuration
 */
export interface ParseEngineConfig {
  readonly strategies: Record<ParseStrategyType, ParseStrategyConfig>;
  readonly defaultOptions: ParseOptions;
  readonly cacheConfig: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  readonly optimizationConfig: {
    enabled: boolean;
    adaptiveStrategies: boolean;
    performanceThresholds: Record<string, number>;
  };
  readonly debugConfig: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    traceExecution: boolean;
  };
}

/**
 * Parse performance report
 */
export interface ParsePerformanceReport {
  readonly summary: {
    totalOperations: number;
    averageTime: number;
    successRate: number;
    cacheHitRate: number;
    fastPathRate: number;
  };
  readonly strategies: Array<{
    type: ParseStrategyType;
    usage: number;
    averageTime: number;
    successRate: number;
    efficiency: number;
  }>;
  readonly bottlenecks: Array<{
    issue: string;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  readonly recommendations: string[];
}

/**
 * Constants for parse strategies
 */
export const PARSE_STRATEGIES: Record<ParseStrategyType, { priority: number; description: string }> = {
  'temporal-wrapper': { priority: 100, description: 'TemporalWrapper instances (highest priority)' },
  'temporal-zoned': { priority: 95, description: 'Temporal.ZonedDateTime instances' },
  'temporal-instant': { priority: 90, description: 'Temporal.Instant instances' },
  'temporal-plain-datetime': { priority: 85, description: 'Temporal.PlainDateTime instances' },
  'temporal-plain-date': { priority: 80, description: 'Temporal.PlainDate instances' },
  'date': { priority: 70, description: 'JavaScript Date objects' },
  'firebase-timestamp': { priority: 65, description: 'Firebase Timestamp objects' },
  'number': { priority: 60, description: 'Numeric timestamps' },
  'string': { priority: 50, description: 'String representations' },
  'temporal-like': { priority: 40, description: 'Objects with temporal properties' },
  'array-like': { priority: 30, description: 'Array-like objects with date components' },
  'fallback': { priority: 1, description: 'Fallback strategy for unrecognized inputs' }
};

/**
 * Priority levels for strategies
 */
export const PARSE_PRIORITIES = {
  CRITICAL: 100,
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40,
  FALLBACK: 1
} as const;

/**
 * Performance thresholds
 */
export const PARSE_THRESHOLDS = {
  FAST_PATH_MAX_TIME: 1, // ms
  ACCEPTABLE_PARSE_TIME: 5, // ms
  SLOW_PARSE_TIME: 20, // ms
  CACHE_HIT_TARGET: 0.8, // 80%
  SUCCESS_RATE_TARGET: 0.95, // 95%
  FAST_PATH_TARGET: 0.6 // 60%
} as const;

/**
 * Common parsing patterns
 */
export const PARSE_PATTERNS = {
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  ISO_DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  ISO_DATETIME_TZ: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[+-]\d{2}:\d{2}$/,
  TIMESTAMP_MS: /^\d{13}$/,
  TIMESTAMP_S: /^\d{10}$/,
  RELATIVE_TIME: /^(\d+)\s*(years?|months?|weeks?|days?|hours?|minutes?|seconds?)\s*(ago|from now)$/i,
  HUMAN_READABLE: /^(today|tomorrow|yesterday|now)$/i
} as const;

/**
 * Utility functions
 */

/**
 * Create a parse context
 */
export function createParseContext(
  input: TemporalInput,
  options: StrictParsingOptions = {},
  inferredType: ParseStrategyType = 'fallback',
  confidence: number = 0
): ParseContext {
  let startTime: number;
  try {
    startTime = performance.now();
  } catch {
    // Fallback to Date.now() if performance.now() fails
    startTime = Date.now();
  }
  
  return {
    input,
    options,
    inferredType,
    confidence,
    startTime,
    metadata: {}
  };
}

/**
 * Create a successful parse result
 */
export function createParseResult(
  data: Temporal.ZonedDateTime,
  strategy: ParseStrategyType,
  executionTime: number,
  fromCache: boolean = false,
  confidence: number = 1
): ParseResult {
  return {
    success: true,
    data,
    status: fromCache ? 'cached' : 'success',
    strategy,
    executionTime,
    fromCache,
    confidence,
    metadata: {}
  };
}

/**
 * Create an error parse result
 */
export function createParseError(
  error: TemporalError,
  strategy: ParseStrategyType,
  executionTime: number
): ParseResult {
  return {
    success: false,
    error,
    status: 'error',
    strategy,
    executionTime,
    fromCache: false,
    confidence: 0,
    metadata: {}
  };
}

/**
 * Type guards
 */
export function isParseSuccess(result: ParseResult): result is ParseResult & { success: true; data: Temporal.ZonedDateTime } {
  return result.success === true && result.data !== undefined;
}

export function isParseError(result: ParseResult): result is ParseResult & { success: false; error: TemporalError } {
  return result.success === false && result.error !== undefined;
}

/**
 * Normalize parse input
 */
export function normalizeParseInput(input: TemporalInput): TemporalInput {
  if (input === null || input === undefined) {
    return input;
  }
  
  if (typeof input === 'string') {
    // Trim whitespace
    const trimmed = input.trim();
    
    // Handle common variations
    if (trimmed.toLowerCase() === 'now') {
      return new Date();
    }
    
    return trimmed;
  }
  
  if (typeof input === 'number') {
    // Don't normalize numbers here - let the number strategy handle seconds/milliseconds detection
    // The number strategy has more sophisticated logic for handling negative timestamps
    return input;
  }
  
  return input;
}

/**
 * Validate parse options
 */
export function validateParseOptions(options: ParseOptions): ParseOptions {
  const validated = {
    ...options
  } as ParseOptions;
  
  // Set defaults
  if (validated.enableFastPath === undefined) {
    (validated as any).enableFastPath = true;
  }
  
  if (validated.enableCaching === undefined) {
    (validated as any).enableCaching = true;
  }
  
  if (validated.enableOptimization === undefined) {
    (validated as any).enableOptimization = true;
  }
  
  if (validated.maxRetries === undefined) {
    (validated as any).maxRetries = 3;
  }
  
  if (validated.fallbackStrategy === undefined) {
    (validated as any).fallbackStrategy = 'fallback';
  }
  
  // Validate values
  if (validated.maxRetries !== undefined && validated.maxRetries < 0) {
    (validated as any).maxRetries = 0;
  }
  
  if (validated.maxRetries !== undefined && validated.maxRetries > 10) {
    (validated as any).maxRetries = 10;
  }
  
  return validated;
}

/**
 * Get strategy by type
 */
export function getStrategyInfo(type: ParseStrategyType): { priority: number; description: string } {
  return PARSE_STRATEGIES[type] || { priority: 0, description: 'Unknown strategy' };
}

/**
 * Sort strategies by priority
 */
export function sortStrategiesByPriority(strategies: ParseStrategyType[]): ParseStrategyType[] {
  return strategies.sort((a, b) => {
    const priorityA = getStrategyInfo(a).priority;
    const priorityB = getStrategyInfo(b).priority;
    return priorityB - priorityA; // Higher priority first
  });
}

/**
 * Check if input matches pattern
 */
export function matchesPattern(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

/**
 * Infer strategy type from input
 */
export function inferStrategyType(input: TemporalInput): { type: ParseStrategyType; confidence: number } {
  if (input === null || input === undefined) {
    return { type: 'fallback', confidence: 0 };
  }
  
  // Check for TemporalWrapper
  if (typeof input === 'object' && input !== null && '_isTemporalWrapper' in input) {
    return { type: 'temporal-wrapper', confidence: 1 };
  }
  
  // Check for Firebase Timestamp BEFORE Temporal types to avoid misidentification
  if (typeof input === 'object' && input !== null && 'seconds' in input && 'nanoseconds' in input) {
    return { type: 'firebase-timestamp', confidence: 0.9 };
  }
  
  // Check for Temporal types
  if (input instanceof Temporal.ZonedDateTime) {
    return { type: 'temporal-zoned', confidence: 1 };
  }
  
  if (input instanceof Temporal.Instant) {
    return { type: 'temporal-instant', confidence: 1 };
  }
  
  if (input instanceof Temporal.PlainDateTime) {
    return { type: 'temporal-plain-datetime', confidence: 1 };
  }
  
  if (input instanceof Temporal.PlainDate) {
    return { type: 'temporal-plain-date', confidence: 1 };
  }
  
  // Check for Date
  if (input instanceof Date) {
    return { type: 'date', confidence: 0.9 };
  }
  
  // Check for number
  if (typeof input === 'number') {
    return { type: 'number', confidence: 0.8 };
  }
  
  // Check for string
  if (typeof input === 'string') {
    const str = input.trim();
    
    if (matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME_TZ)) {
      return { type: 'string', confidence: 0.9 };
    }
    
    if (matchesPattern(str, PARSE_PATTERNS.ISO_DATETIME)) {
      return { type: 'string', confidence: 0.8 };
    }
    
    if (matchesPattern(str, PARSE_PATTERNS.ISO_DATE)) {
      return { type: 'string', confidence: 0.7 };
    }
    
    if (matchesPattern(str, PARSE_PATTERNS.TIMESTAMP_MS) || matchesPattern(str, PARSE_PATTERNS.TIMESTAMP_S)) {
      return { type: 'string', confidence: 0.6 };
    }
    
    return { type: 'string', confidence: 0.5 };
  }
  
  // Check for temporal-like object
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    const temporalKeys = ['year', 'month', 'day', 'hour', 'minute', 'second'];
    
    if (temporalKeys.some(key => key in obj)) {
      return { type: 'temporal-like', confidence: 0.7 };
    }
    
    // Check for array-like
    if ('length' in obj && typeof obj.length === 'number') {
      return { type: 'array-like', confidence: 0.6 };
    }
  }
  
  return { type: 'fallback', confidence: 0.1 };
}