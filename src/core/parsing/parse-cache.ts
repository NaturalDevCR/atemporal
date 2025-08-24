/**
 * @file Parse cache for optimized caching of parsing results
 */

import { Temporal } from '@js-temporal/polyfill';
import type {
  TemporalInput,
  StrictParsingOptions
} from '../../types/index';

import type {
  ParseResult,
  ParseCacheEntry,
  ParseStrategyType
} from './parsing-types';

import { ResizableLRUCache } from '../caching/lru-cache';
import { CacheKeys } from '../caching/cache-keys';

/**
 * Cache configuration for parse operations
 */
export interface ParseCacheConfig {
  readonly enabled: boolean;
  readonly maxSize: number;
  readonly ttl: number; // Time to live in milliseconds
  readonly enableMetrics: boolean;
  readonly enableOptimization: boolean;
}

/**
 * Parse cache statistics
 */
export interface ParseCacheStats {
  readonly size: number;
  readonly maxSize: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRatio: number;
  readonly hitRate: number; // Alias for hitRatio for backward compatibility
  readonly averageAccessTime: number;
  readonly memoryUsage: number;
  readonly efficiency: number;
  readonly entryBreakdown: Record<ParseStrategyType, number>;
  readonly ageDistribution: {
    fresh: number; // < 1 minute
    recent: number; // 1-5 minutes
    old: number; // > 5 minutes
  };
}

/**
 * Parse cache for storing and retrieving parsed temporal results
 */
export class ParseCache {
  private readonly cache: ResizableLRUCache<string, ParseCacheEntry>;
  private readonly config: ParseCacheConfig;
  
  // Metrics
  private hits = 0;
  private misses = 0;
  private totalAccessTime = 0;
  private accessCount = 0;
  
  constructor(config: Partial<ParseCacheConfig> = {}) {
    this.config = {
      enabled: true,
      maxSize: 1000,
      ttl: 300000, // 5 minutes
      enableMetrics: true,
      enableOptimization: true,
      ...config
    };
    
    this.cache = new ResizableLRUCache<string, ParseCacheEntry>(this.config.maxSize);
  }

  /**
   * Get cached parse result
   */
  get(input: TemporalInput, options: StrictParsingOptions): ParseCacheEntry | undefined {
    if (!this.config.enabled) {
      return undefined;
    }
    
    const startTime = performance.now();
    const key = this.createCacheKey(input, options);
    
    try {
      const entry = this.cache.get(key);
      
      if (entry) {
        // Check TTL
        if (this.isExpired(entry)) {
          this.cache.delete(key);
          this.recordMiss(startTime);
          return undefined;
        }
        
        // Update access tracking
        (entry as any).accessCount++;
        (entry as any).lastAccessed = Date.now();
        
        this.recordHit(startTime);
        return entry;
      }
      
      this.recordMiss(startTime);
      return undefined;
      
    } catch (error) {
      this.recordMiss(startTime);
      return undefined;
    }
  }

