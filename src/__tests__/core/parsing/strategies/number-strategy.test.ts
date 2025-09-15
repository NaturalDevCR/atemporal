/**
 * @file Tests for NumberParseStrategy
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import { NumberParseStrategy } from '../../../../core/parsing/strategies/number-strategy';
import type { ParseContext } from '../../../../core/parsing/parsing-types';
import { createParseContext } from '../../../../core/parsing/parsing-types';
import type { StrictParsingOptions } from '../../../../types/enhanced-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('NumberParseStrategy', () => {
  let strategy: NumberParseStrategy;
  let context: ParseContext;

  const createTestContext = (input: any): ParseContext => {
    return createParseContext(input, {
      timeZone: 'UTC',
      strictMode: false,
      enableCache: true,
      maxCacheSize: 1000,
      cacheTTL: 300000
    } as StrictParsingOptions);
  };

  beforeEach(() => {
    strategy = new NumberParseStrategy();
    context = createTestContext(0);
  });

  describe('basic properties', () => {
    it('should have correct type', () => {
      expect(strategy.type).toBe('number');
    });

    it('should have correct priority', () => {
      expect(strategy.priority).toBe(60);
    });

    it('should have meaningful description', () => {
      expect(strategy.description).toBe('Parse numeric timestamps (seconds or milliseconds since epoch)');
    });
  });

  describe('canHandle', () => {
    it('should handle valid numbers', () => {
      const validNumbers = [
        0,
        1703505000000, // milliseconds
        1703505000,    // seconds
        -62135596800,  // min timestamp
        253402300799,  // max timestamp
        1234567890,
        1.5,
        -1000
      ];

      validNumbers.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(true);
      });
    });

    it('should not handle non-numbers', () => {
      const nonNumbers = [
        '123',
        new Date(),
        null,
        undefined,
        {},
        [],
        true,
        false
      ];

      nonNumbers.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(false);
      });
    });

    it('should not handle invalid numbers', () => {
      const invalidNumbers = [
        NaN,
        Infinity,
        -Infinity
      ];

      invalidNumbers.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(false);
      });
    });

    it('should handle edge case numbers', () => {
      const edgeCases = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.EPSILON,
        -0,
        0.1,
        -0.1
      ];

      edgeCases.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(true);
      });
    });
  });

  describe('getConfidence', () => {
    it('should return 0 for non-handleable input', () => {
      const testContext = createTestContext('not-a-number');
      expect(strategy.getConfidence('not-a-number', testContext)).toBe(0);
    });

    it('should return high confidence for valid millisecond timestamps', () => {
      const msTimestamps = [
        1703505000000, // 2023-12-25
        1640995200000, // 2022-01-01
        946684800000   // 2000-01-01
      ];

      msTimestamps.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.95);
      });
    });

    it('should return high confidence for valid second timestamps', () => {
      const sTimestamps = [
        1703505000, // 2023-12-25
        1640995200, // 2022-01-01
        946684800   // 2000-01-01
      ];

      sTimestamps.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.9);
      });
    });

    it('should return medium confidence for plausible timestamps', () => {
      // Numbers that could be timestamps with some tolerance
      const plausibleTimestamps = [
        1000000000, // Early timestamp
        2000000000  // Future timestamp
      ];

      plausibleTimestamps.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.7);
      });
    });

    it('should return very low confidence for non-timestamp numbers', () => {
      const nonTimestamps = [
        123,
        -999999999999999,
        999999999999999999
      ];

      nonTimestamps.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.1);
      });
    });

    it('should handle floating point numbers', () => {
      const floatingPoints = [
        1703505000000.5,
        1703505000.123,
        946684800.999
      ];

      floatingPoints.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('validate', () => {
    it('should validate valid numbers', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.suggestedStrategy).toBe('number');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should invalidate non-numbers', () => {
      const input = 'not-a-number';
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input is not a valid finite number');
      expect(result.suggestedStrategy).toBe('fallback');
      expect(result.confidence).toBe(0);
    });

    it('should warn about zero timestamp', () => {
      const input = 0;
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.warnings).toContain('Timestamp is zero (Unix epoch)');
    });

    it('should warn about negative timestamps', () => {
      const input = -1000;
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.warnings).toContain('Negative timestamp may represent dates before Unix epoch');
    });

    it('should error on very large numbers', () => {
      const input = 999999999999999999;
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number is too large to be a valid timestamp');
    });

    it('should warn about very small positive numbers', () => {
      const input = 500;
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.warnings).toContain('Very small positive number - may not be a timestamp');
    });

    it('should warn about floating point precision issues', () => {
      const input = Number.MAX_SAFE_INTEGER + 1.5;
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.warnings).toContain('Large floating point number may have precision issues');
    });

    it('should normalize input during validation', () => {
      const input = 1703505000000.0000001; // Very close to integer
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.normalizedInput).toBe(1703505000000);
    });
  });

  describe('normalize', () => {
    it('should round numbers very close to integers', () => {
      const input = 1234.00000000001; // Very close to integer, difference < 1e-10
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.normalizedInput).toBe(1234000); // Will be converted to milliseconds
      expect(result.appliedTransforms).toContain('round-to-integer');
      expect(result.appliedTransforms).toContain('seconds-to-milliseconds');
      expect(result.metadata.originalValue).toBe(input);
      expect(result.metadata.isInteger).toBe(false);
    });

    it('should convert seconds to milliseconds', () => {
      const input = 1703505000; // seconds
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.normalizedInput).toBe(1703505000000);
      expect(result.appliedTransforms).toContain('seconds-to-milliseconds');
      expect(result.metadata.assumedUnit).toBe('seconds');
    });

    it('should recognize millisecond timestamps', () => {
      const input = 1703505000000; // milliseconds
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.normalizedInput).toBe(input);
      expect(result.appliedTransforms).not.toContain('seconds-to-milliseconds');
      expect(result.metadata.assumedUnit).toBe('milliseconds');
    });

    it('should not modify numbers that are already milliseconds', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.normalizedInput).toBe(input);
      expect(result.appliedTransforms).toHaveLength(0);
    });

    it('should track metadata correctly', () => {
      const input = 1703505000.5;
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.metadata.originalValue).toBe(input);
      expect(result.metadata.finalValue).toBe(result.normalizedInput);
      expect(result.metadata.transformCount).toBe(result.appliedTransforms.length);
      expect(result.metadata.isInteger).toBe(false);
    });

    it('should handle edge case timestamps', () => {
      const edgeCases = [
        0,
        -62135596800,  // Year 1
        253402300799   // Year 9999
      ];

      edgeCases.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.normalize(input, testContext);
        expect(result.normalizedInput).toBeDefined();
        expect(typeof result.normalizedInput).toBe('number');
      });
    });
  });

  describe('parse', () => {
    it('should parse millisecond timestamps', () => {
      const input = 1703505000000; // 2023-12-25T10:30:00Z
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.data!.year).toBe(2023);
      expect(result.data!.month).toBe(12);
      expect(result.data!.day).toBe(25);
      expect(result.strategy).toBe('number');
    });

    it('should parse second timestamps', () => {
      const input = 1703505000; // 2023-12-25T10:30:00Z
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.data!.year).toBe(2023);
      expect(result.data!.month).toBe(12);
      expect(result.data!.day).toBe(25);
    });

    it('should parse with different timezones', () => {
      const input = 1703505000000;
      const testContext = {
        ...createTestContext(input),
        options: { ...createTestContext(input).options, timeZone: 'America/New_York' }
      };
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data!.timeZoneId).toBe('America/New_York');
    });

    it('should handle zero timestamp (Unix epoch)', () => {
      const input = 0;
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data!.year).toBe(1970);
      expect(result.data!.month).toBe(1);
      expect(result.data!.day).toBe(1);
    });

    it('should handle negative timestamps', () => {
      const input = -86400000; // One day before epoch
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data!.year).toBe(1969);
      expect(result.data!.month).toBe(12);
      expect(result.data!.day).toBe(31);
    });

    it('should handle floating point timestamps', () => {
      const input = 1703505000000.5;
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
    });

    it('should handle parsing errors gracefully', () => {
      const invalidInputs = [
        Number.MAX_VALUE,
        -Number.MAX_VALUE,
        999999999999999999
      ];

      invalidInputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        if (!result.success) {
          expect(result.error).toBeInstanceOf(TemporalParseError);
          expect(result.strategy).toBe('number');
        }
      });
    });

    it('should track execution time', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(typeof result.executionTime).toBe('number');
    });

    it('should include confidence score', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle edge case timestamps', () => {
      const edgeCases = [
        -62135596800000, // Year 1
        253402300799000  // Year 9999
      ];

      edgeCases.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });
  });

  describe('checkFastPath', () => {
    it('should return false for non-handleable input', () => {
      const input = 'not-a-number';
      const testContext = createTestContext(input);
      const result = strategy.checkFastPath(input, testContext);
      
      expect(result.canUseFastPath).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should use fast path for valid millisecond timestamps', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const result = strategy.checkFastPath(input, testContext);
      
      expect(result.canUseFastPath).toBe(true);
      expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.confidence).toBe(0.95);
    });

    it('should not use fast path for floating point numbers', () => {
      const input = 1703505000000.5;
      const testContext = createTestContext(input);
      const result = strategy.checkFastPath(input, testContext);
      
      expect(result.canUseFastPath).toBe(false);
    });

    it('should not use fast path for invalid timestamps', () => {
      const invalidInputs = [
        253402300799001000, // Beyond max timestamp range
        999999999999999999,
        -999999999999999
      ];

      invalidInputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.checkFastPath(input, testContext);
        
        expect(result.canUseFastPath).toBe(false);
      });
    });

    it('should handle fast path errors gracefully', () => {
      // Mock Temporal.Instant.fromEpochMilliseconds to throw
      const originalFromEpochMs = Temporal.Instant.fromEpochMilliseconds;
      jest.spyOn(Temporal.Instant, 'fromEpochMilliseconds')
        .mockImplementation(() => { throw new Error('Mock error'); });
      
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const result = strategy.checkFastPath(input, testContext);
      
      expect(result.canUseFastPath).toBe(false);
      
      // Restore original method
      Temporal.Instant.fromEpochMilliseconds = originalFromEpochMs;
    });
  });

  describe('getOptimizationHints', () => {
    it('should provide low complexity for valid millisecond timestamps', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const hints = strategy.getOptimizationHints(input, testContext);
      
      expect(hints.estimatedComplexity).toBe('low');
      expect(hints.canUseFastPath).toBe(true);
      expect(hints.shouldCache).toBe(true);
      expect(hints.preferredStrategy).toBe('number');
    });

    it('should provide low complexity for valid second timestamps', () => {
      const input = 1703505000;
      const testContext = createTestContext(input);
      const hints = strategy.getOptimizationHints(input, testContext);
      
      expect(hints.estimatedComplexity).toBe('low');
      expect(hints.canUseFastPath).toBe(true);
    });

    it('should provide low complexity for valid millisecond timestamps', () => {
      const input = 1000000000; // Valid millisecond timestamp
      const testContext = createTestContext(input);
      const hints = strategy.getOptimizationHints(input, testContext);
      
      expect(hints.estimatedComplexity).toBe('low');
      expect(hints.canUseFastPath).toBe(true);
    });

    it('should provide high complexity for non-timestamps', () => {
      const input = 253402300799001000; // Beyond max timestamp range
      const testContext = createTestContext(input);
      const hints = strategy.getOptimizationHints(input, testContext);
      
      expect(hints.estimatedComplexity).toBe('high');
      expect(hints.warnings).toContain('Number does not appear to be a valid timestamp');
    });

    it('should warn about floating point numbers', () => {
      const input = 1703505000000.5;
      const testContext = createTestContext(input);
      const hints = strategy.getOptimizationHints(input, testContext);
      
      expect(hints.warnings).toContain('Floating point number may have precision issues');
    });

    it('should recommend against caching for low confidence', () => {
      const input = 253402300799001000; // Beyond max timestamp range - very low confidence
      const testContext = createTestContext(input);
      const hints = strategy.getOptimizationHints(input, testContext);
      
      expect(hints.shouldCache).toBe(false);
      expect(hints.warnings).toContain('Low confidence parsing - results may not be cacheable');
    });

    it('should provide appropriate suggested options', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      const hints = strategy.getOptimizationHints(input, testContext);
      
      expect(hints.suggestedOptions.enableFastPath).toBe(true);
      expect(hints.suggestedOptions.enableCaching).toBe(true);
    });
  });

  describe('private methods validation', () => {
    it('should correctly identify valid millisecond timestamps', () => {
      const validMs = [
        0,
        1703505000000,
        946684800000,
        253402300799000
      ];

      validMs.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.95);
      });
    });

    it('should return high confidence for valid millisecond timestamps', () => {
      // Since the millisecond range encompasses the seconds range,
      // most valid timestamps will be treated as milliseconds (0.95 confidence)
      const validMs = [
        0,
        1703505000000,
        946684800000,
        253402300799000
      ];

      validMs.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.95);
      });
    });

    it('should handle boundary conditions', () => {
      const boundaries = [
        -62135596800,    // MIN_TIMESTAMP_S
        253402300799,    // MAX_TIMESTAMP_S
        -62135596800000, // MIN_TIMESTAMP_MS
        253402300799000  // MAX_TIMESTAMP_MS
      ];

      boundaries.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(true);
        expect(strategy.getConfidence(input, testContext)).toBeGreaterThan(0.8);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very large safe integers', () => {
      const largeInt = Number.MAX_SAFE_INTEGER;
      const testContext = createTestContext(largeInt);
      
      expect(() => strategy.canHandle(largeInt, testContext)).not.toThrow();
      expect(() => strategy.getConfidence(largeInt, testContext)).not.toThrow();
    });

    it('should handle very small numbers', () => {
      const smallNumbers = [
        Number.EPSILON,
        Number.MIN_VALUE,
        -Number.MIN_VALUE
      ];

      smallNumbers.forEach(input => {
        const testContext = createTestContext(input);
        expect(() => strategy.canHandle(input, testContext)).not.toThrow();
      });
    });

    it('should handle performance timing errors gracefully', () => {
      const input = 1703505000000;
      
      // Store original performance.now function
      const originalPerformanceNow = performance.now;
      
      // Mock performance.now using Object.defineProperty (Node.js 18.x compatible)
      Object.defineProperty(performance, 'now', {
        value: () => {
          throw new Error('Performance API error');
        },
        writable: true,
        configurable: true
      });
      
      try {
        // Test that context creation and parsing both handle performance errors
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        // Should still succeed despite timing error
        expect(result.success).toBe(true);
      } finally {
        // Restore original performance.now function
        Object.defineProperty(performance, 'now', {
          value: originalPerformanceNow,
          writable: true,
          configurable: true
        });
      }
    });

    it('should handle context modifications during parsing', () => {
      const input = 1703505000000;
      const testContext = createTestContext(input);
      
      // Modify context during parsing
      const originalParse = strategy.parse.bind(strategy);
      const modifiedParse = (inp: any, ctx: any) => {
        ctx.options.timeZone = 'America/New_York';
        return originalParse(inp, ctx);
      };
      
      expect(() => modifiedParse(input, testContext)).not.toThrow();
    });

    it('should handle precision edge cases', () => {
      const precisionCases = [
        1703505000000.0000001,
        1703505000000.9999999,
        Number.MAX_SAFE_INTEGER - 0.1,
        Number.MAX_SAFE_INTEGER + 0.1
      ];

      precisionCases.forEach(input => {
        const testContext = createTestContext(input);
        expect(() => strategy.normalize(input, testContext)).not.toThrow();
      });
    });
  });

  describe('integration with Temporal API', () => {
    it('should handle all valid timestamp ranges', () => {
      const timestampRanges = [
        0,                    // Unix epoch
        946684800000,        // Y2K
        1577836800000,       // 2020-01-01
        2147483647000,       // Y2038 problem (32-bit)
        253402300799000      // Year 9999
      ];

      timestampRanges.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });

    it('should preserve timezone information', () => {
      const input = 1703505000000;
      const timezones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney'
      ];

      timezones.forEach(timeZone => {
        const testContext = {
          ...createTestContext(input),
          options: { ...createTestContext(input).options, timeZone }
        };
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data!.timeZoneId).toBe(timeZone);
      });
    });

    it('should handle leap years correctly', () => {
      const leapYearTimestamps = [
        1582934400000, // 2020-02-29 (leap year)
        1614556800000, // 2021-03-01 (after non-leap year)
        1709251200000  // 2024-02-29 (leap year)
      ];

      leapYearTimestamps.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });

    it('should handle daylight saving time transitions', () => {
      // Test timestamps around DST transitions
      const dstTimestamps = [
        1615708800000, // 2021-03-14 (US DST start)
        1636264800000  // 2021-11-07 (US DST end)
      ];

      dstTimestamps.forEach(input => {
        const testContext = {
          ...createTestContext(input),
          options: { ...createTestContext(input).options, timeZone: 'America/New_York' }
        };
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });
  });
});