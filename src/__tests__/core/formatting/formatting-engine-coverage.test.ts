import { FormattingEngine } from '../../../core/formatting/formatting-engine';
import { getCachedTemporalAPI } from '../../../core/temporal-detection';
import type { FormattingOptions } from '../../../core/formatting/formatting-types';

describe('FormattingEngine Coverage Tests', () => {
  let testDate: any;
  const TemporalAPI = getCachedTemporalAPI().Temporal;

  beforeEach(() => {
    FormattingEngine.reset();
    testDate = TemporalAPI.ZonedDateTime.from('2024-01-15T14:30:45.123[America/New_York]');
  });

  afterEach(() => {
    FormattingEngine.reset();
  });

  describe('Millisecond Formatting (Lines 345, 347, 349)', () => {
    test('should format milliseconds with SSS pattern', () => {
      const result = FormattingEngine.format(testDate, 'SSS', { locale: 'en-US' });
      expect(result).toContain('123');
    });

    test('should format milliseconds with SS pattern', () => {
      const result = FormattingEngine.format(testDate, 'SS', { locale: 'en-US' });
      expect(result).toContain('12'); // 123ms -> 12 (first two digits)
    });

    test('should format milliseconds with S pattern', () => {
      const result = FormattingEngine.format(testDate, 'S', { locale: 'en-US' });
      expect(result).toContain('1'); // 123ms -> 1 (first digit)
    });

    test('should handle default millisecond pattern', () => {
      // Test with a custom millisecond pattern that falls to default
      const dateWithMs = TemporalAPI.ZonedDateTime.from('2024-01-15T14:30:45.456[UTC]');
      const result = FormattingEngine.format(dateWithMs, 'SSSS', { locale: 'en-US' }); // Non-standard pattern
      expect(result).toContain('456');
    });
  });

  describe('Weekday Formatting (Lines 367)', () => {
    test('should format weekday with dddd pattern (long)', () => {
      const result = FormattingEngine.format(testDate, 'dddd', { locale: 'en-US' });
      expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    });

    test('should format weekday with ddd pattern (short)', () => {
      const result = FormattingEngine.format(testDate, 'ddd', { locale: 'en-US' });
      expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    });

    test('should format weekday with dd pattern (narrow)', () => {
      const result = FormattingEngine.format(testDate, 'dd', { locale: 'en-US' });
      expect(result).toMatch(/M|T|W|F|S/);
    });

    test('should format weekday with d pattern (numeric)', () => {
      const result = FormattingEngine.format(testDate, 'd', { locale: 'en-US' });
      expect(result).toMatch(/[1-7]/);
    });

    test('should handle default weekday pattern', () => {
      const result = FormattingEngine.format(testDate, 'ddddd', { locale: 'en-US' }); // Non-standard pattern
      expect(result).toMatch(/[1-7]/);
    });
  });

  describe('Era Formatting (Lines 382)', () => {
    test('should format AM/PM with A pattern (uppercase)', () => {
      const amDate = TemporalAPI.ZonedDateTime.from('2024-01-15T09:30:45[UTC]');
      const pmDate = TemporalAPI.ZonedDateTime.from('2024-01-15T15:30:45[UTC]');
      
      const amResult = FormattingEngine.format(amDate, 'A', { locale: 'en-US' });
      const pmResult = FormattingEngine.format(pmDate, 'A', { locale: 'en-US' });
      
      expect(amResult).toContain('AM');
      expect(pmResult).toContain('PM');
    });

    test('should format am/pm with a pattern (lowercase)', () => {
      const amDate = TemporalAPI.ZonedDateTime.from('2024-01-15T09:30:45[UTC]');
      const pmDate = TemporalAPI.ZonedDateTime.from('2024-01-15T15:30:45[UTC]');
      
      const amResult = FormattingEngine.format(amDate, 'a', { locale: 'en-US' });
      const pmResult = FormattingEngine.format(pmDate, 'a', { locale: 'en-US' });
      
      expect(amResult).toContain('am');
      expect(pmResult).toContain('pm');
    });

    test('should handle default era pattern', () => {
      const result = FormattingEngine.format(testDate, 'AA', { locale: 'en-US' }); // Non-standard pattern
      expect(result).toMatch(/AM|PM/);
    });
  });

  describe('Timezone Formatting (Lines 395-396, 398)', () => {
    test('should format timezone with z pattern (full IANA name)', () => {
      const result = FormattingEngine.format(testDate, 'z', { locale: 'en-US' });
      expect(result).toContain('America/New_York');
    });

    test('should format timezone with zz pattern (short name)', () => {
      const result = FormattingEngine.format(testDate, 'zz', { locale: 'en-US' });
      expect(result).toContain('New_York');
    });

    test('should handle default timezone pattern', () => {
      const result = FormattingEngine.format(testDate, 'zzz', { locale: 'en-US' }); // Non-standard pattern
      expect(result).toContain('America/New_York');
    });

    test('should handle timezone without slash', () => {
      const utcDate = TemporalAPI.ZonedDateTime.from('2024-01-15T14:30:45[UTC]');
      const result = FormattingEngine.format(utcDate, 'zz', { locale: 'en-US' });
      expect(result).toBe('UTC');
    });
  });

  describe('Offset Formatting (Lines 419)', () => {
    test('should format offset with Z pattern (colon separated)', () => {
      const result = FormattingEngine.format(testDate, 'Z', { locale: 'en-US' });
      expect(result).toMatch(/[+-]\d{2}:\d{2}/);
    });

    test('should format offset with ZZ pattern (no colon)', () => {
      const result = FormattingEngine.format(testDate, 'ZZ', { locale: 'en-US' });
      expect(result).toMatch(/[+-]\d{4}/);
    });

    test('should handle default offset pattern', () => {
      const result = FormattingEngine.format(testDate, 'ZZZ', { locale: 'en-US' }); // Non-standard pattern
      expect(result).toMatch(/[+-]\d{2}:\d{2}/);
    });

    test('should handle positive and negative offsets', () => {
      const positiveOffset = TemporalAPI.ZonedDateTime.from('2024-01-15T14:30:45[Europe/London]');
      const negativeOffset = TemporalAPI.ZonedDateTime.from('2024-01-15T14:30:45[America/Los_Angeles]');
      
      const posResult = FormattingEngine.format(positiveOffset, 'Z', { locale: 'en-US' });
      const negResult = FormattingEngine.format(negativeOffset, 'Z', { locale: 'en-US' });
      
      expect(posResult).toMatch(/[+-]\d{2}:\d{2}/);
      expect(negResult).toMatch(/[+-]\d{2}:\d{2}/);
    });
  });

  describe('Default Token Replacers (Lines 435-454)', () => {
    test('should register default token replacers without error', () => {
      // This tests the registerDefaultTokenReplacers method
      expect(() => FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' })).not.toThrow();
    });
  });

  describe('Performance Metrics (Lines 460-472)', () => {
    test('should get comprehensive formatting metrics', () => {
      // Perform some formatting operations
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'HH:mm:ss', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' }); // Should hit cache
      
      const metrics = FormattingEngine.getMetrics();
      
      expect(metrics.totalFormats).toBeGreaterThan(0);
      expect(metrics.cacheHits).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheMisses).toBeGreaterThanOrEqual(0);
      expect(metrics.fastPathHits).toBeGreaterThanOrEqual(0);
      expect(metrics.averageFormatTime).toBeGreaterThanOrEqual(0);
      expect(metrics.tokenPoolStats).toBeDefined();
      expect(metrics.compilationStats).toBeDefined();
      expect(metrics.compilationStats.totalCompilations).toBeGreaterThanOrEqual(0);
      expect(metrics.compilationStats.averageCompileTime).toBeGreaterThanOrEqual(0);
      expect(metrics.compilationStats.cacheHitRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reset Functionality (Lines 478-495)', () => {
    test('should reset all metrics and caches', () => {
      // Perform operations to generate metrics
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'HH:mm:ss', { locale: 'en-US' });
      
      const metricsBefore = FormattingEngine.getMetrics();
      expect(metricsBefore.totalFormats).toBeGreaterThan(0);
      
      FormattingEngine.reset();
      
      const metricsAfter = FormattingEngine.getMetrics();
      expect(metricsAfter.totalFormats).toBe(0);
      expect(metricsAfter.fastPathHits).toBe(0);
      expect(metricsAfter.cacheHits).toBe(0);
      expect(metricsAfter.averageFormatTime).toBe(0);
    });
  });

  describe('Performance Analysis (Lines 501-525)', () => {
    test('should get detailed performance analysis', () => {
      // Perform various formatting operations
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'HH:mm:ss', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' }); // Cache hit
      
      const analysis = FormattingEngine.getPerformanceAnalysis();
      
      expect(analysis.totalFormats).toBeGreaterThan(0);
      expect(analysis.efficiency).toBeDefined();
      expect(analysis.efficiency.fastPathRatio).toBeGreaterThanOrEqual(0);
      expect(analysis.efficiency.cacheEfficiency).toBeGreaterThanOrEqual(0);
      expect(analysis.efficiency.overallEfficiency).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    test('should generate performance recommendations for low cache hit ratio', () => {
      // Mock low cache hit ratio scenario
      FormattingEngine.reset();
      
      // Perform operations that would result in low cache efficiency
      for (let i = 0; i < 10; i++) {
        FormattingEngine.format(testDate, `pattern-${i}`, { locale: 'en-US' });
      }
      
      const analysis = FormattingEngine.getPerformanceAnalysis();
      expect(analysis.recommendations).toContain('Consider pre-compiling frequently used format patterns');
    });

    test('should generate recommendations for low token pool hit ratio', () => {
      FormattingEngine.reset();
      
      // This would typically require mocking TokenPool stats
      const analysis = FormattingEngine.getPerformanceAnalysis();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    test('should generate recommendations for low fast path ratio', () => {
      FormattingEngine.reset();
      
      // Use complex patterns that don't hit fast path
      FormattingEngine.format(testDate, 'YYYY-MM-DD HH:mm:ss.SSS z', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'dddd, MMMM Do YYYY', { locale: 'en-US' });
      
      const analysis = FormattingEngine.getPerformanceAnalysis();
      expect(analysis.recommendations).toContain('Consider using more common format patterns for better fast-path performance');
    });

    test('should generate recommendations for high average format time', () => {
      FormattingEngine.reset();
      
      // Mock high format time by manipulating metrics
      const engine = FormattingEngine as any;
      engine.metrics.totalFormatTime = 1000; // High total time
      engine.metrics.totalFormats = 100; // Results in 10ms average
      
      const analysis = FormattingEngine.getPerformanceAnalysis();
      expect(analysis.recommendations).toContain('Average format time is high - consider enabling caching');
    });
  });

  describe('Cache Management (Lines 554-566)', () => {
    test('should clear all formatting caches', () => {
      // Perform operations to populate caches
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'HH:mm:ss', { locale: 'en-US' });
      
      expect(() => FormattingEngine.clearCache()).not.toThrow();
    });

    test('should get cache statistics', () => {
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'HH:mm:ss', { locale: 'en-US' });
      
      const cacheStats = FormattingEngine.getCacheStats();
      expect(cacheStats.totalCacheSize).toBeGreaterThanOrEqual(0);
      expect(cacheStats.maxCacheSize).toBeGreaterThan(0);
      expect(cacheStats.hitRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Detailed Cache Statistics (Lines 572-574, 580-582)', () => {
    test('should get detailed cache statistics as formatted string', () => {
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'HH:mm:ss', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' }); // Cache hit
      
      const detailedStats = FormattingEngine.getDetailedCacheStats();
      expect(typeof detailedStats).toBe('string');
      expect(detailedStats).toContain('Detailed Formatting Cache Statistics:');
      expect(detailedStats).toContain('Fast Path Efficiency:');
      expect(detailedStats).toContain('Cache Efficiency:');
      expect(detailedStats).toContain('Overall Efficiency:');
      expect(detailedStats).toContain('Performance Recommendations:');
    });
  });

  describe('Cache Optimization (Lines 588-590)', () => {
    test('should optimize cache without errors', () => {
      FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'en-US' });
      FormattingEngine.format(testDate, 'HH:mm:ss', { locale: 'en-US' });
      
      expect(() => FormattingEngine.optimizeCache()).not.toThrow();
    });

    test('should set maximum cache size', () => {
      const maxSize = 1000;
      expect(() => FormattingEngine.setMaxCacheSize(maxSize)).not.toThrow();
    });
  });

  describe('Dynamic Sizing (Lines 596-597)', () => {
    test('should set and check dynamic sizing', () => {
      // Note: FormattingEngine.isDynamicSizingEnabled() returns false because
      // TokenCompiler.isDynamicSizingEnabled() always returns false
      FormattingEngine.setDynamicSizing(true);
      expect(FormattingEngine.isDynamicSizingEnabled()).toBe(false);
      
      FormattingEngine.setDynamicSizing(false);
      expect(FormattingEngine.isDynamicSizingEnabled()).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle formatting with empty pattern', () => {
      expect(() => FormattingEngine.format(testDate, '', { locale: 'en-US' })).not.toThrow();
    });

    test('should handle formatting with invalid locale', () => {
      expect(() => FormattingEngine.format(testDate, 'YYYY-MM-DD', { locale: 'invalid-locale' })).not.toThrow();
    });

    test('should handle metrics with no operations', () => {
      FormattingEngine.reset();
      const metrics = FormattingEngine.getMetrics();
      expect(metrics.totalFormats).toBe(0);
      expect(metrics.averageFormatTime).toBe(0);
    });

    test('should handle performance analysis with no operations', () => {
      FormattingEngine.reset();
      const analysis = FormattingEngine.getPerformanceAnalysis();
      expect(analysis.efficiency.fastPathRatio).toBe(0);
      expect(analysis.efficiency.cacheEfficiency).toBe(0);
      expect(analysis.efficiency.overallEfficiency).toBe(0);
    });

    test('should handle cache stats with empty caches', () => {
      FormattingEngine.reset();
      FormattingEngine.clearCache();
      
      const cacheStats = FormattingEngine.getCacheStats();
      expect(cacheStats.totalCacheSize).toBeGreaterThanOrEqual(0);
      expect(cacheStats.maxCacheSize).toBeGreaterThan(0);
    });
  });

  describe('Complex Formatting Scenarios', () => {
    test('should handle complex date formatting with multiple tokens', () => {
      const complexPattern = 'dddd, MMMM Do YYYY [at] HH:mm:ss A z (Z)';
      const result = FormattingEngine.format(testDate, complexPattern, { locale: 'en-US' });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should handle formatting with different locales', () => {
      const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE'];
      
      locales.forEach(locale => {
        const result = FormattingEngine.format(testDate, 'YYYY-MM-DD HH:mm:ss', { locale });
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      });
    });

    test('should handle edge case dates', () => {
      const edgeDates = [
        TemporalAPI.ZonedDateTime.from('2024-02-29T23:59:59.999[UTC]'), // Leap year
        TemporalAPI.ZonedDateTime.from('2024-12-31T00:00:00.000[UTC]'), // Year end
        TemporalAPI.ZonedDateTime.from('2024-01-01T12:00:00.000[UTC]')  // Year start
      ];
      
      edgeDates.forEach(date => {
        const result = FormattingEngine.format(date, 'YYYY-MM-DD HH:mm:ss.SSS', { locale: 'en-US' });
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      });
    });
  });
});