/**
 * @file Parse engine that orchestrates type-first parsing strategies for optimal performance
 */

import type { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  StrictParsingOptions
} from '../../types/enhanced-types';
import { TemporalParseError } from '../../types/enhanced-types';

import type {
  ParseStrategy,
  ParseContext,
  ParseResult,
  ParseOptions,
  ParseMetrics,
  ParseProfile,
  ParseOptimizationHints,
  FastPathResult,
  ParseValidationResult,
  ParseStrategyType,
  ParseEngineConfig
} from './parsing-types';

import {
  createParseContext,
  createParseResult,
  createParseError,
  isParseSuccess,
  normalizeParseInput,
  validateParseOptions,
  inferStrategyType,
  sortStrategiesByPriority,
  PARSE_THRESHOLDS
} from './parsing-types';

import { ParseCache } from './parse-cache';
import { StringParseStrategy } from './strategies/string-strategy';
import { NumberParseStrategy } from './strategies/number-strategy';
import { DateParseStrategy } from './strategies/date-strategy';
import { FirebaseTimestampStrategy } from './strategies/firebase-strategy';
import { TemporalWrapperStrategy } from './strategies/temporal-wrapper-strategy';
import { TemporalZonedStrategy } from './strategies/temporal-zoned-strategy';
import { TemporalInstantStrategy } from './strategies/temporal-instant-strategy';
import { TemporalPlainDateTimeStrategy } from './strategies/temporal-plain-datetime-strategy';
import { TemporalPlainDateStrategy } from './strategies/temporal-plain-date-strategy';
import { ArrayLikeStrategy } from './strategies/array-like-strategy';
import { TemporalLikeStrategy } from './strategies/temporal-like-strategy';
import { FallbackStrategy } from './strategies/fallback-strategy';

/**
 * Parse engine that orchestrates type-first parsing strategies
 */
export class ParseEngine {
  private readonly strategies = new Map<ParseStrategyType, ParseStrategy>();
  private readonly cache: ParseCache;
  private readonly config: ParseEngineConfig;
  private readonly internalMetrics: {
    totalParses: number;
    successfulParses: number;
    failedParses: number;
    cachedParses: number;
    fastPathParses: number;
    averageExecutionTime: number;
    strategyBreakdown: Record<string, number>;
    errorBreakdown: Record<string, number>;
    performanceProfile: {
      fastest: { strategy: ParseStrategyType; time: number };
      slowest: { strategy: ParseStrategyType; time: number };
      mostUsed: { strategy: ParseStrategyType; count: number };
      mostSuccessful: { strategy: ParseStrategyType; rate: number };
      recommendations: string[];
    };
  };
  private readonly startTime: number;
  
  constructor(config?: Partial<ParseEngineConfig>) {
    this.startTime = performance.now();
    this.config = this.createDefaultConfig(config);
    this.cache = new ParseCache(this.config.cacheConfig);
    this.internalMetrics = this.createInitialMetrics();
    
    this.initializeStrategies();
  }

