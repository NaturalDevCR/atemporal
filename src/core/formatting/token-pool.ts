/**
 * @file Object pool for format tokens to reduce memory allocations
 */

import type { FormatToken, TokenPoolStats } from './formatting-types';

/**
 * Pooled token wrapper for reuse
 */
interface PooledToken extends FormatToken {
  _pooled: boolean;
  _inUse: boolean;
}

/**
 * High-performance object pool for format tokens
 */
export class FormatTokenPool {
  private static pools = new Map<string, PooledToken[]>();
  private static maxPoolSize = 100;
  private static stats = {
    totalCreated: 0,
    totalReused: 0,
    totalReturned: 0,
    activeTokens: 0,
    memoryEstimate: 0
  };
  
  /**
   * Gets a token from the pool or creates a new one
   */
  static getToken(type: FormatToken['type'], pattern: string, length: number): PooledToken {
    const poolKey = `${type}:${pattern}:${length}`;
    const pool = this.pools.get(poolKey);
    
    if (pool && pool.length > 0) {
      const token = pool.pop()!;
      token._inUse = true;
      this.stats.totalReused++;
      this.stats.activeTokens++;
      return token;
    }
    
    // Create new token
    const newToken: PooledToken = {
      type,
      pattern,
      length,
      _pooled: true,
      _inUse: true
    };
    
    this.stats.totalCreated++;
    this.stats.activeTokens++;
    this.updateMemoryEstimate();
    
    return newToken;
  }
  
  /**
   * Returns a token to the pool for reuse
   */
  static returnToken(token: PooledToken): void {
    if (!token._pooled || !token._inUse) {
      return; // Not a pooled token or already returned
    }
    
    const poolKey = `${token.type}:${token.pattern}:${token.length}`;
    let pool = this.pools.get(poolKey);
    
    if (!pool) {
      pool = [];
      this.pools.set(poolKey, pool);
    }
    
    // Only return to pool if under max size
    if (pool.length < this.maxPoolSize) {
      // Reset token state
      token._inUse = false;
      token.value = undefined;
      token.formatter = undefined;
      
      pool.push(token);
      this.stats.totalReturned++;
    }
    
    this.stats.activeTokens--;
    this.updateMemoryEstimate();
  }
  
  /**
   * Returns multiple tokens to the pool
   */
  static returnTokens(tokens: PooledToken[]): void {
    for (const token of tokens) {
      this.returnToken(token);
    }
  }
  
  /**
   * Creates a batch of tokens for common patterns
   */
  static createTokenBatch(tokens: Array<{
    type: FormatToken['type'];
    pattern: string;
    length: number;
    count?: number;
  }>): PooledToken[][] {
    const batches: PooledToken[][] = [];
    
    for (const tokenSpec of tokens) {
      const count = tokenSpec.count || 1;
      const batch: PooledToken[] = [];
      
      for (let i = 0; i < count; i++) {
        batch.push(this.getToken(tokenSpec.type, tokenSpec.pattern, tokenSpec.length));
      }
      
      batches.push(batch);
    }
    
    return batches;
  }
  
  /**
   * Pre-warms the pool with common token types
   */
  static prewarmPool(): void {
    const commonTokens = [
      { type: 'year' as const, pattern: 'YYYY', length: 4, count: 10 },
      { type: 'year' as const, pattern: 'YY', length: 2, count: 5 },
      { type: 'month' as const, pattern: 'MM', length: 2, count: 10 },
      { type: 'month' as const, pattern: 'MMM', length: 3, count: 5 },
      { type: 'month' as const, pattern: 'MMMM', length: 4, count: 5 },
      { type: 'day' as const, pattern: 'DD', length: 2, count: 10 },
      { type: 'day' as const, pattern: 'D', length: 1, count: 5 },
      { type: 'hour' as const, pattern: 'HH', length: 2, count: 10 },
      { type: 'hour' as const, pattern: 'h', length: 1, count: 5 },
      { type: 'minute' as const, pattern: 'mm', length: 2, count: 10 },
      { type: 'second' as const, pattern: 'ss', length: 2, count: 10 },
      { type: 'literal' as const, pattern: '-', length: 1, count: 15 },
      { type: 'literal' as const, pattern: ':', length: 1, count: 10 },
      { type: 'literal' as const, pattern: ' ', length: 1, count: 10 },
      { type: 'literal' as const, pattern: 'T', length: 1, count: 5 }
    ];
    
    const batches = this.createTokenBatch(commonTokens);
    
    // Return all tokens to pool immediately
    for (const batch of batches) {
      this.returnTokens(batch);
    }
  }
  
