/**
 * @file Firebase Timestamp parsing strategy for handling Firebase Timestamp objects
 */

import { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  FirebaseTimestamp,
  StrictParsingOptions
} from '../../../types/index';
import { TemporalParseError } from '../../../types/enhanced-types';

import { isFirebaseTimestampLike, hasFirebaseTimestampStructure } from '../../../types/index';

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
 * Firebase Timestamp parsing strategy for handling Firebase Timestamp objects
 */
export class FirebaseTimestampStrategy implements ParseStrategy {
  readonly type: ParseStrategyType = 'firebase-timestamp';
  readonly priority = 65;
  readonly description = 'Parse Firebase Timestamp objects';

  /**
   * Check if this strategy can handle the input
   */
  canHandle(input: TemporalInput, context: ParseContext): boolean {
    return isFirebaseTimestampLike(input);
  }

  /**
   * Get confidence score for handling this input
   */
  getConfidence(input: TemporalInput, context: ParseContext): number {
    // First check if it has the basic structure (seconds and nanoseconds properties)
    if (!hasFirebaseTimestampStructure(input)) {
      return 0;
    }

    const timestamp = input as FirebaseTimestamp;
    
    // Check if the timestamp has valid data types
    if (typeof timestamp.seconds !== 'number' || 
        typeof timestamp.nanoseconds !== 'number') {
      return 0.1; // Very low confidence for invalid timestamps
    }
    
    // Check for reasonable values
    if (timestamp.seconds < 0 || timestamp.nanoseconds < 0 || timestamp.nanoseconds >= 1e9) {
      return 0.3; // Low confidence for unreasonable values
    }
    
    // High confidence for valid Firebase timestamps
    return 0.95;
  }

  /**
   * Validate input before parsing
   */
  validate(input: TemporalInput, context: ParseContext): ParseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if input is an object first
    if (typeof input !== 'object' || input === null) {
      errors.push('Input is not a Firebase Timestamp object');
      return {
        isValid: false,
        normalizedInput: input,
        suggestedStrategy: 'fallback',
        confidence: 0,
        errors,
        warnings
      };
    }
    
    const timestamp = input as any;
    
    // Check if the timestamp has required properties with correct types
    if (!('seconds' in timestamp)) {
      errors.push('Firebase Timestamp missing or invalid seconds property');
    } else if (typeof timestamp.seconds !== 'number') {
      errors.push('Firebase Timestamp missing or invalid seconds property');
    }
    
    if (!('nanoseconds' in timestamp)) {
      errors.push('Firebase Timestamp missing or invalid nanoseconds property');
    } else if (typeof timestamp.nanoseconds !== 'number') {
      errors.push('Firebase Timestamp missing or invalid nanoseconds property');
    }
    
    // Validate ranges
    if (typeof timestamp.seconds === 'number') {
      if (timestamp.seconds < -62135596800) { // Year 1
        warnings.push('Firebase Timestamp represents a date before year 1');
      } else if (timestamp.seconds > 253402300799) { // Year 9999
        warnings.push('Firebase Timestamp represents a date after year 9999');
      }
    }
    
    if (typeof timestamp.nanoseconds === 'number') {
      if (timestamp.nanoseconds < 0) {
        errors.push('Firebase Timestamp nanoseconds cannot be negative');
      } else if (timestamp.nanoseconds >= 1e9) {
        errors.push('Firebase Timestamp nanoseconds must be less than 1 billion');
      }
    }
    
