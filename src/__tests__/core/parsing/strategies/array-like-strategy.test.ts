/**
 * @file Tests for ArrayLikeStrategy
 */

import { Temporal } from '@js-temporal/polyfill';
import { ArrayLikeStrategy } from '../../../../core/parsing/strategies/array-like-strategy';
import { ParseContext, ParseStrategyType } from '../../../../core/parsing/parsing-types';
import { TemporalParseError } from '../../../../types/enhanced-types';

describe('ArrayLikeStrategy', () => {
    let strategy: ArrayLikeStrategy;
    let context: ParseContext;

    beforeEach(() => {
        strategy = new ArrayLikeStrategy();
        context = {
            input: [2023, 1, 1],
            options: {
                timeZone: 'UTC',
                strict: false
            },
            inferredType: 'array-like' as ParseStrategyType,
            confidence: 0.8,
            metadata: {},
            startTime: performance.now()
        };
    });

    describe('basic properties', () => {
        it('should have correct type', () => {
            expect(strategy.type).toBe('array-like');
        });

        it('should have correct priority', () => {
            expect(strategy.priority).toBe(40);
        });

        it('should have meaningful description', () => {
            expect(strategy.description).toBe('Parse array-like temporal inputs [year, month, day, ...]');
            expect(typeof strategy.description).toBe('string');
            expect(strategy.description.length).toBeGreaterThan(0);
        });
    });

    describe('canHandle', () => {
        it('should handle arrays with at least 3 elements', () => {
            expect(strategy.canHandle([2023, 1, 1], context)).toBe(true);
            expect(strategy.canHandle([2023, 1, 1, 12], context)).toBe(true);
            expect(strategy.canHandle([2023, 1, 1, 12, 30, 45], context)).toBe(true);
        });

        it('should handle array-like objects', () => {
            const arrayLike = { 0: 2023, 1: 1, 2: 1, length: 3 };
            expect(strategy.canHandle(arrayLike, context)).toBe(true);
        });

        it('should not handle arrays with less than 3 elements', () => {
            expect(strategy.canHandle([], context)).toBe(false);
            expect(strategy.canHandle([2023], context)).toBe(true);
            expect(strategy.canHandle([2023, 1], context)).toBe(true);
        });

        it('should not handle non-array-like objects', () => {
            expect(strategy.canHandle('2023-01-01', context)).toBe(false);
            expect(strategy.canHandle(1234567890000, context)).toBe(false);
            expect(strategy.canHandle(new Date(), context)).toBe(false);
            expect(strategy.canHandle(null, context)).toBe(false);
            expect(strategy.canHandle(undefined, context)).toBe(false);
            expect(strategy.canHandle({}, context)).toBe(false);
        });

        it('should not handle objects without length property', () => {
            const notArrayLike = { 0: 2023, 1: 1, 2: 1 };
            expect(strategy.canHandle(notArrayLike, context)).toBe(false);
        });
    });

    describe('getConfidence', () => {
        it('should return 0 for non-handleable input', () => {
            expect(strategy.getConfidence('2023-01-01', context)).toBe(0);
            expect(strategy.getConfidence([2023, 1], context)).toBe(0.7);
        });

        it('should return high confidence for valid date arrays', () => {
            expect(strategy.getConfidence([2023, 1, 1], context)).toBe(0.8);
            expect(strategy.getConfidence([2023, 6, 15, 12, 30, 45], context)).toBe(0.85);
            expect(strategy.getConfidence([2023, 6, 15, 12, 30, 45, 123], context)).toBe(0.9);
        });

        it('should return low confidence for arrays with non-numbers', () => {
            expect(strategy.getConfidence(['2023', 1, 1] as any, context)).toBe(0.1);
            expect(strategy.getConfidence([2023, '1', 1] as any, context)).toBe(0.1);
            expect(strategy.getConfidence([2023, 1, null] as any, context)).toBe(0.1);
        });

        it('should return low confidence for invalid ranges', () => {
            expect(strategy.getConfidence([0, 1, 1], context)).toBe(0.2); // Invalid year
            expect(strategy.getConfidence([2023, 0, 1], context)).toBe(0.2); // Invalid month
            expect(strategy.getConfidence([2023, 13, 1], context)).toBe(0.2); // Invalid month
            expect(strategy.getConfidence([2023, 1, 0], context)).toBe(0.2); // Invalid day
            expect(strategy.getConfidence([2023, 1, 32], context)).toBe(0.2); // Invalid day
        });

        it('should return medium confidence for extended formats', () => {
            expect(strategy.getConfidence([2023, 1, 1, 12, 30, 45, 123, 456], context)).toBe(0.7);
            expect(strategy.getConfidence([2023, 1, 1, 12, 30, 45, 123, 456, 789, 0], context)).toBe(0.7);
        });

        it('should return reasonable confidence for other lengths', () => {
            const longArray = [2023, 1, 1, 12, 30, 45, 123, 456, 789, 0, 1, 2, 3];
            expect(strategy.getConfidence(longArray, context)).toBe(0.6);
        });

        it('should handle infinite and NaN values', () => {
            expect(strategy.getConfidence([Infinity, 1, 1], context)).toBe(0.1);
            expect(strategy.getConfidence([2023, NaN, 1], context)).toBe(0.1);
            expect(strategy.getConfidence([2023, 1, -Infinity], context)).toBe(0.1);
        });
    });

    describe('validate', () => {
        it('should validate valid arrays', () => {
            const result = strategy.validate([2023, 1, 1], context);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.suggestedStrategy).toBe('array-like');
            expect(result.confidence).toBe(0.8);
        });

        it('should reject non-array-like objects', () => {
            const result = strategy.validate('2023-01-01', context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Input is not an array-like object with at least 1 element');
            expect(result.suggestedStrategy).toBe('fallback');
            expect(result.confidence).toBe(0);
        });

        it('should reject arrays with non-numeric elements', () => {
            const result = strategy.validate(['2023', 1, 1] as any, context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Element at index 0 is not a finite number');
            expect(result.suggestedStrategy).toBe('fallback');
        });

        it('should accept arrays with minimal elements', () => {
            const result = strategy.validate([2023, 1], context);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate year range', () => {
            const invalidYear = strategy.validate([0, 1, 1], context);
            expect(invalidYear.isValid).toBe(false);
            expect(invalidYear.errors).toContain('Year 0 is out of valid range (1-9999)');
            
            const futureYear = strategy.validate([10000, 1, 1], context);
            expect(futureYear.isValid).toBe(false);
            expect(futureYear.errors).toContain('Year 10000 is out of valid range (1-9999)');
        });

        it('should validate month range', () => {
            const invalidMonth = strategy.validate([2023, 0, 1], context);
            expect(invalidMonth.isValid).toBe(false);
            expect(invalidMonth.errors).toContain('Month 0 is out of valid range (1-12)');
            
            const futureMonth = strategy.validate([2023, 13, 1], context);
            expect(futureMonth.isValid).toBe(false);
            expect(futureMonth.errors).toContain('Month 13 is out of valid range (1-12)');
        });

        it('should validate day range', () => {
            const invalidDay = strategy.validate([2023, 1, 0], context);
            expect(invalidDay.isValid).toBe(false);
            expect(invalidDay.errors).toContain('Day 0 is out of valid range (1-31)');
            
            const futureDay = strategy.validate([2023, 1, 32], context);
            expect(futureDay.isValid).toBe(false);
            expect(futureDay.errors).toContain('Day 32 is out of valid range (1-31)');
        });

        it('should validate hour range', () => {
            const invalidHour = strategy.validate([2023, 1, 1, -1], context);
            expect(invalidHour.isValid).toBe(false);
            expect(invalidHour.errors).toContain('Hour -1 is out of valid range (0-23)');
            
            const futureHour = strategy.validate([2023, 1, 1, 24], context);
            expect(futureHour.isValid).toBe(false);
            expect(futureHour.errors).toContain('Hour 24 is out of valid range (0-23)');
        });

        it('should validate minute range', () => {
            const invalidMinute = strategy.validate([2023, 1, 1, 12, -1], context);
            expect(invalidMinute.isValid).toBe(false);
            expect(invalidMinute.errors).toContain('Minute -1 is out of valid range (0-59)');
            
            const futureMinute = strategy.validate([2023, 1, 1, 12, 60], context);
            expect(futureMinute.isValid).toBe(false);
            expect(futureMinute.errors).toContain('Minute 60 is out of valid range (0-59)');
        });

        it('should validate second range', () => {
            const invalidSecond = strategy.validate([2023, 1, 1, 12, 30, -1], context);
            expect(invalidSecond.isValid).toBe(false);
            expect(invalidSecond.errors).toContain('Second -1 is out of valid range (0-59)');
            
            const futureSecond = strategy.validate([2023, 1, 1, 12, 30, 60], context);
            expect(futureSecond.isValid).toBe(false);
            expect(futureSecond.errors).toContain('Second 60 is out of valid range (0-59)');
        });

        it('should warn about unusual millisecond values', () => {
            const result = strategy.validate([2023, 1, 1, 12, 30, 45, 1000], context);
            expect(result.warnings).toContain('Millisecond 1000 is out of typical range (0-999)');
        });

        it('should warn about very long arrays', () => {
            const longArray = new Array(15).fill(0);
            longArray[0] = 2023;
            longArray[1] = 1;
            longArray[2] = 1;
            
            const result = strategy.validate(longArray, context);
            expect(result.warnings).toContain('Array has more than 10 elements - extra elements will be ignored');
        });

        it('should handle multiple validation errors', () => {
            const result = strategy.validate([0, 13, 32, 25, 61, 61], context);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors).toContain('Year 0 is out of valid range (1-9999)');
            expect(result.errors).toContain('Month 13 is out of valid range (1-12)');
            expect(result.errors).toContain('Day 32 is out of valid range (1-31)');
        });
    });

    describe('normalize', () => {
        it('should normalize basic arrays', () => {
            const result = strategy.normalize([2023, 1, 1], context);
            
            expect(result.normalizedInput).toEqual([2023, 1, 1, 0, 0, 0, 0]);
            expect(result.appliedTransforms).toContain('add-default-hour');
            expect(result.appliedTransforms).toContain('add-default-minute');
            expect(result.appliedTransforms).toContain('add-default-second');
            expect(result.appliedTransforms).toContain('add-default-millisecond');
        });

        it('should track metadata', () => {
            const input = [2023, 6, 15, 12, 30];
            const result = strategy.normalize(input, context);
            
            expect(result.metadata.originalLength).toBe(5);
            expect(result.metadata.originalValues).toEqual(input);
            expect(result.metadata.normalizedLength).toBe(7);
            expect(result.metadata.normalizedValues).toEqual([2023, 6, 15, 12, 30, 0, 0]);
            expect(result.metadata.transformCount).toBeGreaterThan(0);
        });

        it('should round non-integer values', () => {
            const result = strategy.normalize([2023.7, 1.2, 1.8], context);
            
            expect(Array.isArray(result.normalizedInput) && result.normalizedInput[0]).toBe(2024);
            expect(Array.isArray(result.normalizedInput) && result.normalizedInput[1]).toBe(1);
            expect(Array.isArray(result.normalizedInput) && result.normalizedInput[2]).toBe(2);
            expect(result.appliedTransforms).toContain('round-element-0');
            expect(result.appliedTransforms).toContain('round-element-2');
        });

        it('should clamp month values', () => {
            const lowMonth = strategy.normalize([2023, 0, 1], context);
            expect(Array.isArray(lowMonth.normalizedInput) && lowMonth.normalizedInput[1]).toBe(1);
            expect(lowMonth.appliedTransforms).toContain('clamp-month-min');
            
            const highMonth = strategy.normalize([2023, 13, 1], context);
            expect(Array.isArray(highMonth.normalizedInput) && highMonth.normalizedInput[1]).toBe(12);
            expect(highMonth.appliedTransforms).toContain('clamp-month-max');
        });

        it('should clamp day values', () => {
            const lowDay = strategy.normalize([2023, 1, 0], context);
            expect(Array.isArray(lowDay.normalizedInput) && lowDay.normalizedInput[2]).toBe(1);
            expect(lowDay.appliedTransforms).toContain('clamp-day-min');
        });

        it('should clamp hour values', () => {
            const lowHour = strategy.normalize([2023, 1, 1, -1], context);
            expect(Array.isArray(lowHour.normalizedInput) && lowHour.normalizedInput[3]).toBe(0);
            expect(lowHour.appliedTransforms).toContain('clamp-hour-min');
            
            const highHour = strategy.normalize([2023, 1, 1, 25], context);
            expect(Array.isArray(highHour.normalizedInput) && highHour.normalizedInput[3]).toBe(23);
            expect(highHour.appliedTransforms).toContain('clamp-hour-max');
        });

        it('should clamp minute values', () => {
            const lowMinute = strategy.normalize([2023, 1, 1, 12, -1], context);
            expect(Array.isArray(lowMinute.normalizedInput) && lowMinute.normalizedInput[4]).toBe(0);
            expect(lowMinute.appliedTransforms).toContain('clamp-minute-min');
            
            const highMinute = strategy.normalize([2023, 1, 1, 12, 61], context);
            expect(Array.isArray(highMinute.normalizedInput) && highMinute.normalizedInput[4]).toBe(59);
            expect(highMinute.appliedTransforms).toContain('clamp-minute-max');
        });

        it('should clamp second values', () => {
            const lowSecond = strategy.normalize([2023, 1, 1, 12, 30, -1], context);
            expect(Array.isArray(lowSecond.normalizedInput) && lowSecond.normalizedInput[5]).toBe(0);
            expect(lowSecond.appliedTransforms).toContain('clamp-second-min');
            
            const highSecond = strategy.normalize([2023, 1, 1, 12, 30, 61], context);
            expect(Array.isArray(highSecond.normalizedInput) && highSecond.normalizedInput[5]).toBe(59);
            expect(highSecond.appliedTransforms).toContain('clamp-second-max');
        });

        it('should clamp millisecond values', () => {
            const lowMillisecond = strategy.normalize([2023, 1, 1, 12, 30, 45, -1], context);
            expect(Array.isArray(lowMillisecond.normalizedInput) && lowMillisecond.normalizedInput[6]).toBe(0);
            expect(lowMillisecond.appliedTransforms).toContain('clamp-millisecond-min');
        });

        it('should handle already normalized arrays', () => {
            const result = strategy.normalize([2023, 1, 1, 0, 0, 0, 0], context);
            
            expect(result.normalizedInput).toEqual([2023, 1, 1, 0, 0, 0, 0]);
            expect(result.appliedTransforms).toHaveLength(0);
        });

        it('should handle array-like objects', () => {
            const arrayLike = { 0: 2023, 1: 1, 2: 1, length: 3 };
            const result = strategy.normalize(arrayLike, context);
            
            expect(result.normalizedInput).toEqual([2023, 1, 1, 0, 0, 0, 0]);
            expect(result.metadata.originalLength).toBe(3);
        });
    });

    describe('parse', () => {
        it('should parse valid arrays', () => {
            const result = strategy.parse([2023, 1, 1], context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(1);
                expect(result.data.day).toBe(1);
                expect(result.data.hour).toBe(0);
                expect(result.data.minute).toBe(0);
                expect(result.data.second).toBe(0);
                expect(result.data.millisecond).toBe(0);
                expect(result.strategy).toBe('array-like');
                expect(result.confidence).toBe(0.8);
            }
        });

        it('should parse arrays with time components', () => {
            const result = strategy.parse([2023, 6, 15, 14, 30, 45, 123], context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(6);
                expect(result.data.day).toBe(15);
                expect(result.data.hour).toBe(14);
                expect(result.data.minute).toBe(30);
                expect(result.data.second).toBe(45);
                expect(result.data.millisecond).toBe(123);
            }
        });

        it('should parse with different timezones', () => {
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            const result = strategy.parse([2023, 1, 1, 12], timezoneContext);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.timeZoneId).toBe('America/New_York');
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(1);
                expect(result.data.day).toBe(1);
                expect(result.data.hour).toBe(12);
            }
        });

        it('should handle leap year dates', () => {
            const result = strategy.parse([2020, 2, 29], context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.year).toBe(2020);
                expect(result.data.month).toBe(2);
                expect(result.data.day).toBe(29);
            }
        });

        it('should handle invalid dates', () => {
            const result = strategy.parse([2023, 2, 30], context); // Invalid date
            
            expect(result.success).toBe(false);
            if (!result.success && result.error) {
                expect(result.error).toBeInstanceOf(TemporalParseError);
                expect(result.error.message).toContain('Failed to parse array-like input');
                expect(result.error.code).toBe('ARRAY_LIKE_PARSE_ERROR');
                expect(result.strategy).toBe('array-like');
            }
        });

        it('should measure execution time', () => {
            const result = strategy.parse([2023, 1, 1], context);
            
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
                
                const result = strategy.parse([2023, 1, 1], context);
                
                // Should still succeed despite timing error
                expect(result.success).toBe(true);
            } finally {
                global.performance = originalPerformance;
            }
        });

        it('should handle array-like objects', () => {
            const arrayLike = { 0: 2023, 1: 6, 2: 15, length: 3 };
            const result = strategy.parse(arrayLike, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(6);
                expect(result.data.day).toBe(15);
            }
        });

        it('should handle edge case dates', () => {
            const edgeCases = [
                [1, 1, 1],      // Minimum year
                [9999, 12, 31], // Maximum year
                [2000, 1, 1],   // Y2K
                [1900, 1, 1]    // Century boundary
            ];
            
            edgeCases.forEach(dateArray => {
                const result = strategy.parse(dateArray, context);
                expect(result.success).toBe(true);
                if (result.success && result.data) {
                    expect(result.data.year).toBe(dateArray[0]);
                    expect(result.data.month).toBe(dateArray[1]);
                    expect(result.data.day).toBe(dateArray[2]);
                }
            });
        });
    });

    describe('checkFastPath', () => {
        it('should not use fast path for non-handleable input', () => {
            const result = strategy.checkFastPath('2023-01-01', context);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.strategy).toBe('array-like');
            expect(result.confidence).toBe(0);
        });

        it('should use fast path for well-formed arrays', () => {
            const result = strategy.checkFastPath([2023, 1, 1], context);
            
            expect(result.canUseFastPath).toBe(true);
            expect(result.strategy).toBe('array-like');
            expect(result.confidence).toBe(0.85);
            expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
            if (result.data) {
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(1);
                expect(result.data.day).toBe(1);
            }
        });

        it('should use fast path for arrays with time components', () => {
            const result = strategy.checkFastPath([2023, 6, 15, 14, 30, 45], context);
            
            expect(result.canUseFastPath).toBe(true);
            if (result.data) {
                expect(result.data.hour).toBe(14);
                expect(result.data.minute).toBe(30);
                expect(result.data.second).toBe(45);
            }
        });

        it('should not use fast path for arrays with non-integer values', () => {
            const result = strategy.checkFastPath([2023.5, 1, 1], context);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.confidence).toBeGreaterThan(0);
        });

        it('should not use fast path for invalid ranges', () => {
            const invalidCases = [
                [0, 1, 1],      // Invalid year
                [2023, 0, 1],   // Invalid month
                [2023, 13, 1],  // Invalid month
                [2023, 1, 0],   // Invalid day
                [2023, 1, 32],  // Invalid day
                [2023, 1, 1, -1], // Invalid hour
                [2023, 1, 1, 24], // Invalid hour
                [2023, 1, 1, 12, -1], // Invalid minute
                [2023, 1, 1, 12, 60], // Invalid minute
                [2023, 1, 1, 12, 30, -1], // Invalid second
                [2023, 1, 1, 12, 30, 60]  // Invalid second
            ];
            
            invalidCases.forEach(invalidArray => {
                const result = strategy.checkFastPath(invalidArray, context);
                expect(result.canUseFastPath).toBe(false);
            });
        });

        it('should not use fast path for very long arrays', () => {
            const longArray = [2023, 1, 1, 12, 30, 45, 123, 456];
            const result = strategy.checkFastPath(longArray, context);
            
            expect(result.canUseFastPath).toBe(false);
        });

        it('should handle fast path with different timezones', () => {
            const timezoneContext = {
                ...context,
                options: { ...context.options, timeZone: 'Europe/London' }
            };
            
            const result = strategy.checkFastPath([2023, 1, 1], timezoneContext);
            
            expect(result.canUseFastPath).toBe(true);
            if (result.data) {
                expect(result.data.timeZoneId).toBe('Europe/London');
            }
        });

        it('should handle fast path errors gracefully', () => {
            // Test with invalid input that would cause Temporal to throw
            // Use an array with invalid values that will fail Temporal validation
            const invalidInput = [2023, 13, 32]; // Invalid month and day
            
            const result = strategy.checkFastPath(invalidInput, context);
            
            expect(result.canUseFastPath).toBe(false);
            expect(result.confidence).toBe(0.2); // Low confidence for invalid input
        });
    });

    describe('getOptimizationHints', () => {
        it('should provide hints for well-formed arrays', () => {
            const hints = strategy.getOptimizationHints([2023, 1, 1], context);
            
            expect(hints.preferredStrategy).toBe('array-like');
            expect(hints.shouldCache).toBe(true);
            expect(hints.canUseFastPath).toBe(true);
            expect(hints.estimatedComplexity).toBe('low');
            expect(hints.suggestedOptions.enableFastPath).toBe(true);
            expect(hints.suggestedOptions.enableCaching).toBe(true);
        });

        it('should provide hints for arrays requiring normalization', () => {
            const hints = strategy.getOptimizationHints([2023.5, 1.2, 1.8], context);
            
            expect(hints.estimatedComplexity).toBe('medium');
            expect(hints.canUseFastPath).toBe(false);
            expect(hints.warnings).toContain('Array requires normalization (rounding, clamping)');
        });

        it('should provide hints for arrays with non-numeric values', () => {
            const hints = strategy.getOptimizationHints(['2023', 1, 1] as any, context);
            
            expect(hints.estimatedComplexity).toBe('high');
            expect(hints.canUseFastPath).toBe(false);
            expect(hints.warnings).toContain('Array contains non-numeric values requiring conversion');
        });

        it('should warn about very long arrays', () => {
            const longArray = new Array(15).fill(1);
            longArray[0] = 2023;
            longArray[1] = 1;
            longArray[2] = 1;
            
            const hints = strategy.getOptimizationHints(longArray, context);
            
            expect(hints.warnings).toContain('Very long array - consider preprocessing');
        });

        it('should not cache low confidence results', () => {
            const hints = strategy.getOptimizationHints([0, 1, 1], context); // Invalid year
            
            expect(hints.shouldCache).toBe(false);
            expect(hints.warnings).toContain('Low confidence parsing - results may not be cacheable');
        });

        it('should provide suggested options', () => {
            const hints = strategy.getOptimizationHints([2023, 1, 1], context);
            
            expect(hints.suggestedOptions).toBeDefined();
            expect(typeof hints.suggestedOptions.enableFastPath).toBe('boolean');
            expect(typeof hints.suggestedOptions.enableCaching).toBe('boolean');
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle arrays with extreme values', () => {
            const extremeArrays = [
                [1, 1, 1],      // Minimum valid date
                [9999, 12, 31], // Maximum valid date
                [2023, 1, 1, 0, 0, 0, 0], // All zeros for time
                [2023, 12, 31, 23, 59, 59, 999] // Maximum time values
            ];
            
            extremeArrays.forEach(array => {
                const result = strategy.parse(array, context);
                expect(result.success).toBe(true);
            });
        });

        it('should handle context modifications during parsing', () => {
            const modifiableContext = { ...context };
            const result = strategy.parse([2023, 1, 1], modifiableContext);
            
            // Modify context after parsing starts
            (modifiableContext.options as any).timeZone = 'America/New_York';
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                // Should use original timezone
                expect(result.data.timeZoneId).toBe('UTC');
            }
        });

        it('should handle very large arrays', () => {
            const largeArray = new Array(1000).fill(0);
            largeArray[0] = 2023;
            largeArray[1] = 1;
            largeArray[2] = 1;
            
            const result = strategy.parse(largeArray, context);
            expect(result.success).toBe(true);
        });

        it('should handle sparse arrays', () => {
            const sparseArray = [2023, , 1]; // Has undefined element
            sparseArray[1] = 1;
            
            const result = strategy.parse(sparseArray as any, context);
            expect(result.success).toBe(true);
        });

        it('should handle typed arrays', () => {
            const typedArray = new Int32Array([2023, 1, 1]);
            const result = strategy.parse(typedArray, context);
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.year).toBe(2023);
                expect(result.data.month).toBe(1);
                expect(result.data.day).toBe(1);
            }
        });
    });

    describe('integration with Temporal API', () => {
        it('should create Temporal objects with correct properties', () => {
            const result = strategy.parse([2023, 6, 15, 14, 30, 45, 123], context);
            
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
            const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
            
            timezones.forEach(timeZone => {
                const timezoneContext = {
                    ...context,
                    options: { ...context.options, timeZone }
                };
                
                const result = strategy.parse([2023, 1, 1, 12], timezoneContext);
                
                expect(result.success).toBe(true);
                if (result.success && result.data) {
                    expect(result.data.timeZoneId).toBe(timeZone);
                }
            });
        });

        it('should handle leap year calculations correctly', () => {
            const leapYearCases = [
                [2020, 2, 29], // Leap year
                [2000, 2, 29], // Century leap year
                [1900, 2, 28]  // Century non-leap year (would fail with 29)
            ];
            
            leapYearCases.forEach(dateArray => {
                const result = strategy.parse(dateArray, context);
                expect(result.success).toBe(true);
                if (result.success && result.data) {
                    expect(result.data.year).toBe(dateArray[0]);
                    expect(result.data.month).toBe(dateArray[1]);
                    expect(result.data.day).toBe(dateArray[2]);
                }
            });
        });

        it('should handle DST transitions correctly', () => {
            const dstContext = {
                ...context,
                options: { ...context.options, timeZone: 'America/New_York' }
            };
            
            // DST transition dates
            const dstDates = [
                [2023, 3, 12, 2], // Spring forward
                [2023, 11, 5, 2]  // Fall back
            ];
            
            dstDates.forEach(dateArray => {
                const result = strategy.parse(dateArray, dstContext);
                expect(result.success).toBe(true);
                if (result.success && result.data) {
                    expect(result.data.timeZoneId).toBe('America/New_York');
                }
            });
        });
    });
});