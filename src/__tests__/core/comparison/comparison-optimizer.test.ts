/**
 * @file Comprehensive test suite for ComparisonOptimizer
 * Tests performance analysis and optimization recommendations
 */

import { ComparisonOptimizer } from '../../../core/comparison/comparison-optimizer';
import type { ComparisonMetrics, ComparisonCacheStats } from '../../../core/comparison/comparison-types';

describe('ComparisonOptimizer', () => {
    let mockMetrics: ComparisonMetrics;
    let mockCacheStats: ComparisonCacheStats;

    beforeEach(() => {
        mockMetrics = {
            totalComparisons: 1000,
            cacheHits: 600,
            cacheMisses: 400,
            averageComputeTime: 2.5,
            fastPathHits: 400,
            operationBreakdown: {
                isBefore: 300,
                isAfter: 250,
                isSame: 200,
                isSameOrBefore: 150,
                isSameOrAfter: 100,
                isBetween: 0,
                diff: 0,
                duration: 0
            },
            unitBreakdown: {
                nanosecond: 50,
                nanoseconds: 50,
                microsecond: 75,
                microseconds: 75,
                millisecond: 100,
                milliseconds: 100,
                second: 150,
                seconds: 150,
                minute: 200,
                minutes: 200,
                hour: 175,
                hours: 175,
                day: 150,
                days: 150,
                week: 50,
                weeks: 50,
                month: 30,
                months: 30,
                year: 20,
                years: 20
            }
        };

        mockCacheStats = {
            hits: 600,
            misses: 400,
            sets: 1000,
            evictions: 50,
            hitRatio: 0.6,
            hitRate: 0.6,
            size: 450,
            maxSize: 500,
            averageAccessTime: 0.1,
            efficiency: 0.6
        };
    });

    describe('analyzePerformance', () => {
        it('should analyze performance with good metrics', () => {
            const analysis = ComparisonOptimizer.analyzePerformance(mockMetrics, mockCacheStats);
            
            expect(analysis.overallEfficiency).toBeGreaterThan(0);
            expect(analysis.overallEfficiency).toBeLessThanOrEqual(1);
            expect(analysis.cacheEfficiency).toBe(0.6); // 60% hit rate
            expect(typeof analysis.computeEfficiency).toBe('number');
            expect(Array.isArray(analysis.bottlenecks)).toBe(true);
            expect(Array.isArray(analysis.strengths)).toBe(true);
        });

        it('should identify bottlenecks with poor cache performance', () => {
            const poorCacheStats = {
                ...mockCacheStats,
                hits: 100,
                misses: 900,
                hitRatio: 0.1
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(mockMetrics, poorCacheStats);
            
            expect(analysis.bottlenecks.some(b => b.includes('cache') || b.includes('Cache'))).toBe(true);
            expect(analysis.cacheEfficiency).toBe(0.1);
        });

        it('should identify bottlenecks with slow compute times', () => {
            const slowMetrics = {
                ...mockMetrics,
                averageComputeTime: 50.0 // Very slow
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(slowMetrics, mockCacheStats);
            
            expect(analysis.bottlenecks.some(b => b.includes('compute') || b.includes('slow'))).toBe(true);
        });

        it('should identify strengths with good performance', () => {
            const goodMetrics = {
                ...mockMetrics,
                averageComputeTime: 0.5 // Very fast
            };
            
            const goodCacheStats = {
                ...mockCacheStats,
                hits: 900,
                misses: 100,
                hitRatio: 0.9
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(goodMetrics, goodCacheStats);
            
            expect(analysis.strengths.length).toBeGreaterThan(0);
            expect(analysis.cacheEfficiency).toBe(0.9);
        });

        it('should handle zero comparisons gracefully', () => {
            const emptyMetrics = {
                ...mockMetrics,
                totalComparisons: 0,
                cacheHits: 0,
                cacheMisses: 0
            };
            
            const emptyCacheStats = {
                ...mockCacheStats,
                hits: 0,
                misses: 0,
                hitRatio: 0
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(emptyMetrics, emptyCacheStats);
            
            expect(analysis.overallEfficiency).toBe(0);
            expect(analysis.cacheEfficiency).toBe(0);
            expect(analysis.computeEfficiency).toBe(0);
        });
    });

    describe('generateRecommendations', () => {
        it('should generate cache size recommendations for high eviction rate', () => {
            const highEvictionStats = {
                ...mockCacheStats,
                evictions: 200, // High eviction rate
                size: 500,
                maxSize: 500
            };
            
            const recommendations = ComparisonOptimizer.generateRecommendations(mockMetrics, highEvictionStats);
            
            expect(recommendations.some(r => 
                r.type === 'cache_size' && r.description.includes('increase')
            )).toBe(true);
        });

        it('should generate cache optimization recommendations for low hit rate', () => {
            const lowHitRateStats = {
                ...mockCacheStats,
                hits: 200,
                misses: 800,
                hitRatio: 0.2
            };
            
            const recommendations = ComparisonOptimizer.generateRecommendations(mockMetrics, lowHitRateStats);
            
            expect(recommendations.some(r => 
                r.type === 'cache_optimization'
            )).toBe(true);
        });

        it('should generate strategy optimization recommendations', () => {
            const unevenMetrics = {
                ...mockMetrics,
                fastPathHits: 50, // Very low fast path usage
                totalComparisons: 1000
            };
            
            const recommendations = ComparisonOptimizer.generateRecommendations(unevenMetrics, mockCacheStats);
            
            expect(recommendations.some(r => 
                r.type === 'strategy_optimization'
            )).toBe(true);
        });

        it('should generate performance tuning recommendations for slow operations', () => {
            const slowMetrics = {
                ...mockMetrics,
                averageComputeTime: 25.0 // Very slow
            };
            
            const recommendations = ComparisonOptimizer.generateRecommendations(slowMetrics, mockCacheStats);
            
            expect(recommendations.some(r => 
                r.type === 'performance_tuning'
            )).toBe(true);
        });

        it('should not generate recommendations for optimal performance', () => {
            const optimalMetrics = {
                ...mockMetrics,
                averageComputeTime: 0.5 // Very fast
            };
            
            const optimalCacheStats = {
                ...mockCacheStats,
                hits: 950,
                misses: 50,
                hitRatio: 0.95,
                evictions: 5 // Very low evictions
            };
            
            const recommendations = ComparisonOptimizer.generateRecommendations(optimalMetrics, optimalCacheStats);
            
            // Should have fewer recommendations for optimal performance
            expect(recommendations.length).toBeLessThan(3);
        });

        it('should include impact assessment in recommendations', () => {
            const recommendations = ComparisonOptimizer.generateRecommendations(mockMetrics, mockCacheStats);
            
            recommendations.forEach(rec => {
                expect(typeof rec.type).toBe('string');
                expect(typeof rec.description).toBe('string');
                expect(['low', 'medium', 'high'].includes(rec.impact)).toBe(true);
            });
        });
    });

    describe('generateProfile', () => {
        it('should generate comprehensive performance profile', () => {
            const profile = ComparisonOptimizer.generateProfile(mockMetrics, mockCacheStats);
            
            expect(profile.timestamp).toBeDefined();
            expect(profile.metrics).toEqual(mockMetrics);
            expect(profile.cacheStats).toEqual(mockCacheStats);
            expect(profile.analysis).toBeDefined();
            expect(Array.isArray(profile.recommendations)).toBe(true);
            expect(typeof profile.summary).toBe('string');
        });

        it('should include performance analysis in profile', () => {
            const profile = ComparisonOptimizer.generateProfile(mockMetrics, mockCacheStats);
            
            expect(profile.analysis.overallEfficiency).toBeDefined();
            expect(profile.analysis.cacheEfficiency).toBeDefined();
            expect(profile.analysis.computeEfficiency).toBeDefined();
            expect(Array.isArray(profile.analysis.bottlenecks)).toBe(true);
            expect(Array.isArray(profile.analysis.strengths)).toBe(true);
        });

        it('should generate meaningful summary', () => {
            const profile = ComparisonOptimizer.generateProfile(mockMetrics, mockCacheStats);
            
            expect(profile.summary.length).toBeGreaterThan(0);
            expect(profile.summary).toContain('efficiency');
        });

        it('should handle edge cases in profile generation', () => {
            const edgeCaseMetrics = {
                ...mockMetrics,
                totalComparisons: 1,
                averageComputeTime: 0
            };
            
            const edgeCaseStats = {
                ...mockCacheStats,
                hits: 0,
                misses: 1,
                hitRatio: 0
            };
            
            const profile = ComparisonOptimizer.generateProfile(edgeCaseMetrics, edgeCaseStats);
            
            expect(profile.timestamp).toBeDefined();
            expect(profile.summary).toBeDefined();
            expect(Array.isArray(profile.recommendations)).toBe(true);
        });
    });

    describe('efficiency calculations', () => {
        it('should calculate cache efficiency correctly', () => {
            const highHitRate = { ...mockCacheStats, hitRatio: 0.9 };
            const lowHitRate = { ...mockCacheStats, hitRatio: 0.1 };
            
            const highAnalysis = ComparisonOptimizer.analyzePerformance(mockMetrics, highHitRate);
            const lowAnalysis = ComparisonOptimizer.analyzePerformance(mockMetrics, lowHitRate);
            
            expect(highAnalysis.cacheEfficiency).toBeGreaterThan(lowAnalysis.cacheEfficiency);
        });

        it('should calculate compute efficiency based on average time', () => {
            const fastMetrics = { ...mockMetrics, averageComputeTime: 0.5 };
            const slowMetrics = { ...mockMetrics, averageComputeTime: 10.0 };
            
            const fastAnalysis = ComparisonOptimizer.analyzePerformance(fastMetrics, mockCacheStats);
            const slowAnalysis = ComparisonOptimizer.analyzePerformance(slowMetrics, mockCacheStats);
            
            expect(fastAnalysis.computeEfficiency).toBeGreaterThan(slowAnalysis.computeEfficiency);
        });

        it('should calculate overall efficiency as combination of factors', () => {
            const analysis = ComparisonOptimizer.analyzePerformance(mockMetrics, mockCacheStats);
            
            expect(analysis.overallEfficiency).toBeGreaterThan(0);
            expect(analysis.overallEfficiency).toBeLessThanOrEqual(1);
            
            // Overall efficiency should be influenced by both cache and compute efficiency
            expect(analysis.overallEfficiency).toBeLessThanOrEqual(
                Math.max(analysis.cacheEfficiency, analysis.computeEfficiency)
            );
        });
    });

    describe('bottleneck identification', () => {
        it('should identify cache-related bottlenecks', () => {
            const poorCacheStats = {
                ...mockCacheStats,
                hitRatio: 0.1,
                evictions: 500
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(mockMetrics, poorCacheStats);
            
            expect(analysis.bottlenecks.some(b => 
                b.toLowerCase().includes('cache')
            )).toBe(true);
        });

        it('should identify compute-related bottlenecks', () => {
            const slowMetrics = {
                ...mockMetrics,
                averageComputeTime: 100.0
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(slowMetrics, mockCacheStats);
            
            expect(analysis.bottlenecks.some(b => 
                b.toLowerCase().includes('compute') || b.toLowerCase().includes('slow')
            )).toBe(true);
        });

        it('should identify strategy imbalance bottlenecks', () => {
            const imbalancedMetrics = {
                ...mockMetrics,
                fastPathHits: 10, // Very low fast path usage
                totalComparisons: 1000
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(imbalancedMetrics, mockCacheStats);
            
            expect(analysis.bottlenecks.some(b => 
                b.toLowerCase().includes('strategy') || b.toLowerCase().includes('imbalance')
            )).toBe(true);
        });
    });

    describe('strength identification', () => {
        it('should identify cache strengths', () => {
            const excellentCacheStats = {
                ...mockCacheStats,
                hitRatio: 0.95,
                evictions: 5
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(mockMetrics, excellentCacheStats);
            
            expect(analysis.strengths.some(s => 
                s.toLowerCase().includes('cache')
            )).toBe(true);
        });

        it('should identify compute strengths', () => {
            const fastMetrics = {
                ...mockMetrics,
                averageComputeTime: 0.1
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(fastMetrics, mockCacheStats);
            
            expect(analysis.strengths.some(s => 
                s.toLowerCase().includes('compute') || s.toLowerCase().includes('fast')
            )).toBe(true);
        });

        it('should identify balanced strategy usage as strength', () => {
            const balancedMetrics = {
                ...mockMetrics,
                fastPathHits: 700, // Good fast path usage
                totalComparisons: 1000
            };
            
            const analysis = ComparisonOptimizer.analyzePerformance(balancedMetrics, mockCacheStats);
            
            expect(analysis.strengths.some(s => 
                s.toLowerCase().includes('strategy') || s.toLowerCase().includes('balanced')
            )).toBe(true);
        });
    });
});