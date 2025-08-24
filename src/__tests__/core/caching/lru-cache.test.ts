/**
 * @file Comprehensive tests for LRU Cache implementation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LRUCache, ResizableLRUCache, type CacheMetrics } from '../../../core/caching/lru-cache';

describe('LRUCache', () => {
    let cache: LRUCache<string, string>;

    beforeEach(() => {
        cache = new LRUCache<string, string>(3);
    });

    describe('constructor', () => {
        it('should create cache with default size', () => {
            const defaultCache = new LRUCache();
            expect((defaultCache as any).maxSize).toBe(100);
            expect(defaultCache.capacity).toBe(100);
        });

        it('should create cache with specified size', () => {
            const customCache = new LRUCache(10);
            expect((customCache as any).maxSize).toBe(10);
            expect(customCache.capacity).toBe(10);
        });

        it('should throw error for invalid size', () => {
            expect(() => new LRUCache(0)).toThrow('Cache size must be at least 1');
            expect(() => new LRUCache(-1)).toThrow('Cache size must be at least 1');
        });
    });

    describe('basic operations', () => {
        it('should set and get values', () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');
            expect(cache.size).toBe(1);
        });

        it('should return undefined for non-existent keys', () => {
            expect(cache.get('nonexistent')).toBeUndefined();
        });

        it('should check if key exists', () => {
            cache.set('key1', 'value1');
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('nonexistent')).toBe(false);
        });

        it('should delete keys', () => {
            cache.set('key1', 'value1');
            expect(cache.delete('key1')).toBe(true);
            expect(cache.has('key1')).toBe(false);
            expect(cache.delete('nonexistent')).toBe(false);
        });

        it('should clear all entries', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.clear();
            expect(cache.size).toBe(0);
            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(false);
        });
    });

    describe('LRU behavior', () => {
        it('should maintain LRU order', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            
            // Access key1 to make it most recently used
            cache.get('key1');
            
            // Add key4, should evict key2 (least recently used)
            cache.set('key4', 'value4');
            
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false); // Evicted
            expect(cache.has('key3')).toBe(true);
            expect(cache.has('key4')).toBe(true);
        });

        it('should update position when getting existing key', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            
            // Get key1 to move it to end
            cache.get('key1');
            
            // Add new key, should evict key2
            cache.set('key4', 'value4');
            
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
        });

        it('should update position when setting existing key', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            
            // Update key1 to move it to end
            cache.set('key1', 'updated_value1');
            
            // Add new key, should evict key2
            cache.set('key4', 'value4');
            
            expect(cache.get('key1')).toBe('updated_value1');
            expect(cache.has('key2')).toBe(false);
        });
    });

    describe('metrics', () => {
        it('should track hits and misses', () => {
            cache.set('key1', 'value1');
            
            // Hit
            cache.get('key1');
            
            // Miss
            cache.get('nonexistent');
            
            const metrics = cache.getMetrics();
            expect(metrics.hits).toBe(1);
            expect(metrics.misses).toBe(1);
            expect(metrics.hitRatio).toBe(0.5);
        });

        it('should calculate hit ratio correctly', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            // 3 hits
            cache.get('key1');
            cache.get('key1');
            cache.get('key2');
            
            // 1 miss
            cache.get('nonexistent');
            
            const metrics = cache.getMetrics();
            expect(metrics.hitRatio).toBe(0.75);
        });

        it('should handle zero operations', () => {
            const metrics = cache.getMetrics();
            expect(metrics.hits).toBe(0);
            expect(metrics.misses).toBe(0);
            expect(metrics.hitRatio).toBe(0);
        });

        it('should track size and utilization', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            const metrics = cache.getMetrics();
            expect(metrics.size).toBe(2);
            expect(metrics.maxSize).toBe(3);
            expect(metrics.utilization).toBeCloseTo(2/3);
        });

        it('should reset metrics when clearing', () => {
            cache.set('key1', 'value1');
            cache.get('key1');
            cache.get('nonexistent');
            
            cache.clear();
            
            const metrics = cache.getMetrics();
            expect(metrics.hits).toBe(0);
            expect(metrics.misses).toBe(0);
        });
    });

    describe('resize functionality', () => {
        it('should set resize interval', () => {
            cache.setResizeInterval(5000);
            expect(() => cache.setResizeInterval(5000)).not.toThrow();
        });

        it('should throw error for invalid resize interval in non-test environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            expect(() => cache.setResizeInterval(500)).toThrow('Resize interval must be at least 1000ms');
            
            process.env.NODE_ENV = originalEnv;
        });

        it('should allow short intervals in test environment', () => {
            process.env.NODE_ENV = 'test';
            expect(() => cache.setResizeInterval(100)).not.toThrow();
        });

        it('should check if resize is needed', () => {
            jest.useFakeTimers();
            cache.setResizeInterval(100);
            expect(cache.shouldResize()).toBe(false);
            
            // Advance time by 150ms
            jest.advanceTimersByTime(150);
            expect(cache.shouldResize()).toBe(true);
            
            jest.useRealTimers();
        });

        it('should mark as resized', () => {
            cache.setResizeInterval(100);
            cache.markResized();
            expect(cache.shouldResize()).toBe(false);
        });
    });

    describe('iteration methods', () => {
        beforeEach(() => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
        });

        it('should iterate over keys in LRU order', () => {
            const keys = Array.from(cache.keys());
            expect(keys).toEqual(['key1', 'key2', 'key3']);
        });

        it('should iterate over values in LRU order', () => {
            const values = Array.from(cache.values());
            expect(values).toEqual(['value1', 'value2', 'value3']);
        });

        it('should iterate over entries in LRU order', () => {
            const entries = Array.from(cache.entries());
            expect(entries).toEqual([
                ['key1', 'value1'],
                ['key2', 'value2'],
                ['key3', 'value3']
            ]);
        });

        it('should support forEach iteration', () => {
            const mockCallback = jest.fn();
            cache.forEach(mockCallback);
            
            expect(mockCallback).toHaveBeenCalledTimes(3);
            expect(mockCallback).toHaveBeenCalledWith('value1', 'key1', cache);
            expect(mockCallback).toHaveBeenCalledWith('value2', 'key2', cache);
            expect(mockCallback).toHaveBeenCalledWith('value3', 'key3', cache);
        });
    });

    describe('edge cases', () => {
        it('should handle single-item cache', () => {
            const singleCache = new LRUCache<string, string>(1);
            singleCache.set('key1', 'value1');
            singleCache.set('key2', 'value2');
            
            expect(singleCache.has('key1')).toBe(false);
            expect(singleCache.has('key2')).toBe(true);
            expect(singleCache.size).toBe(1);
        });

        it('should handle numeric keys', () => {
            const numCache = new LRUCache<number, string>(3);
            numCache.set(1, 'value1');
            numCache.set(2, 'value2');
            
            expect(numCache.get(1)).toBe('value1');
            expect(numCache.has(2)).toBe(true);
        });

        it('should handle symbol keys', () => {
            const sym1 = Symbol('key1');
            const sym2 = Symbol('key2');
            const symCache = new LRUCache<symbol, string>(3);
            
            symCache.set(sym1, 'value1');
            symCache.set(sym2, 'value2');
            
            expect(symCache.get(sym1)).toBe('value1');
            expect(symCache.has(sym2)).toBe(true);
        });

        it('should handle complex values', () => {
            const objCache = new LRUCache<string, object>(3);
            const obj1 = { data: 'test' };
            const obj2 = [1, 2, 3];
            
            objCache.set('obj1', obj1);
            objCache.set('obj2', obj2);
            
            expect(objCache.get('obj1')).toBe(obj1);
            expect(objCache.get('obj2')).toBe(obj2);
        });
    });
});

describe('ResizableLRUCache', () => {
    let cache: ResizableLRUCache<string, string>;

    beforeEach(() => {
        cache = new ResizableLRUCache<string, string>(5);
    });

    describe('constructor', () => {
        it('should create cache with default size', () => {
            const defaultCache = new ResizableLRUCache();
            expect(defaultCache.maxSize).toBe(100);
            expect(defaultCache.capacity).toBe(100);
        });

        it('should create cache with specified size', () => {
            expect(cache.maxSize).toBe(5);
            expect(cache.capacity).toBe(5);
        });
    });

    describe('resizing functionality', () => {
        beforeEach(() => {
            // Fill cache
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            cache.set('key4', 'value4');
            cache.set('key5', 'value5');
        });

        it('should increase cache size', () => {
            cache.setMaxSize(10);
            expect(cache.maxSize).toBe(10);
            expect(cache.capacity).toBe(10);
            expect(cache.size).toBe(5); // All items should remain
        });

        it('should decrease cache size and evict items', () => {
            cache.setMaxSize(3);
            expect(cache.maxSize).toBe(3);
            expect(cache.size).toBe(3);
            
            // Should keep most recently used items
            expect(cache.has('key3')).toBe(true);
            expect(cache.has('key4')).toBe(true);
            expect(cache.has('key5')).toBe(true);
            
            // Should evict least recently used items
            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(false);
        });

        it('should throw error for invalid size', () => {
            expect(() => cache.setMaxSize(0)).toThrow('Cache size must be at least 1');
            expect(() => cache.setMaxSize(-1)).toThrow('Cache size must be at least 1');
        });

        it('should handle resizing to size 1', () => {
            cache.setMaxSize(1);
            expect(cache.size).toBe(1);
            expect(cache.has('key5')).toBe(true); // Most recent
        });

        it('should handle empty cache resize', () => {
            const emptyCache = new ResizableLRUCache<string, string>(5);
            emptyCache.setMaxSize(10);
            expect(emptyCache.maxSize).toBe(10);
            expect(emptyCache.size).toBe(0);
        });
    });

    describe('metrics with resizing', () => {
        it('should update metrics after resize', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            let metrics = cache.getMetrics();
            expect(metrics.maxSize).toBe(5);
            expect(metrics.utilization).toBe(0.4);
            
            cache.setMaxSize(10);
            metrics = cache.getMetrics();
            expect(metrics.maxSize).toBe(10);
            expect(metrics.utilization).toBe(0.2);
        });

        it('should maintain hit/miss tracking through resize', () => {
            cache.set('key1', 'value1');
            cache.get('key1'); // Hit
            cache.get('nonexistent'); // Miss
            
            cache.setMaxSize(10);
            
            const metrics = cache.getMetrics();
            expect(metrics.hits).toBe(1);
            expect(metrics.misses).toBe(1);
            expect(metrics.hitRatio).toBe(0.5);
        });
    });

    describe('inheritance behavior', () => {
        it('should inherit all LRU functionality', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            expect(cache.get('key1')).toBe('value1');
            expect(cache.has('key2')).toBe(true);
            expect(cache.delete('key1')).toBe(true);
            expect(cache.size).toBe(1);
        });

        it('should support all iteration methods', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            expect(Array.from(cache.keys())).toEqual(['key1', 'key2']);
            expect(Array.from(cache.values())).toEqual(['value1', 'value2']);
            expect(Array.from(cache.entries())).toEqual([['key1', 'value1'], ['key2', 'value2']]);
        });

        it('should support forEach', () => {
            cache.set('key1', 'value1');
            const mockCallback = jest.fn();
            cache.forEach(mockCallback);
            expect(mockCallback).toHaveBeenCalledWith('value1', 'key1', expect.any(Object));
        });
    });

    describe('edge cases', () => {
        it('should handle resize during iteration', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            
            const keys = [];
            for (const key of cache.keys()) {
                keys.push(key);
                if (key === 'key2') {
                    cache.setMaxSize(2); // Resize during iteration
                }
            }
            
            expect(keys.length).toBeGreaterThan(0);
        });

        it('should handle multiple rapid resizes', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            cache.setMaxSize(1);
            cache.setMaxSize(10);
            cache.setMaxSize(3);
            
            expect(cache.maxSize).toBe(3);
            expect(cache.size).toBeLessThanOrEqual(3);
        });
    });
});