    // Check for methods if it's a full Firebase Timestamp object
    if (typeof timestamp.toDate === 'function') {
      try {
        const date = timestamp.toDate();
        if (isNaN(date.getTime())) {
          warnings.push('Firebase Timestamp toDate() returns invalid Date');
        }
      } catch (error) {
        // If toDate() method exists but fails, treat this as an error
        // This ensures compatibility with legacy behavior that expects InvalidDateError
        errors.push(`Firebase Timestamp toDate() method failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
    const timestamp = input as FirebaseTimestamp;
    const appliedTransforms: string[] = [];
    const metadata: Record<string, unknown> = {
      originalSeconds: timestamp.seconds,
      originalNanoseconds: timestamp.nanoseconds,
      hasToDateMethod: typeof timestamp.toDate === 'function',
      hasToMillisMethod: typeof (timestamp as any).toMillis === 'function'
    };
    
    // For Firebase Timestamp objects, normalization is minimal since they're already structured
    // We just ensure we have clean values
    let normalizedSeconds = timestamp.seconds;
    let normalizedNanoseconds = timestamp.nanoseconds;
    
    // Ensure integers
    if (!Number.isInteger(normalizedSeconds)) {
      normalizedSeconds = Math.floor(normalizedSeconds);
      appliedTransforms.push('floor-seconds');
    }
    
    if (!Number.isInteger(normalizedNanoseconds)) {
      normalizedNanoseconds = Math.floor(normalizedNanoseconds);
      appliedTransforms.push('floor-nanoseconds');
    }
    
    // Handle nanoseconds overflow
    if (normalizedNanoseconds >= 1e9) {
      const extraSeconds = Math.floor(normalizedNanoseconds / 1e9);
      normalizedSeconds += extraSeconds;
      normalizedNanoseconds = normalizedNanoseconds % 1e9;
      appliedTransforms.push('normalize-nanoseconds-overflow');
    }
    
    // Handle negative nanoseconds
    if (normalizedNanoseconds < 0) {
      normalizedSeconds -= 1;
      normalizedNanoseconds += 1e9;
      appliedTransforms.push('normalize-negative-nanoseconds');
    }
    
    const normalized = {
      seconds: normalizedSeconds,
      nanoseconds: normalizedNanoseconds,
      // Preserve methods if they exist
      ...(typeof timestamp.toDate === 'function' && { toDate: timestamp.toDate.bind(timestamp) }),
      ...(typeof (timestamp as any).toMillis === 'function' && { toMillis: (timestamp as any).toMillis.bind(timestamp) })
    };
    
    metadata.normalizedSeconds = normalizedSeconds;
    metadata.normalizedNanoseconds = normalizedNanoseconds;
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
      const timestamp = input as FirebaseTimestamp;
      
      // Check for methods if it's a full Firebase Timestamp object
      if (typeof timestamp.toDate === 'function') {
        try {
          const date = timestamp.toDate();
          const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
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
        } catch (e) {
          throw new TemporalParseError(
            `Invalid Firebase Timestamp object: ${JSON.stringify(input)}`,
            input,
            'FIREBASE_TIMESTAMP_TODATE_ERROR',
            `Strategy: ${this.type}`
          );
        }
      }
      
      // Normalize the timestamp first
      const normalizationResult = this.normalize(input, context);
      const normalized = normalizationResult.normalizedInput as FirebaseTimestamp;
      
      // Create Instant from Firebase Timestamp
      // Firebase timestamps are in seconds + nanoseconds
      const totalNanoseconds = BigInt(normalized.seconds) * BigInt(1e9) + BigInt(normalized.nanoseconds);
      const instant = new Temporal.Instant(totalNanoseconds);
      
      // Convert to ZonedDateTime
      const timeZone = context.options.timeZone || 'UTC';
      const calendar = context.options.calendar || 'iso8601';
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
        `Failed to parse Firebase Timestamp: ${error instanceof Error ? error.message : 'Unknown error'}`,
        input,
        'FIREBASE_TIMESTAMP_PARSE_ERROR',
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
    
    const timestamp = input as FirebaseTimestamp;
    
    // Fast path for valid Firebase timestamps with integer values
    if (Number.isInteger(timestamp.seconds) && 
        Number.isInteger(timestamp.nanoseconds) &&
        timestamp.seconds >= 0 &&
        timestamp.nanoseconds >= 0 &&
        timestamp.nanoseconds < 1e9) {
      try {
        const totalNanoseconds = BigInt(timestamp.seconds) * BigInt(1e9) + BigInt(timestamp.nanoseconds);
        const instant = new Temporal.Instant(totalNanoseconds);
        const timeZone = context.options.timeZone || 'UTC';
        const calendar = context.options.calendar || 'iso8601';
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
    const timestamp = input as FirebaseTimestamp;
    const confidence = this.getConfidence(input, context);
    
    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    let shouldCache = true;
    let canUseFastPath = false;
    const warnings: string[] = [];
    
    // Determine complexity
    if (Number.isInteger(timestamp.seconds) && 
        Number.isInteger(timestamp.nanoseconds) &&
        timestamp.seconds >= 0 &&
        timestamp.nanoseconds >= 0 &&
        timestamp.nanoseconds < 1e9) {
      estimatedComplexity = 'low';
      canUseFastPath = true;
    } else if (typeof timestamp.seconds === 'number' && 
               typeof timestamp.nanoseconds === 'number') {
      estimatedComplexity = 'medium';
      warnings.push('Firebase Timestamp requires normalization');
    } else {
      estimatedComplexity = 'high';
      warnings.push('Invalid Firebase Timestamp requires error handling');
    }
    
    // Caching recommendations
    if (typeof timestamp.toDate === 'function') {
      warnings.push('Firebase Timestamp with methods - consider caching results');
    }
    
    if (confidence <= 0.3) {
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