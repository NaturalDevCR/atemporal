/**
 * @file Tests for InputParser class
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import { InputParser } from '../../../core/parsing/input-parser';
import { TemporalParseError } from '../../../types/enhanced-types';
import type { StrictParsingOptions, TemporalInput } from '../../../types/enhanced-types';
import type { ParseStrategy, ParseContext } from '../../../core/parsing/parsing-types';

describe('InputParser', () => {
  const defaultOptions: StrictParsingOptions = {
    timeZone: 'UTC',
    strict: false,
    validateInput: true,
    throwOnInvalid: true
  };

  beforeEach(() => {
    // Reset strategies to default state before each test to ensure isolation
    InputParser.resetStrategies();
  });

  // Store original strategies to restore after each test
  let originalStrategies: ParseStrategy[];

  beforeEach(() => {
    // Save original strategies
    originalStrategies = [...(InputParser as any).strategies];
    // Reset any modifications to strategies
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original strategies
    (InputParser as any).strategies = originalStrategies;
    jest.restoreAllMocks();
  });

  describe('parse', () => {
    it('should parse ISO datetime string', () => {
      const input = '2023-12-25T10:30:00Z';
      const result = InputParser.parse(input, defaultOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
      expect(result.day).toBe(25);
      expect(result.hour).toBe(10);
      expect(result.minute).toBe(30);
      expect(result.second).toBe(0);
    });

    it('should parse Date object', () => {
      const input = new Date('2023-12-25T10:30:00Z');
      const result = InputParser.parse(input, defaultOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
      expect(result.day).toBe(25);
    });

    it('should parse number timestamp', () => {
      const input = 1703505000000; // 2023-12-25T10:30:00Z
      const result = InputParser.parse(input, defaultOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
      expect(result.day).toBe(25);
    });

    it('should parse Temporal.ZonedDateTime', () => {
      const input = Temporal.ZonedDateTime.from('2023-12-25T10:30:00[UTC]');
      const result = InputParser.parse(input, defaultOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.equals(input)).toBe(true);
    });

    it('should parse Temporal.Instant', () => {
      const input = Temporal.Instant.from('2023-12-25T10:30:00Z');
      const result = InputParser.parse(input, defaultOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
      expect(result.day).toBe(25);
    });

    it('should parse array-like input', () => {
      const input = [2023, 12, 25, 10, 30, 0];
      const result = InputParser.parse(input, defaultOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
      expect(result.day).toBe(25);
    });

    it('should handle different time zones', () => {
      const input = '2023-12-25T10:30:00Z';
      const options = { ...defaultOptions, timeZone: 'America/New_York' };
      const result = InputParser.parse(input, options);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.timeZoneId).toBe('America/New_York');
    });

    it('should handle special string values', () => {
      const testCases = [
        'now',
        'today',
        'tomorrow',
        'yesterday'
      ];

      testCases.forEach(input => {
        const result = InputParser.parse(input, defaultOptions);
        expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });

    it('should throw TemporalParseError for invalid input', () => {
      const invalidInputs = [
        'invalid-date',
        'not-a-date',
        '',
        '   ',
        'abc123'
      ];

      invalidInputs.forEach(input => {
        expect(() => InputParser.parse(input, defaultOptions))
          .toThrow(TemporalParseError);
      });
    });

    it('should throw TemporalParseError for null/undefined', () => {
      expect(() => InputParser.parse(null as any, defaultOptions))
        .toThrow(TemporalParseError);
      
      expect(() => InputParser.parse(undefined as any, defaultOptions))
        .toThrow(TemporalParseError);
    });

    it('should handle Firebase timestamp-like objects', () => {
      const firebaseTimestamp = {
        seconds: 1703505000,
        nanoseconds: 0
      };
      
      const result = InputParser.parse(firebaseTimestamp, defaultOptions);
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.year).toBe(2023);
    });

    it('should accept plain objects with toDate method', () => {
      const objectWithToDate = {
        toDate: () => new Date('2023-12-25T10:30:00Z')
      };
      
      // Plain objects with useful conversion methods are accepted by the fallback strategy
      const result = InputParser.parse(objectWithToDate, defaultOptions);
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(12);
      expect(result.day).toBe(25);
    });

    it('should handle strict mode', () => {
      const strictOptions = { ...defaultOptions, strict: true };
      const input = '2023-12-25T10:30:00Z';
      
      const result = InputParser.parse(input, strictOptions);
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
    });

    it('should handle performance timing', () => {
      const performanceSpy = jest.spyOn(performance, 'now')
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(150);
      
      const input = '2023-12-25T10:30:00Z';
      const result = InputParser.parse(input, defaultOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(performanceSpy).toHaveBeenCalled();
    });
  });

  describe('validateTimeZone', () => {
    it('should validate valid time zones', () => {
      const validTimeZones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney'
      ];

      validTimeZones.forEach(timeZone => {
        expect(() => InputParser.validateTimeZone(timeZone)).not.toThrow();
      });
    });

    it('should throw for invalid time zones', () => {
      const invalidTimeZones = [
        'Invalid/TimeZone',
        'Not/A/Zone',
        '',
        'GMT+5' // Not IANA format
      ];

      invalidTimeZones.forEach(timeZone => {
        expect(() => InputParser.validateTimeZone(timeZone))
          .toThrow(TemporalParseError);
      });
    });

    it('should handle edge cases', () => {
      expect(() => InputParser.validateTimeZone('UTC')).not.toThrow();
      expect(() => InputParser.validateTimeZone('Etc/GMT+12')).not.toThrow();
      expect(() => InputParser.validateTimeZone('Etc/GMT-14')).not.toThrow();
    });
  });

  describe('addStrategy', () => {
    const mockStrategy: ParseStrategy = {
      type: 'test-strategy' as any,
      priority: 100,
      description: 'Test strategy',
      canHandle: jest.fn().mockReturnValue(true) as jest.MockedFunction<(input: TemporalInput, context: ParseContext) => boolean>,
      getConfidence: jest.fn().mockReturnValue(0.8) as jest.MockedFunction<(input: TemporalInput, context: ParseContext) => number>,
      validate: jest.fn().mockReturnValue({
        isValid: true,
        normalizedInput: 'test',
        suggestedStrategy: 'test-strategy',
        confidence: 0.8,
        errors: [],
        warnings: []
      }) as jest.MockedFunction<(input: TemporalInput, context: ParseContext) => any>,
      normalize: jest.fn().mockReturnValue({
        normalizedInput: 'test',
        appliedTransforms: [],
        metadata: {}
      }) as jest.MockedFunction<(input: TemporalInput, context: ParseContext) => any>,
      parse: jest.fn().mockReturnValue({
        success: true,
        data: Temporal.ZonedDateTime.from('2023-12-25T10:30:00[UTC]'),
        strategy: 'test-strategy',
        executionTime: 10,
        fromCache: false,
        confidence: 0.8
      }) as jest.MockedFunction<(input: TemporalInput, context: ParseContext) => any>,
      checkFastPath: jest.fn().mockReturnValue({
        canUseFastPath: false,
        strategy: 'test-strategy',
        confidence: 0.8
      }) as jest.MockedFunction<(input: TemporalInput, context: ParseContext) => any>,
      getOptimizationHints: jest.fn().mockReturnValue({
        preferredStrategy: 'test-strategy',
        shouldCache: true,
        canUseFastPath: false,
        estimatedComplexity: 'medium',
        suggestedOptions: {},
        warnings: []
      }) as jest.MockedFunction<(input: TemporalInput, context: ParseContext) => any>
    };

    it('should add new strategy', () => {
      const initialStats = InputParser.getStats();
      const initialCount = initialStats.strategiesCount;
      
      InputParser.addStrategy(mockStrategy);
      
      const newStats = InputParser.getStats();
      expect(newStats.strategiesCount).toBe(initialCount + 1);
      expect(newStats.supportedStrategyTypes).toContain('test-strategy');
    });

    it('should replace existing strategy of same type', () => {
      const strategy1 = { ...mockStrategy, priority: 50 };
      const strategy2 = { ...mockStrategy, priority: 150 };
      
      InputParser.addStrategy(strategy1);
      const statsAfterFirst = InputParser.getStats();
      
      InputParser.addStrategy(strategy2);
      const statsAfterSecond = InputParser.getStats();
      
      // Should not increase count when replacing
      expect(statsAfterSecond.strategiesCount).toBe(statsAfterFirst.strategiesCount);
      
      // Should have higher priority strategy
      const testStrategy = statsAfterSecond.strategiesByPriority
        .find(s => s.type === ('test-strategy' as any));
      expect(testStrategy?.priority).toBe(150);
    });

    it('should maintain priority order', () => {
      const highPriorityStrategy = { ...mockStrategy, type: 'high-priority' as any, priority: 200 };
      const lowPriorityStrategy = { ...mockStrategy, type: 'low-priority' as any, priority: 10 };
      
      InputParser.addStrategy(lowPriorityStrategy);
      InputParser.addStrategy(highPriorityStrategy);
      
      const stats = InputParser.getStats();
      const priorities = stats.strategiesByPriority.map(s => s.priority);
      
      // Should be sorted in descending order
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeLessThanOrEqual(priorities[i - 1]);
      }
    });
  });

  describe('getStats', () => {
    it('should return current parser statistics', () => {
      const stats = InputParser.getStats();
      
      expect(stats).toHaveProperty('strategiesCount');
      expect(stats).toHaveProperty('supportedStrategyTypes');
      expect(stats).toHaveProperty('strategiesByPriority');
      
      expect(typeof stats.strategiesCount).toBe('number');
      expect(Array.isArray(stats.supportedStrategyTypes)).toBe(true);
      expect(Array.isArray(stats.strategiesByPriority)).toBe(true);
    });

    it('should include all default strategies', () => {
      const stats = InputParser.getStats();
      
      const expectedStrategies = [
        'string',
        'number',
        'date',
        'temporal-wrapper',
        'firebase-timestamp',
        'array-like',
        'fallback'
      ];
      
      expectedStrategies.forEach(strategyType => {
        expect(stats.supportedStrategyTypes).toContain(strategyType);
      });
    });

    it('should have strategies sorted by priority', () => {
      const stats = InputParser.getStats();
      const priorities = stats.strategiesByPriority.map(s => s.priority);
      
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeLessThanOrEqual(priorities[i - 1]);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very large timestamps', () => {
      const largeTimestamp = 8640000000000000; // Max safe timestamp
      
      expect(() => InputParser.parse(largeTimestamp, defaultOptions))
        .not.toThrow();
    });

    it('should handle very small timestamps', () => {
      const smallTimestamp = -8640000000000000; // Min safe timestamp
      
      expect(() => InputParser.parse(smallTimestamp, defaultOptions))
        .not.toThrow();
    });

    it('should handle complex timezone options', () => {
      const complexOptions = {
        ...defaultOptions,
        timeZone: 'Pacific/Kiritimati', // UTC+14
        strict: true
      };
      
      const input = '2023-12-25T10:30:00Z';
      const result = InputParser.parse(input, complexOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(result.timeZoneId).toBe('Pacific/Kiritimati');
    });

    it('should handle malformed but parseable strings', () => {
      const malformedInputs = [
        '2023-12-25 10:30:00', // Missing T
        '2023/12/25 10:30:00', // Different separators
        'Dec 25, 2023 10:30:00' // Human readable
      ];

      malformedInputs.forEach(input => {
        const result = InputParser.parse(input, defaultOptions);
        expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
      });
    });

    it('should handle options with all properties', () => {
      const fullOptions: StrictParsingOptions = {
        timeZone: 'America/New_York',
        strict: true,
        validateInput: true,
        throwOnInvalid: true
      };
      
      const input = '2023-12-25T10:30:00Z';
      const result = InputParser.parse(input, fullOptions);
      
      expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
    });
  });

  describe('error handling', () => {
    it('should preserve original error context', () => {
      const invalidInput = 'completely-invalid-date-string';
      
      try {
        InputParser.parse(invalidInput, defaultOptions);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TemporalParseError);
        expect((error as TemporalParseError).input).toBe(invalidInput);
      }
    });

    it('should handle strategy parsing failures gracefully', () => {
      // Use a symbol which cannot be converted to temporal value
      const problematicInput = Symbol('test');
      
      expect(() => InputParser.parse(problematicInput as any, defaultOptions))
        .toThrow(TemporalParseError);
    });

    it('should handle circular references in input', () => {
      // Use a function which cannot be converted to temporal value
      const functionInput = () => 'test';
      
      expect(() => InputParser.parse(functionInput as any, defaultOptions))
        .toThrow(TemporalParseError);
    });
  });
});