/**
 * @file Global cache coordinator for unified cache management
 */

import { IntlCache } from './intl-cache';
import { DiffCache } from './diff-cache';
import { CacheOptimizer } from './cache-optimizer';
import type { CacheMetrics } from './lru-cache';

/**
 * Interface for registerable caches
 */
export interface RegisterableCache {
  clear(): void;
  getStats(): any;
  getMetrics?(): CacheMetrics;
  optimize?(): void;
}

/**
 * Global cache statistics
 */
export interface GlobalCacheStats {
  intl: {
    summary: ReturnType<typeof IntlCache.getStats>;
    detailed: ReturnType<typeof IntlCache.getDetailedStats>;
  };
  diff: {
    summary: ReturnType<typeof DiffCache.getStats>;
    detailed: ReturnType<typeof DiffCache.getDetailedStats>;
  };
  plugins: Record<string, any>;
  total: {
    cacheCount: number;
    maxSize: number;
    efficiency: number;
  };
}

/**
 * Global cache coordinator for cross-plugin optimization
 */
export class GlobalCacheCoordinator {
  private static registeredCaches: Map<string, RegisterableCache> = new Map();
  private static lastOptimization = Date.now();
  private static optimizationInterval = 300000; // 5 minutes default
  
  /**
   * Registers a cache with the global coordinator
   */
  static registerCache(name: string, cache: RegisterableCache): void {
    this.registeredCaches.set(name, cache);
  }
  
  /**
   * Unregisters a cache from the global coordinator
   */
  static unregisterCache(name: string): boolean {
    return this.registeredCaches.delete(name);
  }
  
  /**
   * Gets all registered cache names
   */
  static getRegisteredCacheNames(): string[] {
    return Array.from(this.registeredCaches.keys());
  }
  
  /**
   * Clears all caches across the entire library
   */
  static clearAll(): void {
    // Clear core caches
    IntlCache.clearAll();
    DiffCache.clear();
    
    // Clear all registered plugin caches
    for (const cache of Array.from(this.registeredCaches.values())) {
      try {
        cache.clear();
      } catch (error) {
        console.warn('Failed to clear cache:', error);
      }
    }
  }
  
  /**
   * Gets comprehensive cache statistics from all cache systems
   */
  static getAllStats(): GlobalCacheStats {
    const intlStats = IntlCache.getStats();
    const intlDetailedStats = IntlCache.getDetailedStats();
    const diffStats = DiffCache.getStats();
    const diffDetailedStats = DiffCache.getDetailedStats();
    
    // Get stats from all registered plugin caches
    const pluginStats: Record<string, any> = {};
    for (const [name, cache] of Array.from(this.registeredCaches.entries())) {
      try {
        pluginStats[name] = cache.getStats();
      } catch (error) {
        pluginStats[name] = { error: 'Failed to get stats' };
      }
    }
    
    // Calculate overall efficiency
    const efficiency = this.calculateOverallEfficiency();
    
    return {
      intl: {
        summary: intlStats,
        detailed: intlDetailedStats
      },
      diff: {
        summary: diffStats,
        detailed: diffDetailedStats
      },
      plugins: pluginStats,
      total: {
        cacheCount: intlStats.total + diffStats.diffCache,
        maxSize: intlStats.maxSize + diffStats.maxSize,
        efficiency
      }
    };
  }
  
  /**
   * Optimizes all caches by triggering resize checks
   */
  static optimizeAll(): void {
    // Optimize core caches
    IntlCache.optimize();
    DiffCache.optimize();
    
    // Optimize registered plugin caches
    for (const cache of Array.from(this.registeredCaches.values())) {
      if (cache.optimize) {
        try {
          cache.optimize();
        } catch (error) {
          console.warn('Failed to optimize cache:', error);
        }
      }
    }
    
    this.lastOptimization = Date.now();
  }
  
  /**
   * Sets maximum cache sizes for all cache systems
   */
  static setMaxCacheSizes(sizes: {
    intl?: number;
    diff?: number;
    plugins?: Record<string, number>;
  }): void {
    if (sizes.intl !== undefined) {
      IntlCache.setMaxCacheSize(sizes.intl);
    }
    
    if (sizes.diff !== undefined) {
      DiffCache.setMaxCacheSize(sizes.diff);
    }
    
    // Note: Plugin cache sizes would need to be handled by individual plugins
    // This is a placeholder for future plugin cache size management
  }
  
