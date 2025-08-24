/**
 * Comprehensive test coverage for comparison-optimizer.ts
 * Targeting specific uncovered lines: 450-457, 461-468, 472-479, 491-523, 529-532, 538-544, 550-551, 557-579, 585-643, 649-651
 */

import { ComparisonOptimizer } from '../../../core/comparison/comparison-optimizer';
import { ComparisonEngine } from '../../../core/comparison/comparison-engine';
import type { ComparisonMetrics, ComparisonCacheStats } from '../../../core/comparison/comparison-types';

// Define OptimizationRecommendation interface locally since it's not exported
interface OptimizationRecommendation {
  type: 'pattern' | 'strategy' | 'cache' | 'configuration';
  priority: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  implementation: string;
}

// Mock ComparisonEngine methods
jest.mock('../../../core/comparison/comparison-engine', () => ({
  ComparisonEngine: {
    getMetrics: jest.fn(),
    getPerformanceAnalysis: jest.fn(),
    getCacheMaxSize: jest.fn(),
    setCacheMaxSize: jest.fn()
  }
}));

const mockComparisonEngine = ComparisonEngine as jest.Mocked<typeof ComparisonEngine>;

describe('ComparisonOptimizer - Final Coverage Push', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ComparisonOptimizer.reset();
    
    // Setup default mocks
    mockComparisonEngine.getMetrics.mockReturnValue({
      totalComparisons: 1000,
      fastPathHits: 800,
      averageComputeTime: 0.5,
      cacheHits: 750,
      cacheMisses: 250
    } as ComparisonMetrics);
    
    mockComparisonEngine.getPerformanceAnalysis.mockReturnValue({
      metrics: {
        totalComparisons: 1000,
        fastPathHits: 800,
        averageComputeTime: 0.2,
        cacheHits: 800,
        operationBreakdown: {
           isBefore: 400,
           isAfter: 300,
           isSame: 200,
           isSameOrBefore: 50,
           isSameOrAfter: 30,
           isBetween: 15,
           diff: 5,
           duration: 0
         },
         unitBreakdown: {
           nanosecond: 0, nanoseconds: 0,
           microsecond: 0, microseconds: 0,
           millisecond: 100, milliseconds: 50,
           second: 200, seconds: 100,
           minute: 300, minutes: 150,
           hour: 200, hours: 100,
           day: 150, days: 75,
           week: 50, weeks: 25,
           month: 25, months: 12,
           year: 10, years: 5
         }
      } as ComparisonMetrics,
      cacheStats: {
        size: 50,
        maxSize: 100,
        hits: 800,
        misses: 200,
        sets: 1000,
        evictions: 0,
        hitRatio: 0.8,
        hitRate: 0.8,
        averageAccessTime: 0.001,
        efficiency: 0.85
      },
      efficiency: {
        fastPathRatio: 0.8,
        cacheHitRatio: 0.85,
        overallEfficiency: 85
      },
      recommendations: []
    });
    
    mockComparisonEngine.getCacheMaxSize.mockReturnValue(100);
  });

  describe('applyOptimizations method - Lines 491-523', () => {
    /**
     * Test automatic application of optimization recommendations
     */
    it('should apply auto-applicable recommendations successfully', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'configuration',
          priority: 'medium',
          description: 'Increase cache size to accommodate more entries',
          impact: 'Could improve cache hit ratio by 10-20%',
          implementation: 'Increase cache max size by 50-100%'
        }
      ];

      const result = ComparisonOptimizer.applyOptimizations(recommendations);

      expect(result.applied).toHaveLength(1);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockComparisonEngine.setCacheMaxSize).toHaveBeenCalledWith(150);
    });

    /**
     * Test skipping non-auto-applicable recommendations - Lines 500-502
     */
    it('should skip non-auto-applicable recommendations', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'strategy',
          priority: 'high',
          description: 'Review comparison strategies for performance bottlenecks',
          impact: 'Could reduce computation time significantly',
          implementation: 'Profile individual comparison operations'
        }
      ];

      const result = ComparisonOptimizer.applyOptimizations(recommendations);

      expect(result.applied).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    /**
     * Test error handling during recommendation application - Lines 504-510
     */
    it('should handle errors during recommendation application', () => {
      // Mock setCacheMaxSize to throw an error
      mockComparisonEngine.setCacheMaxSize.mockImplementation(() => {
        throw new Error('Cache resize failed');
      });

      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'configuration',
          priority: 'medium',
          description: 'Increase cache size to accommodate more entries',
          impact: 'Could improve cache hit ratio by 10-20%',
          implementation: 'Increase cache max size by 50-100%'
        }
      ];

      const result = ComparisonOptimizer.applyOptimizations(recommendations);

      expect(result.applied).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Cache resize failed');
    });

    /**
     * Test optimization history recording - Lines 513-518
     */
    it('should record optimization history', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'configuration',
          priority: 'medium',
          description: 'Increase cache size to accommodate more entries',
          impact: 'Could improve cache hit ratio by 10-20%',
          implementation: 'Increase cache max size by 50-100%'
        }
      ];

      ComparisonOptimizer.applyOptimizations(recommendations);
      const history = ComparisonOptimizer.getOptimizationHistory();

      expect(history).toHaveLength(1);
      expect(history[0].recommendations).toEqual(recommendations);
      expect(typeof history[0].applied).toBe('boolean');
      expect(typeof history[0].timestamp).toBe('number');
    });
  });

  describe('canAutoApply method - Lines 529-532', () => {
    /**
     * Test auto-apply logic for configuration recommendations
     */
    it('should return true for cache size configuration recommendations', () => {
      const recommendation: OptimizationRecommendation = {
        type: 'configuration',
        priority: 'medium',
        description: 'Increase cache size to accommodate more entries',
        impact: 'Could improve cache hit ratio by 10-20%',
        implementation: 'Increase cache max size by 50-100%'
      };

      // Access private method through any casting
      const canAutoApply = (ComparisonOptimizer as any).canAutoApply(recommendation);
      expect(canAutoApply).toBe(true);
    });

    /**
     * Test auto-apply logic for non-configuration recommendations
     */
    it('should return false for non-configuration recommendations', () => {
      const recommendation: OptimizationRecommendation = {
        type: 'strategy',
        priority: 'high',
        description: 'Review comparison strategies',
        impact: 'Could reduce computation time',
        implementation: 'Profile operations'
      };

      const canAutoApply = (ComparisonOptimizer as any).canAutoApply(recommendation);
      expect(canAutoApply).toBe(false);
    });
  });

  describe('applyRecommendation method - Lines 538-544', () => {
    /**
     * Test cache size increase recommendation application
     */
    it('should apply cache size increase recommendation', () => {
      // Mock setCacheMaxSize to succeed
      mockComparisonEngine.setCacheMaxSize.mockImplementation(() => {
        // Successful implementation
      });

      const recommendation: OptimizationRecommendation = {
        type: 'configuration',
        priority: 'medium',
        description: 'Increase cache size to accommodate more entries',
        impact: 'Could improve cache hit ratio by 10-20%',
        implementation: 'Increase cache max size by 50-100%'
      };

      // Should apply successfully
      expect(() => {
        (ComparisonOptimizer as any).applyRecommendation(recommendation);
      }).not.toThrow();

      expect(mockComparisonEngine.getCacheMaxSize).toHaveBeenCalled();
      expect(mockComparisonEngine.setCacheMaxSize).toHaveBeenCalledWith(150);
    });
    
    /**
     * Test error handling during recommendation application
     */
    it('should throw error when cache resize fails', () => {
      // Mock setCacheMaxSize to throw error
      mockComparisonEngine.setCacheMaxSize.mockImplementation(() => {
        throw new Error('Cache resize failed');
      });

      const recommendation: OptimizationRecommendation = {
        type: 'configuration',
        priority: 'medium',
        description: 'Increase cache size to accommodate more entries',
        impact: 'Could improve cache hit ratio by 10-20%',
        implementation: 'Increase cache max size by 50-100%'
      };

      // Should throw the error since applyRecommendation doesn't handle it
      expect(() => {
        (ComparisonOptimizer as any).applyRecommendation(recommendation);
      }).toThrow('Cache resize failed');
    });
  });

  describe('getOptimizationHistory method - Lines 550-551', () => {
    /**
     * Test optimization history retrieval
     */
    it('should return a copy of optimization history', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'configuration',
          priority: 'medium',
          description: 'Test recommendation',
          impact: 'Test impact',
          implementation: 'Test implementation'
        }
      ];

      ComparisonOptimizer.applyOptimizations(recommendations);
      const history1 = ComparisonOptimizer.getOptimizationHistory();
      const history2 = ComparisonOptimizer.getOptimizationHistory();

      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2); // Should be a copy
    });
  });

  describe('benchmark method - Lines 557-579', () => {
    /**
     * Test benchmark method with default iterations
     */
    it('should return benchmark results with default iterations', () => {
      const result = ComparisonOptimizer.benchmark();

      expect(result).toHaveProperty('operations');
      expect(result).toHaveProperty('overall');
      expect(result.overall).toHaveProperty('totalTime');
      expect(result.overall).toHaveProperty('averageTime');
      expect(result.overall).toHaveProperty('operationsPerSecond');
    });

    /**
     * Test benchmark method with custom iterations
     */
    it('should return benchmark results with custom iterations', () => {
      const result = ComparisonOptimizer.benchmark(500);

      expect(result).toHaveProperty('operations');
      expect(result).toHaveProperty('overall');
      expect(typeof result.overall.totalTime).toBe('number');
      expect(typeof result.overall.averageTime).toBe('number');
      expect(typeof result.overall.operationsPerSecond).toBe('number');
    });
  });

  describe('generatePerformanceReport method - Lines 585-643', () => {
    /**
     * Test performance report generation with excellent health
     */
    it('should generate performance report with excellent health', () => {
      // Mock high efficiency analysis
      jest.spyOn(ComparisonOptimizer, 'analyzePerformance').mockReturnValue({
        overall: {
          efficiency: 90,
          bottlenecks: [],
          strengths: ['High cache hit ratio', 'Fast computation']
        },
        recommendations: [
          {
            type: 'configuration',
            priority: 'low',
            description: 'Minor optimization',
            impact: 'Small improvement',
            implementation: 'Easy fix'
          }
        ]
      } as any);

      const report = ComparisonOptimizer.generatePerformanceReport();

      expect(report.summary.overallHealth).toBe('excellent');
      expect(report.summary.keyInsights).toContain('Overall efficiency: 90%');
      expect(report.summary.actionItems).toHaveLength(0); // No high priority items
      expect(typeof report.timestamp).toBe('number');
    });

    /**
     * Test performance report generation with good health
     */
    it('should generate performance report with good health', () => {
      jest.spyOn(ComparisonOptimizer, 'analyzePerformance').mockReturnValue({
        overall: {
          efficiency: 75,
          bottlenecks: ['Cache misses'],
          strengths: ['Fast computation']
        },
        recommendations: [
          {
            type: 'strategy',
            priority: 'medium',
            description: 'Optimize cache usage',
            impact: 'Moderate improvement',
            implementation: 'Cache tuning'
          }
        ]
      } as any);

      const report = ComparisonOptimizer.generatePerformanceReport();

      expect(report.summary.overallHealth).toBe('good');
      expect(report.analysis.overallEfficiency).toBe(75);
    });

    /**
     * Test performance report generation with fair health
     */
    it('should generate performance report with fair health', () => {
      jest.spyOn(ComparisonOptimizer, 'analyzePerformance').mockReturnValue({
        overall: {
          efficiency: 60,
          bottlenecks: ['Slow computation', 'Cache misses'],
          strengths: []
        },
        recommendations: [
          {
            type: 'strategy',
            priority: 'high',
            description: 'Critical optimization needed',
            impact: 'Major improvement',
            implementation: 'Algorithm redesign'
          }
        ]
      } as any);

      const report = ComparisonOptimizer.generatePerformanceReport();

      expect(report.summary.overallHealth).toBe('fair');
      expect(report.summary.actionItems).toContain('Critical optimization needed');
    });

    /**
     * Test performance report generation with poor health
     */
    it('should generate performance report with poor health', () => {
      jest.spyOn(ComparisonOptimizer, 'analyzePerformance').mockReturnValue({
        overall: {
          efficiency: 30,
          bottlenecks: ['Very slow computation', 'Poor cache performance'],
          strengths: []
        },
        recommendations: [
          {
            type: 'strategy',
            priority: 'high',
            description: 'Urgent performance fix required',
            impact: 'Critical improvement',
            implementation: 'Complete redesign'
          }
        ]
      } as any);

      const report = ComparisonOptimizer.generatePerformanceReport();

      expect(report.summary.overallHealth).toBe('poor');
      expect(report.summary.actionItems).toContain('Urgent performance fix required');
    });

    /**
     * Test key insights generation - Lines 620-625
     */
    it('should generate accurate key insights', () => {
      mockComparisonEngine.getMetrics.mockReturnValue({
        totalComparisons: 2000,
        fastPathHits: 1600,
        averageComputeTime: 0.3,
        cacheHits: 1500,
        cacheMisses: 500
      } as ComparisonMetrics);

      mockComparisonEngine.getPerformanceAnalysis.mockReturnValue({
        metrics: {
          totalComparisons: 2000,
          fastPathHits: 1600,
          averageComputeTime: 0.3,
          cacheHits: 1500,
          operationBreakdown: {
           isBefore: 800,
           isAfter: 600,
           isSame: 400,
           isSameOrBefore: 100,
           isSameOrAfter: 60,
           isBetween: 30,
           diff: 10,
           duration: 0
         },
         unitBreakdown: {
           nanosecond: 0, nanoseconds: 0,
           microsecond: 0, microseconds: 0,
           millisecond: 200, milliseconds: 100,
           second: 400, seconds: 200,
           minute: 600, minutes: 300,
           hour: 400, hours: 200,
           day: 300, days: 150,
           week: 100, weeks: 50,
           month: 50, months: 25,
           year: 20, years: 10
         }
        } as ComparisonMetrics,
        cacheStats: {
          size: 80,
          maxSize: 100,
          hits: 1500,
          misses: 500,
          sets: 2000,
          evictions: 0,
          hitRatio: 0.85,
          hitRate: 0.85,
          averageAccessTime: 0.002,
          efficiency: 0.88
        },
        efficiency: {
          fastPathRatio: 0.8,
          cacheHitRatio: 0.85,
          overallEfficiency: 88
        },
        recommendations: []
      });

      jest.spyOn(ComparisonOptimizer, 'analyzePerformance').mockReturnValue({
        overall: {
          efficiency: 88,
          bottlenecks: [],
          strengths: ['Excellent performance']
        },
        recommendations: []
      } as any);

      const report = ComparisonOptimizer.generatePerformanceReport();

      expect(report.summary.keyInsights).toContain('Overall efficiency: 88%');
      expect(report.summary.keyInsights).toContain('Total comparisons: 2000');
      expect(report.summary.keyInsights).toContain('Cache hit ratio: 85%');
      expect(report.summary.keyInsights).toContain('Fast path usage: 80%');
    });
  });

  describe('reset method - Lines 649-651', () => {
    /**
     * Test reset functionality
     */
    it('should reset all optimization data', () => {
      // Add some data first
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'configuration',
          priority: 'medium',
          description: 'Test recommendation',
          impact: 'Test impact',
          implementation: 'Test implementation'
        }
      ];

      ComparisonOptimizer.applyOptimizations(recommendations);
      expect(ComparisonOptimizer.getOptimizationHistory()).toHaveLength(1);

      // Reset and verify
      ComparisonOptimizer.reset();
      expect(ComparisonOptimizer.getOptimizationHistory()).toHaveLength(0);
    });
  });

  describe('Edge cases and error scenarios', () => {
    /**
     * Test handling of empty recommendations array
     */
    it('should handle empty recommendations array', () => {
      const result = ComparisonOptimizer.applyOptimizations([]);

      expect(result.applied).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    /**
     * Test handling of mixed recommendation types
     */
    it('should handle mixed recommendation types correctly', () => {
      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'configuration',
          priority: 'medium',
          description: 'Increase cache size to accommodate more entries',
          impact: 'Could improve cache hit ratio by 10-20%',
          implementation: 'Increase cache max size by 50-100%'
        },
        {
          type: 'strategy',
          priority: 'high',
          description: 'Review comparison strategies',
          impact: 'Could reduce computation time',
          implementation: 'Profile operations'
        },
        {
          type: 'pattern',
          priority: 'low',
          description: 'Optimize patterns',
          impact: 'Minor improvement',
          implementation: 'Pattern optimization'
        }
      ];

      const result = ComparisonOptimizer.applyOptimizations(recommendations);

      // Verify the result structure exists
      expect(result).toHaveProperty('applied');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.applied)).toBe(true);
      expect(Array.isArray(result.skipped)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    /**
     * Test error handling with non-Error objects
     */
    it('should handle non-Error exceptions', () => {
      mockComparisonEngine.setCacheMaxSize.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });

      const recommendations: OptimizationRecommendation[] = [
        {
          type: 'configuration',
          priority: 'medium',
          description: 'Increase cache size to accommodate more entries',
          impact: 'Could improve cache hit ratio by 10-20%',
          implementation: 'Increase cache max size by 50-100%'
        }
      ];

      const result = ComparisonOptimizer.applyOptimizations(recommendations);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Unknown error');
    });
  });
});