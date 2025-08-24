/**
 * @file Array-like parsing strategy for handling array-like temporal inputs
 */

import { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  StrictParsingOptions
} from '../../../types/index';

import { TemporalParseError } from '../../../types/enhanced-types';

import {
  isArrayLike
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
 * Array-like parsing strategy for handling array-like temporal inputs
 * Supports formats like [year, month, day] or [year, month, day, hour, minute, second]
 */
export class ArrayLikeStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'array-like';
  readonly priority = 40;
  readonly description = 'Parse array-like temporal inputs [year, month, day, ...]';

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return isArrayLike(input) && (input as ArrayLike<unknown>).length >= 1;
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    if (!this.canHandle(input, context)) {
      return 0;
    }

    const arr = input as ArrayLike<unknown>;
    
    // Check if all elements are numbers
    const allNumbers = Array.from(arr).every(item => typeof item === 'number' && Number.isFinite(item));
    if (!allNumbers) {
      return 0.1;
    }
    
    // Check array length and validate ranges
    const numbers = Array.from(arr) as number[];
    
    if (numbers.length < 1) {
      return 0;
    }
    
    // Validate available components
    const year = numbers[0];
    const month = numbers.length > 1 ? numbers[1] : 1; // Default to January
    const day = numbers.length > 2 ? numbers[2] : 1;   // Default to 1st
    
    // Year validation (reasonable range)
    if (year < 1 || year > 9999) {
      return 0.2;
    }
    
    // Month validation (1-12) - only if provided
    if (numbers.length > 1 && (month < 1 || month > 12)) {
      return 0.2;
    }
    
    // Day validation (1-31, rough check) - only if provided
    if (numbers.length > 2 && (day < 1 || day > 31)) {
      return 0.2;
    }
    
    // Higher confidence for common array lengths
    if (numbers.length === 1) { // [year] - minimal but valid
      return 0.6;
    } else if (numbers.length === 2) { // [year, month]
      return 0.7;
    } else if (numbers.length === 3) { // [year, month, day]
      return 0.8;
    } else if (numbers.length === 6) { // [year, month, day, hour, minute, second]
      return 0.85;
    } else if (numbers.length === 7) { // [year, month, day, hour, minute, second, millisecond]
      return 0.9;
    } else if (numbers.length <= 10) { // Extended formats
      return 0.7;
    }
    
    return 0.6; // Reasonable confidence for other lengths
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!this.canHandle(input, context)) {
      errors.push('Input is not an array-like object with at least 1 element');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }
    
    const arr = Array.from(input as ArrayLike<unknown>);
    
    // Check if all elements are numbers
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] !== 'number' || !Number.isFinite(arr[i] as number)) {
        errors.push(`Element at index ${i} is not a finite number`);
      }
    }
    
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
    
    const numbers = arr as number[];
    
    // Validate required components - only year is required, month and day will default to 1
    if (numbers.length < 1) {
      errors.push('Array must have at least 1 element (year)');
    }
    
    if (numbers.length >= 1) {
      const year = numbers[0];
      if (year < 1 || year > 9999) {
        errors.push(`Year ${year} is out of valid range (1-9999)`);
      }
    }
    
    if (numbers.length >= 2) {
      const month = numbers[1];
      if (month < 1 || month > 12) {
        errors.push(`Month ${month} is out of valid range (1-12)`);
      }
    }
    
    if (numbers.length >= 3) {
      const day = numbers[2];
      if (day < 1 || day > 31) {
        errors.push(`Day ${day} is out of valid range (1-31)`);
      }
      
      // Additional validation for impossible dates
      if (numbers.length >= 2) {
        const year = numbers[0];
        const month = numbers[1];
        
        // Check for impossible dates like February 30th
        if (month === 2) {
          const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
          const maxDaysInFeb = isLeapYear ? 29 : 28;
          if (day > maxDaysInFeb) {
            errors.push(`February ${day} does not exist in year ${year} (max: ${maxDaysInFeb})`);
          }
        } else if ([4, 6, 9, 11].includes(month) && day > 30) {
          errors.push(`Day ${day} does not exist in month ${month} (max: 30 days)`);
        }
      }
    }
    
    if (numbers.length >= 4) {
      const hour = numbers[3];
      if (hour < 0 || hour > 23) {
        errors.push(`Hour ${hour} is out of valid range (0-23)`);
      }
    }
    
    if (numbers.length >= 5) {
      const minute = numbers[4];
      if (minute < 0 || minute > 59) {
        errors.push(`Minute ${minute} is out of valid range (0-59)`);
      }
    }
    
    if (numbers.length >= 6) {
      const second = numbers[5];
      if (second < 0 || second > 59) {
        errors.push(`Second ${second} is out of valid range (0-59)`);
      }
    }
    
    if (numbers.length >= 7) {
      const millisecond = numbers[6];
      if (millisecond < 0 || millisecond > 999) {
        warnings.push(`Millisecond ${millisecond} is out of typical range (0-999)`);
      }
    }
    
    // Warn about unusual array lengths
    if (numbers.length > 10) {
      warnings.push('Array has more than 10 elements - extra elements will be ignored');
    }
    
    const confidence = errors.length === 0 ? this.getConfidence(input, context) : 0;
    
    return {
      isValid: errors.length === 0,
      normalizedInput: input,
      suggestedStrategy: errors.length === 0 ? this.type : 'fallback',
      confidence,
      errors,
      warnings
    };
  }

  /**
   * Normalize input for parsing
   */
  normalize(input: TemporalInput, context: ParseContext): ParseNormalizationResult {
    const arr = Array.from(input as ArrayLike<unknown>) as number[];
    const appliedTransforms: string[] = [];
    const metadata: Record<string, unknown> = {
      originalLength: arr.length,
      originalValues: [...arr]
    };
    
    // Normalize to standard format: [year, month, day, hour, minute, second, millisecond]
    const normalized = [...arr];
    
    // Ensure we have at least 7 elements (pad with defaults)
    while (normalized.length < 7) {
      if (normalized.length === 1) {
        normalized.push(1); // month (default to January)
        appliedTransforms.push('add-default-month');
      } else if (normalized.length === 2) {
        normalized.push(1); // day (default to 1st)
        appliedTransforms.push('add-default-day');
      } else if (normalized.length === 3) {
        normalized.push(0); // hour
        appliedTransforms.push('add-default-hour');
      } else if (normalized.length === 4) {
        normalized.push(0); // minute
        appliedTransforms.push('add-default-minute');
      } else if (normalized.length === 5) {
        normalized.push(0); // second
        appliedTransforms.push('add-default-second');
      } else if (normalized.length === 6) {
        normalized.push(0); // millisecond
        appliedTransforms.push('add-default-millisecond');
      }
    }
    
    // Round to integers
    for (let i = 0; i < normalized.length; i++) {
      if (!Number.isInteger(normalized[i])) {
        normalized[i] = Math.round(normalized[i]);
        appliedTransforms.push(`round-element-${i}`);
      }
    }
    
    // Clamp values to valid ranges
    if (normalized[1] < 1) {
      normalized[1] = 1;
      appliedTransforms.push('clamp-month-min');
    } else if (normalized[1] > 12) {
      normalized[1] = 12;
      appliedTransforms.push('clamp-month-max');
    }
    
    if (normalized[2] < 1) {
      normalized[2] = 1;
      appliedTransforms.push('clamp-day-min');
    }
    
    if (normalized[3] < 0) {
      normalized[3] = 0;
      appliedTransforms.push('clamp-hour-min');
    } else if (normalized[3] > 23) {
      normalized[3] = 23;
      appliedTransforms.push('clamp-hour-max');
    }
    
    if (normalized[4] < 0) {
      normalized[4] = 0;
      appliedTransforms.push('clamp-minute-min');
    } else if (normalized[4] > 59) {
      normalized[4] = 59;
      appliedTransforms.push('clamp-minute-max');
    }
    
    if (normalized[5] < 0) {
      normalized[5] = 0;
      appliedTransforms.push('clamp-second-min');
    } else if (normalized[5] > 59) {
      normalized[5] = 59;
      appliedTransforms.push('clamp-second-max');
    }
    
    if (normalized[6] < 0) {
      normalized[6] = 0;
      appliedTransforms.push('clamp-millisecond-min');
    }
    
    metadata.normalizedLength = normalized.length;
    metadata.normalizedValues = [...normalized];
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
      // Normalize input first
      const normalizationResult = this.normalize(input, context);
      const normalized = normalizationResult.normalizedInput as number[];
      
      const [year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0] = normalized;
      
      // Create PlainDateTime first
      const plainDateTime = new Temporal.PlainDateTime(
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond
      );
      
      // Convert to ZonedDateTime
      const timeZone = context.options.timeZone || 'UTC';
      const calendar = context.options.calendar || 'iso8601';
      
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
      
      const parseError = new TemporalParseError(
        `Failed to parse array-like input: ${error instanceof Error ? error.message : 'Unknown error'}`,
        input,
        'ARRAY_LIKE_PARSE_ERROR',
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
    
    const arr = Array.from(input as ArrayLike<unknown>) as number[];
    
    // Fast path for well-formed arrays with integer values
    if (arr.length >= 1 && arr.length <= 7 && 
        arr.every(num => Number.isInteger(num))) {
      
      const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0] = arr;
      
      // Quick validation
      if (year >= 1 && year <= 9999 &&
          month >= 1 && month <= 12 &&
          day >= 1 && day <= 31 &&
          hour >= 0 && hour <= 23 &&
          minute >= 0 && minute <= 59 &&
          second >= 0 && second <= 59) {
        
        try {
          const plainDateTime = new Temporal.PlainDateTime(
            year, month, day, hour, minute, second, millisecond
          );
          const timeZone = context.options.timeZone || 'UTC';
          const calendar = context.options.calendar || 'iso8601';
          const result = plainDateTime.toZonedDateTime(timeZone);
          
          return {
            canUseFastPath: true,
            data: result,
            strategy: this.type,
            confidence: 0.85
          };
        } catch {
          // Fall back to regular parsing
        }
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
    const arr = Array.from(input as ArrayLike<unknown>) as number[];
    const confidence = this.getConfidence(input, context);
    
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'medium';
    let shouldCache = true;
    let canUseFastPath = false;
    const warnings: string[] = [];
    
    // Determine complexity
    if (arr.length >= 3 && arr.length <= 7 && 
        arr.every(num => Number.isInteger(num))) {
      estimatedComplexity = 'low';
      canUseFastPath = true;
    } else if (arr.every(num => typeof num === 'number' && Number.isFinite(num))) {
      estimatedComplexity = 'medium';
      warnings.push('Array requires normalization (rounding, clamping)');
    } else {
      estimatedComplexity = 'high';
      warnings.push('Array contains non-numeric values requiring conversion');
    }
    
    // Caching recommendations
    if (arr.length > 10) {
      warnings.push('Very long array - consider preprocessing');
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