/**
 * @file Temporal Instant parsing strategy for handling Temporal.Instant inputs
 */

import { Temporal } from '@js-temporal/polyfill';
import type { TemporalInput } from '../../../types/enhanced-types';
import { TemporalParseError } from '../../../types/enhanced-types';
import { DEFAULT_TEMPORAL_CONFIG } from '../../../types/index';
import { TemporalWrapper } from '../../../TemporalWrapper';
import type {
  ParseStrategy,
  ParseStrategyType,
  ParseResult,
  ParseValidationResult,
  ParseNormalizationResult,
  ParseConversionResult,
  ParseContext,
  ParseOptimizationHints,
  FastPathResult
} from '../parsing-types';
import {
  createParseResult,
  createParseError
} from '../parsing-types';

/**
 * Strategy for parsing Temporal.Instant inputs
 */
export class TemporalInstantStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'temporal-instant';
  readonly priority = 90;
  readonly description = 'Parse Temporal.Instant instances';

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return input instanceof Temporal.Instant;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }
    return 0.95; // Very high confidence for Temporal.Instant
  }

  /**
   * Check if this strategy can handle the input quickly
   */
  checkFastPath(input: TemporalInput, context: ParseContext): FastPathResult {
    if (!this.canHandle(input, context)) {
      return {
        canUseFastPath: false,
        strategy: this.type,
        confidence: 0
      };
    }

    const instant = input as Temporal.Instant;
    const timeZone = context.options.timeZone || 'UTC';
    
    // Fast path for Instant conversion to ZonedDateTime
    try {
      const result = instant.toZonedDateTimeISO(timeZone);
      return {
        canUseFastPath: true,
        data: result,
        strategy: this.type,
        confidence: 0.95
      };
    } catch {
      return {
        canUseFastPath: false,
        strategy: this.type,
        confidence: 0
      };
    }
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.canHandle(input, context)) {
      errors.push('Input is not a Temporal.Instant');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }

    const instant = input as Temporal.Instant;
    
    // Check if the instant is valid
    try {
      instant.toString();
    } catch (error) {
      errors.push('Invalid Temporal.Instant');
    }

    return {
      isValid: errors.length === 0,
      normalizedInput: input,
      suggestedStrategy: this.type,
      confidence: this.getConfidence(input, context),
      errors,
      warnings
    };
  }

  /**
   * Normalize input for parsing
   */
  normalize(input: TemporalInput, context: ParseContext): ParseNormalizationResult {
    return {
      normalizedInput: input,
      appliedTransforms: [],
      metadata: {
        originalType: 'Temporal.Instant'
      }
    };
  }

  /**
   * Convert input to intermediate format
   */
  convert(input: TemporalInput, context: ParseContext): ParseConversionResult {
    const instant = input as Temporal.Instant;
    const timeZone = context.options.timeZone || (DEFAULT_TEMPORAL_CONFIG as any).timeZone;
    const zonedDateTime = instant.toZonedDateTimeISO(timeZone);
    
    return {
      result: zonedDateTime,
      intermediateSteps: ['temporal-instant'],
      appliedOptions: context.options,
      metadata: {
        epochNanoseconds: instant.epochNanoseconds.toString(),
        timeZone: timeZone
      }
    };
  }

  /**
   * Parse input to ZonedDateTime
   */
  parse(input: TemporalInput, context: ParseContext): ParseResult {
    let startTime: number;
    try {
      startTime = performance.now();
    } catch {
      startTime = Date.now();
    }
    
    try {
      const instant = input as Temporal.Instant;
      const timeZone = context.options.timeZone || (DEFAULT_TEMPORAL_CONFIG as any).timeZone;
      
      // Convert Instant to ZonedDateTime
      const result = instant.toZonedDateTimeISO(timeZone);
      
      let executionTime: number;
      try {
        executionTime = performance.now() - startTime;
      } catch {
        executionTime = Date.now() - startTime;
      }
      
      return createParseResult(
        result,
        this.type,
        executionTime,
        false,
        this.getConfidence(input, context)
      );
    } catch (error) {
      let executionTime: number;
      try {
        executionTime = performance.now() - startTime;
      } catch {
        executionTime = Date.now() - startTime;
      }
      
      const parseError = error instanceof Error ?
        new TemporalParseError(error.message, input, 'TEMPORAL_INSTANT_PARSE_ERROR') :
        new TemporalParseError('Unknown error parsing Temporal.Instant', input, 'UNKNOWN_ERROR');
      
      return createParseError(parseError, this.type, executionTime);
    }
  }

  /**
   * Get optimization hints for this strategy
   */
  getOptimizationHints(input: TemporalInput, context: ParseContext): ParseOptimizationHints {
    return {
      preferredStrategy: this.type,
      shouldCache: false, // Temporal.Instant parsing is very fast
      canUseFastPath: true,
      estimatedComplexity: 'low',
      suggestedOptions: {},
      warnings: []
    };
  }
}