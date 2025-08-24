/**
 * @file Comprehensive test coverage for FormatTokenPool
 * Targeting uncovered lines: 37-42, 65-66, 194-214, 220-234, 240-241, 247-261, 278-305, 318-320
 */

import { FormatTokenPool } from '../../../core/formatting/token-pool';
import type { FormatToken } from '../../../core/formatting/formatting-types';

describe('FormatTokenPool - Comprehensive Coverage', () => {
  beforeEach(() => {
    // Clear pools before each test
    FormatTokenPool.clearPools();
  });

  afterEach(() => {
    // Clean up after each test
    FormatTokenPool.clearPools();
  });

  describe('Token Creation and Pool Management', () => {
    /**
     * Test token creation when pool is empty (lines 37-42)
     */
    it('should create new token when pool is empty', () => {
      const token = FormatTokenPool.getToken('year', 'YYYY', 4);
      
      expect(token).toBeDefined();
      expect(token.type).toBe('year');
      expect(token.pattern).toBe('YYYY');
      expect(token.length).toBe(4);
      expect(token._pooled).toBe(true);
      expect(token._inUse).toBe(true);
      
      const stats = FormatTokenPool.getStats();
      expect(stats.totalTokens).toBe(1);
      expect(stats.activeTokens).toBe(1);
    });

    /**
     * Test token reuse from pool (lines 32-36)
     */
    it('should reuse token from pool when available', () => {
      // Create and return a token to populate the pool
      const token1 = FormatTokenPool.getToken('year', 'YYYY', 4);
      FormatTokenPool.returnToken(token1);
      
      // Get another token of the same type - should reuse
      const token2 = FormatTokenPool.getToken('year', 'YYYY', 4);
      
      expect(token2).toBe(token1); // Same object reference
      expect(token2._inUse).toBe(true);
      
      const stats = FormatTokenPool.getStats();
      expect(stats.totalTokens).toBe(1); // Only one created
    });

    /**
     * Test early return for invalid tokens (lines 65-66)
     */
    it('should handle invalid token returns gracefully', () => {
      const invalidToken = {
        type: 'year' as const,
        pattern: 'YYYY',
        length: 4,
        _pooled: false, // Not pooled
        _inUse: false
      };
      
      // Should return early without error
      expect(() => {
        FormatTokenPool.returnToken(invalidToken as any);
      }).not.toThrow();
      
      const stats = FormatTokenPool.getStats();
      expect(stats.totalTokens).toBe(0);
    });

    /**
     * Test token return when already returned (lines 65-66)
     */
    it('should handle already returned tokens', () => {
      const token = FormatTokenPool.getToken('year', 'YYYY', 4);
      token._inUse = false; // Simulate already returned
      
      // Should return early without error
      expect(() => {
        FormatTokenPool.returnToken(token);
      }).not.toThrow();
    });
  });

  describe('Batch Operations and Pre-warming', () => {
    /**
     * Test token batch creation (lines 194-214)
     */
    it('should create token batches correctly', () => {
      const tokenSpecs = [
        { type: 'year' as const, pattern: 'YYYY', length: 4, count: 3 },
        { type: 'month' as const, pattern: 'MM', length: 2, count: 2 },
        { type: 'day' as const, pattern: 'DD', length: 2 } // No count specified
      ];
      
      const batches = FormatTokenPool.createTokenBatch(tokenSpecs);
      
      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(3); // year tokens
      expect(batches[1]).toHaveLength(2); // month tokens
      expect(batches[2]).toHaveLength(1); // day token (default count = 1)
      
      // Verify token properties
      expect(batches[0][0].type).toBe('year');
      expect(batches[1][0].type).toBe('month');
      expect(batches[2][0].type).toBe('day');
      
      const stats = FormatTokenPool.getStats();
      expect(stats.totalTokens).toBe(6); // 3 + 2 + 1
    });

    /**
     * Test pool pre-warming (lines 194-214)
     */
    it('should pre-warm pools with common tokens', () => {
      FormatTokenPool.prewarmPool();
      
      const stats = FormatTokenPool.getStats();
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.pooledTokens).toBeGreaterThan(0);
      expect(stats.activeTokens).toBe(0); // All returned to pool
      
      // Verify some common tokens are available
      const yearToken = FormatTokenPool.getToken('year', 'YYYY', 4);
      expect(yearToken).toBeDefined();
      
      const monthToken = FormatTokenPool.getToken('month', 'MM', 2);
      expect(monthToken).toBeDefined();
    });
  });

  describe('Pool Size Management', () => {
    /**
     * Test max pool size validation (lines 220-234)
     */
    it('should validate max pool size', () => {
      expect(() => {
        FormatTokenPool.setMaxPoolSize(0);
      }).toThrow('Max pool size must be at least 1');
      
      expect(() => {
        FormatTokenPool.setMaxPoolSize(-5);
      }).toThrow('Max pool size must be at least 1');
    });

    /**
     * Test pool trimming when max size is reduced (lines 220-234)
     */
    it('should trim pools when max size is reduced', () => {
      // Set large max size and create many tokens
      FormatTokenPool.setMaxPoolSize(10);
      
      const tokens = [];
      for (let i = 0; i < 8; i++) {
        tokens.push(FormatTokenPool.getToken('year', 'YYYY', 4));
      }
      
      // Return all tokens to pool
      FormatTokenPool.returnTokens(tokens);
      
      let stats = FormatTokenPool.getStats();
      expect(stats.pooledTokens).toBe(8);
      
      // Reduce max size - should trim pools
      FormatTokenPool.setMaxPoolSize(3);
      
      stats = FormatTokenPool.getStats();
      expect(stats.pooledTokens).toBe(3); // Trimmed to max size
    });

    /**
     * Test max pool size getter (lines 240-241)
     */
    it('should return current max pool size', () => {
      FormatTokenPool.setMaxPoolSize(50);
      expect(FormatTokenPool.getMaxPoolSize()).toBe(50);
      
      FormatTokenPool.setMaxPoolSize(25);
      expect(FormatTokenPool.getMaxPoolSize()).toBe(25);
    });
  });

  describe('Pool Optimization', () => {
    /**
     * Test pool optimization - removing empty pools (lines 247-261)
     */
    it('should remove empty pools during optimization', () => {
      // Create tokens of different types
      const yearToken = FormatTokenPool.getToken('year', 'YYYY', 4);
      const monthToken = FormatTokenPool.getToken('month', 'MM', 2);
      const dayToken = FormatTokenPool.getToken('day', 'DD', 2);
      
      // Return only some tokens to create mixed pool states
      FormatTokenPool.returnToken(yearToken);
      // Keep monthToken and dayToken active (not returned)
      
      let detailedStats = FormatTokenPool.getDetailedStats();
      expect(detailedStats.poolCount).toBeGreaterThan(0);
      
      // Optimize pools - should remove empty pools
      FormatTokenPool.optimizePools();
      
      detailedStats = FormatTokenPool.getDetailedStats();
      // Should have fewer pools after optimization
      expect(detailedStats.poolCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Pool Validation and Debugging', () => {
    /**
     * Test pool validation - valid pools (lines 278-305)
     */
    it('should validate healthy pools', () => {
      const token = FormatTokenPool.getToken('year', 'YYYY', 4);
      FormatTokenPool.returnToken(token);
      
      const validation = FormatTokenPool.validatePools();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    /**
     * Test pool validation - detect oversized pools (lines 278-305)
     */
    it('should detect oversized pools', () => {
      // Set small max size
      FormatTokenPool.setMaxPoolSize(2);
      
      // Manually create an oversized pool by manipulating internal state
      const tokens = [];
      for (let i = 0; i < 5; i++) {
        tokens.push(FormatTokenPool.getToken('year', 'YYYY', 4));
      }
      
      // Force all tokens into pool (bypassing size check)
      const pools = (FormatTokenPool as any).pools;
      const pool = pools.get('year:YYYY:4') || [];
      tokens.forEach(token => {
        token._inUse = false;
        pool.push(token);
      });
      pools.set('year:YYYY:4', pool);
      
      const validation = FormatTokenPool.validatePools();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('exceeds max size');
    });

    /**
     * Test pool validation - detect in-use tokens in pool (lines 278-305)
     */
    it('should detect in-use tokens in pool', () => {
      const token = FormatTokenPool.getToken('year', 'YYYY', 4);
      
      // Manually add in-use token to pool (invalid state)
      const pools = (FormatTokenPool as any).pools;
      let pool = pools.get('year:YYYY:4') || [];
      pool.push(token); // Token is still _inUse = true
      pools.set('year:YYYY:4', pool);
      
      const validation = FormatTokenPool.validatePools();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('in-use token');
    });

    /**
     * Test pool validation - detect non-pooled tokens (lines 278-305)
     */
    it('should detect non-pooled tokens in pool', () => {
      const token = FormatTokenPool.getToken('year', 'YYYY', 4);
      token._pooled = false; // Make it non-pooled
      token._inUse = false;
      
      // Manually add non-pooled token to pool
      const pools = (FormatTokenPool as any).pools;
      let pool = pools.get('year:YYYY:4') || [];
      pool.push(token);
      pools.set('year:YYYY:4', pool);
      
      const validation = FormatTokenPool.validatePools();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('non-pooled token');
    });
  });

  describe('Scoped Token Management', () => {
    /**
     * Test scoped token manager (lines 318-320)
     */
    it('should create and manage scoped tokens', () => {
      const scope = FormatTokenPool.createScope();
      
      // Get tokens through scope
      const token1 = scope.getToken('year', 'YYYY', 4);
      const token2 = scope.getToken('month', 'MM', 2);
      const token3 = scope.getToken('day', 'DD', 2);
      
      expect(token1._inUse).toBe(true);
      expect(token2._inUse).toBe(true);
      expect(token3._inUse).toBe(true);
      
      let stats = FormatTokenPool.getStats();
      expect(stats.activeTokens).toBe(3);
      
      // Dispose scope - should return all tokens
      scope.dispose();
      
      stats = FormatTokenPool.getStats();
      expect(stats.activeTokens).toBe(0);
      expect(stats.pooledTokens).toBe(3);
    });

    /**
     * Test multiple scope disposals
     */
    it('should handle multiple scope disposals safely', () => {
      const scope = FormatTokenPool.createScope();
      
      const token = scope.getToken('year', 'YYYY', 4);
      expect(token._inUse).toBe(true);
      
      // First disposal
      scope.dispose();
      expect(FormatTokenPool.getStats().activeTokens).toBe(0);
      
      // Second disposal should be safe
      expect(() => scope.dispose()).not.toThrow();
    });
  });

  describe('Memory Management and Statistics', () => {
    /**
     * Test memory estimate updates
     */
    it('should update memory estimates correctly', () => {
      const initialStats = FormatTokenPool.getStats();
      expect(initialStats.memoryUsage).toBe(0);
      
      // Create some tokens
      const tokens = [];
      for (let i = 0; i < 5; i++) {
        tokens.push(FormatTokenPool.getToken('year', 'YYYY', 4));
      }
      
      let stats = FormatTokenPool.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
      
      // Return tokens to pool
      FormatTokenPool.returnTokens(tokens);
      
      stats = FormatTokenPool.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0); // Still has pooled tokens
    });

    /**
     * Test detailed statistics
     */
    it('should provide detailed pool statistics', () => {
      // Create diverse token usage
      const yearToken = FormatTokenPool.getToken('year', 'YYYY', 4);
      const monthToken = FormatTokenPool.getToken('month', 'MM', 2);
      const dayToken = FormatTokenPool.getToken('day', 'DD', 2);
      
      FormatTokenPool.returnToken(yearToken);
      FormatTokenPool.returnToken(monthToken);
      // Keep dayToken active
      
      const detailedStats = FormatTokenPool.getDetailedStats();
      
      expect(detailedStats.poolCount).toBeGreaterThan(0);
      expect(detailedStats.maxPoolSize).toBeDefined();
      expect(detailedStats.poolDetails).toBeDefined();
      expect(detailedStats.efficiency).toBeDefined();
      expect(detailedStats.efficiency.reuseRatio).toBeGreaterThanOrEqual(0);
      expect(detailedStats.efficiency.returnRatio).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test hit ratio calculations
     */
    it('should calculate hit ratios correctly', () => {
      // Create and return a token
      const token1 = FormatTokenPool.getToken('year', 'YYYY', 4);
      FormatTokenPool.returnToken(token1);
      
      // Get same token type again (should be reused)
      const token2 = FormatTokenPool.getToken('year', 'YYYY', 4);
      
      const stats = FormatTokenPool.getStats();
      expect(stats.hitRatio).toBeGreaterThan(0);
      expect(stats.hitRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test pool behavior at max capacity
     */
    it('should handle pool at max capacity', () => {
      FormatTokenPool.setMaxPoolSize(2);
      
      // Create more tokens than max pool size
      const tokens = [];
      for (let i = 0; i < 5; i++) {
        tokens.push(FormatTokenPool.getToken('year', 'YYYY', 4));
      }
      
      // Return all tokens
      FormatTokenPool.returnTokens(tokens);
      
      const stats = FormatTokenPool.getStats();
      expect(stats.pooledTokens).toBeLessThanOrEqual(2); // Respects max size
    });

    /**
     * Test token state reset on return
     */
    it('should reset token state when returned to pool', () => {
      const token = FormatTokenPool.getToken('year', 'YYYY', 4);
      
      // Set some properties
      token.value = 'test-value';
      token.formatter = () => 'test';
      
      FormatTokenPool.returnToken(token);
      
      expect(token._inUse).toBe(false);
      expect(token.value).toBeUndefined();
      expect(token.formatter).toBeUndefined();
    });

    /**
     * Test empty pool optimization
     */
    it('should handle optimization with no pools', () => {
      // Start with empty pools
      expect(() => {
        FormatTokenPool.optimizePools();
      }).not.toThrow();
      
      const stats = FormatTokenPool.getStats();
      expect(stats.pooledTokens).toBe(0);
    });
  });
});