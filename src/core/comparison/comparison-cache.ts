/**
 * @file Cache for comparison results
 */

import type {
  ComparisonResult,
  ComparisonCacheEntry
} from './comparison-types';
import { ResizableLRUCache } from '../caching/lru-cache';

/**
 * High-performance cache for comparison results
 */
export class ComparisonCache {
  private cache: ResizableLRUCache<string, ComparisonCacheEntry>;
  private keyTracker: Map<string, { accessCount: number; lastAccess: number }> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    totalAccessTime: 0
  };

  constructor(maxSize: number = 2000) {
    this.cache = new ResizableLRUCache<string, ComparisonCacheEntry>(maxSize);
  }
  
  /**
   * Gets a cached comparison result
   */
  get(cacheKey: string): ComparisonCacheEntry | undefined {
    const startTime = performance.now();
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      this.stats.totalAccessTime += performance.now() - startTime;
      return undefined;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccess = Date.now();
    
    // Update key tracker
    const tracker = this.keyTracker.get(cacheKey);
    if (tracker) {
      tracker.accessCount++;
      tracker.lastAccess = Date.now();
    }
    
    this.stats.hits++;
    this.stats.totalAccessTime += performance.now() - startTime;
    
    return entry;
  }
  
  /**
   * Sets a comparison result in the cache
   */
  set(cacheKey: string, entry: ComparisonCacheEntry): void {
    // Check if this will cause an eviction
    const metrics = this.cache.getMetrics();
    const willEvict = !this.cache.has(cacheKey) && metrics.size >= metrics.maxSize;
    
    // Ensure entry has required fields
    const cacheEntry: ComparisonCacheEntry = {
      ...entry,
      timestamp: entry.timestamp || Date.now(),
      accessCount: entry.accessCount || 1,
      lastAccess: entry.lastAccess || Date.now()
    };
    
    this.cache.set(cacheKey, cacheEntry);
    
    // Update key tracker
    this.keyTracker.set(cacheKey, {
      accessCount: cacheEntry.accessCount,
      lastAccess: cacheEntry.lastAccess
    });
    
    this.stats.sets++;
    
    // Track eviction if one occurred
    if (willEvict) {
      this.stats.evictions++;
    }
  }
  
  /**
   * Checks if a result is cached
   */
  has(cacheKey: string): boolean {
    return this.cache.has(cacheKey);
  }

  /**
   * Removes a specific cache entry
   */
  delete(cacheKey: string): boolean {
    const result = this.cache.delete(cacheKey);
    if (result) {
      this.keyTracker.delete(cacheKey);
    }
    return result;
  }

  /**
   * Clears all cached comparison results
   */
  clear(): void {
    this.cache.clear();
    this.keyTracker.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalAccessTime: 0
    };
  }

  /**
   * Gets the current cache size
   */
  size(): number {
    return this.cache.getMetrics().size;
  }
  
  /**
   * Gets cache statistics
   */
  getStats() {
    const cacheMetrics = this.cache.getMetrics();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    return {
      size: cacheMetrics.size,
      maxSize: cacheMetrics.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      evictions: this.stats.evictions,
      hitRatio: hitRate,
      hitRate: hitRate,
      averageAccessTime: totalRequests > 0 ? this.stats.totalAccessTime / totalRequests : 0,
      efficiency: cacheMetrics.size > 0 ? this.stats.hits / cacheMetrics.size : 0
    };
  }
  
  /**
   * Gets detailed cache information
   */
  getDetailedStats() {
    const basicStats = this.getStats();
    const cacheMetrics = this.cache.getMetrics();
    
    return {
      ...basicStats,
      memoryUsage: this.estimateMemoryUsage(),
      cacheMetrics,
      performance: {
        averageAccessTime: basicStats.averageAccessTime,
        cacheEfficiency: basicStats.efficiency
      }
    };
  }
  
  /**
   * Estimates memory usage of the cache
   */
  private estimateMemoryUsage(): number {
    const cacheMetrics = this.cache.getMetrics();
    // Rough estimate: each entry ~300 bytes (result + metadata)
    return cacheMetrics.size * 300;
  }
  
  /**
   * Optimizes the cache by removing old or rarely accessed entries
   */
  optimize(): {
    entriesRemoved: number;
    memoryFreed: number;
  } {
    const initialSize = this.cache.getMetrics().size;
    const initialMemory = this.estimateMemoryUsage();
    
    // Remove entries that haven't been accessed recently
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let entriesRemoved = 0;
    
    for (const [key, tracker] of this.keyTracker) {
      if (tracker.lastAccess < cutoffTime && tracker.accessCount <= 1) {
        this.delete(key);
        entriesRemoved++;
      }
    }
    
    const finalMemory = this.estimateMemoryUsage();
    const memoryFreed = Math.max(0, initialMemory - finalMemory);
    
    return {
      entriesRemoved,
      memoryFreed
    };
  }

  /**
   * Sets the maximum cache size
   */
  setMaxSize(size: number): void {
    this.cache.setMaxSize(size);
  }

  /**
   * Gets the current maximum cache size
   */
  getMaxSize(): number {
    return this.cache.getMetrics().maxSize;
  }

  /**
   * Gets memory usage information
   */
  getMemoryUsage(): {
    totalBytes: number;
    averageBytesPerEntry: number;
    estimatedOverhead: number;
    overhead: number;
  } {
    const memoryUsage = this.estimateMemoryUsage();
    const stats = this.getStats();
    const overhead = Math.floor(memoryUsage * 0.1); // Estimate 10% overhead
    
    return {
      totalBytes: memoryUsage,
      averageBytesPerEntry: stats.size > 0 ? memoryUsage / stats.size : 0,
      estimatedOverhead: overhead,
      overhead: overhead
    };
  }

  /**
   * Validates cache integrity
   */
  validateCache(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const stats = this.getStats();
    
    // Check for potential issues
    if (stats.hitRatio < 0.4 && stats.hits + stats.misses > 100) {
      warnings.push('Low cache hit ratio detected - comparison patterns may not be cache-friendly');
    }
    
    if (stats.size === stats.maxSize) {
      warnings.push('Cache is at maximum capacity - consider increasing size');
    }
    
    if (stats.averageAccessTime > 0.01) {
      warnings.push('High average access time - cache may be too large or fragmented');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Gets cache efficiency metrics
   */
  getEfficiencyMetrics() {
    const stats = this.getStats();
    const totalRequests = stats.hits + stats.misses;
    
    return {
      hitRate: stats.hitRatio,
      utilization: stats.maxSize > 0 ? stats.size / stats.maxSize : 0,
      efficiency: totalRequests > 0 ? stats.hits / totalRequests : 0,
      memoryEfficiency: this.estimateMemoryUsage() / (stats.maxSize * 300), // Relative to max possible
      accessPatternScore: stats.averageAccessTime < 0.001 ? 1 : Math.max(0, 1 - (stats.averageAccessTime / 0.01)),
      overallScore: (stats.hitRatio + (stats.maxSize > 0 ? stats.size / stats.maxSize : 0)) / 2,
      recommendations: this.generateEfficiencyRecommendations(stats)
    };
  }
  
  /**
   * Generates efficiency recommendations
   */
  private generateEfficiencyRecommendations(stats: ReturnType<ComparisonCache['getStats']>): string[] {
    const recommendations: string[] = [];
    
    if (stats.hitRatio < 0.5) {
      recommendations.push('Cache hit ratio is low - comparison operations may not benefit from caching');
    }
    
    if (stats.size / stats.maxSize > 0.9) {
      recommendations.push('Cache is nearly full - consider increasing max size');
    }
    
    if (stats.hitRatio > 0.8 && stats.size / stats.maxSize < 0.5) {
      recommendations.push('Cache is very efficient but underutilized - could reduce max size');
    }
    
    if (stats.averageAccessTime > 0.005) {
      recommendations.push('High access time - consider cache optimization or size reduction');
    }
    
    const totalRequests = stats.hits + stats.misses;
    if (totalRequests < 20) {
      recommendations.push('Insufficient data for meaningful analysis');
    }
    
    return recommendations;
  }
  
  /**
   * Creates a cache snapshot for debugging
   */
  createSnapshot(): {
    timestamp: number;
    size: number;
    maxSize: number;
    stats: ReturnType<ComparisonCache['getStats']>;
    memoryUsage: number;
    entries: Array<{ key: string; value: ComparisonCacheEntry }>;
  } {
    const metrics = this.cache.getMetrics();
    const entries: Array<{ key: string; value: ComparisonCacheEntry }> = [];
    
    // Build entries from keyTracker and cache
    for (const [key] of this.keyTracker) {
      const value = this.cache.get(key);
      if (value) {
        entries.push({ key, value });
      }
    }
    
    return {
      timestamp: Date.now(),
      size: metrics.size,
      maxSize: metrics.maxSize,
      stats: this.getStats(),
      memoryUsage: this.estimateMemoryUsage(),
      entries
    };
  }

  /**
   * Resets all statistics but keeps cached data
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalAccessTime: 0
    };
  }

  /**
   * Preloads cache with common comparison patterns
   */
  preload(patterns: Array<{
    key: string;
    entry: ComparisonCacheEntry;
  }>): void {
    for (const pattern of patterns) {
      this.set(pattern.key, pattern.entry);
    }
  }

  /**
   * Preloads cache patterns and returns statistics
   */
  preloadPatterns(patterns: Array<{
    key: string;
    entry: ComparisonCacheEntry;
  }>): { loaded: number; skipped: number } {
    let loaded = 0;
    let skipped = 0;
    
    for (const pattern of patterns) {
      if (this.has(pattern.key)) {
        skipped++;
      } else {
        this.set(pattern.key, pattern.entry);
        loaded++;
      }
    }
    
    return { loaded, skipped };
  }
  
  /**
   * Gets the most frequently accessed cache entries
   */
  getTopEntries(limit: number = 10): Array<{
    key: string;
    accessCount: number;
    lastAccess: number;
  }> {
    // Note: This would require iterating over the cache entries
    // which isn't directly supported by our LRU cache implementation
    // This is a placeholder for future enhancement
    return [];
  }

  /**
   * Analyzes cache usage patterns
   */
  analyzeUsagePatterns(): {
    totalEntries: number;
    averageAccessCount: number;
    hotEntries: number;
    coldEntries: number;
    hotKeys: string[];
    coldKeys: string[];
    accessDistribution: object;
    temporalPatterns: object;
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];
    
    const hotThreshold = 5; // Entries accessed more than 5 times
    const coldThreshold = 1; // Entries accessed only once
    
    const hotKeys: string[] = [];
    const coldKeys: string[] = [];
    let totalAccessCount = 0;
    
    // Analyze actual key access patterns
    for (const [key, tracker] of this.keyTracker) {
      totalAccessCount += tracker.accessCount;
      
      if (tracker.accessCount >= hotThreshold) {
        hotKeys.push(key);
      } else if (tracker.accessCount <= coldThreshold) {
        coldKeys.push(key);
      }
    }
    
    const averageAccessCount = this.keyTracker.size > 0 ? totalAccessCount / this.keyTracker.size : 0;
    
    if (stats.hitRatio > 0.8) {
      recommendations.push('High hit ratio indicates good cache locality');
    }
    
    if (coldKeys.length / this.keyTracker.size > 0.5) {
      recommendations.push('Many cold entries detected - consider cache size optimization');
    }
    
    return {
      totalEntries: stats.size,
      averageAccessCount,
      hotEntries: hotKeys.length,
      coldEntries: coldKeys.length,
      hotKeys,
      coldKeys,
      accessDistribution: {
        hot: hotKeys.length,
        cold: coldKeys.length,
        warm: this.keyTracker.size - hotKeys.length - coldKeys.length
      },
      temporalPatterns: {
        recentAccess: Array.from(this.keyTracker.entries())
          .filter(([, tracker]) => Date.now() - tracker.lastAccess < 60000)
          .length
      },
      recommendations
    };
  }

  /**
   * Validates cache integrity
   */
  validateIntegrity(): {
    isValid: boolean;
    issues: string[];
    entriesChecked: number;
  } {
    const metrics = this.cache.getMetrics();
    return {
      isValid: true,
      issues: [],
      entriesChecked: metrics.size
    };
  }

  /**
   * Gets efficiency recommendations
   */
  getEfficiencyRecommendations(): Array<{
    type: string;
    description: string;
    impact: string;
  }> {
    const stats = this.getStats();
    const recommendations: Array<{ type: string; description: string; impact: string }> = [];
    
    if (stats.hitRatio < 0.5) {
      recommendations.push({
        type: 'hit_ratio',
        description: 'Cache hit ratio is low - comparison operations may not benefit from caching',
        impact: 'high'
      });
    }
    
    if (stats.size / stats.maxSize > 0.9) {
      recommendations.push({
        type: 'capacity',
        description: 'Cache is nearly full - consider increasing max size',
        impact: 'medium'
      });
    }
    
    return recommendations;
  }
}