  /**
   * Clears all pools and resets statistics
   */
  static clearPools(): void {
    this.pools.clear();
    this.stats = {
      totalCreated: 0,
      totalReused: 0,
      totalReturned: 0,
      activeTokens: 0,
      memoryEstimate: 0
    };
  }
  
  /**
   * Gets pool statistics
   */
  static getStats(): TokenPoolStats {
    const totalTokens = this.stats.totalCreated;
    const pooledTokens = Array.from(this.pools.values())
      .reduce((sum, pool) => sum + pool.length, 0);
    
    const hitRatio = totalTokens > 0 
      ? this.stats.totalReused / (this.stats.totalReused + this.stats.totalCreated)
      : 0;
    
    return {
      totalTokens,
      activeTokens: this.stats.activeTokens,
      pooledTokens,
      hitRatio,
      memoryUsage: this.stats.memoryEstimate
    };
  }
  
  /**
   * Gets detailed pool information
   */
  static getDetailedStats() {
    const poolDetails = new Map<string, number>();
    
    for (const [key, pool] of Array.from(this.pools.entries())) {
      poolDetails.set(key, pool.length);
    }
    
    return {
      ...this.getStats(),
      poolCount: this.pools.size,
      maxPoolSize: this.maxPoolSize,
      poolDetails: Object.fromEntries(poolDetails),
      efficiency: {
        reuseRatio: this.stats.totalCreated > 0 
          ? this.stats.totalReused / this.stats.totalCreated 
          : 0,
        returnRatio: this.stats.totalCreated > 0
          ? this.stats.totalReturned / this.stats.totalCreated
          : 0
      }
    };
  }
  
  /**
   * Sets the maximum pool size for each token type
   */
  static setMaxPoolSize(size: number): void {
    if (size < 1) {
      throw new Error('Max pool size must be at least 1');
    }
    
    this.maxPoolSize = size;
    
    // Trim existing pools if they exceed new max size
    for (const pool of Array.from(this.pools.values())) {
      while (pool.length > size) {
        pool.pop();
      }
    }
    
    this.updateMemoryEstimate();
  }
  
  /**
   * Gets the current maximum pool size
   */
  static getMaxPoolSize(): number {
    return this.maxPoolSize;
  }
  
  /**
   * Optimizes pools by removing unused token types
   */
  static optimizePools(): void {
    const emptyPools: string[] = [];
    
    for (const [key, pool] of Array.from(this.pools.entries())) {
      if (pool.length === 0) {
        emptyPools.push(key);
      }
    }
    
    // Remove empty pools
    for (const key of emptyPools) {
      this.pools.delete(key);
    }
    
    this.updateMemoryEstimate();
  }
  
  /**
   * Updates the memory usage estimate
   */
  private static updateMemoryEstimate(): void {
    // Rough estimate: each token ~200 bytes
    const pooledTokenCount = Array.from(this.pools.values())
      .reduce((sum, pool) => sum + pool.length, 0);
    
    this.stats.memoryEstimate = (pooledTokenCount + this.stats.activeTokens) * 200;
  }
  
  /**
   * Validates pool integrity (for debugging)
   */
  static validatePools(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    for (const [key, pool] of Array.from(this.pools.entries())) {
      // Check pool size
      if (pool.length > this.maxPoolSize) {
        errors.push(`Pool ${key} exceeds max size: ${pool.length} > ${this.maxPoolSize}`);
      }
      
      // Check token states
      for (let i = 0; i < pool.length; i++) {
        const token = pool[i];
        if (token._inUse) {
          errors.push(`Pool ${key} contains in-use token at index ${i}`);
        }
        if (!token._pooled) {
          errors.push(`Pool ${key} contains non-pooled token at index ${i}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Creates a scoped token manager for automatic cleanup
   */
  static createScope(): {
    getToken: (type: FormatToken['type'], pattern: string, length: number) => PooledToken;
    dispose: () => void;
  } {
    const scopedTokens: PooledToken[] = [];
    
    return {
      getToken: (type, pattern, length) => {
        const token = this.getToken(type, pattern, length);
        scopedTokens.push(token);
        return token;
      },
      dispose: () => {
        this.returnTokens(scopedTokens);
        scopedTokens.length = 0;
      }
    };
  }
}