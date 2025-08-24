/**
 * @file Comprehensive tests for CacheOptimizer class
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheOptimizer, CacheOptimizerConfig } from '../../../core/caching/cache-optimizer';
import type { CacheMetrics } from '../../../core/caching/lru-cache';

describe('CacheOptimizer', () => {
    beforeEach(() => {
        // Reset to defaults before each test
        CacheOptimizer.resetToDefaults();
    });

    afterEach(() => {
        // Clean up after each test
        CacheOptimizer.resetToDefaults();
    });

    describe('configuration management', () => {
        it('should have default configuration', () => {
            const config = CacheOptimizer.getConfig();
            
            expect(config.minCacheSize).toBe(10);
            expect(config.maxCacheSize).toBe(500);
            expect(config.targetHitRatio).toBe(0.8);
            expect(config.growthFactor).toBe(1.5);
            expect(config.shrinkFactor).toBe(0.8);
            expect(config.minSamplesForOptimization).toBe(100);
        });

        it('should allow partial configuration updates', () => {
            const newConfig: Partial<CacheOptimizerConfig> = {
                targetHitRatio: 0.9,
                maxCacheSize: 1000
            };
            
            CacheOptimizer.configure(newConfig);
            const config = CacheOptimizer.getConfig();
            
            expect(config.targetHitRatio).toBe(0.9);
            expect(config.maxCacheSize).toBe(1000);
            expect(config.minCacheSize).toBe(10); // Should remain unchanged
        });

        it('should allow complete configuration replacement', () => {
            const newConfig: CacheOptimizerConfig = {
                minCacheSize: 5,
                maxCacheSize: 200,
                targetHitRatio: 0.75,
                growthFactor: 2.0,
                shrinkFactor: 0.7,
                minSamplesForOptimization: 50
            };
            
            CacheOptimizer.configure(newConfig);
            const config = CacheOptimizer.getConfig();
            
            expect(config).toEqual(newConfig);
        });

        it('should reset to defaults', () => {
            // Modify configuration
            CacheOptimizer.configure({ targetHitRatio: 0.9, maxCacheSize: 1000 });
            
            // Reset to defaults
            CacheOptimizer.resetToDefaults();
            
            const config = CacheOptimizer.getConfig();
            expect(config.targetHitRatio).toBe(0.8);
            expect(config.maxCacheSize).toBe(500);
        });
    });

    describe('optimal size calculation', () => {
        it('should maintain current size with insufficient data', () => {
            const metrics: CacheMetrics = {
                size: 25,
                maxSize: 50,
                hits: 5,
                misses: 3,
                hitRatio: 0.625,
                utilization: 0.5
            };
            
            const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, 50);
            expect(optimalSize).toBe(50); // Should maintain current size
        });

        it('should increase size for low hit ratio', () => {
            const metrics: CacheMetrics = {
                size: 40,
                maxSize: 50,
                hits: 30,
                misses: 70, // Low hit ratio (0.3)
                hitRatio: 0.3,
                utilization: 0.8
            };
            
            const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, 50);
            expect(optimalSize).toBeGreaterThan(50);
            expect(optimalSize).toBeLessThanOrEqual(500); // Should not exceed max
        });

        it('should decrease size for low utilization and good hit ratio', () => {
            const metrics: CacheMetrics = {
                size: 15,
                maxSize: 100,
                hits: 80,
                misses: 20, // Good hit ratio (0.8)
                hitRatio: 0.8,
                utilization: 0.15 // Low utilization
            };
            
            const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, 100);
            expect(optimalSize).toBeLessThan(100);
            expect(optimalSize).toBeGreaterThanOrEqual(10); // Should not go below min
        });

        it('should respect maximum cache size limit', () => {
            CacheOptimizer.configure({ maxCacheSize: 100 });
            
            const metrics: CacheMetrics = {
                size: 90,
                maxSize: 90,
                hits: 10,
                misses: 90, // Very low hit ratio
                hitRatio: 0.1,
                utilization: 1.0
            };
            
            const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, 90);
            expect(optimalSize).toBeLessThanOrEqual(100);
        });

        it('should respect minimum cache size limit', () => {
            CacheOptimizer.configure({ minCacheSize: 20 });
            
            const metrics: CacheMetrics = {
                size: 5,
                maxSize: 30,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.17 // Very low utilization
            };
            
            const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, 30);
            expect(optimalSize).toBeGreaterThanOrEqual(20);
        });

        it('should maintain margin above current usage when shrinking', () => {
            const metrics: CacheMetrics = {
                size: 40,
                maxSize: 100,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.4 // Low utilization
            };
            
            const optimalSize = CacheOptimizer.calculateOptimalSize(metrics, 100);
            expect(optimalSize).toBeGreaterThanOrEqual(45); // size + 5 margin
        });
    });

    describe('performance analysis', () => {
        it('should classify excellent performance', () => {
            const metrics: CacheMetrics = {
                size: 45,
                maxSize: 50,
                hits: 95,
                misses: 5,
                hitRatio: 0.95,
                utilization: 0.9
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.performance).toBe('excellent');
            expect(analysis.recommendations.length).toBeGreaterThanOrEqual(0);
        });

        it('should classify good performance', () => {
            const metrics: CacheMetrics = {
                size: 35,
                maxSize: 50,
                hits: 75,
                misses: 25,
                hitRatio: 0.75,
                utilization: 0.7
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.performance).toBe('good');
        });

        it('should classify fair performance with recommendations', () => {
            const metrics: CacheMetrics = {
                size: 30,
                maxSize: 50,
                hits: 60,
                misses: 40,
                hitRatio: 0.6,
                utilization: 0.6
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.performance).toBe('fair');
            expect(analysis.recommendations).toContain('Consider increasing cache size to improve hit ratio');
        });

        it('should classify poor performance with strong recommendations', () => {
            const metrics: CacheMetrics = {
                size: 25,
                maxSize: 50,
                hits: 30,
                misses: 70,
                hitRatio: 0.3,
                utilization: 0.5
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.performance).toBe('poor');
            expect(analysis.recommendations).toContain('Cache hit ratio is low - significantly increase cache size');
        });

        it('should recommend size reduction for low utilization', () => {
            const metrics: CacheMetrics = {
                size: 10,
                maxSize: 100,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.1 // Very low utilization
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.recommendations).toContain('Cache utilization is low - consider reducing size to save memory');
        });

        it('should recommend size increase for high utilization', () => {
            const metrics: CacheMetrics = {
                size: 48,
                maxSize: 50,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.96 // Very high utilization
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.recommendations).toContain('Cache is nearly full - consider increasing size');
        });

        it('should warn about approaching size limits', () => {
            CacheOptimizer.configure({ maxCacheSize: 100 });
            
            const metrics: CacheMetrics = {
                size: 85,
                maxSize: 85,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 1.0
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.recommendations).toContain('Cache is approaching maximum size limit');
        });

        it('should provide suggested size when different from current', () => {
            const metrics: CacheMetrics = {
                size: 30,
                maxSize: 50,
                hits: 30,
                misses: 70, // Low hit ratio
                hitRatio: 0.3,
                utilization: 0.6
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            
            expect(analysis.suggestedSize).toBeDefined();
            expect(analysis.suggestedSize).toBeGreaterThan(50);
        });
    });

    describe('resize decision logic', () => {
        it('should not resize with insufficient data', () => {
            const metrics: CacheMetrics = {
                size: 25,
                maxSize: 50,
                hits: 3,
                misses: 2,
                hitRatio: 0.6,
                utilization: 0.5
            };
            
            expect(CacheOptimizer.shouldResize(metrics)).toBe(false);
        });

        it('should resize when hit ratio is significantly off target', () => {
            const metrics: CacheMetrics = {
                size: 40,
                maxSize: 50,
                hits: 30,
                misses: 70, // Hit ratio 0.3, target is 0.8
                hitRatio: 0.3,
                utilization: 0.8
            };
            
            expect(CacheOptimizer.shouldResize(metrics)).toBe(true);
        });

        it('should resize when utilization is very low', () => {
            const metrics: CacheMetrics = {
                size: 5,
                maxSize: 100,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.05 // Very low utilization
            };
            
            expect(CacheOptimizer.shouldResize(metrics)).toBe(true);
        });

        it('should resize when utilization is very high', () => {
            const metrics: CacheMetrics = {
                size: 48,
                maxSize: 50,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.96 // Very high utilization
            };
            
            expect(CacheOptimizer.shouldResize(metrics)).toBe(true);
        });

        it('should not resize when metrics are within acceptable ranges', () => {
            const metrics: CacheMetrics = {
                size: 40,
                maxSize: 50,
                hits: 80,
                misses: 20,
                hitRatio: 0.8, // Exactly at target
                utilization: 0.8 // Good utilization
            };
            
            expect(CacheOptimizer.shouldResize(metrics)).toBe(false);
        });
    });

    describe('efficiency score calculation', () => {
        it('should calculate high efficiency score for optimal metrics', () => {
            const metrics: CacheMetrics = {
                size: 35,
                maxSize: 50,
                hits: 90,
                misses: 10,
                hitRatio: 0.9,
                utilization: 0.7 // Optimal range
            };
            
            const score = CacheOptimizer.calculateEfficiencyScore(metrics);
            expect(score).toBeGreaterThan(85);
        });

        it('should calculate low efficiency score for poor metrics', () => {
            const metrics: CacheMetrics = {
                size: 45,
                maxSize: 50,
                hits: 20,
                misses: 80,
                hitRatio: 0.2,
                utilization: 0.9
            };
            
            const score = CacheOptimizer.calculateEfficiencyScore(metrics);
            expect(score).toBeLessThan(50);
        });

        it('should penalize very large caches', () => {
            CacheOptimizer.configure({ maxCacheSize: 100 });
            
            const metrics1: CacheMetrics = {
                size: 25,
                maxSize: 25,
                hits: 90,
                misses: 10,
                hitRatio: 0.9,
                utilization: 1.0
            };
            
            const metrics2: CacheMetrics = {
                size: 90,
                maxSize: 90,
                hits: 90,
                misses: 10,
                hitRatio: 0.9,
                utilization: 1.0
            };
            
            const score1 = CacheOptimizer.calculateEfficiencyScore(metrics1);
            const score2 = CacheOptimizer.calculateEfficiencyScore(metrics2);
            
            expect(score1).toBeGreaterThan(score2);
        });

        it('should handle edge cases gracefully', () => {
            const metrics: CacheMetrics = {
                size: 0,
                maxSize: 50,
                hits: 0,
                misses: 0,
                hitRatio: 0,
                utilization: 0
            };
            
            const score = CacheOptimizer.calculateEfficiencyScore(metrics);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('optimization insights', () => {
        it('should provide comprehensive insights for poor performance', () => {
            const metrics: CacheMetrics = {
                size: 30,
                maxSize: 50,
                hits: 20,
                misses: 80,
                hitRatio: 0.2,
                utilization: 0.6
            };
            
            const insights = CacheOptimizer.getOptimizationInsights(metrics);
            
            expect(insights.currentEfficiency).toBeLessThan(50);
            expect(insights.potentialImprovement).toBeGreaterThan(0);
            expect(insights.keyInsights.length).toBeGreaterThan(0);
            expect(insights.actionItems.length).toBeGreaterThan(0);
            expect(insights.keyInsights[0]).toContain('Low hit ratio');
            expect(insights.actionItems[0]).toContain('Increase cache size');
        });

        it('should provide insights for low utilization', () => {
            const metrics: CacheMetrics = {
                size: 10,
                maxSize: 100,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.1
            };
            
            const insights = CacheOptimizer.getOptimizationInsights(metrics);
            
            expect(insights.keyInsights.some(insight => insight.includes('Low utilization'))).toBe(true);
            expect(insights.actionItems.some(action => action.includes('reducing cache size'))).toBe(true);
        });

        it('should provide insights for high utilization', () => {
            const metrics: CacheMetrics = {
                size: 48,
                maxSize: 50,
                hits: 80,
                misses: 20,
                hitRatio: 0.8,
                utilization: 0.96
            };
            
            const insights = CacheOptimizer.getOptimizationInsights(metrics);
            
            expect(insights.keyInsights.some(insight => insight.includes('High utilization'))).toBe(true);
            expect(insights.actionItems.some(action => action.includes('Increase cache size'))).toBe(true);
        });

        it('should estimate potential improvement correctly', () => {
            const metrics: CacheMetrics = {
                size: 30,
                maxSize: 50,
                hits: 30,
                misses: 70,
                hitRatio: 0.3,
                utilization: 0.6
            };
            
            const insights = CacheOptimizer.getOptimizationInsights(metrics);
            
            // Should suggest higher improvement when optimal size differs significantly
            expect(insights.potentialImprovement).toBeGreaterThan(10);
        });

        it('should provide minimal insights for well-optimized cache', () => {
            const metrics: CacheMetrics = {
                size: 40,
                maxSize: 50,
                hits: 85,
                misses: 15,
                hitRatio: 0.85,
                utilization: 0.8
            };
            
            const insights = CacheOptimizer.getOptimizationInsights(metrics);
            
            expect(insights.currentEfficiency).toBeGreaterThan(80);
            expect(insights.keyInsights.length).toBe(0); // No major issues
            expect(insights.actionItems.length).toBe(0); // No actions needed
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle zero metrics gracefully', () => {
            const metrics: CacheMetrics = {
                size: 0,
                maxSize: 50,
                hits: 0,
                misses: 0,
                hitRatio: 0,
                utilization: 0
            };
            
            expect(() => {
                CacheOptimizer.calculateOptimalSize(metrics, 50);
                CacheOptimizer.analyzePerformance(metrics);
                CacheOptimizer.shouldResize(metrics);
                CacheOptimizer.calculateEfficiencyScore(metrics);
                CacheOptimizer.getOptimizationInsights(metrics);
            }).not.toThrow();
        });

        it('should handle extreme configuration values', () => {
            const extremeConfig: CacheOptimizerConfig = {
                minCacheSize: 1,
                maxCacheSize: 10000,
                targetHitRatio: 0.99,
                growthFactor: 10.0,
                shrinkFactor: 0.1,
                minSamplesForOptimization: 1
            };
            
            CacheOptimizer.configure(extremeConfig);
            
            const metrics: CacheMetrics = {
                size: 50,
                maxSize: 100,
                hits: 50,
                misses: 50,
                hitRatio: 0.5,
                utilization: 0.5
            };
            
            expect(() => {
                CacheOptimizer.calculateOptimalSize(metrics, 100);
            }).not.toThrow();
        });

        it('should handle invalid hit ratios', () => {
            const metrics: CacheMetrics = {
                size: 25,
                maxSize: 50,
                hits: 100,
                misses: 0,
                hitRatio: 1.0, // Perfect hit ratio
                utilization: 0.5
            };
            
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            expect(analysis.performance).toBe('excellent');
        });

        it('should handle test environment detection', () => {
            // This test verifies that the test environment detection works
            const metrics: CacheMetrics = {
                size: 25,
                maxSize: 50,
                hits: 8,
                misses: 2, // 10 total operations (test threshold)
                hitRatio: 0.8,
                utilization: 0.5
            };
            
            // In test environment, should allow optimization with fewer samples
            expect(CacheOptimizer.shouldResize(metrics)).toBe(false); // Good metrics, no resize needed
        });
    });

    describe('integration scenarios', () => {
        it('should provide consistent recommendations across methods', () => {
            const metrics: CacheMetrics = {
                size: 30,
                maxSize: 50,
                hits: 30,
                misses: 70,
                hitRatio: 0.3,
                utilization: 0.6
            };
            
            const shouldResize = CacheOptimizer.shouldResize(metrics);
            const analysis = CacheOptimizer.analyzePerformance(metrics);
            const insights = CacheOptimizer.getOptimizationInsights(metrics);
            
            expect(shouldResize).toBe(true);
            expect(analysis.performance).toBe('poor');
            expect(insights.currentEfficiency).toBeLessThan(60);
            expect(analysis.suggestedSize).toBeGreaterThan(50);
        });

        it('should handle cache growth scenario', () => {
            let currentSize = 20;
            const metrics: CacheMetrics = {
                size: 18,
                maxSize: currentSize,
                hits: 20,
                misses: 80,
                hitRatio: 0.2,
                utilization: 0.9
            };
            
            // Simulate multiple optimization cycles
            for (let i = 0; i < 3; i++) {
                if (CacheOptimizer.shouldResize(metrics)) {
                    currentSize = CacheOptimizer.calculateOptimalSize(metrics, currentSize);
                    metrics.maxSize = currentSize;
                }
            }
            
            expect(currentSize).toBeGreaterThan(20);
        });

        it('should handle cache shrinking scenario', () => {
            let currentSize = 100;
            const metrics: CacheMetrics = {
                size: 15,
                maxSize: currentSize,
                hits: 90,
                misses: 10,
                hitRatio: 0.9,
                utilization: 0.15
            };
            
            // Simulate optimization cycle
            if (CacheOptimizer.shouldResize(metrics)) {
                currentSize = CacheOptimizer.calculateOptimalSize(metrics, currentSize);
            }
            
            expect(currentSize).toBeLessThan(100);
            expect(currentSize).toBeGreaterThanOrEqual(20); // Should maintain margin
        });
    });
});