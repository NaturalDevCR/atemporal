/**
 * @file Main input parser implementing the strategy pattern for optimized parsing
 */

import { Temporal } from '@js-temporal/polyfill';
import type { TemporalInput, StrictParsingOptions } from '../../types/enhanced-types';
import { TemporalParseError } from '../../types/enhanced-types';
import type {
  ParseStrategy,
  ParseContext,
  ParseResult,
  ParseStrategyType
} from './parsing-types';
import { createDefaultStrategies } from './strategies';

/**
 * High-performance input parser using strategy pattern and type-first classification
 */
export class InputParser {
  private static strategies: ParseStrategy[] = createDefaultStrategies();

  /**
   * Parses input using optimized type-first strategy selection
   */
  static parse(input: TemporalInput, options: StrictParsingOptions): Temporal.ZonedDateTime {
    const context: ParseContext = {
      input,
      options,
      inferredType: 'fallback',
      confidence: 0,
      startTime: performance.now(),
      metadata: {}
    };

    try {
      // Try strategies in priority order
      for (const strategy of this.strategies) {
        if (strategy.canHandle(input, context)) {
          const result = strategy.parse(input, context);
          if (result.success && result.data) {
            return result.data;
          } else if (!result.success && result.error) {
            // If strategy failed with an error, throw it
            throw result.error;
          }
        }
      }

      throw new TemporalParseError(`No strategy could parse input: ${typeof input}`, input);
    } catch (error) {
      if (error instanceof TemporalParseError) {
        throw error;
      }
      throw new TemporalParseError(`Failed to parse input: ${error}`, input);
    }
  }

  /**
   * Validates timezone before parsing
   */
  static validateTimeZone(timeZone: string): void {
    try {
      // Validate the time zone by attempting to use it in a formatter
      new Intl.DateTimeFormat('en-US', { timeZone });
    } catch (e) {
      throw new TemporalParseError(`Invalid time zone: ${timeZone}`, timeZone);
    }
  }

  /**
   * Adds a custom parsing strategy
   */
  static addStrategy(strategy: ParseStrategy): void {
    // Remove existing strategy of the same type
    const existingIndex = this.strategies.findIndex(s => s.type === strategy.type);
    if (existingIndex >= 0) {
      this.strategies[existingIndex] = strategy;
    } else {
      this.strategies.push(strategy);
    }
    
    // Re-sort by priority
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Reset strategies to default state (for testing)
   */
  static resetStrategies(): void {
    this.strategies = createDefaultStrategies();
  }

  /**
   * Gets performance statistics for the parser
   */
  static getStats() {
    return {
      strategiesCount: this.strategies.length,
      supportedStrategyTypes: this.strategies.map(s => s.type),
      strategiesByPriority: this.strategies.map(s => ({ type: s.type, priority: s.priority }))
    };
  }
}