/**
 * @file Comparison optimizer for performance analysis and optimization
 */

import type {
  ComparisonMetrics,
  ComparisonProfile,
  ComparisonType,
  TimeUnit,
  OptimizationHints
} from './comparison-types';
import { ComparisonEngine } from './comparison-engine';
import { ComparisonCache } from './comparison-cache';

/**
 * Type alias for cache statistics
 */
type CacheStats = ReturnType<ComparisonCache['getStats']>;

/**
 * Performance optimization recommendations
 */
interface OptimizationRecommendation {
  type: 'cache' | 'strategy' | 'pattern' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
}

/**
 * Comparison performance profile
 */
interface PerformanceProfile {
  operation: ComparisonType;
  unit?: TimeUnit;
  averageTime: number;
  cacheHitRatio: number;
  fastPathRatio: number;
  frequency: number;
  efficiency: number;
}

/**
 * Optimizer for comparison operations
 */
export class ComparisonOptimizer {
  private static profiles = new Map<string, PerformanceProfile>();
  private static optimizationHistory: Array<{
    timestamp: number;
    recommendations: OptimizationRecommendation[];
    applied: boolean;
  }> = [];
  
  /**
   * Analyzes current comparison performance
   */
  static analyzePerformance(): {
    overall: {
      efficiency: number;
      bottlenecks: string[];
      strengths: string[];
    };
    profiles: PerformanceProfile[];
    recommendations: OptimizationRecommendation[];
  };
  
  /**
   * Analyzes performance with provided metrics and cache stats
   */
  static analyzePerformance(
    metrics: ComparisonMetrics,
    cacheStats: CacheStats
  ): {
    overallEfficiency: number;
    cacheEfficiency: number;
    computeEfficiency: number;
    bottlenecks: string[];
    strengths: string[];
  };
  
  static analyzePerformance(
    metrics?: ComparisonMetrics,
    cacheStats?: CacheStats
  ): any {
    if (arguments.length === 0) {
      // Original method implementation
      const currentMetrics = ComparisonEngine.getMetrics();
      const currentCacheStats = ComparisonEngine.getPerformanceAnalysis().cacheStats;
      
      // Calculate overall efficiency
      const efficiency = this.calculateOverallEfficiency(currentMetrics, currentCacheStats);
      
      // Identify bottlenecks and strengths
      const bottlenecks = this.identifyBottlenecks(currentMetrics, currentCacheStats);
      const strengths = this.identifyStrengths(currentMetrics, currentCacheStats);
      
      // Generate performance profiles
      const profiles = this.generatePerformanceProfiles(currentMetrics);
      
      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(currentMetrics, currentCacheStats, profiles);
      
      return {
        overall: {
          efficiency,
          bottlenecks,
          strengths
        },
        profiles,
        recommendations
      };
    } else {
      // Overloaded method implementation
      const overallEfficiency = this.calculateOverallEfficiency(metrics!, cacheStats!) / 100;
      const cacheEfficiency = cacheStats!.hitRatio;
      const computeEfficiency = Math.max(0, 1 - (metrics!.averageComputeTime / 1));
      
      // Identify bottlenecks and strengths
      const bottlenecks = this.identifyBottlenecks(metrics!, cacheStats!);
      const strengths = this.identifyStrengths(metrics!, cacheStats!);
      
      return {
        overallEfficiency,
        cacheEfficiency,
        computeEfficiency,
        bottlenecks,
        strengths
      };
    }
  }
  
  /**
   * Calculates overall efficiency score (0-100)
   */
  private static calculateOverallEfficiency(
    metrics: ComparisonMetrics,
    cacheStats: CacheStats
  ): number {
    if (metrics.totalComparisons === 0) return 0;
    
    // Weight different efficiency factors
    const fastPathWeight = 0.4;
    const cacheWeight = 0.3;
    const speedWeight = 0.3;
    
    const fastPathRatio = metrics.fastPathHits / metrics.totalComparisons;
    const cacheHitRatio = cacheStats.hitRatio;
    const speedScore = Math.max(0, 1 - (metrics.averageComputeTime / 1)); // 1ms baseline
    
    const efficiency = (
      (fastPathRatio * fastPathWeight) +
      (cacheHitRatio * cacheWeight) +
      (speedScore * speedWeight)
    ) * 100;
    
    return Math.round(efficiency);
  }
  
