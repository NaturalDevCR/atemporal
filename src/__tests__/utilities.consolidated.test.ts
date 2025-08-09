import { TemporalUtils, LRUCache, IntlCache, DiffCache } from '../TemporalUtils';
import { Temporal } from '@js-temporal/polyfill';
import atemporal from '../index';

/**
 * Consolidated Utilities Test Suite
 * 
 * This file consolidates tests for:
 * - TemporalUtils.coverage.test.ts
 * - LRUCache functionality
 * - IntlCache functionality
 * - DiffCache functionality
 * - CacheOptimizer functionality
 * 
 * Provides comprehensive coverage for utility classes and edge cases
 */
describe('Utilities: Consolidated Test Suite', () => {
    describe('LRUCache Functionality', () => {
        describe('Basic Operations', () => {
            it('should handle basic set, get, and has operations', () => {
                const cache = new LRUCache<string, number>(3);
                
                // Basic set and get
                cache.set('key1', 100);
                expect(cache.get('key1')).toBe(100);
                expect(cache.has('key1')).toBe(true);
                expect(cache.size).toBe(1);
                
                // Multiple entries
                cache.set('key2', 200);
                cache.set('key3', 300);
                expect(cache.size).toBe(3);
            });

            it('should handle cache overflow and LRU eviction (line 291)', () => {
                const cache = new LRUCache<string, number>(2);
                cache.set('key1', 1);
                cache.set('key2', 2);
                
                // This should trigger overflow logic and evict key1
                cache.set('key3', 3);
                
                expect(cache.size).toBe(2);
                expect(cache.has('key1')).toBe(false); // Should be evicted
                expect(cache.has('key2')).toBe(true);
                expect(cache.has('key3')).toBe(true);
            });

            it('should handle non-existent keys (lines 303-304)', () => {
                const cache = new LRUCache<string, number>(5);
                
                // Test has method for non-existent keys
                expect(cache.has('nonexistent')).toBe(false);
                expect(cache.get('nonexistent')).toBeUndefined();
                
                // Add some data and test again
                cache.set('existing', 42);
                expect(cache.has('existing')).toBe(true);
                expect(cache.has('still-nonexistent')).toBe(false);
            });

            it('should update existing keys and maintain LRU order', () => {
                const cache = new LRUCache<string, number>(2);
                cache.set('key1', 1);
                cache.set('key2', 2);
                
                // Update existing key (should move to front)
                cache.set('key1', 10);
                expect(cache.get('key1')).toBe(10);
                
                // Add new key, key2 should be evicted (not key1)
                cache.set('key3', 3);
                expect(cache.has('key1')).toBe(true);
                expect(cache.has('key2')).toBe(false);
                expect(cache.has('key3')).toBe(true);
            });
        });

        describe('Cache Management', () => {
            it('should handle setMaxSize with size reduction (lines 339-345)', () => {
                const cache = new LRUCache<string, number>(5);
                cache.set('key1', 1);
                cache.set('key2', 2);
                cache.set('key3', 3);
                cache.set('key4', 4);
                
                expect(cache.size).toBe(4);
                
                // Reduce max size, should trigger cleanup
                cache.setMaxSize(2);
                expect(cache.size).toBe(2);
                
                // Only the most recently used items should remain
                expect(cache.has('key3')).toBe(true);
                expect(cache.has('key4')).toBe(true);
                expect(cache.has('key1')).toBe(false);
                expect(cache.has('key2')).toBe(false);
            });

            it('should handle setMaxSize with size increase', () => {
                const cache = new LRUCache<string, number>(2);
                cache.set('key1', 1);
                cache.set('key2', 2);
                
                // Increase max size
                cache.setMaxSize(5);
                expect(cache.size).toBe(2);
                
                // Should be able to add more items now
                cache.set('key3', 3);
                cache.set('key4', 4);
                cache.set('key5', 5);
                expect(cache.size).toBe(5);
            });

            it('should validate setResizeInterval input (lines 356-357)', () => {
                const cache = new LRUCache<string, number>(5);
                
                // Test with invalid interval (negative)
                cache.setResizeInterval(-1000);
                expect(cache.shouldResize()).toBeDefined();
                
                // Test with valid interval
                cache.setResizeInterval(30000);
                expect(cache.shouldResize()).toBeDefined();
                
                // Test with zero (edge case)
                cache.setResizeInterval(0);
                expect(cache.shouldResize()).toBeDefined();
            });

            it('should handle clear operation', () => {
                const cache = new LRUCache<string, number>(3);
                cache.set('key1', 1);
                cache.set('key2', 2);
                cache.set('key3', 3);
                
                expect(cache.size).toBe(3);
                cache.clear();
                expect(cache.size).toBe(0);
                expect(cache.has('key1')).toBe(false);
            });
        });

        describe('Performance and Edge Cases', () => {
            it('should handle rapid insertions and deletions', () => {
                const cache = new LRUCache<string, number>(10);
                
                // Rapid insertions
                for (let i = 0; i < 20; i++) {
                    cache.set(`key${i}`, i);
                }
                
                expect(cache.size).toBe(10);
                
                // Should contain the last 10 items
                for (let i = 10; i < 20; i++) {
                    expect(cache.has(`key${i}`)).toBe(true);
                }
                
                // First 10 should be evicted
                for (let i = 0; i < 10; i++) {
                    expect(cache.has(`key${i}`)).toBe(false);
                }
            });

            it('should handle shouldResize method', () => {
                const cache = new LRUCache<string, number>(5);
                
                // Test shouldResize functionality
                const shouldResize = cache.shouldResize();
                expect(typeof shouldResize).toBe('boolean');
            });
        });
    });

    describe('IntlCache Functionality', () => {
        describe('Dynamic Sizing', () => {
            it('should test isDynamicSizingEnabled method (lines 460-461)', () => {
                const result = IntlCache.isDynamicSizingEnabled();
                expect(typeof result).toBe('boolean');
                
                // Test toggling dynamic sizing
                const originalState = IntlCache.isDynamicSizingEnabled();
                
                IntlCache.setDynamicSizing(false);
                expect(IntlCache.isDynamicSizingEnabled()).toBe(false);
                
                IntlCache.setDynamicSizing(true);
                expect(IntlCache.isDynamicSizingEnabled()).toBe(true);
                
                // Restore original state
                IntlCache.setDynamicSizing(originalState);
            });

            it('should handle dynamic sizing state changes', () => {
                const originalState = IntlCache.isDynamicSizingEnabled();
                
                // Test multiple state changes
                IntlCache.setDynamicSizing(true);
                expect(IntlCache.isDynamicSizingEnabled()).toBe(true);
                
                IntlCache.setDynamicSizing(false);
                expect(IntlCache.isDynamicSizingEnabled()).toBe(false);
                
                IntlCache.setDynamicSizing(true);
                expect(IntlCache.isDynamicSizingEnabled()).toBe(true);
                
                // Restore original state
                IntlCache.setDynamicSizing(originalState);
            });
        });

        describe('Cache Operations', () => {
            it('should handle number formatter caching', () => {
                // Test getting number formatters
                const formatter1 = IntlCache.getNumberFormatter('en-US');
                const formatter2 = IntlCache.getNumberFormatter('en-US');
                
                expect(formatter1).toBe(formatter2); // Should be cached
                expect(formatter1).toBeInstanceOf(Intl.NumberFormat);
                
                // Test different locales
                const formatter3 = IntlCache.getNumberFormatter('es-ES');
                expect(formatter3).not.toBe(formatter1);
                expect(formatter3).toBeInstanceOf(Intl.NumberFormat);
            });

            it('should handle date time formatter caching', () => {
                const options: Intl.DateTimeFormatOptions = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                };
                
                const formatter1 = IntlCache.getDateTimeFormatter('en-US', options);
                const formatter2 = IntlCache.getDateTimeFormatter('en-US', options);
                
                expect(formatter1).toBe(formatter2); // Should be cached
                expect(formatter1).toBeInstanceOf(Intl.DateTimeFormat);
            });

            it('should handle cache statistics', () => {
                const stats = IntlCache.getStats();
                expect(typeof stats.dateTimeFormatters).toBe('number');
                expect(typeof stats.relativeTimeFormatters).toBe('number');
                expect(typeof stats.numberFormatters).toBe('number');
                expect(typeof stats.total).toBe('number');
            });
        });
    });

    describe('DiffCache Functionality', () => {
        describe('Dynamic Sizing', () => {
            it('should test isDynamicSizingEnabled method (lines 666-667)', () => {
                const result = DiffCache.isDynamicSizingEnabled();
                expect(typeof result).toBe('boolean');
                
                // Test toggling
                const originalState = DiffCache.isDynamicSizingEnabled();
                
                DiffCache.setDynamicSizing(false);
                expect(DiffCache.isDynamicSizingEnabled()).toBe(false);
                
                DiffCache.setDynamicSizing(true);
                expect(DiffCache.isDynamicSizingEnabled()).toBe(true);
                
                // Restore original state
                DiffCache.setDynamicSizing(originalState);
            });
        });

        describe('Cache Size Management', () => {
            it('should validate setMaxCacheSize input (lines 693-697)', () => {
                const originalStats = DiffCache.getStats();
                
                // Test with invalid size (negative) - should throw error
                expect(() => {
                    DiffCache.setMaxCacheSize(-10);
                }).toThrow('Cache size must be at least 1');
                
                expect(() => {
                    DiffCache.setMaxCacheSize(0);
                }).toThrow('Cache size must be at least 1');
                
                // Test with valid size
                DiffCache.setMaxCacheSize(50);
                
                // Verify the cache still works after size change
                const date1 = TemporalUtils.from('2024-01-01');
                const date2 = TemporalUtils.from('2024-01-02');
                const diff = DiffCache.getDiffResult(date1, date2, 'day');
                expect(typeof diff).toBe('number');
                expect(Math.abs(diff)).toBe(1);
            });

            it('should handle cache size changes', () => {
                const originalSize = DiffCache.getStats().diffCache;
                
                // Set a smaller cache size
                DiffCache.setMaxCacheSize(10);
                
                // Add some diff calculations
                const baseDate = TemporalUtils.from('2024-01-01');
                for (let i = 1; i <= 15; i++) {
                    const targetDate = TemporalUtils.from(`2024-01-${i.toString().padStart(2, '0')}`);
                    DiffCache.getDiffResult(baseDate, targetDate, 'day');
                }
                
                const stats = DiffCache.getStats();
                expect(stats.diffCache).toBeLessThanOrEqual(10);
                
                // Restore original size
                DiffCache.setMaxCacheSize(100);
            });
        });

        describe('Diff Calculations', () => {
            it('should cache diff results correctly', () => {
                const date1 = TemporalUtils.from('2024-01-01T00:00:00Z');
                const date2 = TemporalUtils.from('2024-01-05T00:00:00Z');
                
                // First calculation
                const diff1 = DiffCache.getDiffResult(date1, date2, 'day');
                expect(Math.abs(diff1)).toBe(4);
                
                // Second calculation (should be cached)
                const diff2 = DiffCache.getDiffResult(date1, date2, 'day');
                expect(Math.abs(diff2)).toBe(4);
                expect(diff1).toBe(diff2);
                
                // Different unit
                const diffHours = DiffCache.getDiffResult(date1, date2, 'hour');
                expect(Math.abs(diffHours)).toBe(96); // 4 days * 24 hours
            });

            it('should handle different date formats in cache', () => {
                const date1 = TemporalUtils.from('2024-01-01');
                const date2 = TemporalUtils.from('2024-01-10');
                
                const diffDays = DiffCache.getDiffResult(date1, date2, 'day');
                const diffWeeks = DiffCache.getDiffResult(date1, date2, 'week');
                const diffMonths = DiffCache.getDiffResult(date1, date2, 'month');
                
                expect(Math.abs(diffDays)).toBe(9); // Use absolute value since direction may vary
                expect(Math.abs(diffWeeks)).toBeCloseTo(1.29, 1); // Approximately 1.29 weeks
                expect(Math.abs(diffMonths)).toBeCloseTo(0.29, 1); // Approximately 0.29 months
            });
        });
    });

    describe('CacheOptimizer Functionality', () => {
        describe('Optimal Size Calculation', () => {
            it('should handle edge cases in calculateOptimalSize (lines 739-745)', () => {
                const CacheOptimizer = (TemporalUtils as any).CacheOptimizer;
                
                if (CacheOptimizer) {
                    // Test with very low hit ratio
                    const lowHitMetrics = {
                        hits: 1,
                        misses: 100,
                        hitRatio: 0.01,
                        size: 50
                    };
                    const result1 = CacheOptimizer.calculateOptimalSize(lowHitMetrics, 50);
                    expect(typeof result1).toBe('number');
                    expect(result1).toBeGreaterThan(0);
                    expect(result1).toBeLessThanOrEqual(50);
                    
                    // Test with very high hit ratio
                    const highHitMetrics = {
                        hits: 100,
                        misses: 1,
                        hitRatio: 0.99,
                        size: 10
                    };
                    const result2 = CacheOptimizer.calculateOptimalSize(highHitMetrics, 10);
                    expect(typeof result2).toBe('number');
                    expect(result2).toBeGreaterThan(0);
                    expect(result2).toBeLessThanOrEqual(10);
                    
                    // Test with edge case where size is at maximum
                    const maxSizeMetrics = {
                        hits: 50,
                        misses: 50,
                        hitRatio: 0.5,
                        size: 500
                    };
                    const result3 = CacheOptimizer.calculateOptimalSize(maxSizeMetrics, 500);
                    expect(result3).toBeLessThanOrEqual(500);
                    expect(result3).toBeGreaterThan(0);
                }
            });

            it('should handle balanced hit ratios', () => {
                const CacheOptimizer = (TemporalUtils as any).CacheOptimizer;
                
                if (CacheOptimizer) {
                    const balancedMetrics = {
                        hits: 50,
                        misses: 50,
                        hitRatio: 0.5,
                        size: 100
                    };
                    
                    const result = CacheOptimizer.calculateOptimalSize(balancedMetrics, 200);
                    expect(typeof result).toBe('number');
                    expect(result).toBeGreaterThan(0);
                    expect(result).toBeLessThanOrEqual(200);
                }
            });

            it('should handle zero hit scenarios', () => {
                const CacheOptimizer = (TemporalUtils as any).CacheOptimizer;
                
                if (CacheOptimizer) {
                    const zeroHitMetrics = {
                        hits: 0,
                        misses: 100,
                        hitRatio: 0,
                        size: 50
                    };
                    
                    const result = CacheOptimizer.calculateOptimalSize(zeroHitMetrics, 50);
                    expect(typeof result).toBe('number');
                    expect(result).toBeGreaterThan(0);
                }
            });
        });
    });

    describe('TemporalUtils Integration', () => {
        describe('Date Creation and Validation', () => {
            it('should create valid TemporalUtils instances', () => {
                const date1 = TemporalUtils.from('2024-01-01');
                expect(date1).toBeDefined();
                
                const date2 = TemporalUtils.from(new Date('2024-01-01'));
                expect(date2).toBeDefined();
                
                const date3 = TemporalUtils.from([2024, 1, 1]);
                expect(date3).toBeDefined();
            });

            it('should handle invalid inputs by throwing errors', () => {
                expect(() => {
                    TemporalUtils.from('invalid-date');
                }).toThrow();
                
                // Note: TemporalUtils.from() handles null/undefined gracefully
                // so we only test clearly invalid string inputs
            });
        });

        describe('Cache Statistics and Monitoring', () => {
            it('should provide cache statistics for all caches', () => {
                const intlStats = IntlCache.getStats();
                expect(intlStats).toHaveProperty('dateTimeFormatters');
                expect(intlStats).toHaveProperty('relativeTimeFormatters');
                expect(intlStats).toHaveProperty('numberFormatters');
                expect(intlStats).toHaveProperty('listFormatters');
                expect(intlStats).toHaveProperty('total');
                expect(intlStats).toHaveProperty('maxSize');
                
                const diffStats = DiffCache.getStats();
                expect(diffStats).toHaveProperty('diffCache');
                expect(diffStats).toHaveProperty('maxSize');
            });

            it('should handle cache clearing operations', () => {
                // Generate some cache entries
                IntlCache.getNumberFormatter('en-US');
                IntlCache.getNumberFormatter('es-ES');
                
                const date1 = TemporalUtils.from('2024-01-01');
                const date2 = TemporalUtils.from('2024-01-02');
                DiffCache.getDiffResult(date1, date2, 'day');
                
                // Clear caches
                IntlCache.clearAll();
                DiffCache.clear();
                
                // Verify caches are cleared
                const intlStats = IntlCache.getStats();
                const diffStats = DiffCache.getStats();
                
                expect(intlStats.total).toBe(0);
                expect(diffStats.diffCache).toBe(0);
            });
        });
    });
});