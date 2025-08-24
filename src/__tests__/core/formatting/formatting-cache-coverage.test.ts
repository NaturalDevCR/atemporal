import { FormattingCache } from '../../../core/formatting/formatting-cache';
import { CacheKeys } from '../../../core/caching/cache-keys';
import { Temporal } from '@js-temporal/polyfill';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('FormattingCache Coverage Tests', () => {
  beforeEach(() => {
    FormattingCache.clear();
    FormattingCache.resetStats();
  });

  afterEach(() => {
    FormattingCache.clear();
    FormattingCache.resetStats();
  });

  describe('Advanced Statistics and Metrics (Lines 220-225)', () => {
    test('should calculate memory usage estimation', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Add some entries to the cache
      const key1 = CacheKeys.customFormat('YYYY-MM-DD', 'en-US', {});
      const key2 = CacheKeys.customFormat('HH:mm:ss', 'en-US', {});
      
      FormattingCache.set(key1, testDate, '2024-01-15');
      FormattingCache.set(key2, testDate, '12:30:45');
      
      const advancedStats = FormattingCache.getDetailedStats();
      expect(advancedStats.memoryUsage).toBeGreaterThan(0);
      expect(advancedStats.memoryUsage).toBe(2 * 500); // 2 entries * 500 bytes each
    });

    test('should calculate average entry age (placeholder)', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      const key = CacheKeys.customFormat('YYYY', 'en-US', {});
      FormattingCache.set(key, testDate, '2024');
      
      const advancedStats = FormattingCache.getDetailedStats();
      expect(advancedStats.averageEntryAge).toBe(0); // Placeholder implementation
    });
  });

  describe('Performance Metrics (Lines 238-246)', () => {
    test('should calculate hits per second (placeholder)', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      const key = CacheKeys.customFormat('MM/DD/YYYY', 'en-US', {});
      FormattingCache.set(key, testDate, '01/15/2024');
      FormattingCache.get(key, testDate);
      
      const advancedStats = FormattingCache.getDetailedStats();
      expect(advancedStats.performance.hitsPerSecond).toBe(0); // Placeholder
    });

    test('should calculate misses per second (placeholder)', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      FormattingCache.get('non-existent-key', testDate);
      
      const advancedStats = FormattingCache.getDetailedStats();
      expect(advancedStats.performance.missesPerSecond).toBe(0); // Placeholder
    });
  });

  describe('Cache Optimization (Lines 252-262)', () => {
    test('should handle cache optimization', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Add entries to cache
      for (let i = 0; i < 10; i++) {
        const key = CacheKeys.customFormat(`pattern-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
      }
      
      // Optimize should not throw
      expect(() => FormattingCache.optimize()).not.toThrow();
    });

    test('should set and get max cache size', () => {
      const newSize = 500;
      FormattingCache.setMaxSize(newSize);
      
      expect(FormattingCache.getMaxSize()).toBe(newSize);
    });
  });

  describe('Cache Validation (Lines 268-288)', () => {
    test('should validate cache with low hit ratio warning', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Create scenario with low hit ratio - need more than 100 total operations
      for (let i = 0; i < 150; i++) {
        FormattingCache.get(`non-existent-key-${i}`, testDate); // Generate misses
      }
      
      // Add some hits but keep ratio low (less than 50%)
      for (let i = 0; i < 20; i++) {
        const key = CacheKeys.customFormat(`pattern-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
        FormattingCache.get(key, testDate);
      }
      
      const validation = FormattingCache.validateCache();
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Low cache hit ratio detected - consider reviewing cache strategy');
    });

    test('should validate cache at maximum capacity', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Set small max size and fill it
      FormattingCache.setMaxSize(5);
      
      for (let i = 0; i < 5; i++) {
        const key = CacheKeys.customFormat(`pattern-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
      }
      
      const validation = FormattingCache.validateCache();
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Cache is at maximum capacity - consider increasing size');
    });

    test('should validate cache with no issues', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Create good cache scenario
      FormattingCache.setMaxSize(100);
      
      for (let i = 0; i < 10; i++) {
        const key = CacheKeys.customFormat(`pattern-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
        // Access multiple times for good hit ratio
        for (let j = 0; j < 5; j++) {
          FormattingCache.get(key, testDate);
        }
      }
      
      const validation = FormattingCache.validateCache();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });
  });

  describe('Cache Preloading (Lines 294-305)', () => {
    test('should preload cache with common patterns', () => {
      const date = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[America/New_York]');
      const patterns = ['YYYY-MM-DD', 'HH:mm:ss', 'MM/DD/YYYY'];
      
      // Preload should not throw
      expect(() => FormattingCache.preload(date, patterns)).not.toThrow();
    });

    test('should handle empty patterns array', () => {
      const date = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      
      expect(() => FormattingCache.preload(date, [])).not.toThrow();
    });
  });

  describe('Efficiency Metrics (Lines 311-317)', () => {
    test('should calculate efficiency metrics with good performance', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      FormattingCache.setMaxSize(100);
      
      // Create efficient cache scenario
      for (let i = 0; i < 20; i++) {
        const key = CacheKeys.customFormat(`efficient-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
        // Multiple hits for good efficiency
        for (let j = 0; j < 3; j++) {
          FormattingCache.get(key, testDate);
        }
      }
      
      const efficiency = FormattingCache.getEfficiencyMetrics();
      expect(efficiency.hitRatio).toBeGreaterThan(0.5);
      expect(efficiency.utilization).toBeGreaterThan(0);
      expect(efficiency.efficiency).toBeGreaterThan(0.5);
      expect(efficiency.memoryEfficiency).toBeGreaterThan(0);
      expect(Array.isArray(efficiency.recommendations)).toBe(true);
    });

    test('should generate efficiency recommendations for low hit ratio', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Create low hit ratio scenario
      for (let i = 0; i < 50; i++) {
        FormattingCache.get(`miss-${i}`, testDate);
      }
      
      for (let i = 0; i < 10; i++) {
        const key = CacheKeys.customFormat(`hit-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
        FormattingCache.get(key, testDate);
      }
      
      const efficiency = FormattingCache.getEfficiencyMetrics();
      expect(efficiency.recommendations).toContain('Consider preloading cache with common format patterns');
    });
  });

  describe('Efficiency Recommendations (Lines 323-324, 330-331)', () => {
    test('should recommend cache size increase when nearly full', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      FormattingCache.setMaxSize(10);
      
      // Fill cache to >90% capacity (10 out of 10 entries = 100%)
      for (let i = 0; i < 10; i++) {
        const key = CacheKeys.customFormat(`full-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
      }
      
      // Generate enough hits to get good hit ratio (>= 0.6) and total requests >= 10
      for (let i = 0; i < 10; i++) {
        const key = CacheKeys.customFormat(`full-${i}`, 'en-US', {});
        // Multiple hits per key to ensure good hit ratio
        for (let j = 0; j < 3; j++) {
          FormattingCache.get(key, testDate);
        }
      }
      
      const efficiency = FormattingCache.getEfficiencyMetrics();
      expect(efficiency.recommendations).toContain('Cache is nearly full - consider increasing max size');
    });

    test('should recommend size reduction for underutilized efficient cache', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      FormattingCache.setMaxSize(100);
      
      // Create very efficient but underutilized cache
      for (let i = 0; i < 10; i++) {
        const key = CacheKeys.customFormat(`underutil-${i}`, 'en-US', {});
        FormattingCache.set(key, testDate, `result-${i}`);
        // Many hits for high efficiency
        for (let j = 0; j < 10; j++) {
          FormattingCache.get(key, testDate);
        }
      }
      
      const efficiency = FormattingCache.getEfficiencyMetrics();
      expect(efficiency.recommendations).toContain('Cache is very efficient but underutilized - could reduce max size');
    });

    test('should recommend more data for meaningful analysis', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Very few operations
      const key = CacheKeys.customFormat('single', 'en-US', {});
      FormattingCache.set(key, testDate, 'result');
      FormattingCache.get(key, testDate);
      
      const efficiency = FormattingCache.getEfficiencyMetrics();
      expect(efficiency.recommendations).toContain('Insufficient data for meaningful analysis');
    });
  });

  describe('Cache Snapshot and Reset', () => {
    test('should create comprehensive cache snapshot', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      // Add some data
      const key = CacheKeys.customFormat('YYYY-MM-DD', 'en-US', {});
      FormattingCache.set(key, testDate, '2024-01-15');
      FormattingCache.get(key, testDate);
      
      const snapshot = FormattingCache.createSnapshot();
      expect(snapshot.timestamp).toBeCloseTo(Date.now(), -2);
      expect(snapshot.stats).toBeDefined();
      expect(snapshot.efficiency).toBeDefined();
      expect(snapshot.validation).toBeDefined();
    });

    test('should reset statistics while keeping cached data', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      const key = CacheKeys.customFormat('test', 'en-US', {});
      FormattingCache.set(key, testDate, 'result');
      FormattingCache.get(key, testDate);
      
      const statsBefore = FormattingCache.getStats();
      expect(statsBefore.hits).toBeGreaterThan(0);
      
      FormattingCache.resetStats();
      
      const statsAfter = FormattingCache.getStats();
      expect(statsAfter.hits).toBe(0);
      expect(statsAfter.misses).toBe(0);
      expect(statsAfter.sets).toBe(0);
      // Note: evictions property may not exist in stats object
      
      // Data should still be cached
      expect(FormattingCache.has(key, testDate)).toBe(true);
    });

    test('should handle dynamic sizing configuration', () => {
      FormattingCache.setDynamicSizing(true);
      expect(FormattingCache.isDynamicSizingEnabled()).toBe(true);
      
      FormattingCache.setDynamicSizing(false);
      expect(FormattingCache.isDynamicSizingEnabled()).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle cache operations with invalid keys', () => {
      const testDate = Temporal.ZonedDateTime.from('2024-01-15T12:30:45[UTC]');
      expect(FormattingCache.get('', testDate)).toBeNull();
      expect(FormattingCache.has('', testDate)).toBe(false);
    });

    test('should handle efficiency metrics with empty cache', () => {
      const efficiency = FormattingCache.getEfficiencyMetrics();
      expect(efficiency.hitRatio).toBe(0);
      expect(efficiency.utilization).toBe(0);
      expect(efficiency.efficiency).toBe(0);
    });

    test('should handle validation with empty cache', () => {
      const validation = FormattingCache.validateCache();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    test('should handle snapshot with empty cache', () => {
      const snapshot = FormattingCache.createSnapshot();
      expect(snapshot.stats.size).toBe(0);
      expect(snapshot.efficiency.hitRatio).toBe(0);
      expect(snapshot.validation.isValid).toBe(true);
    });
  });
});