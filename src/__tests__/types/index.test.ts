/**
 * @file Comprehensive tests for types/index module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  createValidatedInput,
  createParsedTemporal,
  createCachedResult,
  assertTemporalInput,
  assertTimeUnit,
  assertLocale,
  assertTimezone,
  normalizeTimeUnit,
  pluralizeTimeUnit,
  isTimeUnitPlural,
  isTimeUnitSingular,
  createSuccessResult,
  createErrorResult,
  isSuccessResult,
  isErrorResult,
  DEFAULT_TEMPORAL_CONFIG,
  TIME_UNITS,
  COMMON_LOCALES,
  COMMON_TIMEZONES
} from '../../types/index';
import {
  TemporalParseError,
  TemporalFormatError,
  TemporalTimezoneError
} from '../../types/enhanced-types';
import { Temporal } from '@js-temporal/polyfill';

// Mock console.warn to test warning messages
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('types/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleWarn.mockClear();
  });

  describe('branded type creators', () => {
    describe('createValidatedInput', () => {
      it('should create validated input from string', () => {
        const input = '2024-03-15';
        const validated = createValidatedInput(input);
        
        expect(validated).toBe(input);
        expect(typeof validated).toBe('string');
      });

      it('should create validated input from number', () => {
        const input = 1710518400000;
        const validated = createValidatedInput(input);
        
        expect(validated).toBe(input);
        expect(typeof validated).toBe('number');
      });

      it('should create validated input from Date', () => {
        const input = new Date('2024-03-15');
        const validated = createValidatedInput(input);
        
        expect(validated).toBe(input);
        expect(validated instanceof Date).toBe(true);
      });

      it('should create validated input from null', () => {
        const input = null;
        const validated = createValidatedInput(input);
        
        expect(validated).toBe(input);
      });

      it('should create validated input from undefined', () => {
        const input = undefined;
        const validated = createValidatedInput(input);
        
        expect(validated).toBe(input);
      });
    });

    describe('createParsedTemporal', () => {
      it('should create parsed temporal from ZonedDateTime', () => {
        const temporal = Temporal.ZonedDateTime.from('2024-03-15T10:30:00[UTC]');
        const parsed = createParsedTemporal(temporal);
        
        expect(parsed).toBe(temporal);
        expect(parsed instanceof Temporal.ZonedDateTime).toBe(true);
      });
    });

    describe('createCachedResult', () => {
      it('should create cached result from any value', () => {
        const result = { data: 'test' };
        const cached = createCachedResult(result);
        
        expect(cached).toBe(result);
      });

      it('should create cached result from primitive', () => {
        const result = 'test-string';
        const cached = createCachedResult(result);
        
        expect(cached).toBe(result);
      });
    });
  });

  describe('assertion functions', () => {
    describe('assertTemporalInput', () => {
      it('should accept null and undefined', () => {
        expect(() => assertTemporalInput(null)).not.toThrow();
        expect(() => assertTemporalInput(undefined)).not.toThrow();
      });

      it('should accept string inputs', () => {
        expect(() => assertTemporalInput('2024-03-15')).not.toThrow();
        expect(() => assertTemporalInput('2024-03-15T10:30:00Z')).not.toThrow();
        expect(() => assertTemporalInput('')).not.toThrow();
      });

      it('should accept number inputs', () => {
        expect(() => assertTemporalInput(1710518400000)).not.toThrow();
        expect(() => assertTemporalInput(0)).not.toThrow();
        expect(() => assertTemporalInput(-1)).not.toThrow();
      });

      it('should accept Date objects', () => {
        expect(() => assertTemporalInput(new Date())).not.toThrow();
        expect(() => assertTemporalInput(new Date('2024-03-15'))).not.toThrow();
      });

      it('should accept Temporal objects', () => {
        const zonedDateTime = Temporal.ZonedDateTime.from('2024-03-15T10:30:00[UTC]');
        const plainDateTime = Temporal.PlainDateTime.from('2024-03-15T10:30:00');
        const plainDate = Temporal.PlainDate.from('2024-03-15');
        const plainTime = Temporal.PlainTime.from('10:30:00');
        const instant = Temporal.Instant.from('2024-03-15T10:30:00Z');
        
        expect(() => assertTemporalInput(zonedDateTime)).not.toThrow();
        expect(() => assertTemporalInput(plainDateTime)).not.toThrow();
        expect(() => assertTemporalInput(plainDate)).not.toThrow();
        expect(() => assertTemporalInput(plainTime)).not.toThrow();
        expect(() => assertTemporalInput(instant)).not.toThrow();
      });

      it('should accept objects with temporal-like properties', () => {
        const temporalLike = {
          year: 2024,
          month: 3,
          day: 15,
          hour: 10,
          minute: 30,
          second: 0
        };
        
        // This would need the actual type guards to work properly
        // For now, we test that it doesn't throw for objects
        expect(() => assertTemporalInput(temporalLike)).not.toThrow();
      });

      it('should reject invalid types', () => {
        expect(() => assertTemporalInput(true)).toThrow(TemporalParseError);
        expect(() => assertTemporalInput(Symbol('test'))).toThrow(TemporalParseError);
        expect(() => assertTemporalInput(() => {})).toThrow(TemporalParseError);
      });

      it('should provide meaningful error messages', () => {
        try {
          assertTemporalInput(true);
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(TemporalParseError);
          expect((error as TemporalParseError).message).toContain('Invalid temporal input type');
          expect((error as TemporalParseError).code).toBe('INVALID_INPUT_TYPE');
        }
      });
    });

    describe('assertTimeUnit', () => {
      it('should accept singular time units', () => {
        const singularUnits = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond'];
        
        singularUnits.forEach(unit => {
          expect(() => assertTimeUnit(unit)).not.toThrow();
        });
      });

      it('should accept plural time units', () => {
        const pluralUnits = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds', 'microseconds', 'nanoseconds'];
        
        pluralUnits.forEach(unit => {
          expect(() => assertTimeUnit(unit)).not.toThrow();
        });
      });

      it('should reject invalid time units', () => {
        const invalidUnits = ['invalid', 'century', 'decade', 'quarter', 'semester'];
        
        invalidUnits.forEach(unit => {
          expect(() => assertTimeUnit(unit)).toThrow(TemporalParseError);
        });
      });

      it('should reject non-string inputs', () => {
        expect(() => assertTimeUnit(123)).toThrow(TemporalParseError);
        expect(() => assertTimeUnit(null)).toThrow(TemporalParseError);
        expect(() => assertTimeUnit(undefined)).toThrow(TemporalParseError);
        expect(() => assertTimeUnit({})).toThrow(TemporalParseError);
      });

      it('should provide meaningful error messages', () => {
        try {
          assertTimeUnit('invalid');
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(TemporalParseError);
          expect((error as TemporalParseError).message).toContain('Invalid time unit');
          expect((error as TemporalParseError).code).toBe('INVALID_TIME_UNIT');
        }
      });
    });

    describe('assertLocale', () => {
      it('should accept common locales', () => {
        const commonLocales = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES', 'ja-JP', 'zh-CN'];
        
        commonLocales.forEach(locale => {
          expect(() => assertLocale(locale)).not.toThrow();
        });
      });

      it('should accept basic locale patterns', () => {
        expect(() => assertLocale('en')).not.toThrow();
        expect(() => assertLocale('fr')).not.toThrow();
        expect(() => assertLocale('zh')).not.toThrow();
      });

      it('should warn for potentially invalid locales', () => {
        assertLocale('invalid-locale');
        expect(mockConsoleWarn).toHaveBeenCalledWith('Potentially invalid locale format: invalid-locale');
      });

      it('should reject non-string inputs', () => {
        expect(() => assertLocale(123)).toThrow(TemporalFormatError);
        expect(() => assertLocale(null)).toThrow(TemporalFormatError);
        expect(() => assertLocale(undefined)).toThrow(TemporalFormatError);
        expect(() => assertLocale({})).toThrow(TemporalFormatError);
      });

      it('should provide meaningful error messages', () => {
        try {
          assertLocale(123);
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(TemporalFormatError);
          expect((error as TemporalFormatError).message).toContain('Invalid locale type');
          expect((error as TemporalFormatError).code).toBe('INVALID_LOCALE_TYPE');
        }
      });
    });

    describe('assertTimezone', () => {
      it('should accept UTC', () => {
        expect(() => assertTimezone('UTC')).not.toThrow();
      });

      it('should accept common IANA timezones', () => {
        const commonTimezones = [
          'America/New_York',
          'Europe/London',
          'Asia/Tokyo',
          'Australia/Sydney'
        ];
        
        commonTimezones.forEach(timezone => {
          expect(() => assertTimezone(timezone)).not.toThrow();
        });
      });

      it('should warn for potentially invalid timezones', () => {
        assertTimezone('Invalid/Timezone');
        expect(mockConsoleWarn).toHaveBeenCalledWith('Potentially invalid timezone format: Invalid/Timezone');
      });

      it('should reject non-string inputs', () => {
        expect(() => assertTimezone(123)).toThrow(TemporalTimezoneError);
        expect(() => assertTimezone(null)).toThrow(TemporalTimezoneError);
        expect(() => assertTimezone(undefined)).toThrow(TemporalTimezoneError);
        expect(() => assertTimezone({})).toThrow(TemporalTimezoneError);
      });

      it('should provide meaningful error messages', () => {
        try {
          assertTimezone(123);
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(TemporalTimezoneError);
          expect((error as TemporalTimezoneError).message).toContain('Invalid timezone type');
          expect((error as TemporalTimezoneError).code).toBe('INVALID_TIMEZONE_TYPE');
        }
      });
    });
  });

  describe('time unit utilities', () => {
    describe('normalizeTimeUnit', () => {
      it('should normalize plural units to singular', () => {
        expect(normalizeTimeUnit('years')).toBe('year');
        expect(normalizeTimeUnit('months')).toBe('month');
        expect(normalizeTimeUnit('weeks')).toBe('week');
        expect(normalizeTimeUnit('days')).toBe('day');
        expect(normalizeTimeUnit('hours')).toBe('hour');
        expect(normalizeTimeUnit('minutes')).toBe('minute');
        expect(normalizeTimeUnit('seconds')).toBe('second');
        expect(normalizeTimeUnit('milliseconds')).toBe('millisecond');
        expect(normalizeTimeUnit('microseconds')).toBe('microsecond');
        expect(normalizeTimeUnit('nanoseconds')).toBe('nanosecond');
      });

      it('should keep singular units unchanged', () => {
        expect(normalizeTimeUnit('year')).toBe('year');
        expect(normalizeTimeUnit('month')).toBe('month');
        expect(normalizeTimeUnit('week')).toBe('week');
        expect(normalizeTimeUnit('day')).toBe('day');
        expect(normalizeTimeUnit('hour')).toBe('hour');
        expect(normalizeTimeUnit('minute')).toBe('minute');
        expect(normalizeTimeUnit('second')).toBe('second');
        expect(normalizeTimeUnit('millisecond')).toBe('millisecond');
        expect(normalizeTimeUnit('microsecond')).toBe('microsecond');
        expect(normalizeTimeUnit('nanosecond')).toBe('nanosecond');
      });
    });

    describe('pluralizeTimeUnit', () => {
      it('should pluralize singular units', () => {
        expect(pluralizeTimeUnit('year')).toBe('years');
        expect(pluralizeTimeUnit('month')).toBe('months');
        expect(pluralizeTimeUnit('week')).toBe('weeks');
        expect(pluralizeTimeUnit('day')).toBe('days');
        expect(pluralizeTimeUnit('hour')).toBe('hours');
        expect(pluralizeTimeUnit('minute')).toBe('minutes');
        expect(pluralizeTimeUnit('second')).toBe('seconds');
        expect(pluralizeTimeUnit('millisecond')).toBe('milliseconds');
        expect(pluralizeTimeUnit('microsecond')).toBe('microseconds');
        expect(pluralizeTimeUnit('nanosecond')).toBe('nanoseconds');
      });
    });

    describe('isTimeUnitPlural', () => {
      it('should identify plural units correctly', () => {
        expect(isTimeUnitPlural('years')).toBe(true);
        expect(isTimeUnitPlural('months')).toBe(true);
        expect(isTimeUnitPlural('weeks')).toBe(true);
        expect(isTimeUnitPlural('days')).toBe(true);
        expect(isTimeUnitPlural('hours')).toBe(true);
        expect(isTimeUnitPlural('minutes')).toBe(true);
        expect(isTimeUnitPlural('seconds')).toBe(true);
        expect(isTimeUnitPlural('milliseconds')).toBe(true);
        expect(isTimeUnitPlural('microseconds')).toBe(true);
        expect(isTimeUnitPlural('nanoseconds')).toBe(true);
      });

      it('should identify singular units correctly', () => {
        expect(isTimeUnitPlural('year')).toBe(false);
        expect(isTimeUnitPlural('month')).toBe(false);
        expect(isTimeUnitPlural('week')).toBe(false);
        expect(isTimeUnitPlural('day')).toBe(false);
        expect(isTimeUnitPlural('hour')).toBe(false);
        expect(isTimeUnitPlural('minute')).toBe(false);
        expect(isTimeUnitPlural('second')).toBe(false);
        expect(isTimeUnitPlural('millisecond')).toBe(false);
        expect(isTimeUnitPlural('microsecond')).toBe(false);
        expect(isTimeUnitPlural('nanosecond')).toBe(false);
      });
    });

    describe('isTimeUnitSingular', () => {
      it('should identify singular units correctly', () => {
        expect(isTimeUnitSingular('year')).toBe(true);
        expect(isTimeUnitSingular('month')).toBe(true);
        expect(isTimeUnitSingular('week')).toBe(true);
        expect(isTimeUnitSingular('day')).toBe(true);
        expect(isTimeUnitSingular('hour')).toBe(true);
        expect(isTimeUnitSingular('minute')).toBe(true);
        expect(isTimeUnitSingular('second')).toBe(true);
        expect(isTimeUnitSingular('millisecond')).toBe(true);
        expect(isTimeUnitSingular('microsecond')).toBe(true);
        expect(isTimeUnitSingular('nanosecond')).toBe(true);
      });

      it('should identify plural units correctly', () => {
        expect(isTimeUnitSingular('years')).toBe(false);
        expect(isTimeUnitSingular('months')).toBe(false);
        expect(isTimeUnitSingular('weeks')).toBe(false);
        expect(isTimeUnitSingular('days')).toBe(false);
        expect(isTimeUnitSingular('hours')).toBe(false);
        expect(isTimeUnitSingular('minutes')).toBe(false);
        expect(isTimeUnitSingular('seconds')).toBe(false);
        expect(isTimeUnitSingular('milliseconds')).toBe(false);
        expect(isTimeUnitSingular('microseconds')).toBe(false);
        expect(isTimeUnitSingular('nanoseconds')).toBe(false);
      });
    });
  });

  describe('temporal result utilities', () => {
    describe('createSuccessResult', () => {
      it('should create success result with data', () => {
        const data = { value: 'test' };
        const result = createSuccessResult(data);
        
        expect(result).toEqual({
          success: true,
          data
        });
      });

      it('should create success result with primitive data', () => {
        const data = 'test-string';
        const result = createSuccessResult(data);
        
        expect(result).toEqual({
          success: true,
          data
        });
      });

      it('should create success result with null data', () => {
        const data = null;
        const result = createSuccessResult(data);
        
        expect(result).toEqual({
          success: true,
          data
        });
      });
    });

    describe('createErrorResult', () => {
      it('should create error result with TemporalError', () => {
        const error = new TemporalParseError('Test error', 'invalid', 'TEST_ERROR');
        const result = createErrorResult(error);
        
        expect(result).toEqual({
          success: false,
          error
        });
      });
    });

    describe('isSuccessResult', () => {
      it('should identify success results correctly', () => {
        const successResult = createSuccessResult('data');
        expect(isSuccessResult(successResult)).toBe(true);
      });

      it('should identify error results correctly', () => {
        const error = new TemporalParseError('Test error', 'invalid', 'TEST_ERROR');
        const errorResult = createErrorResult(error);
        expect(isSuccessResult(errorResult)).toBe(false);
      });
    });

    describe('isErrorResult', () => {
      it('should identify error results correctly', () => {
        const error = new TemporalParseError('Test error', 'invalid', 'TEST_ERROR');
        const errorResult = createErrorResult(error);
        expect(isErrorResult(errorResult)).toBe(true);
      });

      it('should identify success results correctly', () => {
        const successResult = createSuccessResult('data');
        expect(isErrorResult(successResult)).toBe(false);
      });
    });
  });

  describe('constants', () => {
    describe('DEFAULT_TEMPORAL_CONFIG', () => {
      it('should have correct default values', () => {
        expect(DEFAULT_TEMPORAL_CONFIG).toEqual({
          defaultLocale: 'en-US',
          defaultTimeZone: 'UTC',
          defaultCalendar: 'iso8601',
          enableCaching: true,
          enableOptimizations: true,
          strictMode: false,
          throwOnErrors: true
        });
      });

      it('should be readonly', () => {
        expect(() => {
          (DEFAULT_TEMPORAL_CONFIG as any).defaultLocale = 'fr-FR';
        }).toThrow();
      });
    });

    describe('TIME_UNITS', () => {
      it('should contain all singular units', () => {
        expect(TIME_UNITS.SINGULAR).toEqual([
          'year', 'month', 'week', 'day',
          'hour', 'minute', 'second',
          'millisecond', 'microsecond', 'nanosecond'
        ]);
      });

      it('should contain all plural units', () => {
        expect(TIME_UNITS.PLURAL).toEqual([
          'years', 'months', 'weeks', 'days',
          'hours', 'minutes', 'seconds',
          'milliseconds', 'microseconds', 'nanoseconds'
        ]);
      });

      it('should contain all units combined', () => {
        expect(TIME_UNITS.ALL).toEqual([
          'year', 'years', 'month', 'months', 'week', 'weeks', 'day', 'days',
          'hour', 'hours', 'minute', 'minutes', 'second', 'seconds',
          'millisecond', 'milliseconds', 'microsecond', 'microseconds',
          'nanosecond', 'nanoseconds'
        ]);
      });
    });

    describe('COMMON_LOCALES', () => {
      it('should contain English locales', () => {
        expect(COMMON_LOCALES.ENGLISH).toEqual(['en-US', 'en-GB', 'en-CA', 'en-AU']);
      });

      it('should contain Spanish locales', () => {
        expect(COMMON_LOCALES.SPANISH).toEqual(['es-ES', 'es-MX', 'es-AR']);
      });

      it('should contain French locales', () => {
        expect(COMMON_LOCALES.FRENCH).toEqual(['fr-FR', 'fr-CA']);
      });

      it('should contain German locales', () => {
        expect(COMMON_LOCALES.GERMAN).toEqual(['de-DE', 'de-AT', 'de-CH']);
      });

      it('should contain Asian locales', () => {
        expect(COMMON_LOCALES.ASIAN).toEqual(['ja-JP', 'ko-KR', 'zh-CN', 'zh-TW']);
      });

      it('should contain all locales', () => {
        expect(COMMON_LOCALES.ALL).toContain('en-US');
        expect(COMMON_LOCALES.ALL).toContain('es-ES');
        expect(COMMON_LOCALES.ALL).toContain('fr-FR');
        expect(COMMON_LOCALES.ALL).toContain('de-DE');
        expect(COMMON_LOCALES.ALL).toContain('ja-JP');
        expect(COMMON_LOCALES.ALL.length).toBe(23);
      });
    });

    describe('COMMON_TIMEZONES', () => {
      it('should contain UTC', () => {
        expect(COMMON_TIMEZONES.UTC).toBe('UTC');
      });

      it('should contain American timezones', () => {
        expect(COMMON_TIMEZONES.AMERICA).toContain('America/New_York');
        expect(COMMON_TIMEZONES.AMERICA).toContain('America/Chicago');
        expect(COMMON_TIMEZONES.AMERICA).toContain('America/Los_Angeles');
      });

      it('should contain European timezones', () => {
        expect(COMMON_TIMEZONES.EUROPE).toContain('Europe/London');
        expect(COMMON_TIMEZONES.EUROPE).toContain('Europe/Paris');
        expect(COMMON_TIMEZONES.EUROPE).toContain('Europe/Berlin');
      });

      it('should contain Asian timezones', () => {
        expect(COMMON_TIMEZONES.ASIA).toContain('Asia/Tokyo');
        expect(COMMON_TIMEZONES.ASIA).toContain('Asia/Shanghai');
        expect(COMMON_TIMEZONES.ASIA).toContain('Asia/Mumbai');
      });

      it('should contain Oceania timezones', () => {
        expect(COMMON_TIMEZONES.OCEANIA).toContain('Australia/Sydney');
        expect(COMMON_TIMEZONES.OCEANIA).toContain('Pacific/Auckland');
      });

      it('should contain all timezones', () => {
        expect(COMMON_TIMEZONES.ALL).toContain('UTC');
        expect(COMMON_TIMEZONES.ALL).toContain('America/New_York');
        expect(COMMON_TIMEZONES.ALL).toContain('Europe/London');
        expect(COMMON_TIMEZONES.ALL).toContain('Asia/Tokyo');
        expect(COMMON_TIMEZONES.ALL).toContain('Australia/Sydney');
        expect(COMMON_TIMEZONES.ALL.length).toBeGreaterThan(25);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle extreme date values in assertions', () => {
      expect(() => assertTemporalInput(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(() => assertTemporalInput(Number.MIN_SAFE_INTEGER)).not.toThrow();
      expect(() => assertTemporalInput(0)).not.toThrow();
    });

    it('should handle empty strings in assertions', () => {
      expect(() => assertTemporalInput('')).not.toThrow();
      expect(() => assertLocale('')).not.toThrow();
      expect(() => assertTimezone('')).not.toThrow();
    });

    it('should handle special string values', () => {
      expect(() => assertTemporalInput('null')).not.toThrow();
      expect(() => assertTemporalInput('undefined')).not.toThrow();
      expect(() => assertTemporalInput('NaN')).not.toThrow();
    });

    it('should handle complex objects gracefully', () => {
      const complexObject = {
        nested: {
          deep: {
            value: 'test'
          }
        },
        array: [1, 2, 3],
        date: new Date(),
        func: () => {}
      };
      
      // Should not throw for complex objects (they might be temporal-like)
      expect(() => assertTemporalInput(complexObject)).not.toThrow();
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { prop: 'value' };
      circular.self = circular;
      
      // Should not throw for circular objects
      expect(() => assertTemporalInput(circular)).not.toThrow();
    });
  });

  describe('performance characteristics', () => {
    it('should handle rapid assertion calls', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        assertTemporalInput('2024-03-15');
        assertTimeUnit('day');
        assertLocale('en-US');
        assertTimezone('UTC');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it('should handle rapid utility function calls', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        normalizeTimeUnit('days');
        pluralizeTimeUnit('day');
        isTimeUnitPlural('days');
        isTimeUnitSingular('day');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(500);
    });
  });
});