  /**
   * Parse temporal input using optimal strategy
   */
  parse(input: TemporalInput, options: ParseOptions = {}): ParseResult {
    const startTime = performance.now();
    const validatedOptions = validateParseOptions(options);
    const normalizedInput = normalizeParseInput(input);
    
    try {
      // Check cache first if enabled
      if (validatedOptions.enableCaching && this.cache) {
        const cached = this.cache.get(normalizedInput, validatedOptions);
        if (cached) {
          this.updateMetrics('cached', 'success', performance.now() - startTime, cached.strategy);
          return createParseResult(
            cached.result,
            cached.strategy,
            performance.now() - startTime,
            true,
            1
          );
        }
      }
      
      // Infer strategy type
      const { type: inferredType, confidence } = inferStrategyType(normalizedInput);
      
      // Create parse context
      const context = createParseContext(
        normalizedInput,
        validatedOptions,
        inferredType,
        confidence
      );
      
      // Try fast path first if enabled
      if (validatedOptions.enableFastPath) {
        const fastPathResult = this.tryFastPath(context);
        if (fastPathResult.canUseFastPath && fastPathResult.data) {
          const result = createParseResult(
            fastPathResult.data,
            fastPathResult.strategy,
            performance.now() - startTime,
            false,
            fastPathResult.confidence
          );
          
          // Cache successful fast path result
          if (validatedOptions.enableCaching && this.cache) {
            this.cache.set(normalizedInput, validatedOptions, result);
          }
          
          this.updateMetrics('fast-path', 'success', performance.now() - startTime, fastPathResult.strategy);
          return result;
        }
      }
      
      // Use full strategy-based parsing
      const result = this.parseWithStrategies(context);
      
      // Cache successful result
      if (isParseSuccess(result) && validatedOptions.enableCaching && this.cache) {
        this.cache.set(normalizedInput, validatedOptions, result);
      }
      
      this.updateMetrics('full', result.success ? 'success' : 'error', result.executionTime, result.strategy);
      return result;
      
    } catch (error) {
      const parseError = error instanceof Error ? 
        new TemporalParseError(error.message, input, 'PARSE_ENGINE_ERROR') :
        new TemporalParseError('Unknown parsing error', input, 'UNKNOWN_ERROR');
      
      const result = createParseError(
        parseError,
        'fallback',
        performance.now() - startTime
      );
      
      this.updateMetrics('full', 'error', result.executionTime, 'fallback');
      return result;
    }
  }

  /**
   * Parse multiple inputs in batch
   */
  parseBatch(inputs: TemporalInput[], options: ParseOptions = {}): ParseResult[] {
    return inputs.map(input => this.parse(input, options));
  }

  /**
   * Validate input without parsing
   */
  validate(input: TemporalInput, options: ParseOptions = {}): ParseValidationResult {
    const normalizedInput = normalizeParseInput(input);
    const { type: inferredType, confidence } = inferStrategyType(normalizedInput);
    const strategy = this.strategies.get(inferredType);
    
    if (!strategy) {
      return {
        isValid: false,
        normalizedInput,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors: [`No strategy found for type: ${inferredType}`],
        warnings: []
      };
    }
    
    const context = createParseContext(normalizedInput, options, inferredType, confidence);
    return strategy.validate(normalizedInput, context);
  }

  /**
   * Get optimization hints for input
   */
  getOptimizationHints(input: TemporalInput, options: ParseOptions = {}): ParseOptimizationHints {
    const normalizedInput = normalizeParseInput(input);
    const { type: inferredType, confidence } = inferStrategyType(normalizedInput);
    const strategy = this.strategies.get(inferredType);
    
    if (!strategy || !strategy.getOptimizationHints) {
      return {
        preferredStrategy: inferredType,
        shouldCache: true,
        canUseFastPath: false,
        estimatedComplexity: 'medium',
        suggestedOptions: {},
        warnings: []
      };
    }
    
    const context = createParseContext(normalizedInput, options, inferredType, confidence);
    return strategy.getOptimizationHints(normalizedInput, context);
  }

