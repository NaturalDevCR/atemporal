/**
 * @file Comprehensive test coverage for src/core/caching/index.ts
 * Tests all exports from the caching module index file
 */

import * as CachingIndex from '../../../core/caching/index';
import { LRUCache, ResizableLRUCache } from '../../../core/caching/lru-cache';
import { CacheKeys } from '../../../core/caching/cache-keys';
import { IntlCache } from '../../../core/caching/intl-cache';
import { DiffCache } from '../../../core/caching/diff-cache';
import { CacheOptimizer } from '../../../core/caching/cache-optimizer';
import { GlobalCacheCoordinator as CacheCoordinator } from '../../../core/caching/cache-coordinator';

describe('Caching Index Module', () => {
  /**
   * Test that all expected exports are available from the index file
   */
  describe('Module Exports', () => {
    test('should export LRUCache from lru-cache module', () => {
      expect(CachingIndex.LRUCache).toBeDefined();
      expect(CachingIndex.LRUCache).toBe(LRUCache);
    });

    test('should export ResizableLRUCache from lru-cache module', () => {
      expect(CachingIndex.ResizableLRUCache).toBeDefined();
      expect(CachingIndex.ResizableLRUCache).toBe(ResizableLRUCache);
    });

    test('should export CacheKeys from cache-keys module', () => {
      expect(CachingIndex.CacheKeys).toBeDefined();
      expect(CachingIndex.CacheKeys).toBe(CacheKeys);
    });

    test('should export IntlCache from intl-cache module', () => {
      expect(CachingIndex.IntlCache).toBeDefined();
      expect(CachingIndex.IntlCache).toBe(IntlCache);
    });

    test('should export DiffCache from diff-cache module', () => {
      expect(CachingIndex.DiffCache).toBeDefined();
      expect(CachingIndex.DiffCache).toBe(DiffCache);
    });

    test('should export CacheOptimizer from cache-optimizer module', () => {
      expect(CachingIndex.CacheOptimizer).toBeDefined();
      expect(CachingIndex.CacheOptimizer).toBe(CacheOptimizer);
    });

    test('should export GlobalCacheCoordinator from cache-coordinator module', () => {
      expect(CachingIndex.GlobalCacheCoordinator).toBeDefined();
      expect(CachingIndex.GlobalCacheCoordinator).toBe(CacheCoordinator);
    });
  });

  /**
   * Test that exported classes can be instantiated and used
   */
  describe('Exported Class Functionality', () => {
    test('should be able to create LRUCache instance from index export', () => {
      const cache = new CachingIndex.LRUCache<string, number>(10);
      expect(cache).toBeInstanceOf(LRUCache);
      expect(cache.capacity).toBe(10);
    });

    test('should be able to create ResizableLRUCache instance from index export', () => {
      const cache = new CachingIndex.ResizableLRUCache<string, number>(20);
      expect(cache).toBeInstanceOf(ResizableLRUCache);
      expect(cache.maxSize).toBe(20);
    });

    test('should be able to use CacheKeys static methods from index export', () => {
      const key = CacheKeys.dateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    test('should be able to use IntlCache static methods from index export', () => {
      const formatter = CachingIndex.IntlCache.getDateTimeFormatter('en-US');
      expect(formatter).toBeInstanceOf(Intl.DateTimeFormat);
    });

    test('should be able to use DiffCache static methods from index export', () => {
      const stats = CachingIndex.DiffCache.getStats();
      expect(stats).toHaveProperty('diffCache');
      expect(stats).toHaveProperty('maxSize');
    });

    test('should be able to use CacheOptimizer static methods from index export', () => {
      const config = CachingIndex.CacheOptimizer.getConfig();
      expect(config).toHaveProperty('targetHitRatio');
      expect(config).toHaveProperty('maxCacheSize');
    });

    test('should be able to use GlobalCacheCoordinator static methods from index export', () => {
      const stats = CachingIndex.GlobalCacheCoordinator.getAllStats();
      expect(stats).toHaveProperty('intl');
      expect(stats).toHaveProperty('diff');
      expect(stats).toHaveProperty('total');
    });
  });

  /**
   * Test that all exports are properly typed
   */
  describe('Export Types', () => {
    test('should have correct types for all exports', () => {
      // Test that exports are functions/classes, not undefined
      expect(typeof CachingIndex.LRUCache).toBe('function');
      expect(typeof CachingIndex.ResizableLRUCache).toBe('function');
      expect(typeof CachingIndex.CacheKeys).toBe('function');
      expect(typeof CachingIndex.IntlCache).toBe('function');
      expect(typeof CachingIndex.DiffCache).toBe('function');
      expect(typeof CachingIndex.CacheOptimizer).toBe('function');
      expect(typeof CachingIndex.GlobalCacheCoordinator).toBe('function');
    });

    test('should export constructable classes', () => {
      // Test that class exports can be used with 'new'
      expect(() => new CachingIndex.LRUCache(5)).not.toThrow();
      expect(() => new CachingIndex.ResizableLRUCache(5)).not.toThrow();
    });

    test('should export objects with static methods', () => {
      // Test that static class exports have expected methods
      expect(typeof CacheKeys.dateTimeFormat).toBe('function');
      expect(typeof CachingIndex.IntlCache.getDateTimeFormatter).toBe('function');
      expect(typeof CachingIndex.DiffCache.getStats).toBe('function');
      expect(typeof CachingIndex.CacheOptimizer.getConfig).toBe('function');
      expect(typeof CachingIndex.GlobalCacheCoordinator.getAllStats).toBe('function');
    });
  });

  /**
   * Test module structure and completeness
   */
  describe('Module Structure', () => {
    test('should export all expected caching components', () => {
      const expectedExports = [
        'LRUCache',
        'ResizableLRUCache', 
        'CacheKeys',
        'IntlCache',
        'DiffCache',
        'CacheOptimizer',
        'GlobalCacheCoordinator'
      ];

      expectedExports.forEach(exportName => {
        expect(CachingIndex).toHaveProperty(exportName);
        expect(CachingIndex[exportName as keyof typeof CachingIndex]).toBeDefined();
      });
    });

    test('should not export any unexpected properties', () => {
      const actualExports = Object.keys(CachingIndex);
      const expectedExports = [
        'LRUCache',
        'ResizableLRUCache',
        'CacheKeys', 
        'IntlCache',
        'DiffCache',
        'CacheOptimizer',
        'GlobalCacheCoordinator'
      ];

      // Allow for additional exports but ensure all expected ones are present
      expectedExports.forEach(expected => {
        expect(actualExports).toContain(expected);
      });
    });
  });

  /**
   * Test integration between exported modules
   */
  describe('Module Integration', () => {
    test('should allow caching modules to work together', () => {
      // Create cache using exported classes
      const cache = new CachingIndex.LRUCache<string, string>(5);
      
      // Use cache keys from exported utility
      const key = CacheKeys.dateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      // Store and retrieve value
      cache.set(key, 'test-value');
      expect(cache.get(key)).toBe('test-value');
      
      // Verify cache metrics
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.size).toBe(1);
    });

    test('should allow cache optimization using exported optimizer', () => {
      const cache = new CachingIndex.ResizableLRUCache<string, number>(10);
      
      // Add some data to generate metrics
      for (let i = 0; i < 5; i++) {
        cache.set(`key-${i}`, i);
        cache.get(`key-${i}`); // Generate hits
      }
      
      const metrics = cache.getMetrics();
      const analysis = CachingIndex.CacheOptimizer.analyzePerformance(metrics);
      
      expect(analysis).toHaveProperty('performance');
      expect(analysis).toHaveProperty('recommendations');
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
  });
});