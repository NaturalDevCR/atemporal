/**
 * @file Temporal-like parsing strategy for handling objects with temporal properties
 */

import { Temporal } from '@js-temporal/polyfill';
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
import { TemporalParseError, type TemporalInput } from '../../../types/enhanced-types';
import { TemporalWrapper } from '../../../TemporalWrapper';
import { DEFAULT_TEMPORAL_CONFIG } from '../../../types/index';

/**
 * Interface for temporal-like objects
 */
interface TemporalLikeObject {
  year: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
  microsecond?: number;
  nanosecond?: number;
  timeZone?: string;
  calendar?: string;
}

/**
 * Temporal-like parsing strategy for handling objects with temporal properties
 * Supports objects like { year: 2023, month: 1, day: 1 }
 */
export class TemporalLikeStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'temporal-like';
  readonly priority = 40;
  readonly description = 'Parse objects with temporal properties like { year, month, day }';

  /**
   * Check if this strategy can handle the given input
   */
  canHandle(input: unknown, context?: ParseContext): boolean {
    if (!this.isTemporalLikeObject(input)) {
      return false;
    }
    
    const obj = input as Record<string, unknown>;
    
    // Must have at least year property to be considered temporal-like
    if (!('year' in obj) || typeof obj.year !== 'number') {
      return false;
    }
    
    // Check if it's a plain object with non-temporal properties
    const temporalKeys = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond', 'timeZone', 'calendar'];
    const objectKeys = Object.keys(obj);
    const nonTemporalKeys = objectKeys.filter(key => !temporalKeys.includes(key));
    
    // If it has non-temporal properties, it's not a temporal-like object
    if (nonTemporalKeys.length > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: unknown, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }

    const obj = input as Record<string, unknown>;
    let confidence = 0.1; // Base confidence
    
    // Higher confidence for objects with more temporal properties
    const temporalKeys = ['year', 'month', 'day', 'hour', 'minute', 'second'];
    const presentKeys = temporalKeys.filter(key => key in obj && typeof obj[key] === 'number');
    
    if (presentKeys.length >= 3) {
      confidence = 0.9; // High confidence for date-like objects
    } else if (presentKeys.length >= 2) {
      confidence = 0.7; // Medium confidence
    } else if (presentKeys.length >= 1) {
      confidence = 0.5; // Low confidence
    }
    
    // Boost confidence if timezone is specified
    if ('timeZone' in obj && typeof obj.timeZone === 'string') {
      confidence = Math.min(0.95, confidence + 0.1);
    }
    
    // Boost confidence if calendar is specified
    if ('calendar' in obj && typeof obj.calendar === 'string') {
      confidence = Math.min(0.95, confidence + 0.05);
    }
    
    return confidence;
  }

  /**
   * Check if fast path can be used for temporal-like objects
   */
  checkFastPath(input: unknown, context: ParseContext): FastPathResult {
    if (!this.isTemporalLikeObject(input)) {
      return {
        canUseFastPath: false,
        strategy: this.type,
        confidence: 0
      };
    }

    const obj = input as TemporalLikeObject;
    
    // Fast path for simple year/month/day objects
    if (obj.year && obj.month && obj.day && 
        !obj.hour && !obj.minute && !obj.second && 
        !obj.timeZone && !obj.calendar) {
      return {
        canUseFastPath: true,
        strategy: this.type,
        confidence: 0.9
      };
    }

    return {
      canUseFastPath: false,
      strategy: this.type,
      confidence: this.getConfidence(input, context)
    };
  }

  /**
   * Validate temporal-like object input
   */
  validate(input: unknown, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 0;

    try {
      if (!this.isTemporalLikeObject(input)) {
        errors.push('Input is not a temporal-like object');
        return { 
          isValid: false, 
          normalizedInput: input as TemporalInput,
          suggestedStrategy: 'fallback' as ParseStrategyType,
          confidence: 0,
          errors, 
          warnings 
        };
      }

      const obj = input as TemporalLikeObject;

      // Validate required year property
      if (typeof obj.year !== 'number' || !Number.isInteger(obj.year)) {
        errors.push('Year must be an integer');
      } else if (obj.year < 1 || obj.year > 9999) {
        errors.push('Year must be between 1 and 9999');
      } else {
        confidence += 0.3;
      }

      // Validate optional month property
      if (obj.month !== undefined) {
        if (typeof obj.month !== 'number' || !Number.isInteger(obj.month)) {
          errors.push('Month must be an integer');
        } else if (obj.month < 1 || obj.month > 12) {
          errors.push('Month must be between 1 and 12');
        } else {
          confidence += 0.3;
        }
      }

      // Validate optional day property
      if (obj.day !== undefined) {
        if (typeof obj.day !== 'number' || !Number.isInteger(obj.day)) {
          errors.push('Day must be an integer');
        } else if (obj.day < 1 || obj.day > 31) {
          errors.push('Day must be between 1 and 31');
        } else {
          confidence += 0.3;
          
          // Additional validation for impossible dates
          if (obj.month !== undefined && typeof obj.month === 'number' && obj.month >= 1 && obj.month <= 12) {
            // Check for impossible dates like February 30th
            if (obj.month === 2) {
              const year = obj.year || new Date().getFullYear();
              const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
              const maxDaysInFeb = isLeapYear ? 29 : 28;
              if (obj.day > maxDaysInFeb) {
                errors.push(`February ${obj.day} does not exist in year ${year} (max: ${maxDaysInFeb})`);
              }
            } else if ([4, 6, 9, 11].includes(obj.month) && obj.day > 30) {
              errors.push(`Day ${obj.day} does not exist in month ${obj.month} (max: 30 days)`);
            }
          }
        }
      }

      // Validate time components if present
      const timeFields = ['hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond'];
      for (const field of timeFields) {
        const value = obj[field as keyof TemporalLikeObject];
        if (value !== undefined) {
          if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
            errors.push(`${field} must be a non-negative integer`);
          } else {
            confidence += 0.1;
          }
        }
      }

      // Check for timezone and calendar
      if (obj.timeZone && typeof obj.timeZone !== 'string') {
        warnings.push('timeZone should be a string');
      }
      if (obj.calendar && typeof obj.calendar !== 'string') {
        warnings.push('calendar should be a string');
      }

      const isValid = errors.length === 0;
      if (isValid && confidence < 0.5) {
        confidence = 0.7; // Minimum confidence for valid temporal-like objects
      }

      return { 
        isValid, 
        normalizedInput: input as TemporalInput,
        suggestedStrategy: this.type,
        confidence,
        errors, 
        warnings 
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { 
        isValid: false, 
        normalizedInput: input as TemporalInput,
        suggestedStrategy: 'fallback' as ParseStrategyType,
        confidence: 0,
        errors, 
        warnings 
      };
    }
  }

  /**
   * Normalize temporal-like object to standard format
   */
  normalize(input: unknown, context: ParseContext): ParseNormalizationResult {
    const appliedTransforms: string[] = [];

    try {
      const obj = input as TemporalLikeObject;
      
      // Resolve timezone with proper hierarchy: context.options.timeZone > obj.timeZone > default
      const resolvedTimeZone = context?.options?.timeZone || obj.timeZone || DEFAULT_TEMPORAL_CONFIG.defaultTimeZone;
      
      // Create normalized object with defaults
      const normalized: Required<TemporalLikeObject> = {
        year: obj.year,
        month: obj.month ?? 1,
        day: obj.day ?? 1,
        hour: obj.hour ?? 0,
        minute: obj.minute ?? 0,
        second: obj.second ?? 0,
        millisecond: obj.millisecond ?? 0,
        microsecond: obj.microsecond ?? 0,
        nanosecond: obj.nanosecond ?? 0,
        timeZone: resolvedTimeZone,
        calendar: obj.calendar ?? DEFAULT_TEMPORAL_CONFIG.defaultCalendar
      };
      
      // Track applied transforms
      if (context?.options?.timeZone && obj.timeZone && context.options.timeZone !== obj.timeZone) {
        appliedTransforms.push(`timezone-override:${obj.timeZone}->${context.options.timeZone}`);
      }

      if (obj.month === undefined) {
        appliedTransforms.push('default-month:1');
      }
      if (obj.day === undefined) {
        appliedTransforms.push('default-day:1');
      }
      if (obj.hour === undefined) {
        appliedTransforms.push('default-hour:0');
      }
      if (obj.minute === undefined) {
        appliedTransforms.push('default-minute:0');
      }
      if (obj.second === undefined) {
        appliedTransforms.push('default-second:0');
      }

      return {
        normalizedInput: normalized,
        appliedTransforms,
        metadata: {
          originalFormat: 'temporal-like-object',
          hasTimeZone: obj.timeZone !== undefined,
          hasCalendar: obj.calendar !== undefined,
          hasTimeComponents: obj.hour !== undefined || obj.minute !== undefined || obj.second !== undefined
        }
      };
    } catch (error) {
      return {
        normalizedInput: input as TemporalInput,
      appliedTransforms: [`error:${error instanceof Error ? error.message : 'Unknown error'}`],
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Convert normalized temporal-like object to ZonedDateTime
   */
  convert(normalized: unknown, context: ParseContext): ParseConversionResult {
    const intermediateSteps: string[] = [];

    try {
      const obj = normalized as Required<TemporalLikeObject>;
      intermediateSteps.push('Extracted temporal-like object properties');
      
      // Create Temporal.PlainDateTime first
      const plainDateTime = new Temporal.PlainDateTime(
        obj.year,
        obj.month,
        obj.day,
        obj.hour,
        obj.minute,
        obj.second,
        obj.millisecond,
        obj.microsecond,
        obj.nanosecond,
        obj.calendar
      );
      intermediateSteps.push('Created Temporal.PlainDateTime');

      // Convert to ZonedDateTime
      const zonedDateTime = plainDateTime.toZonedDateTime(obj.timeZone);
      intermediateSteps.push('Converted to Temporal.ZonedDateTime');

      return {
        result: zonedDateTime,
        intermediateSteps,
        appliedOptions: context.options,
        metadata: {
          strategy: this.type,
          originalInput: context.input,
          conversionPath: 'temporal-like -> PlainDateTime -> ZonedDateTime'
        }
      };
    } catch (error) {
      intermediateSteps.push(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse temporal-like object (main entry point)
   */
  parse(input: unknown, context: ParseContext): ParseResult {
    let startTime: number;
    try {
      startTime = performance.now();
    } catch {
      startTime = Date.now();
    }
    
    try {
      // Validate input
      const validation = this.validate(input, context);
      if (!validation.isValid) {
        let executionTime: number;
        try {
          executionTime = performance.now() - startTime;
        } catch {
          executionTime = Date.now() - startTime;
        }
        
        return createParseError(
          new TemporalParseError(`Validation failed: ${validation.errors.join(', ')}`, 'TEMPORAL_LIKE_VALIDATION_ERROR'),
          this.type,
          executionTime
        );
      }

      // Normalize input
      const normalization = this.normalize(input, context);
      
      // Check if normalization had errors (indicated by error in appliedTransforms)
      const hasErrors = normalization.appliedTransforms.some(transform => transform.startsWith('error:'));
      if (hasErrors) {
        let executionTime: number;
        try {
          executionTime = performance.now() - startTime;
        } catch {
          executionTime = Date.now() - startTime;
        }
        
        const errorTransform = normalization.appliedTransforms.find(t => t.startsWith('error:'));
        const errorMessage = errorTransform ? errorTransform.substring(6) : 'Unknown normalization error';
        
        return createParseError(
          new TemporalParseError(`Normalization failed: ${errorMessage}`, 'TEMPORAL_LIKE_NORMALIZATION_ERROR'),
          this.type,
          executionTime
        );
      }

      // Convert to ZonedDateTime
      try {
        const conversion = this.convert(normalization.normalizedInput, context);
        
        let executionTime: number;
        try {
          executionTime = performance.now() - startTime;
        } catch {
          executionTime = Date.now() - startTime;
        }

        return createParseResult(
          conversion.result,
          this.type,
          executionTime
        );
      } catch (conversionError) {
        let executionTime: number;
        try {
          executionTime = performance.now() - startTime;
        } catch {
          executionTime = Date.now() - startTime;
        }
        
        return createParseError(
          conversionError instanceof TemporalParseError ? conversionError : new TemporalParseError('Conversion failed', 'TEMPORAL_LIKE_CONVERSION_ERROR'),
          this.type,
          executionTime
        );
      }
    } catch (error) {
      let executionTime: number;
      try {
        executionTime = performance.now() - startTime;
      } catch {
        executionTime = Date.now() - startTime;
      }
      
      return createParseError(
        error instanceof TemporalParseError ? error : new TemporalParseError('Unknown parsing error', 'TEMPORAL_LIKE_PARSE_ERROR'),
        this.type,
        executionTime
      );
    }
  }

  /**
   * Get optimization hints for temporal-like objects
   */
  getOptimizationHints(input: unknown): ParseOptimizationHints {
    const warnings: string[] = [];
    
    if (!this.isTemporalLikeObject(input)) {
      return {
        preferredStrategy: 'fallback' as ParseStrategyType,
        shouldCache: false,
        canUseFastPath: false,
        estimatedComplexity: 'low',
        suggestedOptions: {},
        warnings: ['Input is not a temporal-like object']
      };
    }

    const obj = input as TemporalLikeObject;
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    // Increase complexity based on features used
    if (obj.timeZone || obj.calendar) {
      complexity = 'medium';
    }
    if (obj.microsecond !== undefined || obj.nanosecond !== undefined) {
      complexity = 'high';
      warnings.push('High precision time components detected - consider caching');
    }

    return {
      preferredStrategy: this.type,
      shouldCache: complexity !== 'low',
      canUseFastPath: complexity === 'low',
      estimatedComplexity: complexity,
      suggestedOptions: {
        enableFastPath: complexity === 'low',
        timeZone: obj.timeZone || DEFAULT_TEMPORAL_CONFIG.defaultTimeZone,
        calendar: obj.calendar || DEFAULT_TEMPORAL_CONFIG.defaultCalendar
      },
      warnings
    };
  }

  /**
   * Check if input is a temporal-like object
   */
  private isTemporalLikeObject(input: unknown): boolean {
    if (!input || typeof input !== 'object') {
      return false;
    }

    const obj = input as Record<string, unknown>;
    
    // Must have year property
    if (typeof obj.year !== 'number') {
      return false;
    }

    // Check for at least one other temporal property
    const temporalKeys = ['month', 'day', 'hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond', 'timeZone', 'calendar'];
    return temporalKeys.some(key => obj[key] !== undefined);
  }
}