  /**
   * Enables or disables dynamic sizing for all caches
   */
  static setDynamicSizing(enabled: boolean): void {
    IntlCache.setDynamicSizing(enabled);
    DiffCache.setDynamicSizing(enabled);
  }
  
  /**
   * Gets the current dynamic sizing status
   */
  static getDynamicSizingStatus() {
    return {
      intl: IntlCache.isDynamicSizingEnabled(),
      diff: DiffCache.isDynamicSizingEnabled()
    };
  }
  
  /**
   * Sets the optimization interval
   */
  static setOptimizationInterval(milliseconds: number): void {
    if (milliseconds < 60000) {
      throw new Error('Optimization interval must be at least 60 seconds');
    }
    this.optimizationInterval = milliseconds;
  }
  
  /**
   * Checks if optimization should be triggered
   */
  static shouldOptimize(): boolean {
    return Date.now() - this.lastOptimization >= this.optimizationInterval;
  }
  
  /**
   * Auto-optimizes caches if enough time has passed
   */
  static autoOptimize(): void {
    if (this.shouldOptimize()) {
      this.optimizeAll();
    }
  }
  
  /**
   * Calculates overall cache efficiency across all systems
   */
  private static calculateOverallEfficiency(): number {
    const intlMetrics = IntlCache.getEfficiencyMetrics();
    const diffMetrics = DiffCache.getEfficiencyMetrics();
    
    // Weight by cache usage (more used caches have higher weight)
    const intlWeight = intlMetrics.totalCacheSize || 1;
    const diffWeight = diffMetrics.cacheSize || 1;
    const totalWeight = intlWeight + diffWeight;
    
    if (totalWeight === 0) return 0;
    
    const intlEfficiency = (intlMetrics.averageHitRatio || 0) * 100;
    const diffEfficiency = (diffMetrics.hitRatio || 0) * 100;
    
    const weightedEfficiency = (
      (intlEfficiency * intlWeight) + 
      (diffEfficiency * diffWeight)
    ) / totalWeight;
    
    return Math.round(weightedEfficiency);
  }
  
  /**
   * Gets memory usage summary across all caches
   */
  static getMemoryUsage(): {
    totalCaches: number;
    totalEntries: number;
    estimatedMemoryKB: number;
    recommendations: string[];
  } {
    const stats = this.getAllStats();
    const recommendations: string[] = [];
    
    const totalCaches = this.registeredCaches.size + 2; // +2 for intl and diff
    const totalEntries = stats.total.cacheCount;
    
    // Rough estimation: each cache entry ~1KB (very approximate)
    const estimatedMemoryKB = totalEntries * 1;
    
    // Generate recommendations
    if (estimatedMemoryKB > 1000) {
      recommendations.push('Consider reducing cache sizes - high memory usage detected');
    }
    
    if (stats.total.efficiency < 60) {
      recommendations.push('Cache efficiency is low - consider optimization');
    }
    
    if (totalCaches > 10) {
      recommendations.push('Many caches registered - consider consolidation');
    }
    
    return {
      totalCaches,
      totalEntries,
      estimatedMemoryKB,
      recommendations
    };
  }
  
  /**
   * Generates a comprehensive cache health report
   */
  static getHealthReport(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    efficiency: number;
    memoryUsage: ReturnType<typeof GlobalCacheCoordinator.getMemoryUsage>;
    recommendations: string[];
    lastOptimization: Date;
  } {
    const efficiency = this.calculateOverallEfficiency();
    const memoryUsage = this.getMemoryUsage();
    const recommendations: string[] = [...memoryUsage.recommendations];
    
    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (efficiency >= 85) {
      overall = 'excellent';
    } else if (efficiency >= 70) {
      overall = 'good';
    } else if (efficiency >= 50) {
      overall = 'fair';
      recommendations.push('Cache performance could be improved');
    } else {
      overall = 'poor';
      recommendations.push('Cache performance needs immediate attention');
    }
    
    // Check if optimization is overdue
    if (this.shouldOptimize()) {
      recommendations.push('Cache optimization is overdue - run optimizeAll()');
    }
    
    return {
      overall,
      efficiency,
      memoryUsage,
      recommendations,
      lastOptimization: new Date(this.lastOptimization)
    };
  }
  
  /**
   * Resets all cache statistics and optimization timers
   */
  static reset(): void {
    this.clearAll();
    this.lastOptimization = Date.now();
  }
}