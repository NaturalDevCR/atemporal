/**
 * @file Optimized Intl cache with structured keys and enhanced performance
 */

import { ResizableLRUCache, CacheMetrics } from './lru-cache';
import { CacheKeys } from './cache-keys';
import { CacheOptimizer } from './cache-optimizer';

/**
 * Enhanced Intl cache with structured keys and dynamic sizing
 */
export class IntlCache {
  // Lazy initialization with configurable size limits
  private static _dateTimeFormatters: ResizableLRUCache<string, Intl.DateTimeFormat> | null = null;
  private static _relativeTimeFormatters: ResizableLRUCache<string, Intl.RelativeTimeFormat> | null = null;
  private static _numberFormatters: ResizableLRUCache<string, Intl.NumberFormat> | null = null;
  private static _listFormatters: ResizableLRUCache<string, any> | null = null;
  
  // Configurable maximum size for each cache
  private static readonly DEFAULT_MAX_SIZE = 50;
  private static maxCacheSize = this.DEFAULT_MAX_SIZE;
  
  // Dynamic sizing configuration
  private static _dynamicSizing = true;
  
  /**
   * Gets or creates the DateTimeFormat cache
   */
  private static get dateTimeFormatters(): ResizableLRUCache<string, Intl.DateTimeFormat> {
    if (!this._dateTimeFormatters) {
      this._dateTimeFormatters = new ResizableLRUCache<string, Intl.DateTimeFormat>(this.maxCacheSize);
    }
    return this._dateTimeFormatters;
  }
  
  /**
   * Gets or creates the RelativeTimeFormat cache
   */
  private static get relativeTimeFormatters(): ResizableLRUCache<string, Intl.RelativeTimeFormat> {
    if (!this._relativeTimeFormatters) {
      this._relativeTimeFormatters = new ResizableLRUCache<string, Intl.RelativeTimeFormat>(this.maxCacheSize);
    }
    return this._relativeTimeFormatters;
  }
  
  /**
   * Gets or creates the NumberFormat cache
   */
  private static get numberFormatters(): ResizableLRUCache<string, Intl.NumberFormat> {
    if (!this._numberFormatters) {
      this._numberFormatters = new ResizableLRUCache<string, Intl.NumberFormat>(this.maxCacheSize);
    }
    return this._numberFormatters;
  }
  
  /**
   * Gets or creates the ListFormat cache
   */
  private static get listFormatters(): ResizableLRUCache<string, any> {
    if (!this._listFormatters) {
      this._listFormatters = new ResizableLRUCache<string, any>(this.maxCacheSize);
    }
    return this._listFormatters;
  }
  
