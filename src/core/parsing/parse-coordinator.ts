/**
 * @file Parse coordinator for orchestrating the entire parsing system
 */

import '@js-temporal/polyfill';
import { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  StrictParsingOptions
} from '../../types/index';

import { TemporalParseError } from '../../types/enhanced-types';

import type {
  ParseStrategy,
  ParseContext,
  ParseResult,
  ParseMetrics,
  ParseOptimizationHints,
  ParseStrategyType,
  ParseEngineConfig
} from './parsing-types';

import {
  createParseContext,
  createParseError,
  inferStrategyType
} from './parsing-types';

import { ParseEngine } from './parse-engine';
import { ParseCache } from './parse-cache';
import { ParseOptimizer } from './parse-optimizer';
import { createDefaultStrategies } from './strategies/index';

/**
 * Parse coordinator configuration
 */
export interface ParseCoordinatorConfig {
  /** Maximum number of strategies to try before giving up */
  maxStrategyAttempts?: number;
  /** Enable automatic optimization */
  enableAutoOptimization?: boolean;
  /** Auto-optimization interval in operations */
  autoOptimizationInterval?: number;
  /** Enable detailed performance tracking */
  enableDetailedMetrics?: boolean;
  /** Custom strategies to register */
  customStrategies?: ParseStrategy[];
  /** Strategy selection mode */
  strategySelectionMode?: 'confidence' | 'priority' | 'hybrid';
  /** Fallback behavior when all strategies fail */
  fallbackBehavior?: 'error' | 'null' | 'retry';
}

/**
 * Parse coordinator for orchestrating the entire parsing system
 * Manages strategy selection, optimization, and performance monitoring
 */
export class ParseCoordinator {
  private parseEngine: ParseEngine;
  private optimizer: ParseOptimizer;
  private config: Required<ParseCoordinatorConfig>;
  private operationCount = 0;
  private lastOptimization = 0;

  constructor(config: ParseCoordinatorConfig = {}) {
    this.config = {
      maxStrategyAttempts: 3,
      enableAutoOptimization: true,
      autoOptimizationInterval: 1000,
      enableDetailedMetrics: true,
      customStrategies: [],
      strategySelectionMode: 'hybrid',
      fallbackBehavior: 'error',
      ...config
    };

    // Initialize components
    const engineConfig: ParseEngineConfig = {
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
        maxSize: this.config.enableDetailedMetrics ? 10000 : 1000,
        ttl: 300000
      },
      optimizationConfig: {
        enabled: true,
        adaptiveStrategies: true,
        performanceThresholds: {
          fastPath: 1,
          acceptable: 5,
          slow: 20
        }
      },
      debugConfig: {
        enabled: false,
        logLevel: 'error',
        traceExecution: false
      }
    };

