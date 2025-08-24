import { Temporal } from '@js-temporal/polyfill';
import { ComparisonEngine } from '../../../core/comparison/comparison-engine';
import { ComparisonStrategy, ComparisonContext, ComparisonResult } from '../../../core/comparison/comparison-types';

/**
 * Mock strategy for testing strategy registration/unregistration
 */
class MockStrategy implements ComparisonStrategy {
  priority = 100;
  name = 'mock-strategy';

  canHandle(context: ComparisonContext): boolean {
    return context.type === 'isBefore' && context.options.unit === 'second';
  }

  execute(context: ComparisonContext): ComparisonResult {
    return {
      result: true,
      type: context.type,
      precision: 'exact',
      cached: false,
      computeTime: 0.1
    };
  }
}

/**
 * Strategy that cannot handle any context (for fallback testing)
 */
class UnhandledStrategy implements ComparisonStrategy {
  priority = 0;
  name = 'unhandled-strategy';

  canHandle(): boolean {
    return false;
  }

  execute(): ComparisonResult {
    throw new Error('Should not be called');
  }
}

describe('ComparisonEngine Final Coverage Tests', () => {
  let date1: Temporal.ZonedDateTime;
  let date2: Temporal.ZonedDateTime;
  let date3: Temporal.ZonedDateTime;

  beforeEach(() => {
    // Reset engine state
    ComparisonEngine.reset();
    
    // Create test dates
    date1 = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[UTC]');
    date2 = Temporal.ZonedDateTime.from('2023-01-01T11:00:00[UTC]');
    date3 = Temporal.ZonedDateTime.from('2023-01-02T10:00:00[UTC]');
  });

  describe('Fallback Strategy Tests (Lines 334-347)', () => {
    beforeEach(() => {
      // Clear all strategies to force fallback
      const originalStrategies = (ComparisonEngine as any).strategies;
      (ComparisonEngine as any).strategies = [];
    });

    afterEach(() => {
      // Restore original strategies
      ComparisonEngine.reset();
    });

    test('should handle isBefore fallback', () => {
      const result = ComparisonEngine.compare(date1, date2, 'isBefore');
      expect(result.result).toBe(true);
      expect(result.precision).toBe('exact');
      expect(result.cached).toBe(false);
    });

    test('should handle isAfter fallback', () => {
      const result = ComparisonEngine.compare(date2, date1, 'isAfter');
      expect(result.result).toBe(true);
      expect(result.precision).toBe('exact');
    });

    test('should handle isSame fallback', () => {
      const result = ComparisonEngine.compare(date1, date1, 'isSame');
      expect(result.result).toBe(true);
      expect(result.precision).toBe('exact');
    });

    test('should handle isSameOrBefore fallback', () => {
      const result = ComparisonEngine.compare(date1, date2, 'isSameOrBefore');
      expect(result.result).toBe(true);
      expect(result.precision).toBe('exact');
    });

    test('should handle isSameOrAfter fallback', () => {
      const result = ComparisonEngine.compare(date2, date1, 'isSameOrAfter');
      expect(result.result).toBe(true);
      expect(result.precision).toBe('exact');
    });

    test('should throw error for unsupported comparison type in fallback', () => {
      expect(() => {
        ComparisonEngine.compare(date1, date2, 'diff' as any);
      }).toThrow('No strategy found for comparison type: diff');
    });
  });

  describe('Strategy Registration Tests (Lines 514, 516, 518, 520)', () => {
    test('should register custom strategy', () => {
      const mockStrategy = new MockStrategy();
      ComparisonEngine.registerStrategy(mockStrategy);
      
      // Test that the strategy is used
      const result = ComparisonEngine.compare(date1, date2, 'isBefore', { unit: 'second' });
      expect(result.result).toBe(true);
    });

    test('should unregister existing strategy', () => {
      const mockStrategy = new MockStrategy();
      ComparisonEngine.registerStrategy(mockStrategy);
      
      const unregistered = ComparisonEngine.unregisterStrategy(mockStrategy);
      expect(unregistered).toBe(true);
    });

    test('should return false when unregistering non-existent strategy', () => {
      const mockStrategy = new MockStrategy();
      const unregistered = ComparisonEngine.unregisterStrategy(mockStrategy);
      expect(unregistered).toBe(false);
    });
  });

  describe('Cache Management Tests (Lines 526-529)', () => {
    test('should get and set cache max size', () => {
      const originalSize = ComparisonEngine.getCacheMaxSize();
      expect(typeof originalSize).toBe('number');
      
      ComparisonEngine.setCacheMaxSize(500);
      expect(ComparisonEngine.getCacheMaxSize()).toBe(500);
      
      // Restore original size
      ComparisonEngine.setCacheMaxSize(originalSize);
    });
  });

  describe('Performance Analysis Tests (Lines 642-643)', () => {
    test('should generate performance recommendations for low fast-path ratio', () => {
      // Force some comparisons to build metrics
      for (let i = 0; i < 10; i++) {
        ComparisonEngine.compare(date1, date2, 'isBefore', { useCache: false });
      }
      
      const analysis = ComparisonEngine.getPerformanceAnalysis();
      expect(analysis).toHaveProperty('metrics');
      expect(analysis).toHaveProperty('cacheStats');
      expect(analysis).toHaveProperty('efficiency');
      expect(analysis).toHaveProperty('recommendations');
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    test('should calculate efficiency ratios correctly', () => {
      // Reset to ensure clean state
      ComparisonEngine.reset();
      
      // Perform some comparisons
      ComparisonEngine.compare(date1, date2, 'isBefore');
      ComparisonEngine.compare(date1, date2, 'isBefore'); // Should hit cache
      
      const analysis = ComparisonEngine.getPerformanceAnalysis();
      expect(analysis.efficiency.cacheHitRatio).toBeGreaterThanOrEqual(0);
      expect(analysis.efficiency.overallEfficiency).toBeGreaterThanOrEqual(0);
      expect(analysis.metrics.totalComparisons).toBeGreaterThan(0);
    });
  });

  describe('Optimization Hints Analysis Tests (Lines 226, 229, 232, 247, 250, 253, 255)', () => {
    test('should analyze nanosecond-level differences', () => {
      const date1Nano = Temporal.ZonedDateTime.from('2023-01-01T10:00:00.000000001[UTC]');
      const date2Nano = Temporal.ZonedDateTime.from('2023-01-01T10:00:00.000000002[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Nano, date2Nano);
      expect(hints.orderOfMagnitude).toBe('nanoseconds');
    });

    test('should analyze microsecond-level differences', () => {
      const date1Micro = Temporal.ZonedDateTime.from('2023-01-01T10:00:00.000001[UTC]');
      const date2Micro = Temporal.ZonedDateTime.from('2023-01-01T10:00:00.000002[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Micro, date2Micro);
      expect(hints.orderOfMagnitude).toBe('microseconds');
    });

    test('should analyze millisecond-level differences', () => {
      const date1Milli = Temporal.ZonedDateTime.from('2023-01-01T10:00:00.001[UTC]');
      const date2Milli = Temporal.ZonedDateTime.from('2023-01-01T10:00:00.002[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Milli, date2Milli);
      expect(hints.orderOfMagnitude).toBe('milliseconds');
    });

    test('should analyze second-level differences', () => {
      const date1Sec = Temporal.ZonedDateTime.from('2023-01-01T10:00:01[UTC]');
      const date2Sec = Temporal.ZonedDateTime.from('2023-01-01T10:00:02[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Sec, date2Sec);
      expect(hints.orderOfMagnitude).toBe('seconds');
    });

    test('should analyze minute-level differences', () => {
      const date1Min = Temporal.ZonedDateTime.from('2023-01-01T10:01:00[UTC]');
      const date2Min = Temporal.ZonedDateTime.from('2023-01-01T10:02:00[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Min, date2Min);
      expect(hints.orderOfMagnitude).toBe('minutes');
    });

    test('should analyze hour-level differences', () => {
      const date1Hour = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[UTC]');
      const date2Hour = Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Hour, date2Hour);
      expect(hints.orderOfMagnitude).toBe('hours');
    });

    test('should analyze day-level differences', () => {
      const date1Day = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[UTC]');
      const date2Day = Temporal.ZonedDateTime.from('2023-01-03T10:00:00[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Day, date2Day);
      expect(hints.orderOfMagnitude).toBe('days');
    });

    test('should analyze month-level differences', () => {
      const date1Month = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[UTC]');
      const date2Month = Temporal.ZonedDateTime.from('2023-03-01T10:00:00[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Month, date2Month);
      expect(hints.orderOfMagnitude).toBe('months');
    });

    test('should analyze year-level differences', () => {
      const date1Year = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[UTC]');
      const date2Year = Temporal.ZonedDateTime.from('2025-01-01T10:00:00[UTC]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(date1Year, date2Year);
      expect(hints.orderOfMagnitude).toBe('years');
    });

    test('should detect same timezone, calendar, year, month, day', () => {
      const hints = ComparisonEngine.analyzeOptimizationHints(date1, date2);
      expect(hints.sameTimeZone).toBe(true);
      expect(hints.sameCalendar).toBe(true);
      expect(hints.sameYear).toBe(true);
      expect(hints.sameMonth).toBe(true);
      expect(hints.sameDay).toBe(true);
    });

    test('should detect different timezone', () => {
      const dateUTC = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[UTC]');
      const dateEST = Temporal.ZonedDateTime.from('2023-01-01T10:00:00[America/New_York]');
      
      const hints = ComparisonEngine.analyzeOptimizationHints(dateUTC, dateEST);
      expect(hints.sameTimeZone).toBe(false);
    });

    test('should detect different day', () => {
      const hints = ComparisonEngine.analyzeOptimizationHints(date1, date3);
      expect(hints.sameDay).toBe(false);
      expect(hints.sameMonth).toBe(true);
      expect(hints.sameYear).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling (Lines 351-359)', () => {
    test('should handle comparison with disabled cache', () => {
      const result1 = ComparisonEngine.compare(date1, date2, 'isBefore', { useCache: false });
      const result2 = ComparisonEngine.compare(date1, date2, 'isBefore', { useCache: false });
      
      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(false);
    });

    test('should handle metrics tracking correctly', () => {
      // Reset to ensure clean state
      ComparisonEngine.reset();
      const initialMetrics = ComparisonEngine.getMetrics();
      
      ComparisonEngine.compare(date1, date2, 'isBefore', { unit: 'hour' });
      
      const updatedMetrics = ComparisonEngine.getMetrics();
      expect(updatedMetrics.totalComparisons).toBe(initialMetrics.totalComparisons + 1);
      expect(updatedMetrics.operationBreakdown.isBefore).toBe(1);
      expect(updatedMetrics.unitBreakdown.hour).toBe(1);
    });

    test('should handle performance recommendations for high compute time', () => {
      // Reset engine to ensure clean state
      ComparisonEngine.reset();
      
      // Manually set high average compute time by manipulating internal state
      const engine = ComparisonEngine as any;
      engine.metrics.averageComputeTime = 0.15; // 150ms
      engine.metrics.totalComparisons = 1;
      
      const analysis = ComparisonEngine.getPerformanceAnalysis();
      expect(analysis.recommendations).toContain('Average compute time is high - consider optimization');
    });

    test('should handle performance recommendations for low cache hit ratio', () => {
      // Perform many comparisons without cache hits
      for (let i = 0; i < 150; i++) {
        const testDate = Temporal.ZonedDateTime.from(`2023-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00[UTC]`);
        ComparisonEngine.compare(date1, testDate, 'isBefore', { useCache: false });
      }
      
      const analysis = ComparisonEngine.getPerformanceAnalysis();
      expect(analysis.recommendations).toContain('Cache hit ratio is low - consider enabling caching for repeated comparisons');
    });
  });
});