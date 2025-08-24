/**
 * @file Date parsing strategy for handling JavaScript Date objects
 */

import { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  StrictParsingOptions
} from '../../../types/index';
import { TemporalParseError } from '../../../types/enhanced-types';

import type {
  ParseStrategy,
  ParseContext,
  ParseResult,
  ParseValidationResult,
  ParseNormalizationResult,
  ParseOptimizationHints,
  FastPathResult,
  ParseStrategyType
} from '../parsing-types';

import {
  createParseResult,
  createParseError
} from '../parsing-types';

/**
 * Date parsing strategy for handling JavaScript Date objects
 */
export class DateParseStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'date';
  readonly priority = 70;
  readonly description = 'Parse JavaScript Date objects';

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return input instanceof Date;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }

    const date = input as Date;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 0.1; // Very low confidence for invalid dates
    }
    
    // High confidence for valid dates
    return 0.95;
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!this.canHandle(input, context)) {
      errors.push('Input is not a Date object');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }
    
    const date = input as Date;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      errors.push('Date object is invalid (NaN timestamp)');
    }
    
    // Check for edge cases
    const timestamp = date.getTime();
    
    if (timestamp === 0) {
      warnings.push('Date represents Unix epoch (1970-01-01)');
    }
    
    // Check for very old or future dates
    const year = date.getFullYear();
    if (year < 1900) {
      warnings.push('Date represents a year before 1900');
    } else if (year > 2100) {
      warnings.push('Date represents a year after 2100');
    }
    
    // Check for timezone-related issues
    const timezoneOffset = date.getTimezoneOffset();
    if (Math.abs(timezoneOffset) > 12 * 60) {
      warnings.push('Date has unusual timezone offset');
    }
    
    const confidence = this.getConfidence(input, context);
    
    return {
      isValid: errors.length === 0,
      normalizedInput: input,
      suggestedStrategy: this.type,
      confidence,
      errors,
      warnings
    };
  }

  /**
   * Normalize input for parsing
   */
  normalize(input: TemporalInput, context: ParseContext): ParseNormalizationResult {
    const date = input as Date;
    const appliedTransforms: string[] = [];
    const metadata: Record<string, unknown> = {
      originalTimestamp: date.getTime(),
      originalTimezoneOffset: date.getTimezoneOffset(),
      originalYear: date.getFullYear(),
      originalMonth: date.getMonth(),
      originalDate: date.getDate()
    };
    
    // For Date objects, normalization is minimal since they're already structured
    // We just ensure we have a clean copy
    const normalized = new Date(date.getTime());
    
    // Check if we need to handle timezone conversion
    if (context.options.timeZone && context.options.timeZone !== 'UTC') {
      appliedTransforms.push('timezone-aware');
      metadata.targetTimezone = context.options.timeZone;
    }
    
    metadata.normalizedTimestamp = normalized.getTime();
    metadata.transformCount = appliedTransforms.length;
    
    return {
      normalizedInput: normalized,
      appliedTransforms,
      metadata
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
      const date = input as Date;
      
      // Validate the date
      if (isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
      }
      
      // Create Instant from Date timestamp
      const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
      
      // Convert to ZonedDateTime
      const timeZone = context.options.timeZone || 'UTC';
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
      
      const parseError = new TemporalParseError(
        `Failed to parse Date: ${error instanceof Error ? error.message : 'Unknown error'}`,
        input,
        'DATE_PARSE_ERROR',
        `Strategy: ${this.type}`
      );
      
      return createParseError(parseError, this.type, executionTime);
    }
  }

  /**
   * Check if fast path can be used
   */
  checkFastPath(input: TemporalInput, context: ParseContext): FastPathResult {
    if (!this.canHandle(input, context)) {
      return {
        canUseFastPath: false,
        strategy: this.type,
        confidence: 0
      };
    }
    
    const date = input as Date;
    
    // Fast path for valid dates
    if (!isNaN(date.getTime())) {
      try {
        const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
        const timeZone = context.options.timeZone || 'UTC';
        const result = instant.toZonedDateTimeISO(timeZone);
        
        return {
          canUseFastPath: true,
          data: result,
          strategy: this.type,
          confidence: 0.95
        };
      } catch {
        // Fall back to regular parsing
      }
    }
    
    return {
      canUseFastPath: false,
      strategy: this.type,
      confidence: this.getConfidence(input, context)
    };
  }

  /**
   * Get optimization hints
   */
  getOptimizationHints(input: TemporalInput, context: ParseContext): ParseOptimizationHints {
    const date = input as Date;
    const confidence = this.getConfidence(input, context);
    
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    let shouldCache = true;
    let canUseFastPath = false;
    const warnings: string[] = [];
    
    // Determine complexity
    if (!isNaN(date.getTime())) {
      estimatedComplexity = 'low';
      canUseFastPath = true;
    } else {
      estimatedComplexity = 'high';
      warnings.push('Invalid Date object requires error handling');
    }
    
    // Check for timezone complexity
    if (context.options.timeZone && context.options.timeZone !== 'UTC') {
      estimatedComplexity = 'medium';
      warnings.push('Timezone conversion adds complexity');
    }
    
    // Caching recommendations
    const timestamp = date.getTime();
    
    // Don't cache invalid dates
    if (isNaN(timestamp)) {
      shouldCache = false;
      warnings.push('Invalid dates should not be cached');
    }
    
    // Don't cache dates that change frequently (like "now")
    const now = Date.now();
    if (Math.abs(timestamp - now) < 1000) {
      shouldCache = false;
      warnings.push('Recent dates may not benefit from caching');
    }
    
    if (confidence < 0.3) {
      shouldCache = false;
      warnings.push('Low confidence parsing - results may not be cacheable');
    }
    
    return {
      preferredStrategy: this.type,
      shouldCache,
      canUseFastPath,
      estimatedComplexity,
      suggestedOptions: {
        enableFastPath: canUseFastPath,
        enableCaching: shouldCache
      },
      warnings
    };
  }
}