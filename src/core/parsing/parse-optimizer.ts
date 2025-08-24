/**
 * @file Parse optimizer for analyzing and optimizing parsing performance
 */

import type {
  ParseMetrics,
  ParseProfile,
  ParseOptimizationHints,
  ParsePerformanceReport,
  ParseStrategyType
} from './parsing-types';

/**
 * Optimization recommendation types
 */
export interface ParseOptimizationRecommendation {
  type: 'cache' | 'strategy' | 'pattern' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
  autoApplicable: boolean;
}

/**
 * Parse optimizer for analyzing and optimizing parsing performance
 */
export class ParseOptimizer {
  private optimizationHistory: Array<{
    timestamp: number;
    recommendations: ParseOptimizationRecommendation[];
    applied: string[];
  }> = [];

  /**
   * Analyze overall parsing performance
   */
  analyzePerformance(metrics: ParseMetrics): {
    efficiency: number;
    bottlenecks: string[];
    strengths: string[];
  } {
    const efficiency = this.calculateEfficiency(metrics);
    const bottlenecks = this.identifyBottlenecks(metrics);
    const strengths = this.identifyStrengths(metrics);

    return {
      efficiency,
      bottlenecks,
      strengths
    };
  }

  /**
   * Generate performance profile for different operations
   */
  generatePerformanceProfile(metrics: ParseMetrics): ParseProfile {
    const totalOperations = metrics.totalParses;
    const avgTime = metrics.averageExecutionTime;

    // Default values for empty metrics
    if (totalOperations === 0) {
      return {
        fastest: { strategy: 'fallback' as ParseStrategyType, time: 0 },
        slowest: { strategy: 'fallback' as ParseStrategyType, time: 0 },
        mostUsed: { strategy: 'fallback' as ParseStrategyType, count: 0 },
        mostSuccessful: { strategy: 'fallback' as ParseStrategyType, rate: 1.0 },
        recommendations: []
      };
    }

    // Find fastest and slowest strategies
    let fastest = { strategy: 'fallback' as ParseStrategyType, time: Infinity };
    let slowest = { strategy: 'fallback' as ParseStrategyType, time: 0 };
    let mostUsed = { strategy: 'fallback' as ParseStrategyType, count: 0 };
    let mostSuccessful = { strategy: 'fallback' as ParseStrategyType, rate: 0 };

    // Analyze strategy breakdown
    for (const [strategy, count] of Object.entries(metrics.strategyBreakdown)) {
      const strategyType = strategy as ParseStrategyType;
      
      // Most used strategy
      if (count > mostUsed.count) {
        mostUsed = { strategy: strategyType, count };
      }

      // For fastest/slowest, we'll use average time as approximation
      // In a real implementation, this would come from detailed metrics
      const estimatedTime = avgTime * (1 + Math.random() * 0.5); // Placeholder logic
      if (estimatedTime < fastest.time) {
        fastest = { strategy: strategyType, time: estimatedTime };
      }
      if (estimatedTime > slowest.time) {
        slowest = { strategy: strategyType, time: estimatedTime };
      }

      // Most successful (using count as proxy for success rate)
      const successRate = count / Math.max(1, totalOperations);
      if (successRate > mostSuccessful.rate) {
        mostSuccessful = { strategy: strategyType, rate: successRate };
      }
    }

    return {
      fastest,
      slowest,
      mostUsed,
      mostSuccessful,
      recommendations: this.generateRecommendations(metrics).map(r => r.description)
    };
  }

