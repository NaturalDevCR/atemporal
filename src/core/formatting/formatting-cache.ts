/**
 * @file Formatting cache for compiled formats and results
 */

import type { Temporal } from '@js-temporal/polyfill';
import { ResizableLRUCache } from '../caching/lru-cache';
import { CacheKeys } from '../caching/cache-keys';

/**
 * Cache entry for formatted results
 */
interface FormattingCacheEntry {
  result: string;
  timestamp: number;
  dateKey: string; // Simplified date representation for quick comparison
}

/**
 * High-performance formatting cache
 */
export class FormattingCache {
  private static cache = new ResizableLRUCache<string, FormattingCacheEntry>(1000);
  private static stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  };
  
  // Dynamic sizing configuration
  private static _dynamicSizing = true;
  
  /**
   * Gets a cached formatting result
   */
  static get(cacheKey: string, date: Temporal.ZonedDateTime): string | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Verify the date matches (quick check)
    const dateKey = this.createDateKey(date);
    if (entry.dateKey !== dateKey) {
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.result;
  }
  
  /**
   * Sets a formatting result in the cache
   */
  static set(cacheKey: string, date: Temporal.ZonedDateTime, result: string): void {
    const entry: FormattingCacheEntry = {
      result,
      timestamp: Date.now(),
      dateKey: this.createDateKey(date)
    };
    
    this.cache.set(cacheKey, entry);
    this.stats.sets++;
  }
  
  /**
   * Creates a simplified date key for quick comparison
   */
  private static createDateKey(date: Temporal.ZonedDateTime): string {
    // Create a compact representation that captures all relevant date/time components
    return `${date.year}-${date.month}-${date.day}-${date.hour}-${date.minute}-${date.second}-${date.millisecond}-${date.timeZoneId}`;
  }
  
  /**
   * Checks if a result is cached for the given parameters
   */
  static has(cacheKey: string, date: Temporal.ZonedDateTime): boolean {
    const entry = this.cache.get(cacheKey);
    if (!entry) return false;
    
    const dateKey = this.createDateKey(date);
    return entry.dateKey === dateKey;
  }
  
  /**
   * Removes a specific cache entry
   */
  static delete(cacheKey: string): boolean {
    return this.cache.delete(cacheKey);
  }
  
  /**
   * Clears all cached formatting results
   */
  static clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }
  
  /**
   * Gets cache statistics
   */
  static getStats() {
    const cacheMetrics = this.cache.getMetrics();
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      size: cacheMetrics.size,
      maxSize: cacheMetrics.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      hitRatio: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      efficiency: cacheMetrics.size > 0 ? this.stats.hits / cacheMetrics.size : 0
    };
  }
  
  /**
   * Gets detailed cache information
   */
  static getDetailedStats() {
    const basicStats = this.getStats();
    const cacheMetrics = this.cache.getMetrics();
    
    return {
      ...basicStats,
      memoryUsage: this.estimateMemoryUsage(),
      averageEntryAge: this.calculateAverageEntryAge(),
      cacheMetrics,
      performance: {
        hitsPerSecond: this.calculateHitsPerSecond(),
        missesPerSecond: this.calculateMissesPerSecond()
      }
    };
  }
  
  /**
   * Estimates memory usage of the cache
   */
  private static estimateMemoryUsage(): number {
    const cacheMetrics = this.cache.getMetrics();
    // Rough estimate: each entry ~500 bytes (result string + metadata)
    return cacheMetrics.size * 500;
  }
  
  /**
   * Calculates average age of cache entries
   */
  private static calculateAverageEntryAge(): number {
    const now = Date.now();
    let totalAge = 0;
    let count = 0;
    
    // Note: This is a simplified calculation since we can't easily iterate over LRU cache
    // In a real implementation, we might track this differently
    return 0; // Placeholder
  }
  
  /**
   * Calculates hits per second (rough estimate)
   */
  private static calculateHitsPerSecond(): number {
    // This would require tracking time windows in a real implementation
    return 0; // Placeholder
  }
  
  /**
   * Calculates misses per second (rough estimate)
   */
  private static calculateMissesPerSecond(): number {
    // This would require tracking time windows in a real implementation
    return 0; // Placeholder
  }
  
  /**
   * Optimizes the cache by removing old entries
   */
  static optimize(): void {
    // The ResizableLRUCache handles optimization automatically
    // This method is here for consistency with other cache classes
  }
  
  /**
   * Sets the maximum cache size
   */
  static setMaxSize(size: number): void {
    this.cache.setMaxSize(size);
  }
  
  /**
   * Gets the current maximum cache size
   */
  static getMaxSize(): number {
    return this.cache.getMetrics().maxSize;
  }
  
  /**
   * Validates cache integrity
   */
  static validateCache(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const stats = this.getStats();
    
    // Check for potential issues
    if (stats.hitRatio < 0.5 && stats.hits + stats.misses > 100) {
      warnings.push('Low cache hit ratio detected - consider reviewing cache strategy');
    }
    
    if (stats.size === stats.maxSize) {
      warnings.push('Cache is at maximum capacity - consider increasing size');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Preloads cache with common formatting patterns
   */
  static preload(date: Temporal.ZonedDateTime, patterns: string[]): void {
    // This would typically be called with a representative date
    // and common format patterns to warm up the cache
    
    for (const pattern of patterns) {
      const cacheKey = CacheKeys.customFormat(pattern, 'en-US', { timeZone: date.timeZoneId });
      // Note: We can't actually format here without the FormattingEngine
      // This is a placeholder for the preloading logic
    }
  }
  
  /**
   * Gets cache efficiency metrics
   */
  static getEfficiencyMetrics() {
    const stats = this.getStats();
    const totalRequests = stats.hits + stats.misses;
    
    return {
      hitRatio: stats.hitRatio,
      utilization: stats.maxSize > 0 ? stats.size / stats.maxSize : 0,
      efficiency: totalRequests > 0 ? stats.hits / totalRequests : 0,
      memoryEfficiency: this.estimateMemoryUsage() / (stats.maxSize * 500), // Relative to max possible
      recommendations: this.generateEfficiencyRecommendations(stats)
    };
  }
  
  /**
   * Generates efficiency recommendations
   */
  private static generateEfficiencyRecommendations(stats: ReturnType<typeof FormattingCache.getStats>): string[] {
    const recommendations: string[] = [];
    
    if (stats.hitRatio < 0.6) {
      recommendations.push('Consider preloading cache with common format patterns');
    }
    
    if (stats.size / stats.maxSize > 0.9) {
      recommendations.push('Cache is nearly full - consider increasing max size');
    }
    
    if (stats.hitRatio > 0.9 && stats.size / stats.maxSize < 0.5) {
      recommendations.push('Cache is very efficient but underutilized - could reduce max size');
    }
    
    const totalRequests = stats.hits + stats.misses;
    if (totalRequests < 10) {
      recommendations.push('Insufficient data for meaningful analysis');
    }
    
    return recommendations;
  }
  
  /**
   * Creates a cache snapshot for debugging
   */
  static createSnapshot(): {
    timestamp: number;
    stats: ReturnType<typeof FormattingCache.getStats>;
    efficiency: ReturnType<typeof FormattingCache.getEfficiencyMetrics>;
    validation: ReturnType<typeof FormattingCache.validateCache>;
  } {
    return {
      timestamp: Date.now(),
      stats: this.getStats(),
      efficiency: this.getEfficiencyMetrics(),
      validation: this.validateCache()
    };
  }
  
  /**
   * Resets all statistics but keeps cached data
   */
  static resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  /**
   * Sets dynamic sizing for the cache
   */
  static setDynamicSizing(enabled: boolean): void {
    this._dynamicSizing = enabled;
  }

  /**
   * Checks if dynamic sizing is enabled
   */
  static isDynamicSizingEnabled(): boolean {
    return this._dynamicSizing;
  }
}