  /**
   * Identifies performance bottlenecks
   */
  private static identifyBottlenecks(
    metrics: ComparisonMetrics,
    cacheStats: CacheStats
  ): string[] {
    const bottlenecks: string[] = [];
    
    if (metrics.totalComparisons === 0) {
      return ['No comparison data available'];
    }
    
    const fastPathRatio = metrics.fastPathHits / metrics.totalComparisons;
    if (fastPathRatio < 0.3) {
      bottlenecks.push('Low fast-path utilization');
    }
    
    if (cacheStats.hitRatio < 0.5 && metrics.totalComparisons > 100) {
      bottlenecks.push('Poor cache performance');
    }
    
    if (metrics.averageComputeTime > 0.5) {
      bottlenecks.push('High average computation time');
    }
    
    if (cacheStats.averageAccessTime > 0.01) {
      bottlenecks.push('Slow cache access');
    }
    
    // Check for unbalanced operation distribution
    const operationCounts = Object.values(metrics.operationBreakdown);
    const maxOperations = Math.max(...operationCounts);
    const minOperations = Math.min(...operationCounts);
    if (maxOperations > minOperations * 10) {
      bottlenecks.push('Unbalanced operation distribution');
    }
    
    // Check for low fast path usage (strategy imbalance indicator)
    if (fastPathRatio < 0.1) {
      bottlenecks.push('Strategy usage imbalance detected');
    }
    
    // Check for slow computation
    if (metrics.averageComputeTime >= 50) {
      bottlenecks.push('Very slow compute times detected');
    }
    
    return bottlenecks;
  }
  
  /**
   * Identifies performance strengths
   */
  private static identifyStrengths(
    metrics: ComparisonMetrics,
    cacheStats: CacheStats
  ): string[] {
    const strengths: string[] = [];
    
    if (metrics.totalComparisons === 0) {
      return [];
    }
    
    const fastPathRatio = metrics.fastPathHits / metrics.totalComparisons;
    if (fastPathRatio > 0.7) {
      strengths.push('Excellent fast-path utilization');
    }
    
    // Cache performance strengths
    if (cacheStats.hitRatio > 0.8) {
      strengths.push('High cache hit ratio');
    }
    
    if (cacheStats.hitRatio >= 0.9) {
      strengths.push('Excellent cache performance');
    }
    
    // Compute performance strengths
    if (metrics.averageComputeTime < 0.5) {
      strengths.push('Fast computation times');
    }
    
    if (metrics.averageComputeTime <= 0.1) {
      strengths.push('Excellent compute performance');
    }
    
    if (cacheStats.averageAccessTime < 0.001) {
      strengths.push('Efficient cache access');
    }
    
    // Strategy balance strengths (based on fast path usage)
    if (fastPathRatio >= 0.5 && fastPathRatio <= 0.8) {
      strengths.push('Well-balanced strategy usage');
    }
    
    return strengths;
  }
  