    this.parseEngine = new ParseEngine(engineConfig);
    this.optimizer = new ParseOptimizer();
  }

  /**
   * Parse temporal input with intelligent strategy selection
   */
  async parse(
    input: TemporalInput,
    options: Partial<StrictParsingOptions> = {}
  ): Promise<Temporal.ZonedDateTime> {
    const context = createParseContext(input, options);
    
    try {
      // Increment operation count
      this.operationCount++;
      
      // Check for auto-optimization
      if (this.config.enableAutoOptimization && 
          this.operationCount - this.lastOptimization >= this.config.autoOptimizationInterval) {
        await this.performAutoOptimization();
      }

      // Get optimization hints for strategy selection
      const hints = await this.getOptimizationHints(input, context);
      
      // Select strategies based on configuration
      const selectedStrategies = this.selectStrategies(input, context, hints);
      
      // Attempt parsing with selected strategies
      const result = await this.attemptParsingWithStrategies(
        input,
        context,
        selectedStrategies
      );
      
      if (result.success && result.temporal) {
        return result.temporal;
      }
      
      // Handle fallback behavior
      return this.handleFallback(input, context, result.lastError);
      
    } catch (error) {
      throw new TemporalParseError(
        `Parse coordination failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        input,
        'COORDINATION_ERROR',
        'ParseCoordinator'
      );
    }
  }

  /**
   * Batch parse multiple inputs
   */
  async batchParse(
    inputs: TemporalInput[],
    options: Partial<StrictParsingOptions> = {}
  ): Promise<Array<{ input: TemporalInput; result?: Temporal.ZonedDateTime; error?: Error }>> {
    const results: Array<{ input: TemporalInput; result?: Temporal.ZonedDateTime; error?: Error }> = [];
    
    // Process in parallel with concurrency limit
    const concurrencyLimit = 10;
    const chunks = this.chunkArray(inputs, concurrencyLimit);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (input) => {
        try {
          const result = await this.parse(input, options);
          return { input, result };
        } catch (error) {
          return { input, error: error as Error };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Get optimization hints for input
   */
  async getOptimizationHints(
    input: TemporalInput,
    context: ParseContext
  ): Promise<ParseOptimizationHints> {
    // Try to infer the best strategy type
    const inferredType = inferStrategyType(input);
    
    // Get hints from the parse engine
    return this.parseEngine.getOptimizationHints(input, context.options);
  }

  /**
   * Select strategies based on configuration and hints
   */
  private selectStrategies(
    input: TemporalInput,
    context: ParseContext,
    hints: ParseOptimizationHints
  ): ParseStrategy[] {
    const availableStrategies = this.parseEngine.getStrategyObjects();
    
    switch (this.config.strategySelectionMode) {
      case 'confidence':
        return this.selectByConfidence(input, context, availableStrategies);
      
      case 'priority':
        return this.selectByPriority(input, context, availableStrategies);
      
      case 'hybrid':
      default:
        return this.selectByHybrid(input, context, availableStrategies, hints);
    }
  }

  /**
   * Select strategies by confidence score
   */
  private selectByConfidence(
    input: TemporalInput,
    context: ParseContext,
    strategies: ParseStrategy[]
  ): ParseStrategy[] {
    const strategiesWithConfidence = strategies
      .map(strategy => ({
        strategy,
        confidence: strategy.getConfidence(input, context)
      }))
      .filter(item => item.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxStrategyAttempts);
    
    return strategiesWithConfidence.map(item => item.strategy);
  }

  /**
   * Select strategies by priority
   */
  private selectByPriority(
    input: TemporalInput,
    context: ParseContext,
    strategies: ParseStrategy[]
  ): ParseStrategy[] {
    return strategies
      .filter(strategy => strategy.canHandle(input, context))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.config.maxStrategyAttempts);
  }

  /**
   * Select strategies using hybrid approach (confidence + priority)
   */
  private selectByHybrid(
    input: TemporalInput,
    context: ParseContext,
    strategies: ParseStrategy[],
    hints: ParseOptimizationHints
  ): ParseStrategy[] {
    const strategiesWithScore = strategies
      .map(strategy => {
        const confidence = strategy.getConfidence(input, context);
        const priority = strategy.priority;
        
        // Hybrid score: 70% confidence, 30% priority
        const hybridScore = (confidence * 0.7) + ((priority / 100) * 0.3);
        
        return {
          strategy,
          confidence,
          priority,
          hybridScore
        };
      })
      .filter(item => item.confidence > 0)
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, this.config.maxStrategyAttempts);
    
    return strategiesWithScore.map(item => item.strategy);
  }

  /**
   * Attempt parsing with selected strategies
   */
  private async attemptParsingWithStrategies(
    input: TemporalInput,
    context: ParseContext,
    strategies: ParseStrategy[]
  ): Promise<{ success: boolean; temporal?: Temporal.ZonedDateTime; lastError?: Error }> {
    let lastError: Error | undefined;
    
    // If no strategies are available, fail immediately
    if (strategies.length === 0) {
      return {
        success: false,
        lastError: new Error('No strategies available for parsing')
      };
    }
    
    // Try each selected strategy in order
    for (const strategy of strategies) {
      try {
        // Check if strategy can handle the input
        if (!strategy.canHandle(input, context)) {
          continue;
        }
        
        // Attempt parsing with this strategy
        const result = this.parseEngine.parseWithStrategy(input, context, strategy.type);
        
        if (result.success && result.temporal) {
          return {
            success: true,
            temporal: result.temporal
          };
        } else {
          lastError = result.error;
        }
      } catch (error) {
        lastError = error as Error;
      }
    }
    
    return {
      success: false,
      lastError
    };
  }

  /**
   * Handle fallback behavior when all strategies fail
   */
  private async handleFallback(
    input: TemporalInput,
    context: ParseContext,
    lastError?: Error
  ): Promise<Temporal.ZonedDateTime> {
    switch (this.config.fallbackBehavior) {
      case 'null':
        // Return epoch as fallback
        return Temporal.Instant.fromEpochMilliseconds(0)
          .toZonedDateTimeISO(context.options.timeZone || 'UTC');
      
      case 'retry':
        // Try with fallback strategy only
        try {
          const result = this.parseEngine.parse(input, context.options);
          if (result.success && result.data) {
            return result.data;
          }
        } catch {
          // Fall through to error
        }
        break;
    }
    
    // Default: throw error
    throw lastError || new TemporalParseError(
      'All parsing strategies failed',
      input,
      'ALL_STRATEGIES_FAILED',
      'ParseCoordinator'
    );
  }

  /**
   * Perform automatic optimization
   */
  private async performAutoOptimization(): Promise<void> {
    try {
      const metrics = this.parseEngine.getMetrics();
      const recommendations = this.optimizer.generateRecommendations(metrics);
      
      if (recommendations.length > 0) {
        this.optimizer.applyRecommendations(recommendations, this.parseEngine);
      }
      
      this.lastOptimization = this.operationCount;
    } catch (error) {
      // Ignore optimization errors
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): ParseMetrics {
    return this.parseEngine.getMetrics();
  }

  /**
   * Get performance analysis
   */
  getPerformanceAnalysis(): {
    efficiency: number;
    bottlenecks: string[];
    strengths: string[];
  } {
    const metrics = this.getMetrics();
    return this.optimizer.analyzePerformance(metrics);
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const metrics = this.getMetrics();
    return this.optimizer.generatePerformanceReport(metrics);
  }

  /**
   * Benchmark parsing performance
   */
  async benchmark(
    testInputs: Array<{ input: any; description: string }>,
    iterations: number = 100
  ) {
    return this.optimizer.benchmarkOperations(this.parseEngine, testInputs, iterations);
  }

  /**
   * Register custom strategy
   */
  registerStrategy(strategy: ParseStrategy): void {
    this.parseEngine.registerStrategy(strategy);
  }

  /**
   * Unregister strategy
   */
  unregisterStrategy(type: ParseStrategyType): void {
    this.parseEngine.unregisterStrategy(type);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.parseEngine.clearCache();
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.parseEngine.resetMetrics();
    this.operationCount = 0;
    this.lastOptimization = 0;
  }

  /**
   * Get configuration
   */
  getConfig(): ParseCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ParseCoordinatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}