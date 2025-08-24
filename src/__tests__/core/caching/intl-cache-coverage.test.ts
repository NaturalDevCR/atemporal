/**
 * @file Comprehensive test coverage for src/core/caching/intl-cache.ts
 * Targets uncovered lines: 123-124, 156-163, 291-292
 */

import { IntlCache } from '../../../core/caching/intl-cache';
import { CacheOptimizer } from '../../../core/caching/cache-optimizer';

describe('IntlCache Coverage Tests', () => {
  beforeEach(() => {
    IntlCache.resetAll();
  });

  /**
   * Test ListFormat error handling (lines 123-124)
   * This tests the error thrown when ListFormat is not supported
   */
  describe('ListFormat Error Handling', () => {
    test('should throw error when ListFormat is not supported', () => {
      // Mock Intl to not have ListFormat
      const originalListFormat = (Intl as any).ListFormat;
      delete (Intl as any).ListFormat;
      
      expect(() => {
        IntlCache.getListFormatter('en-US');
      }).toThrow('Intl.ListFormat is not supported in this environment');
      
      // Restore ListFormat
      (Intl as any).ListFormat = originalListFormat;
    });

    test('should work normally when ListFormat is supported', () => {
      // Ensure ListFormat exists
      if (typeof (Intl as any).ListFormat !== 'undefined') {
        const formatter = IntlCache.getListFormatter('en-US', { style: 'long', type: 'conjunction' });
        expect(formatter).toBeDefined();
        expect(typeof formatter.format).toBe('function');
      }
    });

    test('should cache ListFormat instances', () => {
      if (typeof (Intl as any).ListFormat !== 'undefined') {
        const formatter1 = IntlCache.getListFormatter('en-US');
        const formatter2 = IntlCache.getListFormatter('en-US');
        
        expect(formatter1).toBe(formatter2); // Should be same cached instance
        
        const stats = IntlCache.getStats();
        expect(stats.listFormatters).toBe(1);
      }
    });
  });

  /**
   * Test cache resize logic (lines 156-163)
   * This tests the checkAndResizeCache method for specific cache types
   */
  describe('Cache Resize Logic', () => {
    test('should not resize when dynamic sizing is disabled', () => {
      IntlCache.setDynamicSizing(false);
      
      // Create some formatters to initialize caches
      IntlCache.getDateTimeFormatter('en-US');
      IntlCache.getRelativeTimeFormatter('en-US');
      IntlCache.getNumberFormatter('en-US');
      
      const statsBefore = IntlCache.getStats();
      IntlCache.optimize(); // This should not resize
      const statsAfter = IntlCache.getStats();
      
      expect(statsAfter.maxSize).toBe(statsBefore.maxSize);
    });

    test('should handle null cache in checkAndResizeCache', () => {
      IntlCache.resetAll();
      IntlCache.setDynamicSizing(true);
      
      // Try to optimize without initializing caches
      expect(() => IntlCache.optimize()).not.toThrow();
    });

    test('should not resize when shouldResize returns false', () => {
      // Initialize a cache
      IntlCache.getDateTimeFormatter('en-US');
      
      // Mock shouldResize to return false
      const cache = (IntlCache as any)._dateTimeFormatters;
      if (cache) {
        jest.spyOn(cache, 'shouldResize').mockReturnValue(false);
        
        const sizeBefore = IntlCache.getStats().maxSize;
        IntlCache.optimize();
        const sizeAfter = IntlCache.getStats().maxSize;
        
        expect(sizeAfter).toBe(sizeBefore);
      }
    });

    test('should resize when conditions are met', () => {
      // Initialize cache
      IntlCache.getDateTimeFormatter('en-US');
      
      const cache = (IntlCache as any)._dateTimeFormatters;
      if (cache) {
        // Mock shouldResize to return true
        jest.spyOn(cache, 'shouldResize').mockReturnValue(true);
        
        // Mock getMetrics to return metrics that would trigger resize
        jest.spyOn(cache, 'getMetrics').mockReturnValue({
          hits: 100,
          misses: 200,
          hitRatio: 0.33,
          size: 10,
          maxSize: 50,
          utilization: 0.2
        });
        
        // Mock CacheOptimizer to return different size
        jest.spyOn(CacheOptimizer, 'calculateOptimalSize').mockReturnValue(75);
        
        // Mock setMaxSize and markResized
        const setMaxSizeSpy = jest.spyOn(cache, 'setMaxSize');
        const markResizedSpy = jest.spyOn(cache, 'markResized');
        
        IntlCache.optimize();
        
        expect(setMaxSizeSpy).toHaveBeenCalledWith(75);
        expect(markResizedSpy).toHaveBeenCalled();
      }
    });
  });

  /**
   * Test efficiency metrics edge cases (lines 291-292)
   */
  describe('Efficiency Metrics Edge Cases', () => {
    test('should handle no caches initialized', () => {
      IntlCache.resetAll();
      
      const metrics = IntlCache.getEfficiencyMetrics();
      
      expect(metrics.averageHitRatio).toBe(0);
      expect(metrics.averageUtilization).toBe(0);
      expect(metrics.totalCacheSize).toBe(0);
      expect(metrics.recommendedOptimization).toBe('No caches initialized');
    });

    test('should calculate metrics for single cache', () => {
      // Initialize one cache
      IntlCache.getDateTimeFormatter('en-US');
      IntlCache.getDateTimeFormatter('es-ES');
      
      const metrics = IntlCache.getEfficiencyMetrics();
      
      expect(metrics.averageHitRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.averageUtilization).toBeGreaterThanOrEqual(0);
      expect(metrics.totalCacheSize).toBeGreaterThan(0);
      expect(typeof metrics.recommendedOptimization).toBe('string');
    });

    test('should calculate metrics for multiple caches', () => {
      // Initialize multiple caches
      IntlCache.getDateTimeFormatter('en-US');
      IntlCache.getRelativeTimeFormatter('en-US');
      IntlCache.getNumberFormatter('en-US');
      
      const metrics = IntlCache.getEfficiencyMetrics();
      
      expect(metrics.averageHitRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.averageUtilization).toBeGreaterThanOrEqual(0);
      expect(metrics.totalCacheSize).toBeGreaterThan(0);
    });

    test('should recommend increasing cache size for low hit ratio', () => {
      // Initialize cache
      IntlCache.getDateTimeFormatter('en-US');
      
      // Mock cache metrics to have low hit ratio
      const cache = (IntlCache as any)._dateTimeFormatters;
      if (cache) {
        jest.spyOn(cache, 'getMetrics').mockReturnValue({
          hits: 10,
          misses: 90,
          hitRatio: 0.1,
          size: 5,
          maxSize: 50,
          utilization: 0.1
        });
        
        const metrics = IntlCache.getEfficiencyMetrics();
        
        expect(metrics.averageHitRatio).toBeLessThan(0.7);
        expect(metrics.recommendedOptimization).toContain('increasing cache sizes');
      }
    });

    test('should recommend decreasing cache size for low utilization', () => {
      // Initialize cache
      IntlCache.getDateTimeFormatter('en-US');
      
      // Mock cache metrics to have low utilization but good hit ratio
      const cache = (IntlCache as any)._dateTimeFormatters;
      if (cache) {
        jest.spyOn(cache, 'getMetrics').mockReturnValue({
          hits: 80,
          misses: 20,
          hitRatio: 0.8,
          size: 2,
          maxSize: 100,
          utilization: 0.02
        });
        
        const metrics = IntlCache.getEfficiencyMetrics();
        
        expect(metrics.averageUtilization).toBeLessThan(0.3);
        expect(metrics.recommendedOptimization).toContain('decreasing cache sizes');
      }
    });

    test('should indicate well optimized caches', () => {
      // Initialize cache
      IntlCache.getDateTimeFormatter('en-US');
      
      // Mock cache metrics to have good performance
      const cache = (IntlCache as any)._dateTimeFormatters;
      if (cache) {
        jest.spyOn(cache, 'getMetrics').mockReturnValue({
          hits: 80,
          misses: 20,
          hitRatio: 0.8,
          size: 30,
          maxSize: 50,
          utilization: 0.6
        });
        
        const metrics = IntlCache.getEfficiencyMetrics();
        
        expect(metrics.averageHitRatio).toBeGreaterThanOrEqual(0.7);
        expect(metrics.averageUtilization).toBeGreaterThanOrEqual(0.3);
        expect(metrics.recommendedOptimization).toBe('Caches are well optimized');
      }
    });
  });

  /**
   * Test cache size validation and updates
   */
  describe('Cache Size Management', () => {
    test('should throw error when setting cache size less than 1', () => {
      expect(() => {
        IntlCache.setMaxCacheSize(0);
      }).toThrow('Cache size must be at least 1');
      
      expect(() => {
        IntlCache.setMaxCacheSize(-5);
      }).toThrow('Cache size must be at least 1');
    });

    test('should update all existing caches when setting max cache size', () => {
      // Initialize all cache types
      IntlCache.getDateTimeFormatter('en-US');
      IntlCache.getRelativeTimeFormatter('en-US');
      IntlCache.getNumberFormatter('en-US');
      if (typeof (Intl as any).ListFormat !== 'undefined') {
        IntlCache.getListFormatter('en-US');
      }
      
      // Change cache size
      IntlCache.setMaxCacheSize(75);
      
      const stats = IntlCache.getStats();
      expect(stats.maxSize).toBe(75 * 4); // Total maximum possible size
    });
  });

  /**
   * Test detailed stats edge cases
   */
  describe('Detailed Stats Edge Cases', () => {
    test('should return zero size metrics for uninitialized caches', () => {
      IntlCache.resetAll();
      
      const detailedStats = IntlCache.getDetailedStats();
      
      expect(detailedStats.dateTimeFormatters.size).toBe(0);
      expect(detailedStats.relativeTimeFormatters.size).toBe(0);
      expect(detailedStats.numberFormatters.size).toBe(0);
      expect(detailedStats.listFormatters.size).toBe(0);
      expect(detailedStats.dynamicSizingEnabled).toBe(true);
    });

    test('should return actual metrics for initialized caches', () => {
      IntlCache.getDateTimeFormatter('en-US');
      IntlCache.getDateTimeFormatter('es-ES');
      
      const detailedStats = IntlCache.getDetailedStats();
      
      expect(detailedStats.dateTimeFormatters.size).toBeGreaterThan(0);
      expect(detailedStats.dateTimeFormatters).toHaveProperty('hits');
      expect(detailedStats.dateTimeFormatters).toHaveProperty('misses');
      expect(detailedStats.dateTimeFormatters).toHaveProperty('hitRatio');
    });
  });

  /**
   * Test dynamic sizing status
   */
  describe('Dynamic Sizing Status', () => {
    test('should return correct dynamic sizing status', () => {
      IntlCache.setDynamicSizing(true);
      expect(IntlCache.isDynamicSizingEnabled()).toBe(true);
      
      IntlCache.setDynamicSizing(false);
      expect(IntlCache.isDynamicSizingEnabled()).toBe(false);
    });
  });

  /**
   * Test cache clearing
   */
  describe('Cache Clearing', () => {
    test('should clear all caches when they exist', () => {
      // Add items to all caches
      IntlCache.getDateTimeFormatter('en-US');
      IntlCache.getRelativeTimeFormatter('en-US');
      IntlCache.getNumberFormatter('en-US');
      
      expect(IntlCache.getStats().total).toBeGreaterThan(0);
      
      IntlCache.clearAll();
      
      expect(IntlCache.getStats().total).toBe(0);
    });

    test('should not throw when clearing non-existent caches', () => {
      IntlCache.resetAll();
      
      expect(() => IntlCache.clearAll()).not.toThrow();
    });
  });

  /**
   * Test formatter caching behavior
   */
  describe('Formatter Caching Behavior', () => {
    test('should cache DateTimeFormatter instances', () => {
      const formatter1 = IntlCache.getDateTimeFormatter('en-US', { year: 'numeric' });
      const formatter2 = IntlCache.getDateTimeFormatter('en-US', { year: 'numeric' });
      
      expect(formatter1).toBe(formatter2); // Should be same cached instance
    });

    test('should cache RelativeTimeFormatter instances', () => {
      const formatter1 = IntlCache.getRelativeTimeFormatter('en-US', { numeric: 'auto' });
      const formatter2 = IntlCache.getRelativeTimeFormatter('en-US', { numeric: 'auto' });
      
      expect(formatter1).toBe(formatter2); // Should be same cached instance
    });

    test('should cache NumberFormatter instances', () => {
      const formatter1 = IntlCache.getNumberFormatter('en-US', { style: 'decimal' });
      const formatter2 = IntlCache.getNumberFormatter('en-US', { style: 'decimal' });
      
      expect(formatter1).toBe(formatter2); // Should be same cached instance
    });

    test('should create different instances for different locales/options', () => {
      const formatter1 = IntlCache.getDateTimeFormatter('en-US');
      const formatter2 = IntlCache.getDateTimeFormatter('es-ES');
      const formatter3 = IntlCache.getDateTimeFormatter('en-US', { year: 'numeric' });
      
      expect(formatter1).not.toBe(formatter2);
      expect(formatter1).not.toBe(formatter3);
      expect(formatter2).not.toBe(formatter3);
    });
  });

  /**
   * Test cache resize triggering
   */
  describe('Cache Resize Triggering', () => {
    test('should trigger resize check on formatter access', () => {
      IntlCache.setDynamicSizing(true);
      
      // Mock checkAndResizeCaches to verify it's called
      const checkAndResizeSpy = jest.spyOn(IntlCache as any, 'checkAndResizeCaches');
      
      IntlCache.getDateTimeFormatter('en-US');
      
      expect(checkAndResizeSpy).toHaveBeenCalled();
      
      checkAndResizeSpy.mockRestore();
    });
  });
});