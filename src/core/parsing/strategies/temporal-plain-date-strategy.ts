/**
 * @file Temporal PlainDate parsing strategy for handling Temporal.PlainDate inputs
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
 * Strategy for parsing Temporal.PlainDate inputs
 */
export class TemporalPlainDateStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'temporal-plain-date';
  readonly priority = 80;
  readonly description = 'Parse Temporal.PlainDate instances';

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return input instanceof Temporal.PlainDate;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }
    return 0.85; // High confidence for Temporal.PlainDate
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

    const plainDate = input as Temporal.PlainDate;
    const timeZone = context.options.timeZone || 'UTC';
    
    // Fast path for PlainDate conversion to ZonedDateTime
    try {
      const plainDateTime = plainDate.toPlainDateTime('00:00:00');
      const result = plainDateTime.toZonedDateTime(timeZone);
      return {
        canUseFastPath: true,
        data: result,
        strategy: this.type,
        confidence: 0.85
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
      errors.push('Input is not a Temporal.PlainDate');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }

    const plainDate = input as Temporal.PlainDate;
    
    // Check if the PlainDate is valid
    try {
      plainDate.toString();
    } catch (error) {
      errors.push('Invalid Temporal.PlainDate');
    }

    // Warn if no timezone context is provided
    if (!context.options.timeZone) {
      warnings.push('No timezone specified, will use default timezone and start of day');
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
        originalType: 'Temporal.PlainDate'
      }
    };
  }

  /**
   * Convert input to intermediate format
   */
  convert(input: TemporalInput, context: ParseContext): ParseConversionResult {
    const plainDate = input as Temporal.PlainDate;
    const timeZone = context.options.timeZone || (DEFAULT_TEMPORAL_CONFIG as any).timeZone;
    const plainDateTime = plainDate.toPlainDateTime('00:00:00');
    const zonedDateTime = plainDateTime.toZonedDateTime(timeZone);
    
    return {
      result: zonedDateTime,
      intermediateSteps: ['temporal-plain-date'],
      appliedOptions: context.options,
      metadata: {
        year: plainDate.year,
        month: plainDate.month,
        day: plainDate.day,
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
      const plainDate = input as Temporal.PlainDate;
      const timeZone = context.options.timeZone || (DEFAULT_TEMPORAL_CONFIG as any).timeZone;
      
      // Convert PlainDate to ZonedDateTime at start of day
      const plainDateTime = plainDate.toPlainDateTime('00:00:00');
      const result = plainDateTime.toZonedDateTime(timeZone);
      
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
        new TemporalParseError(error.message, input, 'TEMPORAL_PLAIN_DATE_PARSE_ERROR') :
        new TemporalParseError('Unknown error parsing Temporal.PlainDate', input, 'UNKNOWN_ERROR');
      
      return createParseError(parseError, this.type, executionTime);
    }
  }

  /**
   * Get optimization hints for this strategy
   */
  getOptimizationHints(input: TemporalInput, context: ParseContext): ParseOptimizationHints {
    return {
      preferredStrategy: this.type,
      shouldCache: false, // Temporal.PlainDate parsing is very fast
      canUseFastPath: true,
      estimatedComplexity: 'low',
      suggestedOptions: {
        timeZone: context.options.timeZone || (DEFAULT_TEMPORAL_CONFIG as any).timeZone
      },
      warnings: context.options.timeZone ? [] : ['Consider specifying a timezone for more predictable results']
    };
  }
}