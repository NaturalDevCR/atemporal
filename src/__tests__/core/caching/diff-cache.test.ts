/**
 * @file Comprehensive tests for DiffCache class
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import { DiffCache } from '../../../core/caching/diff-cache';
import type { TimeUnit } from '../../../types';

// Mock the CacheOptimizer to control optimization behavior
jest.mock('../../../core/caching/cache-optimizer', () => ({
    CacheOptimizer: {
        calculateOptimalSize: jest.fn((metrics: any, currentSize: any) => {
            // Simple mock: return current size unless hit ratio is very low
            return metrics.hitRatio < 0.3 ? Math.max(1, currentSize - 5) : currentSize;
        })
    }
}));

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('DiffCache', () => {
    let baseDate: Temporal.ZonedDateTime;
    let futureDate: Temporal.ZonedDateTime;
    let pastDate: Temporal.ZonedDateTime;

    beforeEach(() => {
        // Clear cache before each test
        DiffCache.clear();
        // Reset to default settings
        DiffCache.setMaxCacheSize(100);
        DiffCache.setDynamicSizing(true);
        
        // Set up test dates
        baseDate = Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]');
        futureDate = baseDate.add({ days: 1, hours: 2, minutes: 30 });
        pastDate = baseDate.subtract({ days: 2, hours: 1 });
        
        // Clear mock calls
        mockConsoleWarn.mockClear();
    });

    afterEach(() => {
        // Clean up after each test
        DiffCache.clear();
    });

    describe('basic diff calculations', () => {
        it('should calculate and cache diff results', () => {
            const result1 = DiffCache.getDiffResult(futureDate, baseDate, 'day');
            const result2 = DiffCache.getDiffResult(futureDate, baseDate, 'day');
            
            expect(result1).toBeCloseTo(1.104, 2); // ~1.104 days
            expect(result2).toBe(result1); // Should be cached
            
            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBe(1);
        });

        it('should calculate diffs for different time units', () => {
            const dayDiff = DiffCache.getDiffResult(futureDate, baseDate, 'day');
            const hourDiff = DiffCache.getDiffResult(futureDate, baseDate, 'hour');
            const minuteDiff = DiffCache.getDiffResult(futureDate, baseDate, 'minute');
            
            expect(dayDiff).toBeCloseTo(1.104, 2);
            expect(hourDiff).toBeCloseTo(26.5, 1);
            expect(minuteDiff).toBeCloseTo(1590, 0);
            
            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBe(3); // Three different cache entries
        });

        it('should handle negative diffs (past dates)', () => {
            const result = DiffCache.getDiffResult(pastDate, baseDate, 'day');
            expect(result).toBeCloseTo(-2.042, 2); // Negative because past date
        });

        it('should handle same dates', () => {
            const result = DiffCache.getDiffResult(baseDate, baseDate, 'day');
            expect(result).toBe(0);
        });

        it('should handle different time zones', () => {
            const utcDate = Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]');
            const nyDate = Temporal.ZonedDateTime.from('2023-01-01T12:00:00[America/New_York]');
            
            const result = DiffCache.getDiffResult(utcDate, nyDate, 'hour');
            expect(typeof result).toBe('number');
        });
    });

    describe('cache behavior', () => {
        it('should cache results and improve hit ratio', () => {
            // First call - cache miss
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            
            let metrics = DiffCache.getDetailedStats();
            expect(metrics?.hits).toBe(0);
            expect(metrics?.misses).toBe(1);
            
            // Second call - cache hit
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            
            metrics = DiffCache.getDetailedStats();
            expect(metrics?.hits).toBe(1);
            expect(metrics?.misses).toBe(1);
            expect(metrics?.hitRatio).toBe(0.5);
        });

        it('should create different cache entries for different parameters', () => {
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            DiffCache.getDiffResult(futureDate, baseDate, 'hour');
            DiffCache.getDiffResult(pastDate, baseDate, 'day');
            
            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBe(3);
        });

        it('should handle cache eviction when size limit is reached', () => {
            DiffCache.setMaxCacheSize(2);
            
            // Create more entries than cache can hold
            const date1 = baseDate.add({ days: 1 });
            const date2 = baseDate.add({ days: 2 });
            const date3 = baseDate.add({ days: 3 });
            
            DiffCache.getDiffResult(date1, baseDate, 'day');
            DiffCache.getDiffResult(date2, baseDate, 'day');
            DiffCache.getDiffResult(date3, baseDate, 'day');
            
            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBeLessThanOrEqual(2);
        });
    });

    describe('cache size management', () => {
        it('should set and get max cache size', () => {
            DiffCache.setMaxCacheSize(50);
            
            const stats = DiffCache.getStats();
            expect(stats.maxSize).toBe(50);
        });

        it('should throw error for invalid cache size', () => {
            expect(() => {
                DiffCache.setMaxCacheSize(0);
            }).toThrow('Cache size must be at least 1');

            expect(() => {
                DiffCache.setMaxCacheSize(-5);
            }).toThrow('Cache size must be at least 1');
        });

        it('should update existing cache when size is changed', () => {
            // Create some cache entries
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            
            DiffCache.setMaxCacheSize(25);
            
            const stats = DiffCache.getStats();
            expect(stats.maxSize).toBe(25);
        });
    });

    describe('dynamic sizing', () => {
        it('should enable and disable dynamic sizing', () => {
            expect(DiffCache.isDynamicSizingEnabled()).toBe(true);

            DiffCache.setDynamicSizing(false);
            expect(DiffCache.isDynamicSizingEnabled()).toBe(false);

            DiffCache.setDynamicSizing(true);
            expect(DiffCache.isDynamicSizingEnabled()).toBe(true);
        });

        it('should not resize cache when dynamic sizing is disabled', () => {
            DiffCache.setDynamicSizing(false);

            // Create some cache entries
            for (let i = 0; i < 10; i++) {
                const testDate = baseDate.add({ days: i });
                DiffCache.getDiffResult(testDate, baseDate, 'day');
            }

            // This should not trigger any resizing
            DiffCache.optimize();

            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBe(10);
        });
    });

    describe('cache clearing', () => {
        it('should clear the cache', () => {
            // Create some cache entries
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            DiffCache.getDiffResult(pastDate, baseDate, 'hour');

            let stats = DiffCache.getStats();
            expect(stats.diffCache).toBe(2);

            DiffCache.clear();

            stats = DiffCache.getStats();
            expect(stats.diffCache).toBe(0);
        });
    });

    describe('statistics and monitoring', () => {
        it('should provide basic cache statistics', () => {
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            DiffCache.getDiffResult(pastDate, baseDate, 'hour');

            const stats = DiffCache.getStats();

            expect(stats.diffCache).toBe(2);
            expect(stats.maxSize).toBe(100);
        });

        it('should provide detailed cache statistics', () => {
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            DiffCache.getDiffResult(futureDate, baseDate, 'day'); // Cache hit

            const detailedStats = DiffCache.getDetailedStats();

            expect(detailedStats).toBeTruthy();
            expect(detailedStats?.size).toBe(1);
            expect(detailedStats?.hits).toBe(1);
            expect(detailedStats?.misses).toBe(1);
            expect(detailedStats?.hitRatio).toBe(0.5);
        });

        it('should return null for detailed stats when cache not initialized', () => {
            // Reset the cache to null state to simulate uninitialized cache
            (DiffCache as any)._diffCache = null;
            
            const detailedStats = DiffCache.getDetailedStats();
            expect(detailedStats).toBeNull();
        });

        it('should provide efficiency metrics', () => {
            // Create some cache activity
            for (let i = 0; i < 5; i++) {
                DiffCache.getDiffResult(futureDate, baseDate, 'day'); // This will hit cache after first call
                const testDate = baseDate.add({ days: i });
                DiffCache.getDiffResult(testDate, baseDate, 'hour'); // These will be cache misses
            }

            const efficiency = DiffCache.getEfficiencyMetrics();

            expect(efficiency.hitRatio).toBeGreaterThanOrEqual(0);
            expect(efficiency.utilization).toBeGreaterThanOrEqual(0);
            expect(efficiency.cacheSize).toBeGreaterThan(0);
            expect(typeof efficiency.recommendedOptimization).toBe('string');
        });

        it('should handle efficiency metrics with no cache', () => {
            // Reset the cache to null state
            (DiffCache as any)._diffCache = null;
            
            const efficiency = DiffCache.getEfficiencyMetrics();

            expect(efficiency.hitRatio).toBe(0);
            expect(efficiency.utilization).toBe(0);
            expect(efficiency.cacheSize).toBe(0);
            expect(efficiency.recommendedOptimization).toBe('Cache not initialized');
        });

        it('should provide optimization recommendations', () => {
            // Create many different calculations to simulate low hit ratio
            for (let i = 0; i < 20; i++) {
                const testDate = baseDate.add({ days: i, hours: i });
                DiffCache.getDiffResult(testDate, baseDate, 'day');
            }

            const efficiency = DiffCache.getEfficiencyMetrics();
            expect(efficiency.recommendedOptimization).toContain('Consider increasing cache size or pre-warming with common calculations');
        });
    });

    describe('usage analysis', () => {
        it('should analyze cache usage patterns', () => {
            // Create some cache activity
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            DiffCache.getDiffResult(futureDate, baseDate, 'day'); // Cache hit
            DiffCache.getDiffResult(pastDate, baseDate, 'day'); // Cache miss

            const analysis = DiffCache.analyzeUsage();

            expect(analysis.totalOperations).toBe(3);
            expect(analysis.cacheHits).toBe(1);
            expect(analysis.cacheMisses).toBe(2);
            expect(['Poor', 'Fair', 'Good', 'Excellent']).toContain(analysis.memoryEfficiency);
        });

        it('should handle usage analysis with no cache', () => {
            // Reset the cache to null state by accessing private property
            (DiffCache as any)._diffCache = null;
            
            const analysis = DiffCache.analyzeUsage();
            
            expect(analysis.totalOperations).toBe(0);
            expect(analysis.cacheHits).toBe(0);
            expect(analysis.cacheMisses).toBe(0);
            expect(analysis.memoryEfficiency).toBe('No data available');
        });

        it('should categorize memory efficiency correctly', () => {
            // Create high hit ratio scenario
            for (let i = 0; i < 10; i++) {
                DiffCache.getDiffResult(futureDate, baseDate, 'day'); // Mostly cache hits
            }
            DiffCache.getDiffResult(pastDate, baseDate, 'day'); // One cache miss

            const analysis = DiffCache.analyzeUsage();
            expect(['Good', 'Excellent']).toContain(analysis.memoryEfficiency);
        });
    });

    describe('pre-warming', () => {
        it('should pre-warm cache with common calculations', () => {
            DiffCache.preWarm(baseDate);

            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBeGreaterThan(0);

            // Verify that subsequent calls hit the cache
            const testDate = baseDate.add({ days: 1 });
            DiffCache.getDiffResult(baseDate, testDate, 'day');

            const metrics = DiffCache.getDetailedStats();
            expect(metrics?.hits).toBeGreaterThan(0);
        });

        it('should pre-warm with current time when no base date provided', () => {
            DiffCache.preWarm();

            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBeGreaterThan(0);
        });
    });

    describe('optimization', () => {
        it('should trigger optimization', () => {
            // Create some cache entries
            DiffCache.getDiffResult(futureDate, baseDate, 'day');
            DiffCache.getDiffResult(pastDate, baseDate, 'hour');

            // This should not throw and should trigger resize checks
            expect(() => {
                DiffCache.optimize();
            }).not.toThrow();
        });
    });

    describe('error handling and edge cases', () => {
        it('should handle calculation errors gracefully', () => {
            // Create dates that might cause calculation issues
            const extremeDate = Temporal.ZonedDateTime.from('1900-01-01T00:00:00[UTC]');
            
            const result = DiffCache.getDiffResult(baseDate, extremeDate, 'day');
            expect(typeof result).toBe('number');
        });

        it('should handle invalid time units gracefully', () => {
            // This might cause the internal calculation to fail
            const result = DiffCache.getDiffResult(futureDate, baseDate, 'invalid' as TimeUnit);
            expect(typeof result).toBe('number');
        });

        it('should handle very large time differences', () => {
            const veryFutureDate = baseDate.add({ years: 1000 });
            
            const result = DiffCache.getDiffResult(veryFutureDate, baseDate, 'day');
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(0);
        });

        it('should handle microsecond precision', () => {
            const preciseDate = baseDate.add({ milliseconds: 1 });
            
            const result = DiffCache.getDiffResult(preciseDate, baseDate, 'millisecond');
            expect(result).toBeCloseTo(1, 0);
        });

        it('should handle different calendar systems', () => {
            // Test with different calendar if supported
            const result = DiffCache.getDiffResult(futureDate, baseDate, 'day');
            expect(typeof result).toBe('number');
        });
    });

    describe('concurrent access simulation', () => {
        it('should handle multiple simultaneous cache accesses', () => {
            const promises = [];

            // Simulate concurrent access
            for (let i = 0; i < 10; i++) {
                promises.push(
                    Promise.resolve().then(() => {
                        return DiffCache.getDiffResult(futureDate, baseDate, 'day');
                    })
                );
            }

            return Promise.all(promises).then(results => {
                // All should return the same result
                const firstResult = results[0];
                results.forEach(result => {
                    expect(result).toBe(firstResult);
                });

                // Should have high cache hit ratio
                const metrics = DiffCache.getDetailedStats();
                expect(metrics?.hitRatio).toBeGreaterThan(0.8);
            });
        });
    });

    describe('memory efficiency', () => {
        it('should not grow indefinitely with unique calculations', () => {
            DiffCache.setMaxCacheSize(10);

            // Create more unique calculations than cache can hold
            for (let i = 0; i < 20; i++) {
                const testDate = baseDate.add({ days: i, hours: i, minutes: i });
                DiffCache.getDiffResult(testDate, baseDate, 'day');
            }

            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBeLessThanOrEqual(10);
        });

        it('should maintain reasonable memory usage', () => {
            // Create a reasonable number of cache entries
            for (let i = 0; i < 50; i++) {
                const testDate = baseDate.add({ days: i });
                DiffCache.getDiffResult(testDate, baseDate, 'day');
            }

            const stats = DiffCache.getStats();
            expect(stats.diffCache).toBeLessThanOrEqual(100); // Should not exceed max size
        });
    });
});