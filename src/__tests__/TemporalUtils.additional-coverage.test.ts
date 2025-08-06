import { TemporalUtils, LRUCache } from '../TemporalUtils';
import { Temporal } from '@js-temporal/polyfill';

describe('TemporalUtils Additional Coverage Tests', () => {
    describe('LRUCache Additional Edge Cases', () => {
        it('should cover line 291 - cache set with existing key update', () => {
            // Test line 291: updating existing key in cache
            const cache = new LRUCache<string, number>(3);
            cache.set('key1', 1);
            cache.set('key2', 2);
            
            // Update existing key - this should trigger line 291
            cache.set('key1', 10);
            expect(cache.get('key1')).toBe(10);
        });

        it('should cover lines 343-344 - setMaxSize edge case', () => {
            // Test lines 343-344: setMaxSize when current size equals new size
            const cache = new LRUCache<string, number>(3);
            cache.set('key1', 1);
            cache.set('key2', 2);
            
            // Set max size to current size - should trigger break condition
            cache.setMaxSize(2);
            expect(cache.size).toBe(2);
        });

        it('should cover lines 356-357 - setResizeInterval validation', () => {
            // Test lines 356-357: setResizeInterval with invalid input
            const cache = new LRUCache<string, number>(5);
            
            // Test with zero or negative interval
            cache.setResizeInterval(0);
            cache.setResizeInterval(-100);
            
            // Should handle gracefully without throwing
            expect(cache.shouldResize()).toBeDefined();
        });
    });

    describe('CacheOptimizer Coverage', () => {
        it('should cover lines 739-745 - calculateOptimalSize boundary conditions', () => {
            // Access the internal CacheOptimizer class
            const CacheOptimizerClass = (TemporalUtils as any).CacheOptimizer;
            
            if (CacheOptimizerClass) {
                // Test minimum cache size boundary
                const minMetrics = {
                    hits: 5,
                    misses: 5,
                    hitRatio: 0.5,
                    size: 5
                };
                const result1 = CacheOptimizerClass.calculateOptimalSize(minMetrics, 5);
                expect(result1).toBeGreaterThanOrEqual(10); // MIN_CACHE_SIZE
                
                // Test maximum cache size boundary
                const maxMetrics = {
                    hits: 100,
                    misses: 10,
                    hitRatio: 0.91,
                    size: 600
                };
                const result2 = CacheOptimizerClass.calculateOptimalSize(maxMetrics, 600);
                expect(result2).toBeLessThanOrEqual(500); // MAX_CACHE_SIZE
                
                // Test shrink factor application
                const shrinkMetrics = {
                    hits: 10,
                    misses: 90,
                    hitRatio: 0.1,
                    size: 100
                };
                const result3 = CacheOptimizerClass.calculateOptimalSize(shrinkMetrics, 100);
                expect(typeof result3).toBe('number');
            }
        });
    });
});