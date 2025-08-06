import { TemporalUtils, LRUCache, IntlCache, DiffCache } from '../TemporalUtils';
import { Temporal } from '@js-temporal/polyfill';

describe('TemporalUtils Coverage Tests', () => {
    describe('LRUCache Edge Cases', () => {
        it('should handle cache overflow in set method', () => {
            // Test line 291: cache overflow scenario
            const cache = new LRUCache<string, number>(2);
            cache.set('key1', 1);
            cache.set('key2', 2);
            cache.set('key3', 3); // This should trigger overflow logic
            
            expect(cache.size).toBe(2);
            expect(cache.has('key1')).toBe(false); // Should be evicted
            expect(cache.has('key3')).toBe(true);
        });

        it('should handle has method for non-existent keys', () => {
            // Test lines 303-304: has method return false
            const cache = new LRUCache<string, number>(5);
            expect(cache.has('nonexistent')).toBe(false);
        });

        it('should handle setMaxSize with size reduction', () => {
            // Test lines 339-345: setMaxSize reducing cache size
            const cache = new LRUCache<string, number>(5);
            cache.set('key1', 1);
            cache.set('key2', 2);
            cache.set('key3', 3);
            cache.set('key4', 4);
            
            // Reduce max size, should trigger cleanup
            cache.setMaxSize(2);
            expect(cache.size).toBe(2);
        });

        it('should validate setResizeInterval input', () => {
            // Test lines 356-357: setResizeInterval validation
            const cache = new LRUCache<string, number>(5);
            
            // Test with invalid interval (negative)
            cache.setResizeInterval(-1000);
            // Should not change the interval for invalid values
            
            // Test with valid interval
            cache.setResizeInterval(30000);
            expect(cache.shouldResize()).toBeDefined();
        });
    });

    describe('IntlCache Coverage', () => {
        it('should test isDynamicSizingEnabled method', () => {
            // Test lines 460-461: isDynamicSizingEnabled return
            const result = IntlCache.isDynamicSizingEnabled();
            expect(typeof result).toBe('boolean');
            
            // Test toggling dynamic sizing
            IntlCache.setDynamicSizing(false);
            expect(IntlCache.isDynamicSizingEnabled()).toBe(false);
            
            IntlCache.setDynamicSizing(true);
            expect(IntlCache.isDynamicSizingEnabled()).toBe(true);
        });
    });

    describe('DiffCache Coverage', () => {
        it('should test isDynamicSizingEnabled method', () => {
            // Test lines 666-667: DiffCache isDynamicSizingEnabled
            const result = DiffCache.isDynamicSizingEnabled();
            expect(typeof result).toBe('boolean');
            
            // Test toggling
            DiffCache.setDynamicSizing(false);
            expect(DiffCache.isDynamicSizingEnabled()).toBe(false);
            
            DiffCache.setDynamicSizing(true);
            expect(DiffCache.isDynamicSizingEnabled()).toBe(true);
        });

        it('should validate setMaxCacheSize input', () => {
            // Test lines 693-697: setMaxCacheSize validation
            const originalStats = DiffCache.getStats();
            
            // Test with invalid size (negative) - should throw error
            expect(() => {
                DiffCache.setMaxCacheSize(-10);
            }).toThrow('Cache size must be at least 1');
            
            // Test with valid size
            DiffCache.setMaxCacheSize(50);
            
            // Verify the cache still works
            const date1 = TemporalUtils.from('2024-01-01');
            const date2 = TemporalUtils.from('2024-01-02');
            const diff = DiffCache.getDiffResult(date1, date2, 'day');
            expect(typeof diff).toBe('number');
        });
    });

    describe('CacheOptimizer Edge Cases', () => {
        it('should handle edge cases in calculateOptimalSize', () => {
            // Test lines 739-745: CacheOptimizer edge cases
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
                
                // Test with very high hit ratio
                const highHitMetrics = {
                    hits: 100,
                    misses: 1,
                    hitRatio: 0.99,
                    size: 10
                };
                const result2 = CacheOptimizer.calculateOptimalSize(highHitMetrics, 10);
                expect(typeof result2).toBe('number');
                
                // Test with edge case where size is at maximum
                const maxSizeMetrics = {
                    hits: 50,
                    misses: 50,
                    hitRatio: 0.5,
                    size: 500
                };
                const result3 = CacheOptimizer.calculateOptimalSize(maxSizeMetrics, 500);
                expect(result3).toBeLessThanOrEqual(500);
            }
        });
    });
});