  /**
   * Calculate efficiency score (0-1)
   */
  private calculateEfficiency(metrics: ParseMetrics): number {
    const totalOperations = metrics.totalParses;
    if (totalOperations === 0) return 1;

    // Factors that contribute to efficiency
    const cacheHitRatio = metrics.cachedParses / Math.max(1, totalOperations);
    const fastPathRatio = metrics.fastPathParses / totalOperations;
    const errorRate = metrics.failedParses / totalOperations;
    const avgTime = metrics.averageExecutionTime;

    // Normalize average time (assume 1ms is baseline good performance)
    const timeEfficiency = Math.max(0, Math.min(1, 1 / Math.max(0.1, avgTime)));

    // Weighted efficiency calculation
    const efficiency = (
      cacheHitRatio * 0.3 +        // 30% weight for cache performance
      fastPathRatio * 0.25 +       // 25% weight for fast path usage
      (1 - errorRate) * 0.25 +     // 25% weight for low error rate
      timeEfficiency * 0.2         // 20% weight for execution time
    );

    return Math.max(0, Math.min(1, efficiency));
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(metrics: ParseMetrics): string[] {
    const bottlenecks: string[] = [];
    const totalOperations = metrics.totalParses;

    if (totalOperations === 0) return bottlenecks;

    // Cache performance issues
    const cacheHitRatio = metrics.cachedParses / Math.max(1, totalOperations);
    if (cacheHitRatio < 0.3) {
      bottlenecks.push('Low cache hit ratio - consider optimizing cache keys or increasing cache size');
    }

    // Fast path usage
    const fastPathRatio = metrics.fastPathParses / totalOperations;
    if (fastPathRatio < 0.2) {
      bottlenecks.push('Low fast path usage - input patterns may not be optimized');
    }

    // Error rate
    const errorRate = metrics.failedParses / totalOperations;
    if (errorRate > 0.1) {
      bottlenecks.push('High error rate - input validation or strategy selection needs improvement');
    }

    // Average execution time
    const avgTime = metrics.averageExecutionTime;
    if (avgTime > 5) {
      bottlenecks.push('High average execution time - consider strategy optimization or input preprocessing');
    }

    // Strategy distribution issues
    const fallbackUsage = metrics.strategyBreakdown['fallback'] || 0;
    if (fallbackUsage / totalOperations > 0.2) {
      bottlenecks.push('High fallback strategy usage - input patterns may need specific strategy implementations');
    }

    return bottlenecks;
  }

  /**
   * Identify performance strengths
   */
  private identifyStrengths(metrics: ParseMetrics): string[] {
    const strengths: string[] = [];
    const totalOperations = metrics.totalParses;

    if (totalOperations === 0) return strengths;

    // Cache performance
    const cacheHitRatio = metrics.cachedParses / Math.max(1, totalOperations);
    if (cacheHitRatio > 0.7) {
      strengths.push('Excellent cache performance');
    }

    // Fast path usage
    const fastPathRatio = metrics.fastPathParses / totalOperations;
    if (fastPathRatio > 0.5) {
      strengths.push('High fast path utilization');
    }

    // Low error rate
    const errorRate = metrics.failedParses / totalOperations;
    if (errorRate < 0.05) {
      strengths.push('Low error rate indicates good input validation');
    }

    // Fast execution
    const avgTime = metrics.averageExecutionTime;
    if (avgTime < 1) {
      strengths.push('Fast average execution time');
    }

    // Good strategy distribution
    const fallbackUsage = metrics.strategyBreakdown['fallback'] || 0;
    if (fallbackUsage / totalOperations < 0.1) {
      strengths.push('Low fallback usage indicates good strategy coverage');
    }

    return strengths;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(metrics: ParseMetrics): ParseOptimizationRecommendation[] {
    const recommendations: ParseOptimizationRecommendation[] = [];
    const totalOperations = metrics.totalParses;

    if (totalOperations === 0) return recommendations;

    // Cache optimization recommendations
    const cacheHitRatio = metrics.cachedParses / Math.max(1, totalOperations);
    if (cacheHitRatio < 0.5) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        description: 'Increase cache size to improve hit ratio',
        impact: `Could improve performance by ${Math.round((0.7 - cacheHitRatio) * 100)}%`,
        implementation: 'Increase ParseCache maxSize or optimize cache key generation',
        autoApplicable: true
      });
    }

    // Strategy optimization recommendations
    const fallbackUsage = metrics.strategyBreakdown['fallback'] || 0;
    if (fallbackUsage / totalOperations > 0.15) {
      recommendations.push({
        type: 'strategy',
        priority: 'high',
        description: 'Reduce fallback strategy usage',
        impact: 'Could significantly improve parsing reliability and performance',
        implementation: 'Implement specific strategies for common input patterns',
        autoApplicable: false
      });
    }

    // Pattern optimization recommendations
    const fastPathRatio = metrics.fastPathParses / totalOperations;
    if (fastPathRatio < 0.3) {
      recommendations.push({
        type: 'pattern',
        priority: 'medium',
        description: 'Optimize input patterns for fast path usage',
        impact: `Could improve performance by ${Math.round((0.5 - fastPathRatio) * 50)}%`,
        implementation: 'Preprocess inputs to match fast path patterns or improve fast path detection',
        autoApplicable: false
      });
    }

