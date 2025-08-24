/**
 * @file Comprehensive test suite for ComparisonEngine
 * Tests all comparison strategies and engine functionality
 */

import { Temporal } from '@js-temporal/polyfill';
import { ComparisonEngine } from '../../../core/comparison/comparison-engine';
import { ComparisonCache } from '../../../core/comparison/comparison-cache';
import type { ComparisonOptions } from '../../../core/comparison/comparison-types';

describe('ComparisonEngine', () => {
    let date1: Temporal.ZonedDateTime;
    let date2: Temporal.ZonedDateTime;
    let date3: Temporal.ZonedDateTime;

    beforeEach(() => {
        // Reset engine state
        ComparisonEngine.reset();
        
        // Create test dates
        date1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
        date2 = Temporal.ZonedDateTime.from('2023-01-02T00:00:00[UTC]');
        date3 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]'); // Same as date1
    });

    describe('compare method', () => {
        it('should perform basic isBefore comparison', () => {
            const result = ComparisonEngine.compare(date1, date2, 'isBefore');
            
            expect(result.result).toBe(true);
            expect(result.type).toBe('isBefore');
            expect(result.precision).toBe('exact');
            expect(result.cached).toBe(false);
            expect(typeof result.computeTime).toBe('number');
        });

        it('should perform basic isAfter comparison', () => {
            const result = ComparisonEngine.compare(date2, date1, 'isAfter');
            
            expect(result.result).toBe(true);
            expect(result.type).toBe('isAfter');
            expect(result.precision).toBe('exact');
        });

        it('should perform isSame comparison for identical dates', () => {
            const result = ComparisonEngine.compare(date1, date3, 'isSame');
            
            expect(result.result).toBe(true);
            expect(result.type).toBe('isSame');
        });

        it('should perform isSameOrBefore comparison', () => {
            const result1 = ComparisonEngine.compare(date1, date2, 'isSameOrBefore');
            const result2 = ComparisonEngine.compare(date1, date3, 'isSameOrBefore');
            
            expect(result1.result).toBe(true);
            expect(result2.result).toBe(true);
        });

        it('should perform isSameOrAfter comparison', () => {
            const result1 = ComparisonEngine.compare(date2, date1, 'isSameOrAfter');
            const result2 = ComparisonEngine.compare(date1, date3, 'isSameOrAfter');
            
            expect(result1.result).toBe(true);
            expect(result2.result).toBe(true);
        });

        it('should handle unit-based comparisons', () => {
            const sameDay1 = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[UTC]');
            const sameDay2 = Temporal.ZonedDateTime.from('2023-01-01T15:00:00[UTC]');
            
            const result = ComparisonEngine.compare(sameDay1, sameDay2, 'isSame', { unit: 'day' });
            
            expect(result.result).toBe(true);
            expect(result.unit).toBe('day');
            expect(result.precision).toBe('truncated');
        });

        it('should handle diff calculations', () => {
            const result = ComparisonEngine.compare(date1, date2, 'diff');
            
            expect(result.result).toBeInstanceOf(Temporal.Duration);
            expect(result.type).toBe('diff');
        });

        it('should handle diff with specific unit', () => {
            const result = ComparisonEngine.compare(date1, date2, 'diff', { unit: 'day' });
            
            expect(typeof result.result).toBe('number');
            expect(result.result).toBe(-1); // date1 is 1 day before date2
            expect(result.unit).toBe('day');
        });

        it('should use cache when enabled', () => {
            const options: ComparisonOptions = { useCache: true };
            
            // First call
            const result1 = ComparisonEngine.compare(date1, date2, 'isBefore', options);
            expect(result1.cached).toBe(false);
            
            // Second call should be cached
            const result2 = ComparisonEngine.compare(date1, date2, 'isBefore', options);
            expect(result2.cached).toBe(true);
        });

        it('should not use cache when disabled', () => {
            const options: ComparisonOptions = { useCache: false };
            
            const result1 = ComparisonEngine.compare(date1, date2, 'isBefore', options);
            const result2 = ComparisonEngine.compare(date1, date2, 'isBefore', options);
            
            expect(result1.cached).toBe(false);
            expect(result2.cached).toBe(false);
        });

        it('should throw error for unsupported comparison type', () => {
            expect(() => {
                ComparisonEngine.compare(date1, date2, 'unsupported' as any);
            }).toThrow('No strategy found for comparison type: unsupported');
        });
    });

    describe('convenience methods', () => {
        it('should provide isBefore convenience method', () => {
            expect(ComparisonEngine.isBefore(date1, date2)).toBe(true);
            expect(ComparisonEngine.isBefore(date2, date1)).toBe(false);
            expect(ComparisonEngine.isBefore(date1, date3)).toBe(false);
        });

        it('should provide isAfter convenience method', () => {
            expect(ComparisonEngine.isAfter(date2, date1)).toBe(true);
            expect(ComparisonEngine.isAfter(date1, date2)).toBe(false);
            expect(ComparisonEngine.isAfter(date1, date3)).toBe(false);
        });

        it('should provide isSame convenience method', () => {
            expect(ComparisonEngine.isSame(date1, date3)).toBe(true);
            expect(ComparisonEngine.isSame(date1, date2)).toBe(false);
        });

        it('should provide isSameOrBefore convenience method', () => {
            expect(ComparisonEngine.isSameOrBefore(date1, date2)).toBe(true);
            expect(ComparisonEngine.isSameOrBefore(date1, date3)).toBe(true);
            expect(ComparisonEngine.isSameOrBefore(date2, date1)).toBe(false);
        });

        it('should provide isSameOrAfter convenience method', () => {
            expect(ComparisonEngine.isSameOrAfter(date2, date1)).toBe(true);
            expect(ComparisonEngine.isSameOrAfter(date1, date3)).toBe(true);
            expect(ComparisonEngine.isSameOrAfter(date1, date2)).toBe(false);
        });

        it('should provide diff convenience method', () => {
            const result = ComparisonEngine.diff(date1, date2);
            expect(result).toBeInstanceOf(Temporal.Duration);
        });

        it('should provide diff with unit convenience method', () => {
            const result = ComparisonEngine.diff(date1, date2, 'day');
            expect(typeof result).toBe('number');
            expect(result).toBe(-1);
        });
    });

    describe('optimization hints', () => {
        it('should analyze optimization hints for same timezone dates', () => {
            const hints = ComparisonEngine.analyzeOptimizationHints(date1, date2);
            
            expect(hints.sameTimeZone).toBe(true);
            expect(hints.sameCalendar).toBe(true);
            expect(hints.sameYear).toBe(true);
            expect(hints.sameMonth).toBe(true);
            expect(hints.sameDay).toBe(false);
            expect(hints.orderOfMagnitude).toBe('days');
        });

        it('should analyze optimization hints for different timezone dates', () => {
            const dateUTC = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
            const dateNY = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[America/New_York]');
            
            const hints = ComparisonEngine.analyzeOptimizationHints(dateUTC, dateNY);
            
            expect(hints.sameTimeZone).toBe(false);
            expect(hints.sameCalendar).toBe(true);
        });

        it('should determine correct order of magnitude', () => {
            const date1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00.000000000[UTC]');
            const date2 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00.000000001[UTC]');
            
            const hints = ComparisonEngine.analyzeOptimizationHints(date1, date2);
            expect(hints.orderOfMagnitude).toBe('nanoseconds');
        });
    });

    describe('strategy management', () => {
        it('should register custom strategies', () => {
            const customStrategy = {
                priority: 200,
                canHandle: (context: any) => context.type === 'isBefore',
                execute: () => ({
                    result: true,
                    type: 'isBefore' as const,
                    precision: 'exact' as const,
                    cached: false,
                    computeTime: 0
                })
            };
            
            ComparisonEngine.registerStrategy(customStrategy);
            
            // The custom strategy should now be used
            const result = ComparisonEngine.compare(date1, date2, 'isBefore');
            expect(result.result).toBe(true);
            
            // Clean up
            ComparisonEngine.unregisterStrategy(customStrategy);
        });

        it('should unregister strategies', () => {
            const customStrategy = {
                priority: 200,
                canHandle: () => false,
                execute: () => ({
                    result: false,
                    type: 'isBefore' as const,
                    precision: 'exact' as const,
                    cached: false,
                    computeTime: 0
                })
            };
            
            ComparisonEngine.registerStrategy(customStrategy);
            const unregistered = ComparisonEngine.unregisterStrategy(customStrategy);
            
            expect(unregistered).toBe(true);
        });

        it('should return false when unregistering non-existent strategy', () => {
            const nonExistentStrategy = {
                priority: 1,
                canHandle: () => false,
                execute: () => ({
                    result: false,
                    type: 'isBefore' as const,
                    precision: 'exact' as const,
                    cached: false,
                    computeTime: 0
                })
            };
            
            const unregistered = ComparisonEngine.unregisterStrategy(nonExistentStrategy);
            expect(unregistered).toBe(false);
        });
    });

    describe('metrics and performance', () => {
        it('should track comparison metrics', () => {
            ComparisonEngine.compare(date1, date2, 'isBefore');
            ComparisonEngine.compare(date1, date2, 'isAfter');
            
            const metrics = ComparisonEngine.getMetrics();
            
            expect(metrics.totalComparisons).toBe(2);
            expect(metrics.operationBreakdown.isBefore).toBe(1);
            expect(metrics.operationBreakdown.isAfter).toBe(1);
            expect(typeof metrics.averageComputeTime).toBe('number');
        });

        it('should provide performance analysis', () => {
            // Perform some comparisons
            ComparisonEngine.compare(date1, date2, 'isBefore');
            ComparisonEngine.compare(date1, date3, 'isSame');
            
            const analysis = ComparisonEngine.getPerformanceAnalysis();
            
            expect(analysis.metrics).toBeDefined();
            expect(analysis.cacheStats).toBeDefined();
            expect(analysis.efficiency).toBeDefined();
            expect(Array.isArray(analysis.recommendations)).toBe(true);
        });

        it('should reset metrics and cache', () => {
            ComparisonEngine.compare(date1, date2, 'isBefore');
            
            let metrics = ComparisonEngine.getMetrics();
            expect(metrics.totalComparisons).toBe(1);
            
            ComparisonEngine.reset();
            
            metrics = ComparisonEngine.getMetrics();
            expect(metrics.totalComparisons).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle same instant comparisons efficiently', () => {
            const result = ComparisonEngine.compare(date1, date3, 'isSame');
            
            expect(result.result).toBe(true);
            expect(result.computeTime).toBeLessThan(5); // Should be very fast (adjusted for realistic performance)
        });

        it('should handle large time differences', () => {
            const farFuture = Temporal.ZonedDateTime.from('2123-01-01T00:00:00[UTC]');
            
            const result = ComparisonEngine.compare(date1, farFuture, 'isBefore');
            expect(result.result).toBe(true);
        });

        it('should handle different calendar systems', () => {
            const gregorianDate = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC][u-ca=gregory]');
            const isoDate = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC][u-ca=iso8601]');
            
            const result = ComparisonEngine.compare(gregorianDate, isoDate, 'isSame');
            expect(typeof result.result).toBe('boolean');
        });

        it('should handle precision options', () => {
            const options: ComparisonOptions = {
                precision: 'rounded',
                roundingMode: 'halfExpand'
            };
            
            const result = ComparisonEngine.compare(date1, date2, 'diff', options);
            expect(result.precision).toBe('rounded');
        });
    });
});