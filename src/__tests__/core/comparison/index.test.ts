/**
 * @file Test suite for comparison module exports
 * Tests that all comparison module exports are accessible and functional
 */

import {
    ComparisonEngine,
    ComparisonCache,
    ComparisonOptimizer,
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
    type ComparisonProfile,
    type ComparisonCacheStats
} from '../../../core/comparison';

import { Temporal } from '@js-temporal/polyfill';

describe('Comparison Module Exports', () => {
    describe('Class Exports', () => {
        it('should export ComparisonEngine class', () => {
            expect(ComparisonEngine).toBeDefined();
            expect(typeof ComparisonEngine).toBe('function');
            expect(typeof (ComparisonEngine as any).compare).toBe('function');
            expect(typeof (ComparisonEngine as any).isBefore).toBe('function');
            expect(typeof (ComparisonEngine as any).isAfter).toBe('function');
            expect(typeof (ComparisonEngine as any).isSame).toBe('function');
            expect(typeof (ComparisonEngine as any).diff).toBe('function');
        });

        it('should export ComparisonCache class', () => {
            expect(ComparisonCache).toBeDefined();
            expect(typeof ComparisonCache).toBe('function');
            
            // Test that we can instantiate it
            const cache = new ComparisonCache(100);
            expect(cache).toBeInstanceOf(ComparisonCache);
            expect(typeof cache.get).toBe('function');
            expect(typeof cache.set).toBe('function');
            expect(typeof cache.has).toBe('function');
            expect(typeof cache.delete).toBe('function');
            expect(typeof cache.clear).toBe('function');
        });

        it('should export ComparisonOptimizer class', () => {
            expect(ComparisonOptimizer).toBeDefined();
            expect(typeof ComparisonOptimizer).toBe('function');
            expect(typeof (ComparisonOptimizer as any).analyzePerformance).toBe('function');
            expect(typeof (ComparisonOptimizer as any).generateRecommendations).toBe('function');
            expect(typeof (ComparisonOptimizer as any).generateProfile).toBe('function');
        });
    });

    describe('Type Exports', () => {
        it('should export TimeUnit type', () => {
            // Test that TimeUnit values are accepted
            const units: TimeUnit[] = [
                'nanosecond', 'microsecond', 'millisecond', 'second',
                'minute', 'hour', 'day', 'week', 'month', 'year'
            ];
            
            units.forEach(unit => {
                const testUnit: TimeUnit = unit;
                expect(typeof testUnit).toBe('string');
            });
        });

        it('should export ComparisonType type', () => {
            // Test that ComparisonType values are accepted
            const types: ComparisonType[] = [
                'isBefore', 'isAfter', 'isSame', 'isSameOrBefore', 'isSameOrAfter', 'diff'
            ];
            
            types.forEach(type => {
                const testType: ComparisonType = type;
                expect(typeof testType).toBe('string');
            });
        });

        it('should export ComparisonResult type', () => {
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

        it('should export ComparisonOptions type', () => {
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

        it('should export ComparisonMetrics type', () => {
            const metrics: ComparisonMetrics = {
                totalComparisons: 1000,
                cacheHits: 600,
                cacheMisses: 400,
                averageComputeTime: 2.5,
                fastPathHits: 400,
                operationBreakdown: {
                    isBefore: 300,
                    isAfter: 250,
                    isSame: 200,
                    isSameOrBefore: 150,
                    isSameOrAfter: 100,
                    isBetween: 50,
                    diff: 0,
                    duration: 25
                },
                unitBreakdown: {
                    nanosecond: 50,
                    nanoseconds: 25,
                    microsecond: 75,
                    microseconds: 35,
                    millisecond: 100,
                    milliseconds: 50,
                    second: 150,
                    seconds: 75,
                    minute: 200,
                    minutes: 100,
                    hour: 175,
                    hours: 85,
                    day: 150,
                    days: 75,
                    week: 50,
                    weeks: 25,
                    month: 30,
                    months: 15,
                    year: 20,
                    years: 10
                }
            };
            
            expect(typeof metrics.totalComparisons).toBe('number');
            expect(typeof metrics.operationBreakdown).toBe('object');
            expect(typeof metrics.fastPathHits).toBe('number');
        });

        it('should export ComparisonCacheStats type', () => {
            const stats: ComparisonCacheStats = {
                hits: 600,
                misses: 400,
                sets: 1000,
                evictions: 50,
                hitRatio: 0.6,
                hitRate: 0.6,
                size: 450,
                maxSize: 500,
                averageAccessTime: 0.1,
                efficiency: 0.75
            };
            
            expect(typeof stats.hits).toBe('number');
            expect(typeof stats.misses).toBe('number');
            expect(typeof stats.hitRate).toBe('number');
            expect(typeof stats.size).toBe('number');
        });
    });

    describe('Integration Tests', () => {
        let date1: Temporal.ZonedDateTime;
        let date2: Temporal.ZonedDateTime;

        beforeEach(() => {
            date1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
            date2 = Temporal.ZonedDateTime.from('2023-01-02T00:00:00[UTC]');
        });

        it('should allow ComparisonEngine to work with exported types', () => {
            const options: ComparisonOptions = {
                unit: 'day',
                useCache: true
            };
            
            const result: ComparisonResult = ComparisonEngine.compare(date1, date2, 'isBefore', options);
            
            expect(result.result).toBe(true);
            expect(result.type).toBe('isBefore');
            expect(typeof result.computeTime).toBe('number');
        });

        it('should allow ComparisonCache to work with exported types', () => {
            const cache = new ComparisonCache(100);
            
            const entry: ComparisonCacheEntry = {
                result: {
                    result: true,
                    type: 'isBefore',
                    precision: 'exact',
                    cached: false,
                    computeTime: 1.5
                } as ComparisonResult,
                timestamp: Date.now(),
                accessCount: 1,
                lastAccess: Date.now()
            };
            
            cache.set('test-key', entry);
            const retrieved = cache.get('test-key');
            
            expect(retrieved).toBeDefined();
            expect(retrieved!.result.result).toBe(true);
        });

        it('should allow ComparisonOptimizer to work with exported types', () => {
            const metrics: ComparisonMetrics = {
                totalComparisons: 100,
                cacheHits: 60,
                cacheMisses: 40,
                averageComputeTime: 2.0,
                fastPathHits: 40,
                operationBreakdown: {
                    isBefore: 30,
                    isAfter: 25,
                    isSame: 20,
                    isSameOrBefore: 15,
                    isSameOrAfter: 10,
                    isBetween: 5,
                    diff: 0,
                    duration: 3
                },
                unitBreakdown: {
                    nanosecond: 5,
                    nanoseconds: 2,
                    microsecond: 7,
                    microseconds: 3,
                    millisecond: 10,
                    milliseconds: 5,
                    second: 15,
                    seconds: 7,
                    minute: 20,
                    minutes: 10,
                    hour: 17,
                    hours: 8,
                    day: 15,
                    days: 7,
                    week: 5,
                    weeks: 2,
                    month: 3,
                    months: 1,
                    year: 2,
                    years: 1
                }
            };
            
            const cacheStats: ComparisonCacheStats = {
                hits: 60,
                misses: 40,
                sets: 100,
                evictions: 5,
                hitRatio: 0.6,
                hitRate: 0.6,
                size: 45,
                maxSize: 50,
                averageAccessTime: 0.1,
                efficiency: 0.75
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(metrics, cacheStats);
            
            expect(typeof analysis.overallEfficiency).toBe('number');
            expect(typeof analysis.cacheEfficiency).toBe('number');
            expect(Array.isArray(analysis.bottlenecks)).toBe(true);
            expect(Array.isArray(analysis.strengths)).toBe(true);
        });

        it('should support custom strategy implementation', () => {
            const customStrategy: ComparisonStrategy = {
                priority: 200,
                canHandle: (context) => {
                    return context.type === 'isBefore';
                },
                execute: (context) => {
                    const result: ComparisonResult = {
                        result: true,
                        type: 'isBefore',
                        precision: 'exact',
                        cached: false,
                        computeTime: 0.1
                    };
                    return result;
                }
            };
            
            expect(typeof customStrategy.priority).toBe('number');
            expect(typeof customStrategy.canHandle).toBe('function');
            expect(typeof customStrategy.execute).toBe('function');
            
            // Test that the strategy can be used
            const context: ComparisonContext = {
                date1,
                date2,
                type: 'isBefore',
                options: {}
            };
            const canHandle = customStrategy.canHandle(context);
            expect(canHandle).toBe(true);
            
            const result = customStrategy.execute(context);
            expect(result.result).toBe(true);
            expect(result.type).toBe('isBefore');
        });
    });

    describe('Module Completeness', () => {
        it('should export all expected comparison functionality', () => {
            // Verify that all major comparison features are accessible
            expect(ComparisonEngine.compare).toBeDefined();
            expect(ComparisonEngine.isBefore).toBeDefined();
            expect(ComparisonEngine.isAfter).toBeDefined();
            expect(ComparisonEngine.isSame).toBeDefined();
            expect(ComparisonEngine.isSameOrBefore).toBeDefined();
            expect(ComparisonEngine.isSameOrAfter).toBeDefined();
            expect(ComparisonEngine.diff).toBeDefined();
            expect(ComparisonEngine.getMetrics).toBeDefined();
            expect(ComparisonEngine.reset).toBeDefined();
        });

        it('should export all expected cache functionality', () => {
            const cache = new ComparisonCache(100);
            
            expect(cache.get).toBeDefined();
            expect(cache.set).toBeDefined();
            expect(cache.has).toBeDefined();
            expect(cache.delete).toBeDefined();
            expect(cache.clear).toBeDefined();
            expect(cache.size).toBeDefined();
            expect(cache.getStats).toBeDefined();
            expect(cache.getMemoryUsage).toBeDefined();
            expect(cache.optimize).toBeDefined();
            expect(cache.getMaxSize).toBeDefined();
            expect(cache.setMaxSize).toBeDefined();
        });

        it('should export all expected optimizer functionality', () => {
            expect(ComparisonOptimizer.analyzePerformance).toBeDefined();
            expect(ComparisonOptimizer.generateRecommendations).toBeDefined();
            expect(ComparisonOptimizer.generateProfile).toBeDefined();
        });
    });

    describe('Type Safety', () => {
        it('should enforce type constraints at compile time', () => {
            // These tests verify that TypeScript types are properly exported
            // and can be used for type checking
            
            const validTimeUnit: TimeUnit = 'day';
            const validComparisonType: ComparisonType = 'isBefore';
            
            expect(typeof validTimeUnit).toBe('string');
            expect(typeof validComparisonType).toBe('string');
            
            // Test that invalid values would be caught by TypeScript
            // (These would fail at compile time, not runtime)
            // const invalidTimeUnit: TimeUnit = 'invalid'; // Would cause TS error
            // const invalidComparisonType: ComparisonType = 'invalid'; // Would cause TS error
        });

        it('should provide proper type inference', () => {
            const result = ComparisonEngine.compare(
                Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]'),
                Temporal.ZonedDateTime.from('2023-01-02T00:00:00[UTC]'),
                'isBefore'
            );
            
            // TypeScript should infer the correct return type
            expect(typeof result.result).toBe('boolean');
            expect(typeof result.type).toBe('string');
            expect(typeof result.precision).toBe('string');
            expect(typeof result.cached).toBe('boolean');
            expect(typeof result.computeTime).toBe('number');
        });
    });
});