/**
 * @file Temporal ZonedDateTime parsing strategy for handling Temporal.ZonedDateTime inputs
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
 * Strategy for parsing Temporal.ZonedDateTime inputs
 */
export class TemporalZonedStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'temporal-zoned';
  readonly priority = 95;
  readonly description = 'Parse Temporal.ZonedDateTime instances';

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return input instanceof Temporal.ZonedDateTime;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }
    return 1.0; // Maximum confidence for Temporal.ZonedDateTime
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

    const zonedDateTime = input as Temporal.ZonedDateTime;
    const targetTimeZone = context.options.timeZone;
    
    // Fast path if no timezone conversion is needed
    if (!targetTimeZone || targetTimeZone === zonedDateTime.timeZoneId) {
      return {
        canUseFastPath: true,
        data: zonedDateTime,
        strategy: this.type,
        confidence: 1.0
      };
    }
    
    // Fast path with timezone conversion
    try {
      const converted = zonedDateTime.withTimeZone(targetTimeZone);
      return {
        canUseFastPath: true,
        data: converted,
        strategy: this.type,
        confidence: 1.0
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
      errors.push('Input is not a Temporal.ZonedDateTime');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }

    const zonedDateTime = input as Temporal.ZonedDateTime;
    
    // Check if the ZonedDateTime is valid
    try {
      zonedDateTime.toString();
    } catch (error) {
      errors.push('Invalid Temporal.ZonedDateTime');
    }

    // Check if timezone conversion is needed
    const targetTimeZone = context.options.timeZone;
    if (targetTimeZone && targetTimeZone !== zonedDateTime.timeZoneId) {
      warnings.push(`Input timezone (${zonedDateTime.timeZoneId}) differs from target timezone (${targetTimeZone})`);
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
    const zonedDateTime = input as Temporal.ZonedDateTime;
    const targetTimeZone = context.options.timeZone;
    const appliedTransforms: string[] = [];
    let normalizedInput = zonedDateTime;

    // Convert timezone if needed
    if (targetTimeZone && targetTimeZone !== zonedDateTime.timeZoneId) {
      normalizedInput = zonedDateTime.withTimeZone(targetTimeZone);
      appliedTransforms.push('timezone-conversion');
    }

    return {
      normalizedInput,
      appliedTransforms,
      metadata: {
        originalType: 'Temporal.ZonedDateTime',
        originalTimeZone: zonedDateTime.timeZoneId,
        targetTimeZone: normalizedInput.timeZoneId
      }
    };
  }

  /**
   * Convert input to intermediate format
   */
  convert(input: TemporalInput, context: ParseContext): ParseConversionResult {
    const zonedDateTime = input as Temporal.ZonedDateTime;
    
    return {
      result: zonedDateTime,
      intermediateSteps: ['temporal-zoned'],
      appliedOptions: context.options,
      metadata: {
        timeZoneId: zonedDateTime.timeZoneId,
        epochNanoseconds: zonedDateTime.epochNanoseconds.toString(),
        year: zonedDateTime.year,
        month: zonedDateTime.month,
        day: zonedDateTime.day,
        hour: zonedDateTime.hour,
        minute: zonedDateTime.minute,
        second: zonedDateTime.second
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
      const zonedDateTime = input as Temporal.ZonedDateTime;
      const targetTimeZone = context.options.timeZone;
      
      // Use input as-is or convert timezone if needed
      let result = zonedDateTime;
      if (targetTimeZone && targetTimeZone !== zonedDateTime.timeZoneId) {
        result = zonedDateTime.withTimeZone(targetTimeZone);
      }
      
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
        new TemporalParseError(error.message, input, 'TEMPORAL_ZONED_PARSE_ERROR') :
        new TemporalParseError('Unknown error parsing Temporal.ZonedDateTime', input, 'UNKNOWN_ERROR');
      
      return createParseError(parseError, this.type, executionTime);
    }
  }

  /**
   * Get optimization hints for this strategy
   */
  getOptimizationHints(input: TemporalInput, context: ParseContext): ParseOptimizationHints {
    const zonedDateTime = input as Temporal.ZonedDateTime;
    const targetTimeZone = context.options.timeZone;
    const needsConversion = targetTimeZone && targetTimeZone !== zonedDateTime.timeZoneId;

    return {
      preferredStrategy: this.type,
      shouldCache: false, // Temporal.ZonedDateTime parsing is very fast
      canUseFastPath: true,
      estimatedComplexity: needsConversion ? 'low' : 'low',
      suggestedOptions: {},
      warnings: needsConversion ? [`Timezone conversion required from ${zonedDateTime.timeZoneId} to ${targetTimeZone}`] : []
    };
  }
}