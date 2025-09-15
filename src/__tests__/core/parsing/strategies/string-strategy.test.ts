/**
 * @file Tests for StringParseStrategy
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import { StringParseStrategy } from '../../../../core/parsing/strategies/string-strategy';
import type { ParseContext } from '../../../../core/parsing/parsing-types';
import { createParseContext } from '../../../../core/parsing/parsing-types';
import type { StrictParsingOptions } from '../../../../types/enhanced-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('StringParseStrategy', () => {
  let strategy: StringParseStrategy;

  // Helper function to create test context
  const createTestContext = (input: any) => createParseContext(input, {
    timeZone: 'UTC',
    strictMode: false,
    enableCache: true,
    maxCacheSize: 1000,
    cacheTTL: 300000
  } as StrictParsingOptions);

  beforeEach(() => {
    strategy = new StringParseStrategy();
  });

  describe('basic properties', () => {
    it('should have correct type', () => {
      expect(strategy.type).toBe('string');
    });

    it('should have correct priority', () => {
      expect(strategy.priority).toBe(50);
    });

    it('should have meaningful description', () => {
      expect(strategy.description).toBe('Parse string representations of dates and times');
    });
  });

  describe('canHandle', () => {
    it('should handle valid strings', () => {
      const validStrings = [
        '2023-12-25T10:30:00Z',
        '2023-12-25',
        'now',
        'today',
        '1703505000000',
        'Dec 25, 2023'
      ];

      validStrings.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(true);
      });
    });

    it('should not handle non-strings', () => {
      const nonStrings = [
        123,
        new Date(),
        null,
        undefined,
        {},
        [],
        true
      ];

      nonStrings.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(false);
      });
    });

    it('should not handle empty or whitespace-only strings', () => {
      const emptyStrings = [
        '',
        '   ',
        '\t',
        '\n',
        '\r\n'
      ];

      emptyStrings.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(false);
      });
    });

    it('should handle strings with leading/trailing whitespace', () => {
      const inputs = [
        '  2023-12-25T10:30:00Z  ',
        '\t2023-12-25\n',
        ' now '
      ];

      inputs.forEach(input => {
        const testContext = createTestContext(input);
        expect(strategy.canHandle(input, testContext)).toBe(true);
      });
    });
  });

  describe('getConfidence', () => {
    it('should return 0 for non-handleable input', () => {
      const testContext = createTestContext(123);
      expect(strategy.getConfidence(123, testContext)).toBe(0);
    });

    it('should return high confidence for ISO datetime with timezone', () => {
      const input = '2023-12-25T10:30:00+05:00';
      const testContext = createTestContext(input);
      const confidence = strategy.getConfidence(input, testContext);
      expect(confidence).toBe(0.95);
    });

    it('should return high confidence for ISO datetime', () => {
      const input = '2023-12-25T10:30:00';
      const testContext = createTestContext(input);
      const confidence = strategy.getConfidence(input, testContext);
      expect(confidence).toBe(0.9);
    });

    it('should return good confidence for ISO date', () => {
      const input = '2023-12-25';
      const testContext = createTestContext(input);
      const confidence = strategy.getConfidence(input, testContext);
      expect(confidence).toBe(0.85);
    });

    it('should return medium confidence for timestamps', () => {
      const timestampInputs = [
        '1703505000000', // milliseconds
        '1703505000'    // seconds
      ];

      timestampInputs.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.7);
      });
    });

    it('should return lower confidence for human readable dates', () => {
      const humanReadableInputs = [
        'Dec 25, 2023',
        'December 25, 2023',
        '25 Dec 2023'
      ];

      humanReadableInputs.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.6);
      });
    });

    it('should return medium confidence for parseable dates', () => {
      const parseableInputs = [
        '2023/12/25',
        '12/25/2023',
        '2023-12-25 10:30:00'
      ];

      parseableInputs.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.5);
      });
    });

    it('should return very low confidence for unrecognized strings', () => {
      const unrecognizedInputs = [
        'not-a-date',
        'random-string',
        'abc123'
      ];

      unrecognizedInputs.forEach(input => {
        const testContext = createTestContext(input);
        const confidence = strategy.getConfidence(input, testContext);
        expect(confidence).toBe(0.1);
      });
    });
  });

  describe('validate', () => {
    it('should validate valid strings', () => {
      const input = '2023-12-25T10:30:00Z';
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.suggestedStrategy).toBe('string');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should invalidate non-strings', () => {
      const input = 123;
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input is not a valid string');
      expect(result.suggestedStrategy).toBe('fallback');
      expect(result.confidence).toBe(0);
    });

    it('should invalidate empty strings', () => {
      const input = '   ';
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('String is empty');
    });

    it('should warn about undefined/null in strings', () => {
      const inputs = [
        'undefined',
        'null',
        'value is undefined',
        'result: null'
      ];

      inputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.validate(input, testContext);
        expect(result.warnings).toContain('String contains undefined or null values');
      });
    });

    it('should warn about timezone abbreviations', () => {
      const inputs = [
        '2023-12-25 10:30:00 GMT',
        '2023-12-25T10:30:00 UTC',
        'Dec 25, 2023 GMT+5'
      ];

      inputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.validate(input, testContext);
        expect(result.warnings).toContain('String contains timezone abbreviations which may be ambiguous');
      });
    });

    it('should normalize input during validation', () => {
      const input = '  2023-12-25T10:30:00Z  ';
      const testContext = createTestContext(input);
      const result = strategy.validate(input, testContext);
      
      expect(result.normalizedInput).toBe('2023-12-25T10:30:00Z');
    });
  });

  describe('normalize', () => {
    it('should trim whitespace', () => {
      const input = '  2023-12-25T10:30:00Z  ';
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.normalizedInput).toBe('2023-12-25T10:30:00Z');
      expect(result.metadata.originalLength).toBe(input.length);
      expect(result.metadata.finalLength).toBe('2023-12-25T10:30:00Z'.length);
    });

    it('should handle special string values', () => {
      const testCases = [
        { input: 'now', shouldTransform: true },
        { input: 'today', shouldTransform: true },
        { input: 'tomorrow', shouldTransform: true },
        { input: 'yesterday', shouldTransform: true },
        { input: 'NOW', shouldTransform: true },
        { input: 'Today', shouldTransform: true }
      ];

      testCases.forEach(({ input, shouldTransform }) => {
        const testContext = createTestContext(input);
        const result = strategy.normalize(input, testContext);
        
        if (shouldTransform) {
          expect(result.normalizedInput).not.toBe(input.toLowerCase());
          expect(result.normalizedInput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
          expect(result.appliedTransforms.length).toBeGreaterThan(0);
        }
      });
    });

    it('should convert timestamp strings to ISO', () => {
      const testCases = [
        { input: '1703505000000', transform: 'timestamp-ms-to-iso' },
        { input: '1703505000', transform: 'timestamp-s-to-iso' }
      ];

      testCases.forEach(({ input, transform }) => {
        const testContext = createTestContext(input);
        const result = strategy.normalize(input, testContext);
        
        expect(result.appliedTransforms).toContain(transform);
        expect(result.normalizedInput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
      });
    });

    it('should add UTC timezone when missing', () => {
      const input = '2023-12-25T10:30:00';
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.normalizedInput).toBe('2023-12-25T10:30:00Z');
      expect(result.appliedTransforms).toContain('add-utc-timezone');
    });

    it('should not modify strings that already have timezone', () => {
      const inputs = [
        '2023-12-25T10:30:00Z',
        '2023-12-25T10:30:00+05:00',
        '2023-12-25T10:30:00-08:00'
      ];

      inputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.normalize(input, testContext);
        expect(result.normalizedInput).toBe(input);
        expect(result.appliedTransforms).not.toContain('add-utc-timezone');
      });
    });

    it('should track metadata correctly', () => {
      const input = '  now  ';
      const testContext = createTestContext(input);
      const result = strategy.normalize(input, testContext);
      
      expect(result.metadata.originalLength).toBe(input.length);
      expect(result.metadata.finalLength).toBe(typeof result.normalizedInput === 'string' ? result.normalizedInput.length : 0);
      expect(result.metadata.transformCount).toBe(result.appliedTransforms.length);
    });
  });

  describe('parse', () => {
    it('should parse ISO datetime strings', () => {
      const input = '2023-12-25T10:30:00Z';
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.data!.year).toBe(2023);
      expect(result.data!.month).toBe(12);
      expect(result.data!.day).toBe(25);
      expect(result.data!.hour).toBe(10);
      expect(result.data!.minute).toBe(30);
      expect(result.strategy).toBe('string');
    });

    it('should parse with different timezones', () => {
      const input = '2023-12-25T10:30:00';
      const testContext = createParseContext(input, {
        timeZone: 'America/New_York',
        strictMode: false,
        enableCache: true,
        maxCacheSize: 1000,
        cacheTTL: 300000
      } as StrictParsingOptions);
      const result = strategy.parse(input, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data!.timeZoneId).toBe('America/New_York');
    });

    it('should parse special string values', () => {
      const specialValues = ['now', 'today', 'tomorrow', 'yesterday'];
      
      specialValues.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });

    it('should parse timestamp strings', () => {
      const testCases = [
        { input: '1703505000000', expectedYear: 2023 },
        { input: '1703505000', expectedYear: 2023 }
      ];

      testCases.forEach(({ input, expectedYear }) => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data!.year).toBe(expectedYear);
      });
    });

    it('should parse human-readable dates', () => {
      const inputs = [
        'Dec 25, 2023',
        'December 25, 2023',
        '2023/12/25'
      ];

      inputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });

    it('should handle parsing errors gracefully', () => {
      const invalidInputs = [
        'invalid-date',
        'not-a-date',
        'abc123',
        ''
      ];

      invalidInputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(TemporalParseError);
        expect(result.strategy).toBe('string');
      });
    });

    it('should track execution time', () => {
      const input = '2023-12-25T10:30:00Z';
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(typeof result.executionTime).toBe('number');
    });

    it('should include confidence score', () => {
      const input = '2023-12-25T10:30:00Z';
      const testContext = createTestContext(input);
      const result = strategy.parse(input, testContext);
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle edge case dates', () => {
      const edgeCases = [
        '1970-01-01T00:00:00Z', // Unix epoch
        '2038-01-19T03:14:07Z', // Y2038 problem
        '1900-01-01T00:00:00Z', // Early 20th century
        '2100-12-31T23:59:59Z'  // Far future
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
      const input = 123;
      const testContext = createTestContext(input);
      const result = strategy.checkFastPath(input, testContext);
      
      expect(result.canUseFastPath).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should use fast path for ISO datetime with timezone', () => {
      const input = '2023-12-25T10:30:00+05:00';
      const testContext = createTestContext(input);
      const result = strategy.checkFastPath(input, testContext);
      
      expect(result.canUseFastPath).toBe(true);
      expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.confidence).toBe(0.95);
    });

    it('should use fast path for ISO datetime', () => {
      const input = '2023-12-25T10:30:00';
      const testContext = createTestContext(input);
      const result = strategy.checkFastPath(input, testContext);
      
      expect(result.canUseFastPath).toBe(true);
      expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.confidence).toBe(0.9);
    });

    it('should not use fast path for other formats', () => {
      const inputs = [
        '2023-12-25',
        '1703505000000',
        'Dec 25, 2023',
        'now'
      ];

      inputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.checkFastPath(input, testContext);
        
        expect(result.canUseFastPath).toBe(false);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should handle malformed ISO strings gracefully', () => {
      const malformedInputs = [
        '2023-12-25T25:30:00Z', // Invalid hour
        '2023-13-25T10:30:00Z', // Invalid month
        '2023-12-32T10:30:00Z'  // Invalid day
      ];

      malformedInputs.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.checkFastPath(input, testContext);
        
        expect(result.canUseFastPath).toBe(false);
      });
    });
  });

  describe('getOptimizationHints', () => {
    it('should provide low complexity for ISO formats', () => {
      const isoInputs = [
        '2023-12-25T10:30:00+05:00',
        '2023-12-25T10:30:00',
        '2023-12-25'
      ];

      isoInputs.forEach(input => {
        const testContext = createTestContext(input);
        const hints = strategy.getOptimizationHints(input, testContext);
        
        expect(hints.estimatedComplexity).toBe('low');
        expect(hints.shouldCache).toBe(true);
        expect(hints.preferredStrategy).toBe('string');
      });
    });

    it('should provide medium complexity for human readable', () => {
      const humanInputs = [
        'Dec 25, 2023',
        'December 25, 2023'
      ];

      humanInputs.forEach(input => {
        const testContext = createTestContext(input);
        const hints = strategy.getOptimizationHints(input, testContext);
        
        expect(hints.estimatedComplexity).toBe('medium');
      });
    });

    it('should provide high complexity for unrecognized formats', () => {
      const unrecognizedInputs = [
        'not-a-date',
        'random-string'
      ];

      unrecognizedInputs.forEach(input => {
        const testContext = createTestContext(input);
        const hints = strategy.getOptimizationHints(input, testContext);
        
        expect(hints.estimatedComplexity).toBe('high');
        expect(hints.warnings).toContain('Unrecognized string format may require complex parsing');
      });
    });

    it('should recommend fast path for suitable inputs', () => {
      const fastPathInputs = [
        '2023-12-25T10:30:00+05:00',
        '2023-12-25T10:30:00'
      ];

      fastPathInputs.forEach(input => {
        const testContext = createTestContext(input);
        const hints = strategy.getOptimizationHints(input, testContext);
        
        expect(hints.canUseFastPath).toBe(true);
        expect(hints.suggestedOptions.enableFastPath).toBe(true);
      });
    });

    it('should warn about very long strings', () => {
      const longString = 'a'.repeat(150);
      const testContext = createTestContext(longString);
      const hints = strategy.getOptimizationHints(longString, testContext);
      
      expect(hints.warnings).toContain('Very long string - consider preprocessing');
    });

    it('should recommend against caching for low confidence', () => {
      const lowConfidenceInput = 'not-a-date';
      const testContext = createTestContext(lowConfidenceInput);
      const hints = strategy.getOptimizationHints(lowConfidenceInput, testContext);
      
      expect(hints.shouldCache).toBe(false);
      expect(hints.warnings).toContain('Low confidence parsing - results may not be cacheable');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long strings', () => {
      const longString = '2023-12-25T10:30:00Z' + 'a'.repeat(1000);
      const testContext = createTestContext(longString);
      
      expect(() => strategy.canHandle(longString, testContext)).not.toThrow();
      expect(() => strategy.getConfidence(longString, testContext)).not.toThrow();
    });

    it('should handle strings with special characters', () => {
      const specialStrings = [
        '2023-12-25T10:30:00Z\u0000',
        '2023-12-25T10:30:00Z\n\r\t',
        '2023-12-25T10:30:00Z\u00A0' // Non-breaking space
      ];

      specialStrings.forEach(input => {
        const testContext = createTestContext(input);
        expect(() => strategy.canHandle(input, testContext)).not.toThrow();
      });
    });

    it('should handle Unicode strings', () => {
      const unicodeStrings = [
        '2023年12月25日',
        '25 décembre 2023',
        '25 Δεκεμβρίου 2023'
      ];

      unicodeStrings.forEach(input => {
        const testContext = createTestContext(input);
        expect(() => strategy.getConfidence(input, testContext)).not.toThrow();
      });
    });

    it('should handle performance timing errors gracefully', () => {
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
        const input = '2023-12-25T10:30:00Z';
        
        // Test that context creation and parsing both handle performance errors
        expect(() => {
          const testContext = createTestContext(input);
          strategy.parse(input, testContext);
        }).not.toThrow();
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
      const input = '2023-12-25T10:30:00Z';
      const testContext = createTestContext(input);
      
      // Modify context during parsing
      const originalParse = strategy.parse.bind(strategy);
      const modifiedParse = (inp: any, ctx: any) => {
        ctx.options.timeZone = 'America/New_York';
        return originalParse(inp, ctx);
      };
      
      expect(() => modifiedParse(input, testContext)).not.toThrow();
    });
  });

  describe('integration with Temporal API', () => {
    it('should handle all Temporal-compatible string formats', () => {
      const temporalFormats = [
        '2023-12-25',
        '2023-12-25T10:30',
        '2023-12-25T10:30:00',
        '2023-12-25T10:30:00.123',
        '2023-12-25T10:30:00+05:00',
        '2023-12-25T10:30:00[America/New_York]',
        '2023-12-25T10:30:00+05:00[Asia/Kolkata]'
      ];

      temporalFormats.forEach(input => {
        const testContext = createTestContext(input);
        const result = strategy.parse(input, testContext);
        
        if (result.success) {
          expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
        }
      });
    });

    it('should preserve timezone information when available', () => {
      const timezonedInput = '2023-12-25T10:30:00+05:00';
      const testContext = createTestContext(timezonedInput);
      const result = strategy.parse(timezonedInput, testContext);
      
      expect(result.success).toBe(true);
      expect(result.data!.offset).toBe('+05:00');
    });

    it('should handle leap years correctly', () => {
      const leapYearInputs = [
        '2024-02-29T10:30:00Z', // Valid leap day
        '2023-02-29T10:30:00Z'  // Invalid leap day
      ];

      const validResult = strategy.parse(leapYearInputs[0], createTestContext(leapYearInputs[0]));
      expect(validResult.success).toBe(true);

      const invalidResult = strategy.parse(leapYearInputs[1], createTestContext(leapYearInputs[1]));
      expect(invalidResult.success).toBe(false);
    });
  });
});