  /**
   * Generates performance profiles for different operations
   */
  private static generatePerformanceProfiles(metrics: ComparisonMetrics): PerformanceProfile[] {
    const profiles: PerformanceProfile[] = [];
    
    for (const [operation, count] of Object.entries(metrics.operationBreakdown)) {
      const frequency = count / metrics.totalComparisons;
      
      // Estimate performance metrics for this operation
      // (In a real implementation, we'd track these separately)
      const profile: PerformanceProfile = {
        operation: operation as ComparisonType,
        averageTime: metrics.averageComputeTime * this.getOperationComplexityFactor(operation as ComparisonType),
        cacheHitRatio: metrics.cacheHits / metrics.totalComparisons, // Simplified
        fastPathRatio: metrics.fastPathHits / metrics.totalComparisons, // Simplified
        frequency,
        efficiency: this.calculateOperationEfficiency(operation as ComparisonType, frequency)
      };
      
      profiles.push(profile);
    }
    
    return profiles.sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Gets complexity factor for different operations
   */
  private static getOperationComplexityFactor(operation: ComparisonType): number {
    switch (operation) {
      case 'isSame':
      case 'isBefore':
      case 'isAfter':
        return 0.5; // Simple operations
      case 'isSameOrBefore':
      case 'isSameOrAfter':
        return 0.7; // Slightly more complex
      case 'diff':
        return 2.0; // Most complex
      default:
        return 1.0;
    }
  }
  
  /**
   * Calculates efficiency for a specific operation
   */
  private static calculateOperationEfficiency(operation: ComparisonType, frequency: number): number {
    const complexityFactor = this.getOperationComplexityFactor(operation);
    const frequencyBonus = Math.min(frequency * 2, 1); // More frequent = more important to optimize
    
    return Math.round((1 / complexityFactor) * frequencyBonus * 100);
  }
  
  /**
   * Generates recommendations with provided metrics and cache stats
   */
  static generateRecommendations(
    metrics: ComparisonMetrics,
    cacheStats: CacheStats
  ): Array<{
    type: 'cache_size' | 'cache_optimization' | 'strategy_optimization' | 'performance_tuning';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }> {
    const recommendations: Array<{
      type: 'cache_size' | 'cache_optimization' | 'strategy_optimization' | 'performance_tuning';
      description: string;
      impact: 'low' | 'medium' | 'high';
    }> = [];

    // Cache size recommendations
    if (cacheStats.evictions > cacheStats.hits * 0.1) {
      recommendations.push({
        type: 'cache_size',
        description: 'Consider increase cache size to reduce evictions',
        impact: 'medium'
      });
    }

    // Cache optimization recommendations
    if (cacheStats.hitRatio < 0.5) {
      recommendations.push({
        type: 'cache_optimization',
        description: 'Improve cache hit ratio through better key generation',
        impact: 'high'
      });
    }

    // Strategy optimization recommendations
    const fastPathRatio = metrics.fastPathHits / metrics.totalComparisons;
    if (fastPathRatio < 0.3) {
      recommendations.push({
        type: 'strategy_optimization',
        description: 'Balance strategy usage for better performance',
        impact: 'medium'
      });
    }

    // Performance tuning recommendations
    if (metrics.averageComputeTime > 10) {
      recommendations.push({
        type: 'performance_tuning',
        description: 'Optimize slow computation paths',
        impact: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Generates a performance profile with provided metrics and cache stats
   */
  static generateProfile(
    metrics: ComparisonMetrics,
    cacheStats: CacheStats
  ): {
    timestamp: number;
    metrics: ComparisonMetrics;
    cacheStats: CacheStats;
    analysis: {
      overallEfficiency: number;
      cacheEfficiency: number;
      computeEfficiency: number;
      bottlenecks: string[];
      strengths: string[];
    };
    recommendations: Array<{
      type: 'cache_size' | 'cache_optimization' | 'strategy_optimization' | 'performance_tuning';
      description: string;
      impact: 'low' | 'medium' | 'high';
    }>;
    summary: string;
  } {
    const analysis = this.analyzePerformance(metrics, cacheStats);
    const recommendations = this.generateRecommendations(metrics, cacheStats);
    
    // Generate summary
    const efficiency = Math.round(analysis.overallEfficiency * 100);
    const summary = `Performance analysis: ${efficiency}% efficiency, ` +
      `${analysis.bottlenecks.length} bottlenecks identified, ` +
      `${recommendations.length} recommendations generated.`;
    
    return {
      timestamp: Date.now(),
      metrics,
      cacheStats,
      analysis,
      recommendations,
      summary
    };
  }

  /**
   * Generates optimization recommendations
   */
  private static generateOptimizationRecommendations(
    metrics: ComparisonMetrics,
    cacheStats: CacheStats,
    profiles: PerformanceProfile[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Cache optimization recommendations
    if (cacheStats.hitRatio < 0.5 && metrics.totalComparisons > 100) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        description: 'Increase cache size or improve cache key generation',
        impact: 'Could improve performance by 20-40%',
        implementation: 'Call ComparisonCache.setMaxSize() with a larger value'
      });
    }
    
    // Fast path optimization
    const fastPathRatio = metrics.fastPathHits / metrics.totalComparisons;
    if (fastPathRatio < 0.3) {
      recommendations.push({
        type: 'strategy',
        priority: 'high',
        description: 'Use simpler comparison operations when possible',
        impact: 'Could improve performance by 30-50%',
        implementation: 'Prefer isBefore/isAfter over unit-based comparisons for simple cases'
      });
    }
    
    // Operation-specific recommendations
    const diffProfile = profiles.find(p => p.operation === 'diff');
    if (diffProfile && diffProfile.frequency > 0.3 && diffProfile.efficiency < 50) {
      recommendations.push({
        type: 'pattern',
        priority: 'medium',
        description: 'Optimize diff operations with caching or pre-computation',
        impact: 'Could reduce diff computation time by 15-25%',
        implementation: 'Enable caching for diff operations or use simpler units when possible'
      });
    }
    
    // Cache size recommendations
    if (cacheStats.size === cacheStats.maxSize && cacheStats.hitRatio > 0.8) {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        description: 'Increase cache size to accommodate more entries',
        impact: 'Could improve cache hit ratio by 10-20%',
        implementation: 'Increase cache max size by 50-100%'
      });
    }
    
    // Performance monitoring recommendations
    if (metrics.averageComputeTime > 1) {
      recommendations.push({
        type: 'strategy',
        priority: 'high',
        description: 'Review comparison strategies for performance bottlenecks',
        impact: 'Could reduce computation time significantly',
        implementation: 'Profile individual comparison operations and optimize slow paths'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Applies optimization recommendations automatically
   */
  static applyOptimizations(recommendations: OptimizationRecommendation[]): {
    applied: OptimizationRecommendation[];
    skipped: OptimizationRecommendation[];
    errors: Array<{ recommendation: OptimizationRecommendation; error: string }>;
  } {
    const applied: OptimizationRecommendation[] = [];
    const skipped: OptimizationRecommendation[] = [];
    const errors: Array<{ recommendation: OptimizationRecommendation; error: string }> = [];
    
    for (const recommendation of recommendations) {
      try {
        if (this.canAutoApply(recommendation)) {
          this.applyRecommendation(recommendation);
          applied.push(recommendation);
        } else {
          skipped.push(recommendation);
        }
      } catch (error) {
        errors.push({
          recommendation,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Record optimization history
    this.optimizationHistory.push({
      timestamp: Date.now(),
      recommendations,
      applied: applied.length > 0
    });
    
    return { applied, skipped, errors };
  }
  
  /**
   * Checks if a recommendation can be automatically applied
   */
  private static canAutoApply(recommendation: OptimizationRecommendation): boolean {
    // Only auto-apply safe configuration changes
    return recommendation.type === 'configuration' && 
           recommendation.description.includes('cache size');
  }
  
  /**
   * Applies a specific recommendation
   */
  private static applyRecommendation(recommendation: OptimizationRecommendation): void {
    if (recommendation.description.includes('Increase cache size')) {
      const currentSize = ComparisonEngine.getCacheMaxSize();
      const newSize = Math.floor(currentSize * 1.5);
      ComparisonEngine.setCacheMaxSize(newSize);
    }
    // Add more auto-applicable optimizations here
  }
  
  /**
   * Gets optimization history
   */
  static getOptimizationHistory(): typeof ComparisonOptimizer.optimizationHistory {
    return [...this.optimizationHistory];
  }
  
  /**
   * Benchmarks comparison operations
   */
  static benchmark(iterations: number = 1000): {
    operations: Record<ComparisonType, {
      averageTime: number;
      minTime: number;
      maxTime: number;
      standardDeviation: number;
    }>;
    overall: {
      totalTime: number;
      averageTime: number;
      operationsPerSecond: number;
    };
  } {
    // This would implement actual benchmarking
    // Placeholder implementation
    return {
      operations: {} as any,
      overall: {
        totalTime: 0,
        averageTime: 0,
        operationsPerSecond: 0
      }
    };
  }
  
  /**
   * Generates a comprehensive performance report
   */
  static generatePerformanceReport(): {
    timestamp: number;
    analysis: ReturnType<typeof ComparisonOptimizer.analyzePerformance>;
    metrics: ComparisonMetrics;
    cacheStats: CacheStats;
    history: typeof ComparisonOptimizer.optimizationHistory;
    summary: {
      overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
      keyInsights: string[];
      actionItems: string[];
    };
  } {
    const analysis = this.analyzePerformance();
    const metrics = ComparisonEngine.getMetrics();
    const cacheStats = ComparisonEngine.getPerformanceAnalysis().cacheStats;
    
    // Determine overall health
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (analysis.overall.efficiency >= 85) {
      overallHealth = 'excellent';
    } else if (analysis.overall.efficiency >= 70) {
      overallHealth = 'good';
    } else if (analysis.overall.efficiency >= 50) {
      overallHealth = 'fair';
    } else {
      overallHealth = 'poor';
    }
    
    // Generate key insights
    const keyInsights = [
      `Overall efficiency: ${analysis.overall.efficiency}%`,
      `Total comparisons: ${metrics.totalComparisons}`,
      `Cache hit ratio: ${Math.round(cacheStats.hitRatio * 100)}%`,
      `Fast path usage: ${Math.round((metrics.fastPathHits / Math.max(metrics.totalComparisons, 1)) * 100)}%`
    ];
    
    // Generate action items
    const actionItems = analysis.recommendations
      .filter(r => r.priority === 'high')
      .map(r => r.description);
    
    return {
      timestamp: Date.now(),
      analysis: {
        overallEfficiency: analysis.overall.efficiency,
        cacheEfficiency: cacheStats.hitRatio * 100,
        computeEfficiency: metrics.averageComputeTime > 0 ? (1 / metrics.averageComputeTime) * 100 : 100,
        bottlenecks: analysis.overall.bottlenecks,
        strengths: analysis.overall.strengths
      },
      metrics,
      cacheStats,
      history: this.optimizationHistory,
      summary: {
        overallHealth,
        keyInsights,
        actionItems
      }
    };
  }
  
  /**
   * Resets all optimization data
   */
  static reset(): void {
    this.profiles.clear();
    this.optimizationHistory.length = 0;
  }
}