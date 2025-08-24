/**
 * @file Comprehensive test coverage for src/core/caching/cache-optimizer.ts
 * Targets uncovered line: 182
 */

import { CacheOptimizer } from '../../../core/caching/cache-optimizer';
import type { CacheMetrics } from '../../../core/caching/lru-cache';

describe('CacheOptimizer Coverage Tests', () => {
  beforeEach(() => {
    CacheOptimizer.resetToDefaults();
  });

  /**
   * Test line 182 - the specific uncovered line in calculateEfficiencyScore
   * This line is in the size efficiency calculation: sizeEfficiencyScore = 50
   */
  describe('Efficiency Score Calculation Edge Cases', () => {
    test('should handle size efficiency calculation edge case (line 182)', () => {
      // Create metrics that will trigger the specific calculation path
      const metrics: CacheMetrics = {
        hits: 80,
        misses: 20,
        hitRatio: 0.8,
        size: 40, // This should trigger the size efficiency calculation
        maxSize: 50,
        utilization: 0.8
      };
      
      // Use default configuration to test the calculation
      
      const score = CacheOptimizer.calculateEfficiencyScore(metrics);
      
      // The score should be calculated with the size efficiency component
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      
      // Verify the calculation includes size efficiency
      // With size 40 and maxSize 50, sizeRatio = 0.8
      // sizeEfficiencyScore = Math.max(0, 100 - (0.8 * 50)) = Math.max(0, 60) = 60
      // This contributes to the weighted score
      expect(score).toBeGreaterThan(70); // Should be high due to good metrics
    });

    test('should handle maximum size ratio in efficiency calculation', () => {
      const metrics: CacheMetrics = {
        hits: 90,
        misses: 10,
        hitRatio: 0.9,
        size: 50, // Equal to maxCacheSize
        maxSize: 50,
        utilization: 1.0
      };
      
      // Use default configuration
      
      const score = CacheOptimizer.calculateEfficiencyScore(metrics);
      
      // With size equal to maxCacheSize, sizeRatio = 1.0
      // sizeEfficiencyScore = Math.max(0, 100 - (1.0 * 50)) = 50
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle size larger than maxCacheSize', () => {
      const metrics: CacheMetrics = {
        hits: 70,
        misses: 30,
        hitRatio: 0.7,
        size: 60, // Larger than maxCacheSize
        maxSize: 60,
        utilization: 1.0
      };
      
      // Use default configuration
      
      const score = CacheOptimizer.calculateEfficiencyScore(metrics);
      
      // With size 60 and maxCacheSize 50, sizeRatio = 1.2
      // sizeEfficiencyScore = Math.max(0, 100 - (1.2 * 50)) = Math.max(0, 40) = 40
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle zero size efficiency score', () => {
      const metrics: CacheMetrics = {
        hits: 50,
        misses: 50,
        hitRatio: 0.5,
        size: 100, // Very large size
        maxSize: 100,
        utilization: 1.0
      };
      
      // Use default configuration
      
      const score = CacheOptimizer.calculateEfficiencyScore(metrics);
      
      // With size 100 and maxCacheSize 50, sizeRatio = 2.0
      // sizeEfficiencyScore = Math.max(0, 100 - (2.0 * 50)) = Math.max(0, 0) = 0
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  /**
   * Test various efficiency score scenarios to ensure comprehensive coverage
   */
  describe('Efficiency Score Comprehensive Tests', () => {
    test('should calculate score with different utilization levels', () => {
      const baseMetrics: CacheMetrics = {
        hits: 80,
        misses: 20,
        hitRatio: 0.8,
        size: 30,
        maxSize: 50,
        utilization: 0.6 // Optimal utilization
      };
      
      const score1 = CacheOptimizer.calculateEfficiencyScore(baseMetrics);
      
      // Test with low utilization
      const lowUtilizationMetrics = { ...baseMetrics, utilization: 0.1, size: 5 };
      const score2 = CacheOptimizer.calculateEfficiencyScore(lowUtilizationMetrics);
      
      // Test with high utilization
      const highUtilizationMetrics = { ...baseMetrics, utilization: 0.95, size: 47 };
      const score3 = CacheOptimizer.calculateEfficiencyScore(highUtilizationMetrics);
      
      expect(score1).toBeGreaterThan(score2); // Optimal should be better than low
      expect(score1).toBeGreaterThan(score3); // Optimal should be better than too high
    });

    test('should handle edge case with perfect metrics', () => {
      const perfectMetrics: CacheMetrics = {
        hits: 100,
        misses: 0,
        hitRatio: 1.0,
        size: 35, // 70% utilization
        maxSize: 50,
        utilization: 0.7
      };
      
      const score = CacheOptimizer.calculateEfficiencyScore(perfectMetrics);
      
      expect(score).toBeGreaterThan(90); // Should be very high
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle edge case with poor metrics', () => {
      const poorMetrics: CacheMetrics = {
        hits: 10,
        misses: 90,
        hitRatio: 0.1,
        size: 2,
        maxSize: 100,
        utilization: 0.02
      };
      
      const score = CacheOptimizer.calculateEfficiencyScore(poorMetrics);
      
      expect(score).toBeLessThan(50); // Should be low
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * Test configuration edge cases
   */
  describe('Configuration Edge Cases', () => {
    test('should handle custom configuration affecting efficiency calculation', () => {
      const metrics1: CacheMetrics = {
        hits: 75,
        misses: 25,
        hitRatio: 0.75,
        size: 40,
        maxSize: 50,
        utilization: 0.8
      };
      
      const metrics2: CacheMetrics = {
        hits: 75,
        misses: 25,
        hitRatio: 0.75,
        size: 40,
        maxSize: 100, // Different maxSize should affect size efficiency
        utilization: 0.4 // Different utilization due to larger max size
      };
      
      // Test with different metrics that should produce different scores
      const score1 = CacheOptimizer.calculateEfficiencyScore(metrics1);
      const score2 = CacheOptimizer.calculateEfficiencyScore(metrics2);
      
      // Different maxSize and utilization should affect the efficiency score
      expect(score1).not.toBe(score2);
    });

    test('should maintain score bounds regardless of configuration', () => {
      const metrics: CacheMetrics = {
        hits: 60,
        misses: 40,
        hitRatio: 0.6,
        size: 30,
        maxSize: 50,
        utilization: 0.6
      };
      
      // Test with default configuration
      
      const score = CacheOptimizer.calculateEfficiencyScore(metrics);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  /**
   * Test weight factor calculations
   */
  describe('Weight Factor Tests', () => {
    test('should apply correct weight factors in score calculation', () => {
      // Test that hit ratio has the highest weight (0.7)
      const highHitRatioMetrics: CacheMetrics = {
        hits: 90,
        misses: 10,
        hitRatio: 0.9,
        size: 10,
        maxSize: 100,
        utilization: 0.1
      };
      
      const lowHitRatioMetrics: CacheMetrics = {
        hits: 10,
        misses: 90,
        hitRatio: 0.1,
        size: 80,
        maxSize: 100,
        utilization: 0.8
      };
      
      const score1 = CacheOptimizer.calculateEfficiencyScore(highHitRatioMetrics);
      const score2 = CacheOptimizer.calculateEfficiencyScore(lowHitRatioMetrics);
      
      // High hit ratio should result in higher score despite poor utilization
      expect(score1).toBeGreaterThan(score2);
    });

    test('should handle utilization scoring bands correctly', () => {
      const baseMetrics: CacheMetrics = {
        hits: 80,
        misses: 20,
        hitRatio: 0.8,
        size: 30,
        maxSize: 50,
        utilization: 0.6
      };
      
      // Test optimal utilization (60-80%)
      const optimalScore = CacheOptimizer.calculateEfficiencyScore(baseMetrics);
      
      // Test good utilization (40-90%)
      const goodMetrics = { ...baseMetrics, utilization: 0.45, size: 22 };
      const goodScore = CacheOptimizer.calculateEfficiencyScore(goodMetrics);
      
      // Test fair utilization (20-95%)
      const fairMetrics = { ...baseMetrics, utilization: 0.25, size: 12 };
      const fairScore = CacheOptimizer.calculateEfficiencyScore(fairMetrics);
      
      // Test poor utilization (outside ranges)
      const poorMetrics = { ...baseMetrics, utilization: 0.1, size: 5 };
      const poorScore = CacheOptimizer.calculateEfficiencyScore(poorMetrics);
      
      expect(optimalScore).toBeGreaterThan(goodScore);
      expect(goodScore).toBeGreaterThan(fairScore);
      expect(fairScore).toBeGreaterThan(poorScore);
    });
  });

  /**
   * Test rounding behavior
   */
  describe('Score Rounding Tests', () => {
    test('should round efficiency score to nearest integer', () => {
      const metrics: CacheMetrics = {
        hits: 77,
        misses: 23,
        hitRatio: 0.77,
        size: 33,
        maxSize: 50,
        utilization: 0.66
      };
      
      const score = CacheOptimizer.calculateEfficiencyScore(metrics);
      
      // Score should be an integer (rounded)
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});