/**
 * @file Optimized diff cache with structured keys and enhanced performance
 */

import { Temporal } from '@js-temporal/polyfill';
import { ResizableLRUCache, CacheMetrics } from './lru-cache';
import { CacheKeys } from './cache-keys';
import { CacheOptimizer } from './cache-optimizer';
import type { TimeUnit } from '../../types';

/**
 * Enhanced diff cache with structured keys and dynamic sizing
 */
export class DiffCache {
  // Lazy initialization with configurable size limit
  private static _diffCache: ResizableLRUCache<string, number> | null = null;
  
  // Configurable maximum size for the cache
  private static readonly DEFAULT_MAX_SIZE = 100;
  private static maxCacheSize = this.DEFAULT_MAX_SIZE;
  
  // Dynamic sizing configuration
  private static _dynamicSizing = true;
  
  /**
   * Gets or creates the diff cache
   */
  private static get diffCache(): ResizableLRUCache<string, number> {
    if (!this._diffCache) {
      this._diffCache = new ResizableLRUCache<string, number>(this.maxCacheSize);
    }
    return this._diffCache;
  }
  
  /**
   * Gets a cached diff result or calculates a new one
   */
  static getDiffResult(d1: Temporal.ZonedDateTime, d2: Temporal.ZonedDateTime, unit: TimeUnit): number {
    // Create optimized cache key using structured approach
    const key = CacheKeys.diff(d1, d2, unit);
    
    this.checkAndResizeCache();
    
    let result = this.diffCache.get(key);
    if (result === undefined) {
      // Calculate and cache the result
      result = this.calculateDiff(d1, d2, unit);
      this.diffCache.set(key, result);
    }
    
    return result;
  }
  
  /**
   * Calculates the actual diff between two dates
   */
  private static calculateDiff(d1: Temporal.ZonedDateTime, d2: Temporal.ZonedDateTime, unit: TimeUnit): number {
    type TotalUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
    
    try {
      return d1.since(d2).total({ unit: unit as TotalUnit, relativeTo: d1 });
    } catch (error) {
      // Fallback for unsupported units or edge cases
      console.warn(`Failed to calculate diff for unit ${unit}:`, error);
      return 0;
    }
  }
  
  /**
   * Checks and resizes the cache if necessary
   */
  private static checkAndResizeCache(): void {
    if (!this._dynamicSizing || !this._diffCache || !this._diffCache.shouldResize()) return;
    
    const metrics = this._diffCache.getMetrics();
    const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, metrics.maxSize);
    
    if (optimalSize !== metrics.maxSize) {
      this._diffCache.setMaxSize(optimalSize);
      this._diffCache.markResized();
    }
  }
  
  /**
   * Enables or disables dynamic sizing
   */
  static setDynamicSizing(enabled: boolean): void {
    this._dynamicSizing = enabled;
  }
  
  /**
   * Gets the current dynamic sizing status
   */
  static isDynamicSizingEnabled(): boolean {
    return this._dynamicSizing;
  }
  
  /**
   * Sets the maximum cache size
   */
  static setMaxCacheSize(size: number): void {
    if (size < 1) throw new Error('Cache size must be at least 1');
    
    this.maxCacheSize = size;
    
    // Update existing cache
    if (this._diffCache) {
      this._diffCache.setMaxSize(size);
    }
  }
  
  /**
   * Resets the cache to initial state (for testing)
   */
  static reset(): void {
    this._diffCache = null;
    this.maxCacheSize = this.DEFAULT_MAX_SIZE;
    this._dynamicSizing = true;
  }

  /**
   * Clears the diff cache
   */
  static clear(): void {
    if (this._diffCache) {
      this._diffCache.clear();
    }
  }
  
  /**
   * Gets basic cache statistics
   */
  static getStats() {
    const cacheSize = this._diffCache ? this._diffCache.size : 0;
    
    return {
      diffCache: cacheSize,
      maxSize: this.maxCacheSize
    };
  }
  
  /**
   * Gets detailed cache statistics for monitoring
   */
  static getDetailedStats(): CacheMetrics | null {
    return this._diffCache ? this._diffCache.getMetrics() : null;
  }
  
  /**
   * Optimizes the cache by triggering resize check
   */
  static optimize(): void {
    this.checkAndResizeCache();
  }
  
  /**
   * Pre-warms the cache with common diff calculations
   */
  static preWarm(baseDate?: Temporal.ZonedDateTime): void {
    const base = baseDate || Temporal.Now.zonedDateTimeISO('UTC');
    const units: TimeUnit[] = ['day', 'hour', 'minute', 'second', 'millisecond'];
    
    // Pre-calculate common diffs
    const testDates = [
      base.add({ days: 1 }),
      base.add({ hours: 1 }),
      base.add({ minutes: 30 }),
      base.subtract({ days: 1 }),
      base.subtract({ hours: 1 })
    ];
    
    for (const testDate of testDates) {
      for (const unit of units) {
        this.getDiffResult(base, testDate, unit);
      }
    }
  }
  
  /**
   * Gets cache efficiency metrics
   */
  static getEfficiencyMetrics(): {
    hitRatio: number;
    utilization: number;
    cacheSize: number;
    recommendedOptimization: string;
  } {
    if (!this._diffCache) {
      return {
        hitRatio: 0,
        utilization: 0,
        cacheSize: 0,
        recommendedOptimization: 'Cache not initialized'
      };
    }
    
    const metrics = this._diffCache.getMetrics();
    
    let recommendation = 'Cache is well optimized';
    if (metrics.hitRatio < 0.6) {
      recommendation = 'Consider increasing cache size or pre-warming with common calculations';
    } else if (metrics.utilization < 0.2) {
      recommendation = 'Consider decreasing cache size to save memory';
    }
    
    return {
      hitRatio: metrics.hitRatio,
      utilization: metrics.utilization,
      cacheSize: metrics.size,
      recommendedOptimization: recommendation
    };
  }
  
  /**
   * Analyzes cache usage patterns
   */
  static analyzeUsage(): {
    totalOperations: number;
    cacheHits: number;
    cacheMisses: number;
    memoryEfficiency: string;
  } {
    if (!this._diffCache) {
      return {
        totalOperations: 0,
        cacheHits: 0,
        cacheMisses: 0,
        memoryEfficiency: 'No data available'
      };
    }
    
    const metrics = this._diffCache.getMetrics();
    const totalOps = metrics.hits + metrics.misses;
    
    let efficiency = 'Poor';
    if (metrics.hitRatio > 0.8) efficiency = 'Excellent';
    else if (metrics.hitRatio > 0.6) efficiency = 'Good';
    else if (metrics.hitRatio > 0.4) efficiency = 'Fair';
    
    return {
      totalOperations: totalOps,
      cacheHits: metrics.hits,
      cacheMisses: metrics.misses,
      memoryEfficiency: efficiency
    };
  }
}