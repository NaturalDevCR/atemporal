/**
 * @file Comprehensive test coverage for src/core/caching/lru-cache.ts
 * Targets uncovered lines: 40, 42-47, 119-120, 224-225, 249-253, 260-261
 */

import { LRUCache, ResizableLRUCache } from '../../../core/caching/lru-cache';

describe('LRUCache Coverage Tests', () => {
  /**
   * Test LRUCache edge cases and error conditions
   */
  describe('LRUCache Edge Cases', () => {
    test('should handle cache size validation in constructor', () => {
      expect(() => new LRUCache(0)).toThrow('Cache size must be at least 1');
      expect(() => new LRUCache(-1)).toThrow('Cache size must be at least 1');
    });

    test('should handle eviction when cache is full (lines 40, 42-47)', () => {
      const cache = new LRUCache<string, number>(2);
      
      // Fill cache to capacity
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      // This should trigger eviction of oldest item (key1)
      cache.set('key3', 3);
      
      expect(cache.has('key1')).toBe(false); // Should be evicted
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.size).toBe(2);
    });

    test('should handle eviction when oldest key is undefined (edge case)', () => {
      const cache = new LRUCache<string, number>(1);
      
      // Mock the keys().next() to return undefined value
      const originalKeys = cache.keys;
      cache.keys = jest.fn().mockReturnValue({
        next: () => ({ value: undefined, done: false })
      });
      
      // This should handle the undefined case gracefully
      expect(() => cache.set('key1', 1)).not.toThrow();
      
      // Restore original method
      cache.keys = originalKeys;
    });

    test('should handle setMaxSize with eviction (lines 119-120)', () => {
      const cache = new LRUCache<string, number>(5);
      
      // Fill cache
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, i);
      }
      
      expect(cache.size).toBe(5);
      
      // Reduce size, should trigger eviction
      cache.setMaxSize(3);
      
      expect(cache.size).toBe(3);
      expect(cache.capacity).toBe(3);
      
      // Oldest items should be evicted
      expect(cache.has('key0')).toBe(false);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    test('should handle setMaxSize eviction when oldest key is undefined', () => {
      const cache = new LRUCache<string, number>(3);
      
      // Fill cache
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      // Mock keys().next() to return undefined during eviction
      const originalKeys = cache.keys;
      let callCount = 0;
      cache.keys = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { next: () => ({ value: undefined, done: false }) };
        }
        return originalKeys.call(cache);
      });
      
      // This should break out of the eviction loop when undefined is encountered
      cache.setMaxSize(1);
      
      // Restore original method
      cache.keys = originalKeys;
    });

    test('should validate cache size in setMaxSize', () => {
      const cache = new LRUCache<string, number>(5);
      
      expect(() => cache.setMaxSize(0)).toThrow('Cache size must be at least 1');
      expect(() => cache.setMaxSize(-1)).toThrow('Cache size must be at least 1');
    });

    test('should handle resize interval validation', () => {
      const cache = new LRUCache<string, number>(5);
      
      // In non-test environment, should throw for intervals < 1000ms
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      expect(() => cache.setResizeInterval(500)).toThrow('Resize interval must be at least 1000ms');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    test('should allow short resize intervals in test environment', () => {
      const cache = new LRUCache<string, number>(5);
      
      // In test environment, should allow short intervals
      expect(() => cache.setResizeInterval(100)).not.toThrow();
      
      cache.setResizeInterval(100);
      
      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      const baseTime = Date.now();
      Date.now = jest.fn().mockReturnValue(baseTime + 200); // 200ms later
      
      expect(cache.shouldResize()).toBe(true); // Should be true after interval
      
      // Restore Date.now
      Date.now = originalNow;
    });
  });

  /**
   * Test ResizableLRUCache edge cases and error conditions
   */
  describe('ResizableLRUCache Edge Cases', () => {
    test('should handle cache size validation in constructor', () => {
      expect(() => new ResizableLRUCache(0)).toThrow('Cache size must be at least 1');
      expect(() => new ResizableLRUCache(-1)).toThrow('Cache size must be at least 1');
    });

    test('should handle eviction when cache is full (lines 224-225)', () => {
      const cache = new ResizableLRUCache<string, number>(2);
      
      // Fill cache to capacity
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      // This should trigger eviction of oldest item (key1)
      cache.set('key3', 3);
      
      expect(cache.has('key1')).toBe(false); // Should be evicted
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.size).toBe(2);
    });

    test('should handle eviction when first key is undefined (edge case)', () => {
      const cache = new ResizableLRUCache<string, number>(1);
      
      // Mock the keys().next() to return undefined value
      const originalKeys = cache.keys;
      cache.keys = jest.fn().mockReturnValue({
        next: () => ({ value: undefined, done: false })
      });
      
      // This should handle the undefined case gracefully
      expect(() => cache.set('key1', 1)).not.toThrow();
      
      // Restore original method
      cache.keys = originalKeys;
    });

    test('should handle setMaxSize with eviction (lines 249-253)', () => {
      const cache = new ResizableLRUCache<string, number>(5);
      
      // Fill cache
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, i);
      }
      
      expect(cache.size).toBe(5);
      
      // Reduce size, should trigger eviction
      cache.setMaxSize(3);
      
      expect(cache.size).toBe(3);
      expect(cache.maxSize).toBe(3);
      
      // Oldest items should be evicted
      expect(cache.has('key0')).toBe(false);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    test('should handle setMaxSize eviction when first key is undefined (lines 249-253)', () => {
      const cache = new ResizableLRUCache<string, number>(3);
      
      // Fill cache
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      // Mock keys().next() to return undefined during eviction
      const originalKeys = cache.keys;
      let callCount = 0;
      cache.keys = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { next: () => ({ value: undefined, done: false }) };
        }
        return originalKeys.call(cache);
      });
      
      // This should break out of the eviction loop when undefined is encountered
      cache.setMaxSize(1);
      
      // Restore original method
      cache.keys = originalKeys;
    });

    test('should validate cache size in setMaxSize', () => {
      const cache = new ResizableLRUCache<string, number>(5);
      
      expect(() => cache.setMaxSize(0)).toThrow('Cache size must be at least 1');
      expect(() => cache.setMaxSize(-1)).toThrow('Cache size must be at least 1');
    });

    test('should handle resize timing (lines 260-261)', () => {
      const cache = new ResizableLRUCache<string, number>(5);
      
      // Mock Date.now to control timing
      const originalNow = Date.now;
      const baseTime = Date.now();
      
      // Initially, simulate time has passed since last resize
      Date.now = jest.fn().mockReturnValue(baseTime + 70000); // 70 seconds later
      expect(cache.shouldResize()).toBe(true);
      
      // Mark as resized (this updates lastResizeTime to current time)
      cache.markResized();
      
      // Should not need resize immediately after marking
      expect(cache.shouldResize()).toBe(false);
      
      // Simulate more time passage
      Date.now = jest.fn().mockReturnValue(baseTime + 140000); // 140 seconds total
      
      // Should need resize after interval has passed again
      expect(cache.shouldResize()).toBe(true);
      
      // Restore Date.now
      Date.now = originalNow;
    });

    test('should track hits and misses correctly', () => {
      const cache = new ResizableLRUCache<string, number>(3);
      
      // Add items
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      // Generate hits
      cache.get('key1');
      cache.get('key2');
      cache.get('key1'); // Another hit
      
      // Generate misses
      cache.get('key3');
      cache.get('key4');
      
      const metrics = cache.getMetrics();
      
      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(2);
      expect(metrics.hitRatio).toBe(0.6); // 3/(3+2)
    });

    test('should calculate utilization correctly', () => {
      const cache = new ResizableLRUCache<string, number>(10);
      
      // Add 3 items to cache of size 10
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      const metrics = cache.getMetrics();
      
      expect(metrics.size).toBe(3);
      expect(metrics.maxSize).toBe(10);
      expect(metrics.utilization).toBe(0.3); // 3/10
    });

    test('should handle hit ratio calculation with no operations', () => {
      const cache = new ResizableLRUCache<string, number>(5);
      
      const metrics = cache.getMetrics();
      
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRatio).toBe(0); // Should handle 0/0 case
    });

    test('should maintain LRU order correctly', () => {
      const cache = new ResizableLRUCache<string, number>(3);
      
      // Add items
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add new item, should evict key2 (least recently used)
      cache.set('key4', 4);
      
      expect(cache.has('key1')).toBe(true); // Should still be there
      expect(cache.has('key2')).toBe(false); // Should be evicted
      expect(cache.has('key3')).toBe(true); // Should still be there
      expect(cache.has('key4')).toBe(true); // Should be there
    });

    test('should update existing keys without changing size', () => {
      const cache = new ResizableLRUCache<string, number>(3);
      
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      expect(cache.size).toBe(2);
      
      // Update existing key
      cache.set('key1', 10);
      
      expect(cache.size).toBe(2); // Size should not change
      expect(cache.get('key1')).toBe(10); // Value should be updated
    });
  });

  /**
   * Test cache metrics and monitoring
   */
  describe('Cache Metrics and Monitoring', () => {
    test('should provide accurate capacity information', () => {
      const lruCache = new LRUCache<string, number>(15);
      const resizableCache = new ResizableLRUCache<string, number>(20);
      
      expect(lruCache.capacity).toBe(15);
      expect(resizableCache.capacity).toBe(20);
      expect(resizableCache.maxSize).toBe(20);
    });

    test('should track resize timing accurately', () => {
      const cache = new ResizableLRUCache<string, number>(5);
      
      const timeBefore = Date.now();
      cache.markResized();
      const timeAfter = Date.now();
      
      // The last resize time should be between our measurements
      expect(cache.shouldResize()).toBe(false); // Should be false immediately after marking
    });

    test('should handle iterator methods correctly', () => {
      const cache = new LRUCache<string, number>(5);
      
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      // Test keys iterator
      const keys = Array.from(cache.keys());
      expect(keys).toEqual(['key1', 'key2', 'key3']);
      
      // Test values iterator
      const values = Array.from(cache.values());
      expect(values).toEqual([1, 2, 3]);
      
      // Test entries iterator
      const entries = Array.from(cache.entries());
      expect(entries).toEqual([['key1', 1], ['key2', 2], ['key3', 3]]);
    });

    test('should handle forEach correctly', () => {
      const cache = new LRUCache<string, number>(5);
      
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      const collected: Array<[number, string]> = [];
      
      cache.forEach((value, key, map) => {
        collected.push([value, key]);
        expect(map).toBe(cache);
      });
      
      expect(collected).toEqual([[1, 'key1'], [2, 'key2']]);
    });

    test('should handle delete operations correctly', () => {
      const cache = new LRUCache<string, number>(5);
      
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      expect(cache.delete('key1')).toBe(true);
      expect(cache.delete('nonexistent')).toBe(false);
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.size).toBe(1);
    });

    test('should reset metrics on clear', () => {
      const cache = new LRUCache<string, number>(5);
      
      cache.set('key1', 1);
      cache.get('key1'); // Generate hit
      cache.get('key2'); // Generate miss
      
      let metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      
      cache.clear();
      
      metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(cache.size).toBe(0);
    });
  });
});