  /**
   * Register custom strategy
   */
  registerStrategy(strategy: ParseStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  /**
   * Unregister strategy
   */
  unregisterStrategy(type: ParseStrategyType): boolean {
    return this.strategies.delete(type);
  }

  /**
   * Get registered strategies
   */
  getStrategies(): ParseStrategyType[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get registered strategy objects
   */
  getStrategyObjects(): ParseStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Parse with specific strategy
   */
  parseWithStrategy(
    input: TemporalInput,
    context: ParseContext,
    strategyType: ParseStrategyType
  ): { success: boolean; temporal?: Temporal.ZonedDateTime; error?: Error } {
    const startTime = performance.now();
    const strategy = this.strategies.get(strategyType);
    
    if (!strategy) {
      const executionTime = performance.now() - startTime;
      this.updateMetrics('full', 'error', executionTime, strategyType);
      return {
        success: false,
        error: new Error(`Strategy not found: ${strategyType}`)
      };
    }
    
    try {
      // Validate input before parsing
      const validation = strategy.validate(input, context);
      if (!validation.isValid && validation.errors.length > 0) {
        const executionTime = performance.now() - startTime;
        this.updateMetrics('full', 'error', executionTime, strategyType);
        return {
          success: false,
          error: new TemporalParseError(
            validation.errors.join('; '),
            input,
            'VALIDATION_ERROR',
            `Strategy: ${strategyType}`
          )
        };
      }
      
      const result = strategy.parse(input, context);
      const executionTime = performance.now() - startTime;
      
      if (isParseSuccess(result)) {
        this.updateMetrics('full', 'success', executionTime, strategyType);
        return {
          success: true,
          temporal: result.data
        };
      } else {
        this.updateMetrics('full', 'error', executionTime, strategyType);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.updateMetrics('full', 'error', executionTime, strategyType);
      return {
        success: false,
        error: error as Error
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ParseMetrics {
    return {
      totalParses: this.internalMetrics.totalParses,
      successfulParses: this.internalMetrics.successfulParses,
      failedParses: this.internalMetrics.failedParses,
      cachedParses: this.internalMetrics.cachedParses,
      fastPathParses: this.internalMetrics.fastPathParses,
      averageExecutionTime: this.internalMetrics.averageExecutionTime,
      strategyBreakdown: { ...this.internalMetrics.strategyBreakdown } as Record<ParseStrategyType, number>,
      errorBreakdown: { ...this.internalMetrics.errorBreakdown },
      performanceProfile: {
        fastest: { ...this.internalMetrics.performanceProfile.fastest },
        slowest: { ...this.internalMetrics.performanceProfile.slowest },
        mostUsed: { ...this.internalMetrics.performanceProfile.mostUsed },
        mostSuccessful: { ...this.internalMetrics.performanceProfile.mostSuccessful },
        recommendations: [...this.internalMetrics.performanceProfile.recommendations]
      }
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    Object.assign(this.internalMetrics, this.createInitialMetrics());
  }

  /**
   * Get performance profile
   */
  getPerformanceProfile(): ParseProfile {
    return {
      fastest: { ...this.internalMetrics.performanceProfile.fastest },
      slowest: { ...this.internalMetrics.performanceProfile.slowest },
      mostUsed: { ...this.internalMetrics.performanceProfile.mostUsed },
      mostSuccessful: { ...this.internalMetrics.performanceProfile.mostSuccessful },
      recommendations: [...this.internalMetrics.performanceProfile.recommendations]
    };
  }

  /**
   * Optimize engine based on usage patterns
   */
  optimize(): void {
    // Analyze metrics and adjust strategy priorities
    const profile = this.getPerformanceProfile();
    
    // Promote successful strategies
    if (profile.mostSuccessful.rate > 0.9) {
      const strategy = this.strategies.get(profile.mostSuccessful.strategy);
      if (strategy) {
        // Could adjust priority or enable optimizations
      }
    }
    
    // Optimize cache based on usage
    this.cache.optimize();
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      strategies: this.strategies.size,
      uptime: performance.now() - this.startTime,
      metrics: this.getMetrics(),
      cache: this.getCacheStats()
    };
  }

  /**
   * Try fast path parsing
   */
  private tryFastPath(context: ParseContext): FastPathResult {
    const strategy = this.strategies.get(context.inferredType);
    
    if (!strategy || !strategy.checkFastPath) {
      return {
        canUseFastPath: false,
        strategy: context.inferredType,
        confidence: 0
      };
    }
    
    return strategy.checkFastPath(context.input, context);
  }

  /**
   * Parse using strategy-based approach
   */
  private parseWithStrategies(context: ParseContext): ParseResult {
    const startTime = performance.now();
    
    // Get candidate strategies sorted by priority and confidence
    const candidates = this.getCandidateStrategies(context);
    
    let lastError: TemporalParseError | undefined;
    
    // Try each strategy in order
    for (const strategyType of candidates) {
      const strategy = this.strategies.get(strategyType);
      if (!strategy) continue;
      
      try {
        // Check if strategy can handle input
        if (!strategy.canHandle(context.input, context)) {
          continue;
        }
        
        // Validate input before parsing
        const validation = strategy.validate(context.input, context);
        if (!validation.isValid && validation.errors.length > 0) {
          // For fallback strategy validation failures, still attempt parsing
          // to allow creation of invalid instances rather than throwing errors
          if (strategyType === 'fallback') {
            // Continue with parsing even if validation fails
            // This allows invalid instances to be created
          } else {
            // For other strategies, continue to next strategy
            continue;
          }
        }
        
        // Attempt parsing
        const result = strategy.parse(context.input, context);
        
        if (isParseSuccess(result)) {
          return {
            ...result,
            executionTime: performance.now() - startTime
          };
        }
        
        // Store error for potential fallback
        if (result.error) {
          lastError = result.error as TemporalParseError;
        }
        
      } catch (error) {
        lastError = error instanceof TemporalParseError ? 
          error :
          new TemporalParseError(
            `Strategy ${strategyType} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            context.input,
            'STRATEGY_ERROR'
          );
      }
    }
    
    // All strategies failed
    return createParseError(
      lastError || new TemporalParseError(
        'All parsing strategies failed',
        context.input,
        'ALL_STRATEGIES_FAILED'
      ),
      'fallback',
      performance.now() - startTime
    );
  }

  /**
   * Get candidate strategies for parsing
   */
  private getCandidateStrategies(context: ParseContext): ParseStrategyType[] {
    const candidates: Array<{ type: ParseStrategyType; score: number }> = [];
    
    for (const [type, strategy] of Array.from(this.strategies.entries())) {
      if (!strategy.canHandle(context.input, context)) {
        continue;
      }
      
      const confidence = strategy.getConfidence(context.input, context);
      const priority = strategy.priority;
      
      // Calculate composite score (confidence + priority)
      const score = confidence * 0.7 + (priority / 100) * 0.3;
      
      candidates.push({ type, score });
    }
    
    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates.map(c => c.type);
  }

  /**
   * Initialize built-in strategies
   */
  private initializeStrategies(): void {
    const strategies: ParseStrategy[] = [
      new TemporalWrapperStrategy(),
      new TemporalZonedStrategy() as ParseStrategy,
      new TemporalInstantStrategy() as ParseStrategy,
      new TemporalPlainDateTimeStrategy() as ParseStrategy,
      new TemporalPlainDateStrategy() as ParseStrategy,
      new DateParseStrategy(),
      new FirebaseTimestampStrategy(),
      new NumberParseStrategy(),
      new StringParseStrategy(),
      new TemporalLikeStrategy(),
      new ArrayLikeStrategy(),
      new FallbackStrategy()
    ];
    
    for (const strategy of strategies) {
      if (this.config.strategies[strategy.type]?.enabled !== false) {
        this.strategies.set(strategy.type, strategy);
      }
    }
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(config?: Partial<ParseEngineConfig>): ParseEngineConfig {
    return {
      strategies: {
        'temporal-wrapper': { enabled: true, priority: 100, options: {} },
        'temporal-zoned': { enabled: true, priority: 95, options: {} },
        'temporal-instant': { enabled: true, priority: 90, options: {} },
        'temporal-plain-datetime': { enabled: true, priority: 85, options: {} },
        'temporal-plain-date': { enabled: true, priority: 80, options: {} },
        'date': { enabled: true, priority: 70, options: {} },
        'firebase-timestamp': { enabled: true, priority: 65, options: {} },
        'number': { enabled: true, priority: 60, options: {} },
        'string': { enabled: true, priority: 50, options: {} },
        'temporal-like': { enabled: true, priority: 40, options: {} },
        'array-like': { enabled: true, priority: 30, options: {} },
        'fallback': { enabled: true, priority: 1, options: {} }
      },
      defaultOptions: {
        enableFastPath: true,
        enableCaching: true,
        enableOptimization: true,
        maxRetries: 3,
        fallbackStrategy: 'fallback'
      },
      cacheConfig: {
        enabled: true,
        maxSize: 1000,
        ttl: 300000 // 5 minutes
      },
      optimizationConfig: {
        enabled: true,
        adaptiveStrategies: true,
        performanceThresholds: {
          fastPath: PARSE_THRESHOLDS.FAST_PATH_MAX_TIME,
          acceptable: PARSE_THRESHOLDS.ACCEPTABLE_PARSE_TIME,
          slow: PARSE_THRESHOLDS.SLOW_PARSE_TIME
        }
      },
      debugConfig: {
        enabled: false,
        logLevel: 'error',
        traceExecution: false
      },
      ...config
    };
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics() {
    return {
      totalParses: 0,
      successfulParses: 0,
      failedParses: 0,
      cachedParses: 0,
      fastPathParses: 0,
      averageExecutionTime: 0,
      strategyBreakdown: {} as Record<string, number>,
      errorBreakdown: {} as Record<string, number>,
      performanceProfile: {
        fastest: { strategy: 'temporal-wrapper' as ParseStrategyType, time: 0 },
        slowest: { strategy: 'fallback' as ParseStrategyType, time: 0 },
        mostUsed: { strategy: 'string' as ParseStrategyType, count: 0 },
        mostSuccessful: { strategy: 'temporal-wrapper' as ParseStrategyType, rate: 1 },
        recommendations: []
      }
    };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(
    parseType: 'cached' | 'fast-path' | 'full',
    result: 'success' | 'error',
    executionTime: number,
    strategy: ParseStrategyType
  ): void {
    this.internalMetrics.totalParses++;
    
    if (result === 'success') {
      this.internalMetrics.successfulParses++;
    } else {
      this.internalMetrics.failedParses++;
    }
    
    if (parseType === 'cached') {
      this.internalMetrics.cachedParses++;
    } else if (parseType === 'fast-path') {
      this.internalMetrics.fastPathParses++;
    }
    
    // Update average execution time
    this.internalMetrics.averageExecutionTime = 
      (this.internalMetrics.averageExecutionTime * (this.internalMetrics.totalParses - 1) + executionTime) / 
      this.internalMetrics.totalParses;
    
    // Update strategy breakdown
    this.internalMetrics.strategyBreakdown[strategy] = 
      (this.internalMetrics.strategyBreakdown[strategy] || 0) + 1;
    
    // Update performance profile
    this.updatePerformanceProfile(strategy, executionTime, result);
  }

  /**
   * Update performance profile
   */
  private updatePerformanceProfile(
    strategy: ParseStrategyType,
    executionTime: number,
    result: 'success' | 'error'
  ): void {
    const profile = this.internalMetrics.performanceProfile;
    
    // Update fastest
    if (executionTime < profile.fastest.time || profile.fastest.time === 0) {
      profile.fastest = { strategy, time: executionTime };
    }
    
    // Update slowest
    if (executionTime > profile.slowest.time) {
      profile.slowest = { strategy, time: executionTime };
    }
    
    // Update most used
    const usage = this.internalMetrics.strategyBreakdown[strategy] || 0;
    if (usage > profile.mostUsed.count) {
      profile.mostUsed = { strategy, count: usage };
    }
    
    // Update most successful (simplified calculation)
    if (result === 'success') {
      const successRate = usage > 0 ? 1 : 0; // Simplified for this example
      if (successRate > profile.mostSuccessful.rate) {
        profile.mostSuccessful = { strategy, rate: successRate };
      }
    }
    
    // Generate recommendations
    profile.recommendations = this.generateRecommendations();
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.internalMetrics;
    
    // Cache hit rate recommendation
    const cacheHitRate = metrics.cachedParses / metrics.totalParses;
    if (cacheHitRate < PARSE_THRESHOLDS.CACHE_HIT_TARGET) {
      recommendations.push('Consider increasing cache size or TTL to improve cache hit rate');
    }
    
    // Fast path recommendation
    const fastPathRate = metrics.fastPathParses / metrics.totalParses;
    if (fastPathRate < PARSE_THRESHOLDS.FAST_PATH_TARGET) {
      recommendations.push('Consider optimizing input patterns to use fast path more frequently');
    }
    
    // Success rate recommendation
    const successRate = metrics.successfulParses / metrics.totalParses;
    if (successRate < PARSE_THRESHOLDS.SUCCESS_RATE_TARGET) {
      recommendations.push('High error rate detected - consider input validation or strategy improvements');
    }
    
    // Performance recommendation
    if (metrics.averageExecutionTime > PARSE_THRESHOLDS.ACCEPTABLE_PARSE_TIME) {
      recommendations.push('Average parse time is high - consider enabling more optimizations');
    }
    
    return recommendations;
  }
}