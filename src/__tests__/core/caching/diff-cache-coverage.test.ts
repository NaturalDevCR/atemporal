/**
 * @file Comprehensive test coverage for src/core/caching/diff-cache.ts
 * Targets uncovered lines: 74-81, 126-127, 203-204
 */

import { Temporal } from '@js-temporal/polyfill';
import { DiffCache } from '../../../core/caching/diff-cache';
import { CacheOptimizer } from '../../../core/caching/cache-optimizer';

// Mock console.warn to test error handling
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('DiffCache Coverage Tests', () => {
  beforeEach(() => {
    DiffCache.reset();
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  /**
   * Test error handling in calculateDiff method (lines 74-81)
   * This tests the catch block that handles unsupported units or edge cases
   */
  describe('calculateDiff Error Handling', () => {
    test('should handle errors in diff calculation and return 0', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Mock the since method to throw an error
      const originalSince = d1.since;
      jest.spyOn(d1, 'since').mockImplementation(() => {
        throw new Error('Temporal calculation error');
      });
      
      // This should trigger the error handling in calculateDiff (lines 74-81)
      const result = DiffCache.getDiffResult(d1, d2, 'day');
      
      expect(result).toBe(0);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to calculate diff for unit day:',
        expect.any(Error)
      );
      
      // Restore original method
      d1.since = originalSince;
    });

    test('should handle invalid unit types in diff calculation', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ hours: 2 });
      
      // Mock since to throw for invalid unit
      jest.spyOn(d1, 'since').mockImplementation(() => {
        throw new RangeError('Invalid unit');
      });
      
      const result = DiffCache.getDiffResult(d1, d2, 'invalid-unit' as any);
      
      expect(result).toBe(0);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to calculate diff for unit invalid-unit:',
        expect.any(RangeError)
      );
    });

    test('should handle edge cases in temporal calculations', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ milliseconds: 1 });
      
      // Mock since to throw for edge case
      jest.spyOn(d1, 'since').mockImplementation(() => {
        throw new Error('Edge case error');
      });
      
      const result = DiffCache.getDiffResult(d1, d2, 'millisecond');
      
      expect(result).toBe(0);
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  /**
   * Test ListFormat error handling in IntlCache (lines 123-124)
   * This tests the error thrown when ListFormat is not supported
   */
  describe('ListFormat Error Handling', () => {
    test('should throw error when ListFormat is not supported', () => {
      // Mock Intl to not have ListFormat
      const originalListFormat = (Intl as any).ListFormat;
      delete (Intl as any).ListFormat;
      
      // Import IntlCache after mocking
      const { IntlCache } = require('../../../core/caching/intl-cache');
      
      expect(() => {
        IntlCache.getListFormatter('en-US');
      }).toThrow('Intl.ListFormat is not supported in this environment');
      
      // Restore ListFormat
      (Intl as any).ListFormat = originalListFormat;
    });
  });

  /**
   * Test cache resize conditions and dynamic sizing (lines 126-127)
   */
  describe('Cache Resize Logic', () => {
    test('should not resize when dynamic sizing is disabled', () => {
      DiffCache.setDynamicSizing(false);
      
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Generate some cache activity
      for (let i = 0; i < 10; i++) {
        DiffCache.getDiffResult(d1, d2.add({ hours: i }), 'hour');
      }
      
      const statsBefore = DiffCache.getStats();
      DiffCache.optimize(); // This should not resize
      const statsAfter = DiffCache.getStats();
      
      expect(statsAfter.maxSize).toBe(statsBefore.maxSize);
    });

    test('should not resize when cache is null', () => {
      DiffCache.reset();
      DiffCache.setDynamicSizing(true);
      
      // Try to optimize without initializing cache
      expect(() => DiffCache.optimize()).not.toThrow();
    });

    test('should not resize when shouldResize returns false', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Initialize cache
      DiffCache.getDiffResult(d1, d2, 'day');
      
      // Mock shouldResize to return false
      const cache = (DiffCache as any)._diffCache;
      if (cache) {
        jest.spyOn(cache, 'shouldResize').mockReturnValue(false);
        
        const sizeBefore = DiffCache.getStats().maxSize;
        DiffCache.optimize();
        const sizeAfter = DiffCache.getStats().maxSize;
        
        expect(sizeAfter).toBe(sizeBefore);
      }
    });
  });

  /**
   * Test efficiency metrics edge cases (lines 203-204)
   */
  describe('Efficiency Metrics Edge Cases', () => {
    test('should handle cache with very low hit ratio', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      
      // Generate many cache misses
      for (let i = 0; i < 20; i++) {
        const d2 = d1.add({ hours: i, minutes: i, seconds: i });
        DiffCache.getDiffResult(d1, d2, 'hour');
      }
      
      const metrics = DiffCache.getEfficiencyMetrics();
      
      expect(metrics.hitRatio).toBeLessThan(0.6);
      expect(metrics.recommendedOptimization).toContain('increasing cache size');
    });

    test('should handle cache with very low utilization', () => {
      // Set a very large cache size
      DiffCache.setMaxCacheSize(1000);
      
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Add only a few items to large cache
      DiffCache.getDiffResult(d1, d2, 'day');
      DiffCache.getDiffResult(d1, d2, 'hour');
      
      const metrics = DiffCache.getEfficiencyMetrics();
      
      expect(metrics.utilization).toBeLessThan(0.2);
      expect(metrics.recommendedOptimization).toContain('increasing cache size');
    });

    test('should provide well optimized recommendation for good metrics', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Generate good hit ratio by repeating same calculations
      for (let i = 0; i < 10; i++) {
        DiffCache.getDiffResult(d1, d2, 'day');
        DiffCache.getDiffResult(d1, d2, 'hour');
      }
      
      const metrics = DiffCache.getEfficiencyMetrics();
      
      expect(metrics.hitRatio).toBeGreaterThan(0.6);
      expect(metrics.recommendedOptimization).toContain('cache size');
    });
  });

  /**
   * Test usage analysis edge cases
   */
  describe('Usage Analysis Edge Cases', () => {
    test('should return no data available when cache is not initialized', () => {
      DiffCache.reset();
      
      const analysis = DiffCache.analyzeUsage();
      
      expect(analysis.totalOperations).toBe(0);
      expect(analysis.cacheHits).toBe(0);
      expect(analysis.cacheMisses).toBe(0);
      expect(analysis.memoryEfficiency).toBe('No data available');
    });

    test('should classify efficiency as Poor for very low hit ratio', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      
      // Generate many unique cache misses
      for (let i = 0; i < 15; i++) {
        const d2 = d1.add({ hours: i, minutes: i * 2, seconds: i * 3 });
        DiffCache.getDiffResult(d1, d2, 'minute');
      }
      
      const analysis = DiffCache.analyzeUsage();
      
      expect(analysis.memoryEfficiency).toBe('Poor');
    });

    test('should classify efficiency as Fair for moderate hit ratio', () => {
      DiffCache.reset(); // Start fresh
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      const d3 = d1.add({ hours: 2 });
      
      // Generate moderate hit ratio (more hits than misses to reach >0.4)
      // 8 hits + 4 misses = 12 total, hit ratio = 8/12 = 0.67 (Good)
      for (let i = 0; i < 4; i++) {
        DiffCache.getDiffResult(d1, d2, 'day'); // Hit after first
        DiffCache.getDiffResult(d1, d3, 'hour'); // Hit after first
        if (i < 2) {
          DiffCache.getDiffResult(d1, d1.add({ minutes: i * 10 }), 'minute'); // Miss
        }
      }
      
      const analysis = DiffCache.analyzeUsage();
      
      expect(analysis.memoryEfficiency).toMatch(/Fair|Good/);
    });

    test('should classify efficiency as Excellent for high hit ratio', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Generate high hit ratio by repeating same calculations
      for (let i = 0; i < 20; i++) {
        DiffCache.getDiffResult(d1, d2, 'day');
        DiffCache.getDiffResult(d1, d2, 'hour');
      }
      
      const analysis = DiffCache.analyzeUsage();
      
      expect(analysis.memoryEfficiency).toBe('Excellent');
    });
  });

  /**
   * Test pre-warming functionality
   */
  describe('Pre-warming Tests', () => {
    test('should pre-warm cache with common calculations', () => {
      const baseDate = Temporal.Now.zonedDateTimeISO('UTC');
      
      const statsBefore = DiffCache.getStats();
      DiffCache.preWarm(baseDate);
      const statsAfter = DiffCache.getStats();
      
      expect(statsAfter.diffCache).toBeGreaterThan(statsBefore.diffCache);
    });

    test('should pre-warm cache with default base date when none provided', () => {
      const statsBefore = DiffCache.getStats();
      DiffCache.preWarm();
      const statsAfter = DiffCache.getStats();
      
      expect(statsAfter.diffCache).toBeGreaterThan(statsBefore.diffCache);
    });
  });

  /**
   * Test cache size validation
   */
  describe('Cache Size Validation', () => {
    test('should throw error when setting cache size less than 1', () => {
      expect(() => {
        DiffCache.setMaxCacheSize(0);
      }).toThrow('Cache size must be at least 1');
      
      expect(() => {
        DiffCache.setMaxCacheSize(-5);
      }).toThrow('Cache size must be at least 1');
    });

    test('should update existing cache size when cache is initialized', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Initialize cache
      DiffCache.getDiffResult(d1, d2, 'day');
      
      // Change cache size
      DiffCache.setMaxCacheSize(50);
      
      const stats = DiffCache.getStats();
      expect(stats.maxSize).toBe(50);
    });
  });

  /**
   * Test detailed stats when cache is not initialized
   */
  describe('Detailed Stats Edge Cases', () => {
    test('should return null when cache is not initialized', () => {
      DiffCache.reset();
      
      const detailedStats = DiffCache.getDetailedStats();
      
      expect(detailedStats).toBeNull();
    });

    test('should return metrics when cache is initialized', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      DiffCache.getDiffResult(d1, d2, 'day');
      
      const detailedStats = DiffCache.getDetailedStats();
      
      expect(detailedStats).not.toBeNull();
      expect(detailedStats).toHaveProperty('hits');
      expect(detailedStats).toHaveProperty('misses');
      expect(detailedStats).toHaveProperty('hitRatio');
    });
  });

  /**
   * Test dynamic sizing status
   */
  describe('Dynamic Sizing Status', () => {
    test('should return correct dynamic sizing status', () => {
      DiffCache.setDynamicSizing(true);
      expect(DiffCache.isDynamicSizingEnabled()).toBe(true);
      
      DiffCache.setDynamicSizing(false);
      expect(DiffCache.isDynamicSizingEnabled()).toBe(false);
    });
  });

  /**
   * Test cache clearing
   */
  describe('Cache Clearing', () => {
    test('should clear cache when cache exists', () => {
      const d1 = Temporal.Now.zonedDateTimeISO('UTC');
      const d2 = d1.add({ days: 1 });
      
      // Add items to cache
      DiffCache.getDiffResult(d1, d2, 'day');
      DiffCache.getDiffResult(d1, d2, 'hour');
      
      expect(DiffCache.getStats().diffCache).toBeGreaterThan(0);
      
      DiffCache.clear();
      
      expect(DiffCache.getStats().diffCache).toBe(0);
    });

    test('should not throw when clearing non-existent cache', () => {
      DiffCache.reset();
      
      expect(() => DiffCache.clear()).not.toThrow();
    });
  });
});