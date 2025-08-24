/**
 * @file Comprehensive tests for enhanced-types module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import {
  TemporalParseError,
  TemporalTimezoneError,
  TemporalFormatError,
  TemporalCacheError,
  isTemporalWrapper,
  isTemporalError,
  isFirebaseTimestamp,
  isTemporalLike,
  isArrayLike,
  type TemporalInput,
  type TemporalWrapper,
  type TemporalError,
  type TemporalResult,
  type FirebaseTimestamp,
  type TemporalLike,
  type ArrayLike,
  type LocaleString,
  type TimezoneString,
  type CalendarString,
  type TimeUnit,
  type SingularTimeUnit,
  type PluralTimeUnit,
  type RoundingMode,
  type OverflowBehavior,
  type Disambiguation,
  type OffsetBehavior,
  type StrictTemporalOptions,
  type StrictParsingOptions,
  type StrictFormattingOptions,
  type StrictComparisonOptions,
  type StrictDiffOptions,
  type ValidatedInput,
  type ParsedTemporal,
  type CachedResult,
  type GlobalTemporalConfig,
  type TemporalPlugin,
  type PerformanceMetrics
} from '../../types/enhanced-types';

describe('enhanced-types', () => {
  describe('Error Classes', () => {
    describe('TemporalParseError', () => {
      it('should create error with all properties', () => {
        const input = 'invalid-date';
        const error = new TemporalParseError(
          'Failed to parse date',
          input,
          'INVALID_FORMAT',
          'date parsing'
        );
        
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TemporalParseError);
        expect(error.name).toBe('TemporalParseError');
        expect(error.message).toBe('Failed to parse date');
        expect(error.code).toBe('INVALID_FORMAT');
        expect(error.input).toBe(input);
        expect(error.context).toBe('date parsing');
      });

      it('should create error with default code', () => {
        const error = new TemporalParseError('Parse failed', 'input');
        
        expect(error.code).toBe('PARSE_ERROR');
        expect(error.context).toBeUndefined();
      });

      it('should preserve stack trace', () => {
        const error = new TemporalParseError('Test error', 'input');
        
        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe('string');
      });
    });

    describe('TemporalTimezoneError', () => {
      it('should create error with all properties', () => {
        const timezone = 'Invalid/Timezone';
        const error = new TemporalTimezoneError(
          'Invalid timezone',
          timezone,
          'INVALID_TIMEZONE',
          'Use UTC instead'
        );
        
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TemporalTimezoneError);
        expect(error.name).toBe('TemporalTimezoneError');
        expect(error.message).toBe('Invalid timezone');
        expect(error.code).toBe('INVALID_TIMEZONE');
        expect(error.timezone).toBe(timezone);
        expect(error.suggestion).toBe('Use UTC instead');
      });

      it('should create error with default code', () => {
        const error = new TemporalTimezoneError('Timezone error', 'UTC');
        
        expect(error.code).toBe('TIMEZONE_ERROR');
        expect(error.suggestion).toBeUndefined();
      });
    });

    describe('TemporalFormatError', () => {
      it('should create error with all properties', () => {
        const format = 'YYYY-MM-DD';
        const error = new TemporalFormatError(
          'Invalid format token',
          format,
          'INVALID_TOKEN',
          5
        );
        
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TemporalFormatError);
        expect(error.name).toBe('TemporalFormatError');
        expect(error.message).toBe('Invalid format token');
        expect(error.code).toBe('INVALID_TOKEN');
        expect(error.format).toBe(format);
        expect(error.position).toBe(5);
      });

      it('should create error with default code', () => {
        const error = new TemporalFormatError('Format error', 'format');
        
        expect(error.code).toBe('FORMAT_ERROR');
        expect(error.position).toBeUndefined();
      });
    });

    describe('TemporalCacheError', () => {
      it('should create error with all properties', () => {
        const operation = 'cache-set';
        const error = new TemporalCacheError(
          'Cache operation failed',
          operation,
          'CACHE_FULL',
          'LRU'
        );
        
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(TemporalCacheError);
        expect(error.name).toBe('TemporalCacheError');
        expect(error.message).toBe('Cache operation failed');
        expect(error.code).toBe('CACHE_FULL');
        expect(error.operation).toBe(operation);
        expect(error.cacheType).toBe('LRU');
      });

      it('should create error with default code', () => {
        const error = new TemporalCacheError('Cache error', 'operation');
        
        expect(error.code).toBe('CACHE_ERROR');
        expect(error.cacheType).toBeUndefined();
      });
    });
  });

  describe('Type Guards', () => {
    describe('isTemporalWrapper', () => {
      it('should return true for valid TemporalWrapper', () => {
        const wrapper = {
          _temporal: Temporal.Now.zonedDateTimeISO(),
          _isTemporalWrapper: true as const,
          format: () => '',
          add: () => wrapper,
          subtract: () => wrapper,
          diff: () => 0,
          isBefore: () => false,
          isAfter: () => false,
          isSame: () => false,
          isSameOrBefore: () => false,
          isSameOrAfter: () => false,
          isBetween: () => false,
          startOf: () => wrapper,
          endOf: () => wrapper,
          set: () => wrapper,
          with: () => wrapper,
          toDate: () => new Date(),
          toISOString: () => '',
          toString: () => '',
          valueOf: () => 0,
          toJSON: () => '',
          withTimeZone: () => wrapper,
          withCalendar: () => wrapper,
          year: 2024,
          month: 3,
          day: 15,
          hour: 10,
          minute: 30,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
          dayOfWeek: 5,
          dayOfYear: 75,
          weekOfYear: 11,
          daysInMonth: 31,
          daysInYear: 366,
          inLeapYear: true,
          timeZoneId: 'UTC',
          calendarId: 'iso8601',
          epochNanoseconds: BigInt(0),
          epochMicroseconds: 0,
          epochMilliseconds: 0,
          epochSeconds: 0
        };
        
        expect(isTemporalWrapper(wrapper)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        expect(isTemporalWrapper(null)).toBe(false);
        expect(isTemporalWrapper(undefined)).toBe(false);
        expect(isTemporalWrapper({})).toBe(false);
        expect(isTemporalWrapper({ _isTemporalWrapper: false })).toBe(false);
        expect(isTemporalWrapper({ _isTemporalWrapper: 'true' })).toBe(false);
        expect(isTemporalWrapper('string')).toBe(false);
        expect(isTemporalWrapper(123)).toBe(false);
        expect(isTemporalWrapper([])).toBe(false);
      });

      it('should return false for objects without _isTemporalWrapper', () => {
        const obj = {
          _temporal: Temporal.Now.zonedDateTimeISO(),
          format: () => ''
        };
        
        expect(isTemporalWrapper(obj)).toBe(false);
      });
    });

    describe('isTemporalError', () => {
      it('should return true for TemporalParseError', () => {
        const error = new TemporalParseError('Parse error', 'input');
        expect(isTemporalError(error)).toBe(true);
      });

      it('should return true for TemporalTimezoneError', () => {
        const error = new TemporalTimezoneError('Timezone error', 'UTC');
        expect(isTemporalError(error)).toBe(true);
      });

      it('should return true for TemporalFormatError', () => {
        const error = new TemporalFormatError('Format error', 'format');
        expect(isTemporalError(error)).toBe(true);
      });

      it('should return true for TemporalCacheError', () => {
        const error = new TemporalCacheError('Cache error', 'operation');
        expect(isTemporalError(error)).toBe(true);
      });

      it('should return false for regular errors', () => {
        expect(isTemporalError(new Error('Regular error'))).toBe(false);
        expect(isTemporalError(new TypeError('Type error'))).toBe(false);
        expect(isTemporalError(new ReferenceError('Reference error'))).toBe(false);
      });

      it('should return false for non-error values', () => {
        expect(isTemporalError(null)).toBe(false);
        expect(isTemporalError(undefined)).toBe(false);
        expect(isTemporalError('string')).toBe(false);
        expect(isTemporalError(123)).toBe(false);
        expect(isTemporalError({})).toBe(false);
        expect(isTemporalError([])).toBe(false);
      });
    });

    describe('isFirebaseTimestamp', () => {
      it('should return true for valid Firebase timestamp', () => {
        const timestamp: FirebaseTimestamp = {
          seconds: 1647345000,
          nanoseconds: 123456789,
          toDate: () => new Date()
        };
        
        expect(isFirebaseTimestamp(timestamp)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        expect(isFirebaseTimestamp(null)).toBe(false);
        expect(isFirebaseTimestamp(undefined)).toBe(false);
        expect(isFirebaseTimestamp({})).toBe(false);
        expect(isFirebaseTimestamp({ seconds: 123 })).toBe(false);
        expect(isFirebaseTimestamp({ nanoseconds: 123 })).toBe(false);
        expect(isFirebaseTimestamp({ toDate: () => new Date() })).toBe(false);
        expect(isFirebaseTimestamp({
          seconds: 123,
          nanoseconds: 456
          // missing toDate
        })).toBe(false);
        expect(isFirebaseTimestamp({
          seconds: 123,
          nanoseconds: 456,
          toDate: 'not a function'
        })).toBe(false);
      });

      it('should return false for primitive values', () => {
        expect(isFirebaseTimestamp('string')).toBe(false);
        expect(isFirebaseTimestamp(123)).toBe(false);
        expect(isFirebaseTimestamp(true)).toBe(false);
        expect(isFirebaseTimestamp([])).toBe(false);
      });
    });

    describe('isTemporalLike', () => {
      it('should return true for objects with temporal properties', () => {
        expect(isTemporalLike({ year: 2024 })).toBe(true);
        expect(isTemporalLike({ month: 3 })).toBe(true);
        expect(isTemporalLike({ day: 15 })).toBe(true);
        expect(isTemporalLike({ hour: 10 })).toBe(true);
        expect(isTemporalLike({ minute: 30 })).toBe(true);
        expect(isTemporalLike({ second: 45 })).toBe(true);
        expect(isTemporalLike({ millisecond: 123 })).toBe(true);
        expect(isTemporalLike({ microsecond: 456 })).toBe(true);
        expect(isTemporalLike({ nanosecond: 789 })).toBe(true);
        expect(isTemporalLike({ timeZone: 'UTC' })).toBe(true);
        expect(isTemporalLike({ calendar: 'iso8601' })).toBe(true);
      });

      it('should return true for objects with multiple temporal properties', () => {
        expect(isTemporalLike({
          year: 2024,
          month: 3,
          day: 15,
          hour: 10,
          minute: 30
        })).toBe(true);
      });

      it('should return true for objects with temporal and non-temporal properties', () => {
        expect(isTemporalLike({
          year: 2024,
          someOtherProp: 'value',
          anotherProp: 123
        })).toBe(true);
      });

      it('should return false for objects without temporal properties', () => {
        expect(isTemporalLike({})).toBe(false);
        expect(isTemporalLike({ someProperty: 'value' })).toBe(false);
        expect(isTemporalLike({ number: 123, string: 'test' })).toBe(false);
      });

      it('should return false for non-objects', () => {
        expect(isTemporalLike(null)).toBe(false);
        expect(isTemporalLike(undefined)).toBe(false);
        expect(isTemporalLike('string')).toBe(false);
        expect(isTemporalLike(123)).toBe(false);
        expect(isTemporalLike(true)).toBe(false);
        expect(isTemporalLike([])).toBe(false);
      });
    });

    describe('isArrayLike', () => {
      it('should return true for arrays', () => {
        expect(isArrayLike([])).toBe(true);
        expect(isArrayLike([1, 2, 3])).toBe(true);
        expect(isArrayLike(new Array(5))).toBe(true);
      });

      it('should return true for array-like objects', () => {
        expect(isArrayLike({ length: 0 })).toBe(true);
        expect(isArrayLike({ length: 3, 0: 1, 1: 2, 2: 3 })).toBe(true);
        expect(isArrayLike({ length: 2, someOtherProp: 'value' })).toBe(true);
      });

      it('should return false for strings (they are primitives, not objects)', () => {
        expect(isArrayLike('hello')).toBe(false);
        expect(isArrayLike('')).toBe(false);
      });

      it('should return false for objects without length', () => {
        expect(isArrayLike({})).toBe(false);
        expect(isArrayLike({ prop: 'value' })).toBe(false);
      });

      it('should return false for objects with non-numeric length', () => {
        expect(isArrayLike({ length: 'not a number' })).toBe(false);
        expect(isArrayLike({ length: null })).toBe(false);
        expect(isArrayLike({ length: undefined })).toBe(false);
        expect(isArrayLike({ length: {} })).toBe(false);
      });

      it('should return false for non-objects', () => {
        expect(isArrayLike(null)).toBe(false);
        expect(isArrayLike(undefined)).toBe(false);
        expect(isArrayLike(123)).toBe(false);
        expect(isArrayLike(true)).toBe(false);
      });
    });
  });

  describe('Type Definitions', () => {
    describe('TemporalInput', () => {
      it('should accept all valid temporal input types', () => {
        // This test verifies that the type accepts various inputs
        // TypeScript compilation serves as the test
        const inputs: TemporalInput[] = [
          undefined,
          null,
          'string',
          123,
          new Date(),
          Temporal.Now.zonedDateTimeISO(),
          Temporal.Now.plainDateTimeISO(),
          Temporal.Now.plainDateISO(),
          Temporal.Now.plainTimeISO(),
          Temporal.Now.instant(),
          { year: 2024, month: 3, day: 15 },
          { seconds: 123, nanoseconds: 456, toDate: () => new Date() },
          [2024, 3, 15],
          { someProperty: 'value' }
        ];
        
        expect(inputs).toBeDefined();
      });
    });

    describe('TimeUnit types', () => {
      it('should define singular time units', () => {
        const singularUnits: SingularTimeUnit[] = [
          'year', 'month', 'week', 'day',
          'hour', 'minute', 'second',
          'millisecond', 'microsecond', 'nanosecond'
        ];
        
        expect(singularUnits).toHaveLength(10);
      });

      it('should define plural time units', () => {
        const pluralUnits: PluralTimeUnit[] = [
          'years', 'months', 'weeks', 'days',
          'hours', 'minutes', 'seconds',
          'milliseconds', 'microseconds', 'nanoseconds'
        ];
        
        expect(pluralUnits).toHaveLength(10);
      });

      it('should define all time units', () => {
        const allUnits: TimeUnit[] = [
          'year', 'years', 'month', 'months',
          'week', 'weeks', 'day', 'days',
          'hour', 'hours', 'minute', 'minutes',
          'second', 'seconds', 'millisecond', 'milliseconds',
          'microsecond', 'microseconds', 'nanosecond', 'nanoseconds'
        ];
        
        expect(allUnits).toHaveLength(20);
      });
    });

    describe('Locale and Timezone types', () => {
      it('should define common locales', () => {
        const locales: LocaleString[] = [
          'en-US', 'en-GB', 'en-CA', 'en-AU',
          'es-ES', 'es-MX', 'es-AR',
          'fr-FR', 'fr-CA',
          'de-DE', 'de-AT', 'de-CH',
          'it-IT',
          'pt-BR', 'pt-PT',
          'ru-RU',
          'ja-JP',
          'ko-KR',
          'zh-CN', 'zh-TW',
          'ar-SA',
          'hi-IN',
          'custom-locale' // string fallback
        ];
        
        expect(locales.length).toBeGreaterThan(20);
      });

      it('should define common timezones', () => {
        const timezones: TimezoneString[] = [
          'UTC',
          'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
          'Europe/London', 'Europe/Paris', 'Europe/Berlin',
          'Asia/Tokyo', 'Asia/Shanghai',
          'Australia/Sydney',
          'custom-timezone' // string fallback
        ];
        
        expect(timezones.length).toBeGreaterThan(10);
      });

      it('should define calendar types', () => {
        const calendars: CalendarString[] = [
          'iso8601', 'gregory', 'buddhist', 'chinese',
          'hebrew', 'islamic', 'japanese',
          'custom-calendar' // string fallback
        ];
        
        expect(calendars.length).toBeGreaterThan(5);
      });
    });

    describe('Option types', () => {
      it('should define rounding modes', () => {
        const roundingModes: RoundingMode[] = [
          'ceil', 'floor', 'trunc', 'halfExpand',
          'halfEven', 'halfTrunc', 'halfCeil', 'halfFloor'
        ];
        
        expect(roundingModes).toHaveLength(8);
      });

      it('should define overflow behaviors', () => {
        const overflowBehaviors: OverflowBehavior[] = ['constrain', 'reject'];
        expect(overflowBehaviors).toHaveLength(2);
      });

      it('should define disambiguation options', () => {
        const disambiguations: Disambiguation[] = [
          'compatible', 'earlier', 'later', 'reject'
        ];
        expect(disambiguations).toHaveLength(4);
      });

      it('should define offset behaviors', () => {
        const offsetBehaviors: OffsetBehavior[] = [
          'prefer', 'use', 'ignore', 'reject'
        ];
        expect(offsetBehaviors).toHaveLength(4);
      });
    });

    describe('Result types', () => {
      it('should define success result', () => {
        const successResult: TemporalResult<string> = {
          success: true,
          data: 'test-data'
        };
        
        expect(successResult.success).toBe(true);
        expect(successResult.data).toBe('test-data');
        expect(successResult.error).toBeUndefined();
      });

      it('should define error result', () => {
        const errorResult: TemporalResult<string> = {
          success: false,
          error: new TemporalParseError('Parse failed', 'input')
        };
        
        expect(errorResult.success).toBe(false);
        expect(errorResult.error).toBeInstanceOf(TemporalParseError);
        expect(errorResult.data).toBeUndefined();
      });
    });

    describe('Configuration types', () => {
      it('should define global temporal config', () => {
        const config: GlobalTemporalConfig = {
          defaultLocale: 'en-US',
          defaultTimeZone: 'UTC',
          defaultCalendar: 'iso8601',
          enableCaching: true,
          enableOptimizations: true,
          strictMode: false,
          throwOnErrors: false
        };
        
        expect(config.defaultLocale).toBe('en-US');
        expect(config.enableCaching).toBe(true);
      });

      it('should define plugin interface', () => {
        const plugin: TemporalPlugin = {
          name: 'test-plugin',
          version: '1.0.0',
          initialize: (config) => {
            expect(config).toBeDefined();
          },
          destroy: () => {
            // cleanup
          },
          parsers: {
            'custom': (input) => ({
              success: true,
              data: Temporal.Now.zonedDateTimeISO()
            })
          },
          formatters: {
            'custom': (date) => date.toString()
          },
          comparators: {
            'custom': (a, b) => a.epochNanoseconds < b.epochNanoseconds
          }
        };
        
        expect(plugin.name).toBe('test-plugin');
        expect(plugin.version).toBe('1.0.0');
        expect(typeof plugin.initialize).toBe('function');
      });

      it('should define performance metrics', () => {
        const metrics: PerformanceMetrics = {
          parsing: {
            totalOperations: 1000,
            averageTime: 1.5,
            cacheHitRatio: 0.85,
            errorRate: 0.02
          },
          formatting: {
            totalOperations: 2000,
            averageTime: 0.8,
            cacheHitRatio: 0.92,
            tokenPoolEfficiency: 0.78
          },
          comparison: {
            totalOperations: 1500,
            averageTime: 0.3,
            fastPathRatio: 0.95,
            cacheHitRatio: 0.88
          },
          memory: {
            totalCacheSize: 1024000,
            estimatedUsage: 512000,
            efficiency: 0.75
          }
        };
        
        expect(metrics.parsing.totalOperations).toBe(1000);
        expect(metrics.memory.totalCacheSize).toBe(1024000);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle circular references in type guards', () => {
      const circular: any = { prop: 'value' };
      circular.self = circular;
      
      expect(() => isTemporalLike(circular)).not.toThrow();
      expect(() => isArrayLike(circular)).not.toThrow();
      expect(() => isFirebaseTimestamp(circular)).not.toThrow();
    });

    it('should handle objects with null prototype', () => {
      const nullProtoObj = Object.create(null);
      nullProtoObj.year = 2024;
      
      expect(() => isTemporalLike(nullProtoObj)).not.toThrow();
      expect(isTemporalLike(nullProtoObj)).toBe(true);
    });

    it('should handle objects with getters that throw', () => {
      const throwingObj = {
        get year() {
          throw new Error('Getter throws');
        }
      };
      
      expect(() => isTemporalLike(throwingObj)).not.toThrow();
      expect(isTemporalLike(throwingObj)).toBe(true);
    });

    it('should handle frozen objects', () => {
      const frozenObj = Object.freeze({ year: 2024 });
      
      expect(() => isTemporalLike(frozenObj)).not.toThrow();
      expect(isTemporalLike(frozenObj)).toBe(true);
    });

    it('should handle objects with symbols', () => {
      const symbolKey = Symbol('test');
      const objWithSymbol = {
        [symbolKey]: 'value',
        year: 2024
      };
      
      expect(() => isTemporalLike(objWithSymbol)).not.toThrow();
      expect(isTemporalLike(objWithSymbol)).toBe(true);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle rapid type guard calls', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        isTemporalLike({ year: 2024 });
        isArrayLike([1, 2, 3]);
        isFirebaseTimestamp({ seconds: 123, nanoseconds: 456, toDate: () => new Date() });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle large objects efficiently', () => {
      const largeObj: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`prop${i}`] = `value${i}`;
      }
      largeObj.year = 2024;
      
      const startTime = Date.now();
      const result = isTemporalLike(largeObj);
      const endTime = Date.now();
      
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});