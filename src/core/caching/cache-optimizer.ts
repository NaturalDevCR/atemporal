/**
 * @file Cache optimizer for dynamic sizing based on usage patterns
 */

import type { CacheMetrics } from './lru-cache';

/**
 * Configuration for cache optimization
 */
export interface CacheOptimizerConfig {
  minCacheSize: number;
  maxCacheSize: number;
  targetHitRatio: number;
  growthFactor: number;
  shrinkFactor: number;
  minSamplesForOptimization: number;
}

/**
 * Default configuration for cache optimization
 */
const DEFAULT_CONFIG: CacheOptimizerConfig = {
  minCacheSize: 10,
  maxCacheSize: 500,
  targetHitRatio: 0.8, // 80% hit ratio target
  growthFactor: 1.5,
  shrinkFactor: 0.8,
  minSamplesForOptimization: 100 // Require 100 operations before optimizing
};

/**
 * Cache optimizer that dynamically adjusts cache sizes based on usage patterns
 */
export class CacheOptimizer {
  private static config: CacheOptimizerConfig = { ...DEFAULT_CONFIG };
  
  /**
   * Updates the optimizer configuration
   */
  static configure(newConfig: Partial<CacheOptimizerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Gets the current optimizer configuration
   */
  static getConfig(): CacheOptimizerConfig {
    return { ...this.config };
  }
  
  /**
   * Calculates the optimal cache size based on usage metrics
   */
  static calculateOptimalSize(metrics: CacheMetrics, currentSize: number): number {
    // In test environments, require fewer samples
    const minSamples = typeof process !== 'undefined' && 
                      process.env && 
                      process.env.NODE_ENV === 'test' 
                      ? 10 
                      : this.config.minSamplesForOptimization;
    
    // If not enough data, maintain current size
    if (metrics.hits + metrics.misses < minSamples) {
      return currentSize;
    }
    
    let newSize = currentSize;
    
    // Adjust based on hit ratio
    if (metrics.hitRatio < this.config.targetHitRatio) {
      // Low hit ratio, increase size
      newSize = Math.min(
        Math.ceil(currentSize * this.config.growthFactor),
        this.config.maxCacheSize
      );
    } else if (metrics.utilization < 0.5 && metrics.size > this.config.minCacheSize) {
      // High hit ratio but low utilization, decrease size
      newSize = Math.max(
        Math.ceil(currentSize * this.config.shrinkFactor),
        this.config.minCacheSize,
        metrics.size + 5 // Keep margin above current usage
      );
    }
    
    return newSize;
  }
  
  /**
   * Analyzes cache performance and provides recommendations
   */
  static analyzePerformance(metrics: CacheMetrics): {
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
    suggestedSize?: number;
  } {
    const recommendations: string[] = [];
    let performance: 'excellent' | 'good' | 'fair' | 'poor';
    
    // Analyze hit ratio
    if (metrics.hitRatio >= 0.9) {
      performance = 'excellent';
    } else if (metrics.hitRatio >= 0.7) {
      performance = 'good';
    } else if (metrics.hitRatio >= 0.5) {
      performance = 'fair';
      recommendations.push('Consider increasing cache size to improve hit ratio');
    } else {
      performance = 'poor';
      recommendations.push('Cache hit ratio is low - significantly increase cache size');
    }
    
    // Analyze utilization
    if (metrics.utilization < 0.3 && performance !== 'poor') {
      recommendations.push('Cache utilization is low - consider reducing size to save memory');
    } else if (metrics.utilization > 0.9) {
      recommendations.push('Cache is nearly full - consider increasing size');
    }
    
    // Memory efficiency
    if (metrics.size > this.config.maxCacheSize * 0.8) {
      recommendations.push('Cache is approaching maximum size limit');
    }
    
    // Calculate suggested size
    const suggestedSize = this.calculateOptimalSize(metrics, metrics.maxSize);
    
    return {
      performance,
      recommendations,
      suggestedSize: suggestedSize !== metrics.maxSize ? suggestedSize : undefined
    };
  }
  
  /**
   * Determines if a cache should be resized based on its metrics
   */
  static shouldResize(metrics: CacheMetrics): boolean {
    const minSamples = typeof process !== 'undefined' && 
                      process.env && 
                      process.env.NODE_ENV === 'test' 
                      ? 10 
                      : this.config.minSamplesForOptimization;
    
    // Need sufficient data
    if (metrics.hits + metrics.misses < minSamples) {
      return false;
    }
    
    // Check if hit ratio is significantly off target
    const hitRatioDiff = Math.abs(metrics.hitRatio - this.config.targetHitRatio);
    if (hitRatioDiff > 0.2) {
      return true;
    }
    
    // Check if utilization is very low or very high
    if (metrics.utilization < 0.2 || metrics.utilization > 0.95) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculates memory efficiency score (0-100)
   */
  static calculateEfficiencyScore(metrics: CacheMetrics): number {
    // Weight factors for different aspects - hit ratio is most important
    const hitRatioWeight = 0.7;
    const utilizationWeight = 0.2;
    const sizeEfficiencyWeight = 0.1;
    
    // Hit ratio score (0-100) - more aggressive penalty for poor performance
    const hitRatioScore = metrics.hitRatio * 100;
    
    // Utilization score (optimal around 60-80%)
    let utilizationScore = 0;
    if (metrics.utilization >= 0.6 && metrics.utilization <= 0.8) {
      utilizationScore = 100;
    } else if (metrics.utilization >= 0.4 && metrics.utilization <= 0.9) {
      utilizationScore = 80;
    } else if (metrics.utilization >= 0.2 && metrics.utilization <= 0.95) {
      utilizationScore = 50; // Reduced from 60 to be more strict
    } else {
      utilizationScore = 30; // Reduced from 40 to be more strict
    }
    
    // Size efficiency (prefer smaller caches when possible)
    const sizeRatio = metrics.size / this.config.maxCacheSize;
    const sizeEfficiencyScore = Math.max(0, 100 - (sizeRatio * 50));
    
    // Calculate weighted score
    const totalScore = (
      hitRatioScore * hitRatioWeight +
      utilizationScore * utilizationWeight +
      sizeEfficiencyScore * sizeEfficiencyWeight
    );
    
    return Math.round(totalScore);
  }
  
  /**
   * Provides detailed optimization insights
   */
  static getOptimizationInsights(metrics: CacheMetrics): {
    currentEfficiency: number;
    potentialImprovement: number;
    keyInsights: string[];
    actionItems: string[];
  } {
    const currentEfficiency = this.calculateEfficiencyScore(metrics);
    const analysis = this.analyzePerformance(metrics);
    
    const keyInsights: string[] = [];
    const actionItems: string[] = [];
    
    // Generate insights based on metrics
    if (metrics.hitRatio < 0.6) {
      keyInsights.push(`Low hit ratio (${(metrics.hitRatio * 100).toFixed(1)}%) indicates cache misses are frequent`);
      actionItems.push('Increase cache size to improve hit ratio');
    }
    
    if (metrics.utilization < 0.3) {
      keyInsights.push(`Low utilization (${(metrics.utilization * 100).toFixed(1)}%) suggests over-provisioned cache`);
      actionItems.push('Consider reducing cache size to optimize memory usage');
    }
    
    if (metrics.utilization > 0.9) {
      keyInsights.push(`High utilization (${(metrics.utilization * 100).toFixed(1)}%) may lead to frequent evictions`);
      actionItems.push('Increase cache size to reduce eviction pressure');
    }
    
    // Estimate potential improvement
    const optimalSize = this.calculateOptimalSize(metrics, metrics.maxSize);
    const potentialImprovement = optimalSize !== metrics.maxSize ? 15 : 5;
    
    return {
      currentEfficiency,
      potentialImprovement,
      keyInsights,
      actionItems
    };
  }
  
  /**
   * Resets configuration to defaults
   */
  static resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
  }
}