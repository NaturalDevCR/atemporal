/**
 * @file Test suite for comparison types and constants
 * Tests type definitions, constants, and utility functions
 */

import { Temporal } from '@js-temporal/polyfill';
import {
    TIME_UNIT_FACTORS,
    COMPARISON_THRESHOLDS,
    PRECISION_LEVELS,
    type TimeUnit,
    type ComparisonType,
    type ComparisonResult,
    type ComparisonOptions,
    type ComparisonMetrics,
    type ComparisonContext,
    type ComparisonStrategy,
    type FastPathResult,
    type DiffOptions,
    type DurationBreakdown,
    type OptimizationHints,
    type ComparisonCacheEntry,
    type ComparisonProfile
} from '../../../core/comparison/comparison-types';

describe('Comparison Types and Constants', () => {
    describe('TIME_UNIT_FACTORS', () => {
        it('should have correct time unit conversion factors', () => {
            expect(TIME_UNIT_FACTORS.nanosecond).toBe(1);
            expect(TIME_UNIT_FACTORS.microsecond).toBe(1000);
            expect(TIME_UNIT_FACTORS.millisecond).toBe(1000000);
            expect(TIME_UNIT_FACTORS.second).toBe(1000000000);
            expect(TIME_UNIT_FACTORS.minute).toBe(60 * 1000000000);
            expect(TIME_UNIT_FACTORS.hour).toBe(60 * 60 * 1000000000);
            expect(TIME_UNIT_FACTORS.day).toBe(24 * 60 * 60 * 1000000000);
        });

        it('should have all required time units', () => {
            const expectedUnits: TimeUnit[] = [
                'nanosecond', 'microsecond', 'millisecond', 'second',
                'minute', 'hour', 'day', 'week', 'month', 'year'
            ];
            
            expectedUnits.forEach(unit => {
                expect(TIME_UNIT_FACTORS).toHaveProperty(unit);
                expect(typeof TIME_UNIT_FACTORS[unit]).toBe('number');
                expect(TIME_UNIT_FACTORS[unit]).toBeGreaterThan(0);
            });
        });

        it('should have increasing factors for larger units', () => {
            expect(TIME_UNIT_FACTORS.microsecond).toBeGreaterThan(TIME_UNIT_FACTORS.nanosecond);
            expect(TIME_UNIT_FACTORS.millisecond).toBeGreaterThan(TIME_UNIT_FACTORS.microsecond);
            expect(TIME_UNIT_FACTORS.second).toBeGreaterThan(TIME_UNIT_FACTORS.millisecond);
            expect(TIME_UNIT_FACTORS.minute).toBeGreaterThan(TIME_UNIT_FACTORS.second);
            expect(TIME_UNIT_FACTORS.hour).toBeGreaterThan(TIME_UNIT_FACTORS.minute);
            expect(TIME_UNIT_FACTORS.day).toBeGreaterThan(TIME_UNIT_FACTORS.hour);
        });
    });

    describe('COMPARISON_THRESHOLDS', () => {
        it('should have time-based thresholds', () => {
            expect(typeof COMPARISON_THRESHOLDS.SAME_INSTANT_NS).toBe('number');
            expect(typeof COMPARISON_THRESHOLDS.SAME_SECOND_NS).toBe('number');
            expect(typeof COMPARISON_THRESHOLDS.SAME_MINUTE_NS).toBe('number');
            expect(typeof COMPARISON_THRESHOLDS.SAME_HOUR_NS).toBe('number');
            expect(typeof COMPARISON_THRESHOLDS.SAME_DAY_NS).toBe('number');
            expect(typeof COMPARISON_THRESHOLDS.FAST_PATH_MAX_DIFF_DAYS).toBe('number');
            expect(typeof COMPARISON_THRESHOLDS.CACHE_WORTHINESS_THRESHOLD_NS).toBe('number');
            
            expect(COMPARISON_THRESHOLDS.SAME_INSTANT_NS).toBe(0);
            expect(COMPARISON_THRESHOLDS.SAME_SECOND_NS).toBe(1000000000);
            expect(COMPARISON_THRESHOLDS.SAME_MINUTE_NS).toBe(60000000000);
            expect(COMPARISON_THRESHOLDS.SAME_HOUR_NS).toBe(3600000000000);
            expect(COMPARISON_THRESHOLDS.SAME_DAY_NS).toBe(86400000000000);
        });

        it('should have logical threshold values', () => {
            // Thresholds should be in increasing order
            expect(COMPARISON_THRESHOLDS.SAME_SECOND_NS).toBeGreaterThan(COMPARISON_THRESHOLDS.SAME_INSTANT_NS);
            expect(COMPARISON_THRESHOLDS.SAME_MINUTE_NS).toBeGreaterThan(COMPARISON_THRESHOLDS.SAME_SECOND_NS);
            expect(COMPARISON_THRESHOLDS.SAME_HOUR_NS).toBeGreaterThan(COMPARISON_THRESHOLDS.SAME_MINUTE_NS);
            expect(COMPARISON_THRESHOLDS.SAME_DAY_NS).toBeGreaterThan(COMPARISON_THRESHOLDS.SAME_HOUR_NS);
            
            // Fast path should handle reasonable time differences
            expect(COMPARISON_THRESHOLDS.FAST_PATH_MAX_DIFF_DAYS).toBeGreaterThan(365); // At least 1 year
            
            // Cache threshold should be reasonable (1ms in nanoseconds)
            expect(COMPARISON_THRESHOLDS.CACHE_WORTHINESS_THRESHOLD_NS).toBe(1000000);
        });
    });

    describe('PRECISION_LEVELS', () => {
        it('should have precision level definitions', () => {
            expect(typeof PRECISION_LEVELS.exact).toBe('object');
            expect(typeof PRECISION_LEVELS.truncated).toBe('object');
            expect(typeof PRECISION_LEVELS.rounded).toBe('object');
            
            expect(PRECISION_LEVELS.exact.description).toBe('Exact nanosecond precision');
            expect(PRECISION_LEVELS.exact.tolerance).toBe(0);
            expect(PRECISION_LEVELS.truncated.description).toBe('Truncated to specified unit');
            expect(PRECISION_LEVELS.truncated.tolerance).toBe('unit-dependent');
            expect(PRECISION_LEVELS.rounded.description).toBe('Rounded to nearest unit');
            expect(PRECISION_LEVELS.rounded.tolerance).toBe('unit-dependent');
        });

        it('should have valid precision level structure', () => {
            Object.values(PRECISION_LEVELS).forEach(level => {
                expect(level).toHaveProperty('description');
                expect(level).toHaveProperty('tolerance');
                expect(typeof level.description).toBe('string');
            });
        });
    });

    describe('Type Definitions', () => {
        it('should accept valid TimeUnit values', () => {
            const validUnits: TimeUnit[] = [
                'nanosecond', 'microsecond', 'millisecond', 'second',
                'minute', 'hour', 'day', 'week', 'month', 'year'
            ];
            
            validUnits.forEach(unit => {
                const testUnit: TimeUnit = unit;
                expect(typeof testUnit).toBe('string');
            });
        });

        it('should accept valid ComparisonType values', () => {
            const validTypes: ComparisonType[] = [
                'isBefore', 'isAfter', 'isSame', 'isSameOrBefore', 'isSameOrAfter', 'diff'
            ];
            
            validTypes.forEach(type => {
                const testType: ComparisonType = type;
                expect(typeof testType).toBe('string');
            });
        });

        it('should create valid ComparisonResult objects', () => {
            const result: ComparisonResult = {
                result: true,
                type: 'isBefore',
                precision: 'exact',
                cached: false,
                computeTime: 1.5
            };
            
            expect(typeof result.result).toBe('boolean');
            expect(typeof result.type).toBe('string');
            expect(typeof result.precision).toBe('string');
            expect(typeof result.cached).toBe('boolean');
            expect(typeof result.computeTime).toBe('number');
        });

        it('should create valid ComparisonOptions objects', () => {
            const options: ComparisonOptions = {
                unit: 'day',
                useCache: true,
                precision: 'rounded',
                roundingMode: 'halfExpand'
            };
            
            expect(typeof options.unit).toBe('string');
            expect(typeof options.useCache).toBe('boolean');
            expect(typeof options.precision).toBe('string');
            expect(typeof options.roundingMode).toBe('string');
        });

        it('should create valid ComparisonMetrics objects', () => {
            const metrics: ComparisonMetrics = {
                totalComparisons: 1000,
                cacheHits: 600,
                cacheMisses: 400,
                averageComputeTime: 2.5,
                fastPathHits: 300,
                operationBreakdown: {
                    isBefore: 300,
                    isAfter: 250,
                    isSame: 200,
                    isSameOrBefore: 150,
                    isSameOrAfter: 100,
                    diff: 0,
                    isBetween: 50,
                    duration: 25
                },
                unitBreakdown: {
                    nanosecond: 50,
                    nanoseconds: 50,
                    microsecond: 75,
                    microseconds: 75,
                    millisecond: 100,
                    milliseconds: 100,
                    second: 150,
                    seconds: 150,
                    minute: 200,
                    minutes: 200,
                    hour: 175,
                    hours: 175,
                    day: 150,
                    days: 150,
                    week: 50,
                    weeks: 50,
                    month: 30,
                    months: 30,
                    year: 20,
                    years: 20
                }
            };
            
            expect(typeof metrics.totalComparisons).toBe('number');
            expect(typeof metrics.cacheHits).toBe('number');
            expect(typeof metrics.cacheMisses).toBe('number');
            expect(typeof metrics.averageComputeTime).toBe('number');
            expect(typeof metrics.fastPathHits).toBe('number');
            expect(typeof metrics.operationBreakdown).toBe('object');
            expect(typeof metrics.unitBreakdown).toBe('object');
        });

        it('should create valid OptimizationHints objects', () => {
            const hints: OptimizationHints = {
                sameTimeZone: true,
                sameCalendar: true,
                sameYear: true,
                sameMonth: true,
                sameDay: false,
                orderOfMagnitude: 'days'
            };
            
            expect(typeof hints.sameTimeZone).toBe('boolean');
            expect(typeof hints.sameCalendar).toBe('boolean');
            expect(typeof hints.sameYear).toBe('boolean');
            expect(typeof hints.sameMonth).toBe('boolean');
            expect(typeof hints.sameDay).toBe('boolean');
            expect(typeof hints.orderOfMagnitude).toBe('string');
        });

        it('should create valid ComparisonCacheEntry objects', () => {
            const mockResult: ComparisonResult = {
                result: true,
                type: 'isBefore',
                precision: 'exact',
                cached: false,
                computeTime: 1.5
            };
            
            const entry: ComparisonCacheEntry = {
                result: mockResult,
                timestamp: Date.now(),
                accessCount: 1,
                lastAccess: Date.now()
            };
            
            expect(typeof entry.result).toBe('object');
            expect(typeof entry.timestamp).toBe('number');
            expect(typeof entry.accessCount).toBe('number');
            expect(typeof entry.lastAccess).toBe('number');
        });

        it('should create valid DurationBreakdown objects', () => {
            const breakdown: DurationBreakdown = {
                years: 1,
                months: 2,
                weeks: 3,
                days: 4,
                hours: 5,
                minutes: 6,
                seconds: 7,
                milliseconds: 8,
                microseconds: 9,
                nanoseconds: 10,
                total: {
                    years: 1,
                    months: 2,
                    weeks: 3,
                    days: 4,
                    hours: 5,
                    minutes: 6,
                    seconds: 7,
                    milliseconds: 8,
                    microseconds: 9,
                    nanoseconds: 10
                }
            };
            
            // Check individual numeric properties
            expect(typeof breakdown.years).toBe('number');
            expect(typeof breakdown.months).toBe('number');
            expect(typeof breakdown.weeks).toBe('number');
            expect(typeof breakdown.days).toBe('number');
            expect(typeof breakdown.hours).toBe('number');
            expect(typeof breakdown.minutes).toBe('number');
            expect(typeof breakdown.seconds).toBe('number');
            expect(typeof breakdown.milliseconds).toBe('number');
            expect(typeof breakdown.microseconds).toBe('number');
            expect(typeof breakdown.nanoseconds).toBe('number');
            
            // Check that total is an object with the same structure
            expect(typeof breakdown.total).toBe('object');
            expect(typeof breakdown.total.years).toBe('number');
            expect(typeof breakdown.total.months).toBe('number');
        });

        it('should create valid FastPathResult objects', () => {
            const fastResult: FastPathResult = {
                result: true,
                wasUsed: true,
                reason: 'Same instant comparison'
            };
            
            expect(typeof fastResult.wasUsed).toBe('boolean');
            expect(typeof fastResult.result).toBe('boolean');
            expect(typeof fastResult.reason).toBe('string');
        });

        it('should create valid DiffOptions objects', () => {
            const diffOptions: DiffOptions = {
                largestUnit: 'year',
                smallestUnit: 'nanosecond',
                absolute: true,
                roundingMode: 'halfExpand'
            };
            
            expect(typeof diffOptions.largestUnit).toBe('string');
            expect(typeof diffOptions.smallestUnit).toBe('string');
            expect(typeof diffOptions.absolute).toBe('boolean');
            expect(typeof diffOptions.roundingMode).toBe('string');
        });
    });

    describe('Type Constraints', () => {
        it('should enforce ComparisonStrategy interface structure', () => {
            const mockStrategy: ComparisonStrategy = {
                priority: 100,
                canHandle: (context) => {
                    expect(typeof context.date1).toBe('object');
                    expect(typeof context.date2).toBe('object');
                    expect(typeof context.type).toBe('string');
                    return true;
                },
                execute: (context) => {
                    return {
                        result: true,
                        type: 'isBefore',
                        precision: 'exact',
                        cached: false,
                        computeTime: 1.0
                    };
                }
            };
            
            expect(typeof mockStrategy.priority).toBe('number');
            expect(typeof mockStrategy.canHandle).toBe('function');
            expect(typeof mockStrategy.execute).toBe('function');
        });

        it('should enforce ComparisonContext interface structure', () => {
            const mockDate1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
            const mockDate2 = Temporal.ZonedDateTime.from('2023-01-02T00:00:00[UTC]');
            
            const context: ComparisonContext = {
                date1: mockDate1,
                date2: mockDate2,
                type: 'isBefore',
                options: {
                    unit: 'day',
                    precision: 'exact'
                },
                cacheKey: 'test-cache-key'
            };
            
            expect(typeof context.date1).toBe('object');
            expect(typeof context.date2).toBe('object');
            expect(typeof context.type).toBe('string');
            expect(typeof context.options).toBe('object');
            expect(typeof context.cacheKey).toBe('string');
        });
    });
});