  /**
   * Set cached parse result
   */
  set(input: TemporalInput, options: StrictParsingOptions, result: ParseResult): void {
    if (!this.config.enabled || !result.success || !result.data) {
      return;
    }
    
    const key = this.createCacheKey(input, options);
    const now = Date.now();
    
    const entry: ParseCacheEntry = {
      result: result.data,
      strategy: result.strategy,
      executionTime: result.executionTime,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      metadata: {
        confidence: result.confidence,
        fromCache: false,
        inputType: typeof input,
        inputSize: this.estimateInputSize(input)
      }
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Check if entry exists in cache
   */
  has(input: TemporalInput, options: StrictParsingOptions): boolean {
    if (!this.config.enabled) {
      return false;
    }
    
    const key = this.createCacheKey(input, options);
    const entry = this.cache.get(key);
    
    if (entry && !this.isExpired(entry)) {
      return true;
    }
    
    if (entry && this.isExpired(entry)) {
      this.cache.delete(key);
    }
    
    return false;
  }

  /**
   * Delete entry from cache
   */
  delete(input: TemporalInput, options: StrictParsingOptions): boolean {
    if (!this.config.enabled) {
      return false;
    }
    
    const key = this.createCacheKey(input, options);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.resetMetrics();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get maximum cache size
   */
  maxSize(): number {
    return this.cache.capacity;
  }

  /**
   * Set maximum cache size
   */
  setMaxSize(size: number): void {
    this.cache.setMaxSize(size);
  }

  /**
   * Get cache statistics
   */
  getStats(): ParseCacheStats {
    // Note: getStats method not available on ResizableLRUCache
    const cacheStats = { hits: 0, misses: 0, hitRatio: 0 };
    const now = Date.now();
    
    // Calculate age distribution
    const ageDistribution = { fresh: 0, recent: 0, old: 0 };
    const entryBreakdown: Record<string, number> = {};
    
    for (const entry of Array.from(this.cache.values())) {
      const age = now - entry.timestamp;
      
      if (age < 60000) { // < 1 minute
        ageDistribution.fresh++;
      } else if (age < 300000) { // 1-5 minutes
        ageDistribution.recent++;
      } else {
        ageDistribution.old++;
      }
      
      entryBreakdown[entry.strategy] = (entryBreakdown[entry.strategy] || 0) + 1;
    }
    
    const hitRatio = this.calculateHitRatio();
    return {
      size: this.cache.size,
      maxSize: this.cache.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRatio,
      hitRate: hitRatio, // Alias for backward compatibility
      averageAccessTime: this.calculateAverageAccessTime(),
      memoryUsage: this.estimateMemoryUsage(),
      efficiency: this.calculateEfficiency(),
      entryBreakdown: entryBreakdown as Record<ParseStrategyType, number>,
      ageDistribution
    };
  }

  /**
   * Optimize cache based on usage patterns
   */
  optimize(): void {
    if (!this.config.enableOptimization) {
      return;
    }
    
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Remove expired entries
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }
    
    // Remove expired entries
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    
    // Note: optimize method not available on ResizableLRUCache
    // this.cache.optimize();
  }

  /**
   * Get efficiency metrics
   */
  getEfficiencyMetrics() {
    const stats = this.getStats();
    
    return {
      hitRatio: stats.hitRatio,
      memoryEfficiency: this.calculateMemoryEfficiency(),
      accessPatternEfficiency: this.calculateAccessPatternEfficiency(),
      ageEfficiency: this.calculateAgeEfficiency(stats.ageDistribution),
      overallEfficiency: stats.efficiency
    };
  }

  /**
   * Get cache recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getStats();
    
    // Hit ratio recommendations
    if (stats.hitRatio < 0.5) {
      recommendations.push('Low cache hit ratio - consider increasing cache size or TTL');
    } else if (stats.hitRatio > 0.95) {
      recommendations.push('Very high cache hit ratio - consider reducing cache size to save memory');
    }
    
    // Memory usage recommendations
    if (stats.memoryUsage > 10 * 1024 * 1024) { // 10MB
      recommendations.push('High memory usage - consider reducing cache size or TTL');
    }
    
    // Age distribution recommendations
    if (stats.ageDistribution.old > stats.size * 0.3) {
      recommendations.push('Many old entries - consider reducing TTL');
    }
    
    // Efficiency recommendations
    if (stats.efficiency < 0.7) {
      recommendations.push('Low cache efficiency - consider optimizing cache configuration');
    }
    
    return recommendations;
  }

  /**
   * Create snapshot of cache state
   */
  createSnapshot() {
    return {
      timestamp: Date.now(),
      stats: this.getStats(),
      efficiency: this.getEfficiencyMetrics(),
      recommendations: this.getRecommendations(),
      config: this.config
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
    this.totalAccessTime = 0;
    this.accessCount = 0;
  }

  /**
   * Validate cache integrity
   */
  validateIntegrity(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const now = Date.now();
    
    // Check for expired entries
    let expiredCount = 0;
    for (const entry of Array.from(this.cache.values())) {
      if (this.isExpired(entry)) {
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      issues.push(`Found ${expiredCount} expired entries`);
    }
    
    // Check cache size consistency
    if (this.cache.size > this.cache.capacity) {
      issues.push('Cache size exceeds maximum size');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Preload common patterns
   */
  preload(patterns: Array<{ input: TemporalInput; options: StrictParsingOptions; result: Temporal.ZonedDateTime; strategy: ParseStrategyType }>): void {
    for (const pattern of patterns) {
      const key = this.createCacheKey(pattern.input, pattern.options);
      const now = Date.now();
      
      const entry: ParseCacheEntry = {
        result: pattern.result,
        strategy: pattern.strategy,
        executionTime: 0, // Preloaded entries have no execution time
        timestamp: now,
        accessCount: 0,
        lastAccessed: now,
        metadata: {
          preloaded: true,
          confidence: 1,
          fromCache: false,
          inputType: typeof pattern.input,
          inputSize: this.estimateInputSize(pattern.input)
        }
      };
      
      this.cache.set(key, entry);
    }
  }

  /**
   * Create cache key for input and options
   */
  private createCacheKey(input: TemporalInput, options: StrictParsingOptions): string {
    return CacheKeys.parseKey(input, options);
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: ParseCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  /**
   * Record cache hit
   */
  private recordHit(startTime: number): void {
    if (this.config.enableMetrics) {
      this.hits++;
      this.totalAccessTime += performance.now() - startTime;
      this.accessCount++;
    }
  }

  /**
   * Record cache miss
   */
  private recordMiss(startTime: number): void {
    if (this.config.enableMetrics) {
      this.misses++;
      this.totalAccessTime += performance.now() - startTime;
      this.accessCount++;
    }
  }

  /**
   * Calculate hit ratio
   */
  private calculateHitRatio(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  /**
   * Calculate average access time
   */
  private calculateAverageAccessTime(): number {
    return this.accessCount > 0 ? this.totalAccessTime / this.accessCount : 0;
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      // Estimate key size
      totalSize += key.length * 2; // UTF-16
      
      // Estimate entry size
      totalSize += 200; // Base object overhead
      totalSize += this.estimateInputSize(entry.result);
      totalSize += JSON.stringify(entry.metadata).length * 2;
    }
    
    return totalSize;
  }

  /**
   * Calculate cache efficiency
   */
  private calculateEfficiency(): number {
    const hitRatio = this.calculateHitRatio();
    const memoryEfficiency = this.calculateMemoryEfficiency();
    const accessEfficiency = this.calculateAccessPatternEfficiency();
    
    return (hitRatio * 0.5) + (memoryEfficiency * 0.3) + (accessEfficiency * 0.2);
  }

  /**
   * Calculate memory efficiency
   */
  private calculateMemoryEfficiency(): number {
    const usage = this.estimateMemoryUsage();
    const maxReasonableUsage = this.cache.capacity * 1000; // 1KB per entry
    
    return Math.max(0, 1 - (usage / maxReasonableUsage));
  }

  /**
   * Calculate access pattern efficiency
   */
  private calculateAccessPatternEfficiency(): number {
    if (this.cache.size === 0) {
      return 1;
    }
    
    let totalAccesses = 0;
    let accessedEntries = 0;
    
    for (const entry of Array.from(this.cache.values())) {
      totalAccesses += entry.accessCount;
      if (entry.accessCount > 0) {
        accessedEntries++;
      }
    }
    
    // Efficiency is higher when more entries are accessed
    return accessedEntries / this.cache.size;
  }

  /**
   * Calculate age efficiency
   */
  private calculateAgeEfficiency(ageDistribution: { fresh: number; recent: number; old: number }): number {
    const total = ageDistribution.fresh + ageDistribution.recent + ageDistribution.old;
    
    if (total === 0) {
      return 1;
    }
    
    // Prefer fresh and recent entries over old ones
    return (ageDistribution.fresh * 1.0 + ageDistribution.recent * 0.7 + ageDistribution.old * 0.3) / total;
  }

  /**
   * Estimate input size for memory calculations
   */
  private estimateInputSize(input: unknown): number {
    if (input === null || input === undefined) {
      return 8;
    }
    
    if (typeof input === 'string') {
      return input.length * 2; // UTF-16
    }
    
    if (typeof input === 'number') {
      return 8;
    }
    
    if (typeof input === 'boolean') {
      return 4;
    }
    
    if (input instanceof Date) {
      return 24;
    }
    
    if (typeof input === 'object') {
      try {
        return JSON.stringify(input).length * 2;
      } catch {
        return 100; // Fallback estimate
      }
    }
    
    return 50; // Default estimate
  }
}