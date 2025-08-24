/**
 * @file Fallback parsing strategy for handling inputs that other strategies cannot handle
 */

import '@js-temporal/polyfill';
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
 * Fallback parsing strategy for handling inputs that other strategies cannot handle
 * This strategy attempts various conversion approaches as a last resort
 */
export class FallbackStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'fallback';
  readonly priority = 10; // Lowest priority
  readonly description = 'Fallback strategy for inputs that other strategies cannot handle';

  /**
   * Check if this strategy can handle the input
   * Fallback strategy can always attempt to handle any input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return input != null; // Can handle anything that's not null or undefined
  }

  /**
   * Get confidence score for handling this input
   * Fallback strategy always has low confidence since it's a last resort
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (input == null) {
      return 0;
    }
    
    // Very low confidence for all inputs since this is a fallback
    return 0.1;
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (input == null) {
      errors.push('Input is null or undefined');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }
    
    // Check input type and provide specific errors for unsupported types
    const inputType = typeof input;
    
    if (inputType === 'boolean') {
      errors.push('Boolean input is not supported for temporal values');
    } else if (inputType === 'symbol') {
      errors.push('Symbol input cannot be converted to temporal value');
    } else if (inputType === 'function') {
      errors.push('Function input cannot be converted to temporal value');
    } else if (inputType === 'object') {
      if (Array.isArray(input)) {
        // Arrays should be handled by array-like-strategy, not fallback
        errors.push('Array input should be handled by array-like strategy');
      } else {
        // Check if it's a plain object (not a Date, not a Temporal type, etc.)
        const isPlainObject = input.constructor === Object || input.constructor === undefined;
        if (isPlainObject) {
          // Allow plain objects if they have useful conversion methods or temporal-like properties
          let hasUsefulMethods = false;
          try {
            hasUsefulMethods = 
              typeof (input as any).toDate === 'function' ||
              typeof (input as any).valueOf === 'function' ||
              (typeof (input as any).toString === 'function' && (input as any).toString !== Object.prototype.toString) ||
              // Check for temporal-like properties
              ('year' in (input as object) && typeof (input as any).year === 'number');
          } catch {
            // If checking methods throws (e.g., getter errors), assume it has toString at minimum
            try {
              hasUsefulMethods = typeof (input as any).toString === 'function';
            } catch {
              hasUsefulMethods = false;
            }
          }
          
          if (!hasUsefulMethods) {
            errors.push('Plain object input without useful conversion methods is not supported for temporal values');
          } else {
            warnings.push('Plain object input will be converted using available methods');
          }
        } else {
          // Only allow objects with specific conversion methods
          let hasToDate = false;
          let hasValueOf = false;
          let hasToString = false;
          
          try {
            hasToDate = typeof (input as any).toDate === 'function';
            hasValueOf = typeof (input as any).valueOf === 'function';
            hasToString = typeof (input as any).toString === 'function';
          } catch {
            // If checking methods throws (e.g., getter errors), try toString separately
            try {
              hasToString = typeof (input as any).toString === 'function';
            } catch {
              // All method checks failed
            }
          }
          
          if (!hasToDate && !hasValueOf && !hasToString) {
            errors.push('Object input must have toDate(), valueOf(), or toString() method');
          } else {
            warnings.push('Object input will be converted using available methods');
          }
        }
      }
    } else if (inputType === 'bigint') {
      warnings.push('BigInt input will be converted to number (may lose precision)');
    }
    
    // If we have errors, this input is not valid for fallback strategy either
    if (errors.length > 0) {
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }
    
    // Warn about using fallback strategy only if input is valid
    warnings.push('Using fallback strategy - parsing may be unreliable');
    
    const confidence = this.getConfidence(input, context);
    
    return {
      isValid: true,
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
    const appliedTransforms: string[] = [];
    const metadata: Record<string, unknown> = {
      originalType: typeof input,
      originalValue: input
    };
    
    let normalized: unknown = input;
    
    // Try various conversion strategies
    if (typeof input === 'boolean') {
      // Boolean inputs should have been caught in validation
      throw new Error('Boolean input is not supported for temporal values');
    } else if (typeof input === 'bigint') {
      normalized = Number(input);
      appliedTransforms.push('bigint-to-number');
      if (!Number.isSafeInteger(normalized as number)) {
        appliedTransforms.push('precision-loss-warning');
      }
    } else if (typeof input === 'object' && input !== null) {
      // Check for arrays first - they should fail
      if (Array.isArray(input)) {
        // Arrays should not be converted to temporal values
        throw new Error('Array input is not supported for temporal values');
      }
      
      // Check for plain objects - only reject if they don't have useful conversion methods
      const isPlainObject = input.constructor === Object || input.constructor === undefined;
      if (isPlainObject) {
        // Allow plain objects if they have useful conversion methods
        let hasUsefulMethods = false;
        try {
          hasUsefulMethods = 
            typeof (input as any).toDate === 'function' ||
            typeof (input as any).valueOf === 'function' ||
            (typeof (input as any).toString === 'function' && (input as any).toString !== Object.prototype.toString) ||
            // Check for temporal-like properties
            ('year' in (input as object) && typeof (input as any).year === 'number');
        } catch {
          // If checking methods throws (e.g., getter errors), assume it has toString at minimum
          try {
            hasUsefulMethods = typeof (input as any).toString === 'function';
          } catch {
            hasUsefulMethods = false;
          }
        }
        
        if (!hasUsefulMethods) {
          throw new Error('Plain object input without useful conversion methods is not supported for temporal values');
        }
      }
      
      // Try different object conversion strategies
      
      // 1. Check for toDate method (common in date-like objects)
      if (typeof (input as any).toDate === 'function') {
        try {
          const date = (input as any).toDate();
          if (date instanceof Date) {
            normalized = date;
            appliedTransforms.push('object-todate');
          }
        } catch {
          // Ignore toDate errors
        }
      }
      
      // 2. Check for valueOf method if toDate didn't work
      if (normalized === input) {
        try {
          // Check if valueOf exists and is a function (this can throw if it's a getter)
          const hasValueOf = typeof (input as any).valueOf === 'function';
          if (hasValueOf) {
            const value = (input as any).valueOf();
            if (typeof value === 'number' || typeof value === 'string') {
              normalized = value;
              appliedTransforms.push('object-valueof');
            }
          }
        } catch {
          // Ignore valueOf errors (including getter errors)
        }
      }
      
      // 3. Check for toString method if valueOf didn't work
      if (normalized === input && typeof (input as any).toString === 'function') {
        try {
          const str = (input as any).toString();
          if (str !== '[object Object]') {
            normalized = str;
            appliedTransforms.push('object-tostring');
          }
        } catch {
          // toString threw an error, try JSON.stringify as fallback
          try {
            normalized = JSON.stringify(input);
            appliedTransforms.push('object-json-stringify');
          } catch {
            // JSON.stringify also failed, ignore
          }
        }
      }
      
      // 4. For complex objects, try string conversion or JSON.stringify
       if (normalized === input) {
         try {
           const stringValue = String(input);
           if (stringValue === '[object Object]') {
             // Generic object toString, try JSON.stringify
             try {
               normalized = JSON.stringify(input);
               appliedTransforms.push('object-json-stringify');
             } catch {
               // JSON.stringify failed (e.g., circular references), use string conversion
               normalized = stringValue;
               appliedTransforms.push('object-string-conversion');
             }
           } else {
             // Custom toString, might be parseable
             normalized = stringValue;
             appliedTransforms.push('object-string-conversion');
           }
         } catch {
           // String conversion failed, try JSON.stringify as last resort
           try {
             normalized = JSON.stringify(input);
             appliedTransforms.push('object-json-stringify');
           } catch {
             // Both failed, this is truly unparseable
             throw new Error('Complex object cannot be converted to temporal value');
           }
         }
       }
    }
    
    // If we still have the original input, try string conversion
    if (normalized === input && typeof input !== 'string' && typeof input !== 'number') {
      normalized = String(input);
      appliedTransforms.push('fallback-string-conversion');
    }
    
    metadata.normalizedType = typeof normalized;
    metadata.normalizedValue = normalized;
    metadata.transformCount = appliedTransforms.length;
    
    return {
      normalizedInput: normalized as TemporalInput,
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
      // Validate input first - if validation fails, don't attempt parsing
      const validationResult = this.validate(input, context);
      if (!validationResult.isValid) {
        throw new Error(`Input validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Normalize input
      let normalizationResult: ParseNormalizationResult;
      try {
        normalizationResult = this.normalize(input, context);
      } catch (normalizationError) {
        // If normalization fails, the input cannot be parsed
        throw new Error(`Normalization failed: ${normalizationError instanceof Error ? normalizationError.message : 'Unknown error'}`);
      }
      const normalized = normalizationResult.normalizedInput;
      
      let result: Temporal.ZonedDateTime;
      
      // Try parsing the normalized input
      if (typeof normalized === 'string') {
        // Try string parsing approaches
        result = this.parseAsString(normalized as string, context);
      } else if (typeof normalized === 'number') {
        // Try number parsing approaches
        result = this.parseAsNumber(normalized as number, context);
      } else if (normalized instanceof Date) {
        // Handle Date objects (from toDate method)
        result = this.parseAsDate(normalized, context);
      } else {
        throw new Error(`Cannot parse normalized input of type: ${typeof normalized}`);
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
        `Fallback parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        input,
        'FALLBACK_PARSE_ERROR',
        `Strategy: ${this.type}, Original type: ${typeof input}`
      );
      
      return createParseError(parseError, this.type, executionTime);
    }
  }

  /**
   * Check if fast path can be used
   * Fallback strategy never uses fast path since it's inherently complex
   */
  checkFastPath(input: TemporalInput, context: ParseContext): FastPathResult {
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
    const confidence = this.getConfidence(input, context);
    
    const warnings: string[] = [
      'Using fallback strategy indicates input format is not recognized',
      'Consider preprocessing input to match a specific strategy',
      'Fallback parsing is slower and less reliable than specific strategies'
    ];
    
    // Add type-specific warnings
    const inputType = typeof input;
    if (inputType === 'object' && input !== null) {
      warnings.push('Object input requires complex conversion - consider using a more specific format');
    } else if (inputType === 'boolean') {
      warnings.push('Boolean input is not supported - consider using a valid temporal format');
    } else if (inputType === 'bigint') {
      warnings.push('BigInt conversion may lose precision');
    }
    
    return {
      preferredStrategy: this.type,
      shouldCache: false, // Don't cache fallback results as they're unreliable
      canUseFastPath: false,
      estimatedComplexity: 'high',
      suggestedOptions: {
        enableFastPath: false,
        enableCaching: false
      },
      warnings
    };
  }

  /**
   * Parse normalized input as string
   */
  private parseAsString(str: string, context: ParseContext): Temporal.ZonedDateTime {
    // Try various string parsing approaches
    
    // 1. Try Temporal.ZonedDateTime.from()
    try {
      return Temporal.ZonedDateTime.from(str);
    } catch {
      // Continue to next approach
    }
    
    // 2. Try Temporal.Instant.from() and convert
    try {
      const instant = Temporal.Instant.from(str);
      const timeZone = context.options.timeZone || 'UTC';
      return instant.toZonedDateTimeISO(timeZone);
    } catch {
      // Continue to next approach
    }
    
    // 3. Try parsing as Date and convert
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
        const timeZone = context.options.timeZone || 'UTC';
        return instant.toZonedDateTimeISO(timeZone);
      }
    } catch {
      // Continue to next approach
    }
    
    // 4. Try parsing as number string (timestamp)
    try {
      const num = parseFloat(str);
      if (Number.isFinite(num)) {
        return this.parseAsNumber(num, context);
      }
    } catch {
      // Continue to next approach
    }
    
    throw new Error(`Unable to parse string: ${str}`);
  }

  /**
   * Parse normalized input as number
   */
  private parseAsNumber(num: number, context: ParseContext): Temporal.ZonedDateTime {
    if (!Number.isFinite(num)) {
      throw new Error(`Invalid number: ${num}`);
    }
    
    const timeZone = context.options.timeZone || 'UTC';
    
    // Determine if this is likely seconds or milliseconds
    // Timestamps in seconds are typically 10 digits (1e9 to 1e10)
    // Timestamps in milliseconds are typically 13 digits (1e12 to 1e13)
    if (num >= 1e12) {
      // Likely milliseconds
      try {
        const instant = Temporal.Instant.fromEpochMilliseconds(num);
        return instant.toZonedDateTimeISO(timeZone);
      } catch {
        throw new Error(`Unable to parse number as millisecond timestamp: ${num}`);
      }
    } else if (num >= 1e9) {
      // Likely seconds
      try {
        const instant = Temporal.Instant.fromEpochMilliseconds(num * 1000);
        return instant.toZonedDateTimeISO(timeZone);
      } catch {
        throw new Error(`Unable to parse number as second timestamp: ${num}`);
      }
    } else {
      // Try as milliseconds first for smaller numbers
      try {
        const instant = Temporal.Instant.fromEpochMilliseconds(num);
        return instant.toZonedDateTimeISO(timeZone);
      } catch {
        // Try as seconds
        try {
          const instant = Temporal.Instant.fromEpochMilliseconds(num * 1000);
          return instant.toZonedDateTimeISO(timeZone);
        } catch {
          throw new Error(`Unable to parse number as timestamp: ${num}`);
        }
      }
    }
  }

  /**
   * Parse input as Date object
   */
  private parseAsDate(input: Date, context: ParseContext): Temporal.ZonedDateTime {
    // Check if the Date is valid
    if (isNaN(input.getTime())) {
      throw new Error('Invalid Date object');
    }
    
    // Convert Date to ZonedDateTime
    const timeZone = context.options.timeZone || 'UTC';
    return Temporal.Instant.fromEpochMilliseconds(input.getTime())
      .toZonedDateTimeISO(timeZone);
  }
}