  /**
   * Gets a cached DateTimeFormat instance or creates a new one
   */
  static getDateTimeFormatter(locale: string, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
    const key = CacheKeys.dateTimeFormat(locale, options);
    
    this.checkAndResizeCaches();
    
    let formatter = this.dateTimeFormatters.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, options);
      this.dateTimeFormatters.set(key, formatter);
    }
    
    return formatter;
  }
  
  /**
   * Gets a cached RelativeTimeFormat instance or creates a new one
   */
  static getRelativeTimeFormatter(locale: string, options: Intl.RelativeTimeFormatOptions = {}): Intl.RelativeTimeFormat {
    const key = CacheKeys.relativeTimeFormat(locale, options);
    
    this.checkAndResizeCaches();
    
    let formatter = this.relativeTimeFormatters.get(key);
    if (!formatter) {
      formatter = new Intl.RelativeTimeFormat(locale, options);
      this.relativeTimeFormatters.set(key, formatter);
    }
    
    return formatter;
  }
  
  /**
   * Gets a cached NumberFormat instance or creates a new one
   */
  static getNumberFormatter(locale: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
    const key = CacheKeys.numberFormat(locale, options);
    
    this.checkAndResizeCaches();
    
    let formatter = this.numberFormatters.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, options);
      this.numberFormatters.set(key, formatter);
    }
    
    return formatter;
  }
  
  /**
   * Gets a cached ListFormat instance or creates a new one
   */
  static getListFormatter(locale: string, options: any = {}): any {
    // Check if ListFormat is available in the environment
    if (typeof (Intl as any).ListFormat === 'undefined') {
      throw new Error('Intl.ListFormat is not supported in this environment');
    }
    
    const key = CacheKeys.listFormat(locale, options);
    
    this.checkAndResizeCaches();
    
    let formatter = this.listFormatters.get(key);
    if (!formatter) {
      formatter = new (Intl as any).ListFormat(locale, options);
      this.listFormatters.set(key, formatter);
    }
    
    return formatter;
  }
  
  /**
   * Checks and resizes all caches if necessary
   */
  static checkAndResizeCaches(): void {
    if (!this._dynamicSizing) return;
    
    this.checkAndResizeCache(this._dateTimeFormatters);
    this.checkAndResizeCache(this._relativeTimeFormatters);
    this.checkAndResizeCache(this._numberFormatters);
    this.checkAndResizeCache(this._listFormatters);
  }
  
  /**
   * Checks and resizes a specific cache
   */
  private static checkAndResizeCache<V>(cache: ResizableLRUCache<string, V> | null): void {
    if (!cache || !cache.shouldResize()) return;
    
    const metrics = cache.getMetrics();
    const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, metrics.maxSize);
    
    if (optimalSize !== metrics.maxSize) {
      cache.setMaxSize(optimalSize);
      cache.markResized();
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
   * Sets the maximum cache size for all caches
   */
  static setMaxCacheSize(size: number): void {
    if (size < 1) throw new Error('Cache size must be at least 1');
    
    this.maxCacheSize = size;
    
    // Update existing caches
    if (this._dateTimeFormatters) this._dateTimeFormatters.setMaxSize(size);
    if (this._relativeTimeFormatters) this._relativeTimeFormatters.setMaxSize(size);
    if (this._numberFormatters) this._numberFormatters.setMaxSize(size);
    if (this._listFormatters) this._listFormatters.setMaxSize(size);
  }
  
  /**
   * Resets all caches to initial state (for testing)
   */
  static resetAll(): void {
    this._dateTimeFormatters = null;
    this._relativeTimeFormatters = null;
    this._numberFormatters = null;
    this._listFormatters = null;
    this.maxCacheSize = this.DEFAULT_MAX_SIZE;
    this._dynamicSizing = true;
  }

  /**
   * Clears all caches
   */
  static clearAll(): void {
    if (this._dateTimeFormatters) this._dateTimeFormatters.clear();
    if (this._relativeTimeFormatters) this._relativeTimeFormatters.clear();
    if (this._numberFormatters) this._numberFormatters.clear();
    if (this._listFormatters) this._listFormatters.clear();
  }
  
  /**
   * Gets basic cache statistics
   */
  static getStats() {
    const dtfSize = this._dateTimeFormatters ? this._dateTimeFormatters.size : 0;
    const rtfSize = this._relativeTimeFormatters ? this._relativeTimeFormatters.size : 0;
    const nfSize = this._numberFormatters ? this._numberFormatters.size : 0;
    const lfSize = this._listFormatters ? this._listFormatters.size : 0;
    
    return {
      dateTimeFormatters: dtfSize,
      relativeTimeFormatters: rtfSize,
      numberFormatters: nfSize,
      listFormatters: lfSize,
      total: dtfSize + rtfSize + nfSize + lfSize,
      maxSize: this.maxCacheSize * 4 // Total maximum possible size
    };
  }
  
  /**
   * Gets detailed cache statistics for monitoring
   */
  static getDetailedStats() {
    return {
      dateTimeFormatters: this._dateTimeFormatters ? this._dateTimeFormatters.getMetrics() : { size: 0 },
      relativeTimeFormatters: this._relativeTimeFormatters ? this._relativeTimeFormatters.getMetrics() : { size: 0 },
      numberFormatters: this._numberFormatters ? this._numberFormatters.getMetrics() : { size: 0 },
      listFormatters: this._listFormatters ? this._listFormatters.getMetrics() : { size: 0 },
      dynamicSizingEnabled: this._dynamicSizing,
      maxCacheSize: this.maxCacheSize
    };
  }
  
  /**
   * Optimizes all caches by triggering resize checks
   */
  static optimize(): void {
    this.checkAndResizeCaches();
  }
  
  /**
   * Gets cache efficiency metrics
   */
  static getEfficiencyMetrics(): {
    averageHitRatio: number;
    averageUtilization: number;
    totalCacheSize: number;
    recommendedOptimization: string;
  } {
    const caches = [
      this._dateTimeFormatters,
      this._relativeTimeFormatters,
      this._numberFormatters,
      this._listFormatters
    ].filter(cache => cache !== null) as ResizableLRUCache<string, any>[];
    
    if (caches.length === 0) {
      return {
        averageHitRatio: 0,
        averageUtilization: 0,
        totalCacheSize: 0,
        recommendedOptimization: 'No caches initialized'
      };
    }
    
    const metrics = caches.map(cache => cache.getMetrics());
    const avgHitRatio = metrics.reduce((sum, m) => sum + m.hitRatio, 0) / metrics.length;
    const avgUtilization = metrics.reduce((sum, m) => sum + m.utilization, 0) / metrics.length;
    const totalSize = metrics.reduce((sum, m) => sum + m.size, 0);
    
    let recommendation = 'Caches are well optimized';
    if (avgHitRatio < 0.7) {
      recommendation = 'Consider increasing cache sizes for better hit ratio';
    } else if (avgUtilization < 0.3) {
      recommendation = 'Consider decreasing cache sizes to save memory';
    }
    
    return {
      averageHitRatio: avgHitRatio,
      averageUtilization: avgUtilization,
      totalCacheSize: totalSize,
      recommendedOptimization: recommendation
    };
  }
}