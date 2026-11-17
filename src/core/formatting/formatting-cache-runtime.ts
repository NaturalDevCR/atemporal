/**
 * @file Formatting cache for compiled formats and results
 */

import type { Temporal } from '../../types/temporal';
import { ResizableLRUCache } from '../caching/lru-cache';

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
    return `${date.epochNanoseconds}|${date.timeZoneId}|${date.calendarId}`;
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
  
  /** @internal Read-only metrics used by optional cache analysis. */
  static getCacheMetrics() {
    return this.cache.getMetrics();
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
