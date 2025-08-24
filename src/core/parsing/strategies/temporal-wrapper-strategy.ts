/**
 * @file TemporalWrapper parsing strategy for handling existing TemporalWrapper objects
 */

import { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  StrictParsingOptions
} from '../../../types/index';
import { TemporalParseError } from '../../../types/enhanced-types';
import { TemporalWrapper } from '../../../TemporalWrapper';
import {
  isTemporalWrapper
} from '../../../types/index';

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
 * TemporalWrapper parsing strategy for handling existing TemporalWrapper objects
 */
export class TemporalWrapperStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'temporal-wrapper';
  readonly priority = 90;
  readonly description = 'Parse TemporalWrapper objects (already parsed temporal data)';

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return isTemporalWrapper(input);
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }

    const wrapper = input as unknown as TemporalWrapper;
    
    // Check if the wrapper has valid temporal data
    try {
      if (!wrapper.datetime) {
        return 0.1; // Very low confidence for invalid wrappers
      }
      
      // Check if it's a valid Temporal object by checking for essential properties
      // For ZonedDateTime (most common case), we need epochNanoseconds
      // For other Temporal types, we need at least year or hour properties
      const hasEssentialProperties = 
        'epochNanoseconds' in wrapper.datetime || // ZonedDateTime, Instant
        ('year' in wrapper.datetime && 'month' in wrapper.datetime) || // PlainDate, PlainDateTime, ZonedDateTime
        ('hour' in wrapper.datetime && 'minute' in wrapper.datetime); // PlainTime, PlainDateTime, ZonedDateTime
        
      if (!hasEssentialProperties) {
        return 0.1; // Very low confidence for invalid wrappers
      }
    } catch {
      return 0.1; // Very low confidence for invalid wrappers
    }
    
    // High confidence for valid TemporalWrapper objects
    return 0.98;
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!this.canHandle(input, context)) {
      errors.push('Input is not a TemporalWrapper object');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }
    
    const wrapper = input as unknown as TemporalWrapper;
    
    // Check if the wrapper has valid temporal data
    try {
      if (!wrapper.datetime) {
        errors.push('TemporalWrapper missing datetime property');
      } else {
        // Validate the temporal object
        if (!wrapper.datetime.epochNanoseconds) {
          errors.push('TemporalWrapper datetime object missing epochNanoseconds');
        }
        
        // Check if it's a valid ZonedDateTime-like object
        if (!wrapper.datetime.timeZoneId) {
          warnings.push('TemporalWrapper datetime object missing timeZoneId');
        }
        
        if (!wrapper.datetime.calendarId) {
          warnings.push('TemporalWrapper datetime object missing calendarId');
        }
      }
    } catch (error) {
      errors.push(`Invalid temporal object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // TemporalWrapper objects don't have metadata property
    // Validation focuses on the datetime property
    
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
    const wrapper = input as unknown as TemporalWrapper;
    const appliedTransforms: string[] = [];
    const metadata: Record<string, unknown> = {
      originalSource: 'TemporalWrapper',
      originalParseTime: undefined,
      hasMetadata: false
    };
    
    // For TemporalWrapper objects, normalization is minimal since they're already parsed
    // We just ensure we have the temporal data
    let normalized = wrapper;
    
    // Check if we need to handle timezone conversion
    if (context.options.timeZone && 
        wrapper.datetime.timeZoneId && 
        context.options.timeZone !== wrapper.datetime.timeZoneId) {
      appliedTransforms.push('timezone-conversion-needed');
      metadata.targetTimezone = context.options.timeZone;
      metadata.sourceTimezone = wrapper.datetime.timeZoneId;
    }
    
    // Check if we need to handle calendar conversion
    if (context.options.calendar && 
        wrapper.datetime.calendarId && 
        context.options.calendar !== wrapper.datetime.calendarId) {
      appliedTransforms.push('calendar-conversion-needed');
      metadata.targetCalendar = context.options.calendar;
      metadata.sourceCalendar = wrapper.datetime.calendarId;
    }
    
    metadata.transformCount = appliedTransforms.length;
    
    return {
      normalizedInput: input,
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
      const wrapper = input as unknown as TemporalWrapper;
      
      // Validate the wrapper
      if (!wrapper.datetime) {
        throw new Error('Invalid TemporalWrapper object');
      }
      
      let result: Temporal.ZonedDateTime;
      
      // The datetime property is already a ZonedDateTime, use it directly
      result = wrapper.datetime;
      
      // Apply timezone conversion if needed
      if (context.options.timeZone && context.options.timeZone !== result.timeZoneId) {
        result = result.withTimeZone(context.options.timeZone);
      }
      
      // Apply calendar conversion if needed
      if (context.options.calendar && context.options.calendar !== result.calendarId) {
        result = result.withCalendar(context.options.calendar);
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
      
      const parseError = new TemporalParseError(
        `Failed to parse TemporalWrapper: ${error instanceof Error ? error.message : 'Unknown error'}`,
        input,
        'TEMPORAL_WRAPPER_PARSE_ERROR',
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
    
    const wrapper = input as unknown as TemporalWrapper;
    
    // Fast path if the temporal object is already a ZonedDateTime and no conversion is needed
    if (wrapper.datetime instanceof Temporal.ZonedDateTime) {
      const needsTimezoneConversion = context.options.timeZone && 
                                     context.options.timeZone !== wrapper.datetime.timeZoneId;
      const needsCalendarConversion = context.options.calendar && 
                                     context.options.calendar !== wrapper.datetime.calendarId;
      
      if (!needsTimezoneConversion && !needsCalendarConversion) {
        return {
          canUseFastPath: true,
          data: wrapper.datetime,
          strategy: this.type,
          confidence: 0.98
        };
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
    const wrapper = input as unknown as TemporalWrapper;
    const confidence = this.getConfidence(input, context);
    
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    let shouldCache = false; // Already parsed, no need to cache
    let canUseFastPath = false;
    const warnings: string[] = [];
    
    // Determine complexity
    if (wrapper.datetime instanceof Temporal.ZonedDateTime) {
      const needsTimezoneConversion = context.options.timeZone && 
                                     context.options.timeZone !== wrapper.datetime.timeZoneId;
      const needsCalendarConversion = context.options.calendar && 
                                     context.options.calendar !== wrapper.datetime.calendarId;
      
      if (!needsTimezoneConversion && !needsCalendarConversion) {
        estimatedComplexity = 'low';
        canUseFastPath = true;
      } else {
        estimatedComplexity = 'medium';
        warnings.push('Timezone or calendar conversion required');
      }
    } else if (wrapper.datetime && 'epochNanoseconds' in wrapper.datetime) {
      estimatedComplexity = 'medium';
      warnings.push('ZonedDateTime reconstruction required');
    } else {
      estimatedComplexity = 'high';
      warnings.push('Invalid TemporalWrapper requires error handling');
    }
    
    // Caching recommendations - TemporalWrapper objects are already parsed
    shouldCache = false;
    warnings.push('TemporalWrapper objects are already parsed - caching not beneficial');
    
    if (confidence < 0.3) {
      warnings.push('Low confidence parsing - invalid TemporalWrapper');
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