    // Configuration optimization recommendations
    const avgTime = metrics.averageExecutionTime;
    if (avgTime > 3) {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        description: 'Optimize parsing configuration for better performance',
        impact: 'Could reduce average parsing time',
        implementation: 'Adjust strategy priorities, enable more aggressive caching, or optimize validation',
        autoApplicable: true
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Apply optimization recommendations
   */
  applyRecommendations(
    recommendations: ParseOptimizationRecommendation[],
    parseEngine: any // ParseEngine instance
  ): string[] {
    const applied: string[] = [];

    for (const recommendation of recommendations) {
      if (!recommendation.autoApplicable) continue;

      try {
        switch (recommendation.type) {
          case 'cache':
            if (recommendation.description.includes('cache size')) {
              // Increase cache size by 50%
              const currentSize = parseEngine.cache?.getMaxSize() || 1000;
              const newSize = Math.round(currentSize * 1.5);
              parseEngine.cache?.setMaxSize(newSize);
              applied.push(`Increased cache size from ${currentSize} to ${newSize}`);
            }
            break;

          case 'configuration':
            if (recommendation.description.includes('parsing configuration')) {
              // Enable more aggressive caching
              parseEngine.enableAggressiveCaching?.();
              applied.push('Enabled aggressive caching configuration');
            }
            break;
        }
      } catch (error) {
        // Ignore application errors
      }
    }

    // Record optimization history
    this.optimizationHistory.push({
      timestamp: Date.now(),
      recommendations,
      applied
    });

    return applied;
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): Array<{
    timestamp: number;
    recommendations: ParseOptimizationRecommendation[];
    applied: string[];
  }> {
    return [...this.optimizationHistory];
  }

  /**
   * Benchmark parsing operations
   */
  async benchmarkOperations(
    parseEngine: any, // ParseEngine instance
    testInputs: Array<{ input: any; description: string }>,
    iterations: number = 100
  ): Promise<{
    results: Array<{
      description: string;
      avgTime: number;
      minTime: number;
      maxTime: number;
      successRate: number;
      strategy: string;
    }>;
    summary: {
      totalTime: number;
      avgTime: number;
      fastestOperation: string;
      slowestOperation: string;
    };
  }> {
    const results: Array<{
      description: string;
      avgTime: number;
      minTime: number;
      maxTime: number;
      successRate: number;
      strategy: string;
    }> = [];

    let totalBenchmarkTime = 0;

    for (const testInput of testInputs) {
      const times: number[] = [];
      let successes = 0;
      let lastStrategy = 'unknown';

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        try {
          const result = await parseEngine.parse(testInput.input);
          const endTime = performance.now();
          times.push(endTime - startTime);
          successes++;
          if (result.strategy) {
            lastStrategy = result.strategy;
          }
        } catch {
          times.push(0); // Record failed attempts as 0 time
        }
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times.filter(t => t > 0));
      const maxTime = Math.max(...times);
      const successRate = successes / iterations;

      totalBenchmarkTime += avgTime;

      results.push({
        description: testInput.description,
        avgTime,
        minTime: isFinite(minTime) ? minTime : 0,
        maxTime,
        successRate,
        strategy: lastStrategy
      });
    }

    const avgTime = results.length > 0 ? totalBenchmarkTime / results.length : NaN;
    const fastestOperation = results.length > 0 ? results.reduce((fastest, current) => 
      current.avgTime < fastest.avgTime ? current : fastest
    ).description : 'none';
    const slowestOperation = results.length > 0 ? results.reduce((slowest, current) => 
      current.avgTime > slowest.avgTime ? current : slowest
    ).description : 'none';

    return {
      results,
      summary: {
        totalTime: totalBenchmarkTime,
        avgTime,
        fastestOperation,
        slowestOperation
      }
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(metrics: ParseMetrics): ParsePerformanceReport {
    const analysis = this.analyzePerformance(metrics);
    const recommendations = this.generateRecommendations(metrics);
    const totalOperations = metrics.totalParses;

    // Calculate strategy performance
    const strategies: Array<{
      type: ParseStrategyType;
      usage: number;
      averageTime: number;
      successRate: number;
      efficiency: number;
    }> = [];

    // Only populate strategies if there are operations
    if (totalOperations > 0) {
      for (const [strategy, count] of Object.entries(metrics.strategyBreakdown)) {
        // Only include strategies that were actually used
        if (count > 0) {
          const strategyType = strategy as ParseStrategyType;
          const usage = count / totalOperations;
          const averageTime = metrics.averageExecutionTime; // Simplified - would be per-strategy in real implementation
          const successRate = 1 - (metrics.failedParses / Math.max(1, totalOperations)); // Simplified
          const efficiency = this.calculateEfficiency(metrics); // Simplified

          strategies.push({
            type: strategyType,
            usage,
            averageTime,
            successRate,
            efficiency
          });
        }
      }
    }

    // Generate bottlenecks
    const bottlenecks = analysis.bottlenecks.map(bottleneck => ({
      issue: bottleneck,
      impact: 'medium' as const,
      suggestion: 'Optimize based on analysis'
    }));

    return {
      summary: {
        totalOperations,
        averageTime: metrics.averageExecutionTime,
        successRate: metrics.successfulParses / Math.max(1, totalOperations),
        cacheHitRate: metrics.cachedParses / Math.max(1, totalOperations),
        fastPathRate: metrics.fastPathParses / Math.max(1, totalOperations)
      },
      strategies,
      bottlenecks,
      recommendations: recommendations.map(r => r.description)
    };
  }
}