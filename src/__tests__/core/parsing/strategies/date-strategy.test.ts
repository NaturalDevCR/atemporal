/**
 * @file Tests for DateParseStrategy
 */

import { Temporal } from '@js-temporal/polyfill';
import { DateParseStrategy } from '../../../../core/parsing/strategies/date-strategy';
import type { ParseContext, ParseStrategyType } from '../../../../core/parsing/parsing-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('DateParseStrategy', () => {
    let strategy: DateParseStrategy;
    let context: ParseContext;

    beforeEach(() => {
        strategy = new DateParseStrategy();
        context = {
            input: null,
            inferredType: 'date' as ParseStrategyType,
            confidence: 0,
            startTime: Date.now(),
            options: {
                timeZone: 'UTC',
                strict: false
            },
            metadata: {}
        };
    });

    describe('basic properties', () => {
        it('should have correct type', () => {
            expect(strategy.type).toBe('date');
        });

        it('should have correct priority', () => {
            expect(strategy.priority).toBe(70);
        });

        it('should have meaningful description', () => {
            expect(strategy.description).toBe('Parse JavaScript Date objects');
            expect(typeof strategy.description).toBe('string');
            expect(strategy.description.length).toBeGreaterThan(0);
        });
    });

    describe('canHandle', () => {
        it('should handle Date objects', () => {
            const date = new Date();
            expect(strategy.canHandle(date, context)).toBe(true);
        });

        it('should handle invalid Date objects', () => {
            const invalidDate = new Date('invalid');
            expect(strategy.canHandle(invalidDate, context)).toBe(true);
        });

        it('should not handle non-Date objects', () => {
            expect(strategy.canHandle('2023-01-01', context)).toBe(false);
            expect(strategy.canHandle(1234567890000, context)).toBe(false);
            expect(strategy.canHandle(null, context)).toBe(false);
            expect(strategy.canHandle(undefined, context)).toBe(false);
            expect(strategy.canHandle({}, context)).toBe(false);
            expect(strategy.canHandle([], context)).toBe(false);
        });
    });

    describe('getConfidence', () => {
        it('should return 0 for non-handleable input', () => {
            expect(strategy.getConfidence('2023-01-01', context)).toBe(0);
            expect(strategy.getConfidence(1234567890000, context)).toBe(0);
        });

        it('should return high confidence for valid dates', () => {
            const validDate = new Date('2023-01-01T12:00:00Z');
            const confidence = strategy.getConfidence(validDate, context);
            expect(confidence).toBe(0.95);
        });

        it('should return very low confidence for invalid dates', () => {
            const invalidDate = new Date('invalid');
            const confidence = strategy.getConfidence(invalidDate, context);
            expect(confidence).toBe(0.1);
        });

        it('should return high confidence for edge case dates', () => {
            const epochDate = new Date(0);
            const confidence = strategy.getConfidence(epochDate, context);
            expect(confidence).toBe(0.95);
        });
    });

    describe('validate', () => {
        it('should validate valid Date objects', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.validate(date, context);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.suggestedStrategy).toBe('date');
            expect(result.confidence).toBe(0.95);
        });

        it('should reject non-Date objects', () => {
            const result = strategy.validate('2023-01-01', context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Input is not a Date object');
            expect(result.suggestedStrategy).toBe('fallback');
            expect(result.confidence).toBe(0);
        });

        it('should reject invalid Date objects', () => {
            const invalidDate = new Date('invalid');
            const result = strategy.validate(invalidDate, context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Date object is invalid (NaN timestamp)');
        });

        it('should warn about epoch date', () => {
            const epochDate = new Date(0);
            const result = strategy.validate(epochDate, context);
            
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Date represents Unix epoch (1970-01-01)');
        });

        it('should warn about very old dates', () => {
            const oldDate = new Date('1850-01-01');
            const result = strategy.validate(oldDate, context);
            
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Date represents a year before 1900');
        });

        it('should warn about far future dates', () => {
            const futureDate = new Date('2150-01-01');
            const result = strategy.validate(futureDate, context);
            
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Date represents a year after 2100');
        });

        it('should warn about unusual timezone offsets', () => {
            // Create a date with unusual timezone offset by mocking getTimezoneOffset
            const date = new Date('2023-01-01T12:00:00Z');
            jest.spyOn(date, 'getTimezoneOffset').mockReturnValue(15 * 60); // 15 hours
            
            const result = strategy.validate(date, context);
            
            expect(result.warnings).toContain('Date has unusual timezone offset');
            
            jest.restoreAllMocks();
        });

        it('should perform normalization during validation', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.validate(date, context);
            
            expect(result.normalizedInput).toEqual(date);
        });
    });

    describe('normalize', () => {
        it('should normalize Date objects', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.normalize(date, context);
            
            expect(result.normalizedInput).toBeInstanceOf(Date);
            expect((result.normalizedInput as Date).getTime()).toBe(date.getTime());
            expect(result.appliedTransforms).toEqual([]);
        });

        it('should track metadata', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.normalize(date, context);
            
            expect(result.metadata.originalTimestamp).toBe(date.getTime());
            expect(result.metadata.originalTimezoneOffset).toBe(date.getTimezoneOffset());
            expect(result.metadata.originalYear).toBe(date.getFullYear());
            expect(result.metadata.originalMonth).toBe(date.getMonth());
            expect(result.metadata.originalDate).toBe(date.getDate());
            expect(result.metadata.normalizedTimestamp).toBe(date.getTime());
            expect(result.metadata.transformCount).toBe(0);
        });

        it('should handle timezone-aware normalization', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.normalize(date, timezoneContext);
            
            expect(result.appliedTransforms).toContain('timezone-aware');
            expect(result.metadata.targetTimezone).toBe('America/New_York');
            expect(result.metadata.transformCount).toBe(1);
        });

        it('should create a clean copy of the date', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.normalize(date, context);
            
            expect(result.normalizedInput).not.toBe(date); // Different object
            expect((result.normalizedInput as Date).getTime()).toBe(date.getTime()); // Same value
        });
    });

    describe('parse', () => {
        it('should parse valid Date objects', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.parse(date, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(result.data.epochMilliseconds).toBe(date.getTime());
                expect(result.strategy).toBe('date');
                expect(result.confidence).toBe(0.95);
                expect(result.executionTime).toBeGreaterThan(0);
            }
        });

        it('should parse dates with different timezones', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.parse(date, timezoneContext);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.timeZoneId).toBe('America/New_York');
                expect(result.data.epochMilliseconds).toBe(date.getTime());
            }
        });

        it('should handle epoch date', () => {
            const epochDate = new Date(0);
            const result = strategy.parse(epochDate, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.epochMilliseconds).toBe(0);
                expect(result.data.year).toBe(1970);
                expect(result.data.month).toBe(1);
                expect(result.data.day).toBe(1);
            }
        });

        it('should handle invalid Date objects', () => {
            const invalidDate = new Date('invalid');
            const result = strategy.parse(invalidDate, context);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(TemporalParseError);
                expect(result.error?.message).toContain('Failed to parse Date');
                expect(result.error?.code).toBe('DATE_PARSE_ERROR');
                expect(result.strategy).toBe('date');
                expect(result.executionTime).toBeGreaterThan(0);
            }
        });

        it('should measure execution time', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.parse(date, context);
            
            expect(result.executionTime).toBeGreaterThan(0);
            expect(typeof result.executionTime).toBe('number');
        });

        it('should handle performance timing errors gracefully', () => {
            const originalPerformance = global.performance;
            
            try {
                global.performance = {
                    ...originalPerformance,
                    now: jest.fn().mockImplementation(() => {
                        throw new Error('Performance API error');
                    })
                };
                
                const date = new Date('2023-01-01T12:00:00Z');
                const result = strategy.parse(date, context);
                
                // Should still succeed despite timing error
                expect(result.success).toBe(true);
            } finally {
                global.performance = originalPerformance;
            }
        });

        it('should preserve confidence score', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.parse(date, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.confidence).toBe(0.95);
            }
        });

        it('should handle edge case dates', () => {
            const edgeDates = [
                new Date('1900-01-01T00:00:00Z'),
                new Date('2099-12-31T23:59:59Z'),
                new Date('2000-02-29T12:00:00Z'), // Leap year
                new Date('1999-12-31T23:59:59Z')  // Y2K
            ];
            
            edgeDates.forEach(date => {
                const result = strategy.parse(date, context);
                expect(result.success).toBe(true);
                if (result.success && result.data) {
                    expect(result.data.epochMilliseconds).toBe(date.getTime());
                }
            });
        });
    });

    describe('checkFastPath', () => {
        it('should not use fast path for non-handleable input', () => {
            const result = strategy.checkFastPath('2023-01-01', context);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.strategy).toBe('date');
            expect(result.confidence).toBe(0);
        });

        it('should use fast path for valid dates', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const result = strategy.checkFastPath(date, context);
            
            expect(result.canUseFastPath).toBe(true);
            expect(result.strategy).toBe('date');
            expect(result.confidence).toBe(0.95);
            expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
            if (result.data) {
                expect(result.data.epochMilliseconds).toBe(date.getTime());
            }
        });

        it('should not use fast path for invalid dates', () => {
            const invalidDate = new Date('invalid');
            const result = strategy.checkFastPath(invalidDate, context);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.strategy).toBe('date');
            expect(result.confidence).toBe(0.1);
        });

        it('should handle fast path with different timezones', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.checkFastPath(date, timezoneContext);
            
            expect(result.canUseFastPath).toBe(true);
            if (result.data) {
                expect(result.data.timeZoneId).toBe('America/New_York');
            }
        });

        it('should handle fast path errors gracefully', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            
            // Mock Temporal to throw an error
            const originalFromEpochMilliseconds = Temporal.Instant.fromEpochMilliseconds;
            Temporal.Instant.fromEpochMilliseconds = jest.fn().mockImplementation(() => {
                throw new Error('Temporal error');
            });
            
            const result = strategy.checkFastPath(date, context);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.confidence).toBe(0.95); // Should still return correct confidence
            
            // Restore original method
            Temporal.Instant.fromEpochMilliseconds = originalFromEpochMilliseconds;
        });
    });

    describe('getOptimizationHints', () => {
        it('should provide hints for valid dates', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const hints = strategy.getOptimizationHints(date, context);
            
            expect(hints.preferredStrategy).toBe('date');
            expect(hints.shouldCache).toBe(true);
            expect(hints.canUseFastPath).toBe(true);
            expect(hints.estimatedComplexity).toBe('low');
            expect(hints.suggestedOptions.enableFastPath).toBe(true);
            expect(hints.suggestedOptions.enableCaching).toBe(true);
        });

        it('should provide hints for invalid dates', () => {
            const invalidDate = new Date('invalid');
            const hints = strategy.getOptimizationHints(invalidDate, context);
            
            expect(hints.preferredStrategy).toBe('date');
            expect(hints.shouldCache).toBe(false);
            expect(hints.canUseFastPath).toBe(false);
            expect(hints.estimatedComplexity).toBe('high');
            expect(hints.warnings).toContain('Invalid Date object requires error handling');
            expect(hints.warnings).toContain('Invalid dates should not be cached');
        });

        it('should handle timezone complexity', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const hints = strategy.getOptimizationHints(date, timezoneContext);
            
            expect(hints.estimatedComplexity).toBe('medium');
            expect(hints.warnings).toContain('Timezone conversion adds complexity');
        });

        it('should not cache recent dates', () => {
            const recentDate = new Date(Date.now() - 500); // 500ms ago
            const hints = strategy.getOptimizationHints(recentDate, context);
            
            expect(hints.shouldCache).toBe(false);
            expect(hints.warnings).toContain('Recent dates may not benefit from caching');
        });

        it('should not cache low confidence results', () => {
            const invalidDate = new Date('invalid');
            const hints = strategy.getOptimizationHints(invalidDate, context);
            
            expect(hints.shouldCache).toBe(false);
            expect(hints.warnings).toContain('Low confidence parsing - results may not be cacheable');
        });

        it('should provide suggested options', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const hints = strategy.getOptimizationHints(date, context);
            
            expect(hints.suggestedOptions).toBeDefined();
            expect(typeof hints.suggestedOptions.enableFastPath).toBe('boolean');
            expect(typeof hints.suggestedOptions.enableCaching).toBe('boolean');
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle Date objects with extreme values', () => {
            const extremeDates = [
                new Date(-8640000000000000), // Min safe date
                new Date(8640000000000000),  // Max safe date
                new Date(Number.MAX_SAFE_INTEGER),
                new Date(Number.MIN_SAFE_INTEGER)
            ];
            
            extremeDates.forEach(date => {
                if (!isNaN(date.getTime())) {
                    const result = strategy.parse(date, context);
                    expect(result.success).toBe(true);
                }
            });
        });

        it('should handle context modifications during parsing', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const modifiableContext = { ...context };
            
            const result = strategy.parse(date, modifiableContext);
            
            // Modify context after parsing starts
            (modifiableContext.options as any).timeZone = 'America/New_York';
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                // Should use original timezone
                expect(result.data.timeZoneId).toBe('UTC');
            }
        });

        it('should handle leap year dates correctly', () => {
            const leapYearDate = new Date('2020-02-29T12:00:00Z');
            const result = strategy.parse(leapYearDate, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.month).toBe(2);
                expect(result.data.day).toBe(29);
                expect(result.data.year).toBe(2020);
            }
        });

        it('should handle DST transition dates', () => {
            const dstDate = new Date('2023-03-12T07:00:00Z'); // DST transition in US
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.parse(dstDate, timezoneContext);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.timeZoneId).toBe('America/New_York');
            }
        });
    });

    describe('integration with Temporal API', () => {
        it('should create Temporal objects with correct properties', () => {
            const date = new Date('2023-06-15T14:30:45.123Z');
            const result = strategy.parse(date, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(6);
                expect(result.data.day).toBe(15);
                expect(result.data.hour).toBe(14);
                expect(result.data.minute).toBe(30);
                expect(result.data.second).toBe(45);
                expect(result.data.millisecond).toBe(123);
                expect(result.data.timeZoneId).toBe('UTC');
            }
        });

        it('should preserve timezone information', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
            
            timezones.forEach(timeZone => {
                const timezoneContext = {
                    ...context,
                    options: { ...context.options, timeZone }
                };
                
                const result = strategy.parse(date, timezoneContext);
                
                expect(result.success).toBe(true);
                if (result.success && result.data) {
                    expect(result.data.timeZoneId).toBe(timeZone);
                    expect(result.data.epochMilliseconds).toBe(date.getTime());
                }
            });
        });
    });
});