/**
 * @file Comprehensive test suite for ParseOptimizer class
 * Tests performance analysis, optimization recommendations, and benchmarking
 */

import { ParseOptimizer, type ParseOptimizationRecommendation } from '../../../core/parsing/parse-optimizer';
import type {
    ParseMetrics,
    ParseProfile,
    ParsePerformanceReport,
    ParseStrategyType
} from '../../../core/parsing/parsing-types';

// Mock ParseEngine for testing
class MockParseEngine {
    private cacheSize = 1000;
    private aggressiveCaching = false;

    cache = {
        getMaxSize: () => this.cacheSize,
        setMaxSize: (size: number) => { this.cacheSize = size; }
    };

    enableAggressiveCaching() {
        this.aggressiveCaching = true;
    }

    async parse(input: any) {
        // Simulate parsing with random delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        
        if (input === 'fail') {
            throw new Error('Parse failed');
        }
        
        return {
            success: true,
            strategy: 'string',
            data: new Date()
        };
    }
}

describe('ParseOptimizer', () => {
    let optimizer: ParseOptimizer;
    let mockMetrics: ParseMetrics;
    let mockEngine: MockParseEngine;

    beforeEach(() => {
        optimizer = new ParseOptimizer();
        mockEngine = new MockParseEngine();
        
        mockMetrics = {
            totalParses: 1000,
            successfulParses: 950,
            failedParses: 50,
            cachedParses: 300,
            fastPathParses: 200,
            averageExecutionTime: 2.5,
            strategyBreakdown: {
                'string': 400,
                'date': 300,
                'number': 200,
                'fallback': 100,
                'temporal-zoned': 0,
                'temporal-plain-datetime': 0,
                'temporal-plain-date': 0,
                'temporal-instant': 0,
                'firebase-timestamp': 0,
                'temporal-wrapper': 0,
                'temporal-like': 0,
                'array-like': 0
            },
            errorBreakdown: {
                'InvalidInput': 30,
                'ParseError': 15,
                'ValidationError': 5
            },
            performanceProfile: {
                fastest: { strategy: 'string', time: 0.5 },
                slowest: { strategy: 'fallback', time: 10.0 },
                mostUsed: { strategy: 'string', count: 400 },
                mostSuccessful: { strategy: 'string', rate: 0.98 },
                recommendations: ['Use more specific strategies', 'Enable caching']
            }
        };
    });

    describe('Constructor', () => {
        it('should create optimizer with empty history', () => {
            const newOptimizer = new ParseOptimizer();
            const history = newOptimizer.getOptimizationHistory();
            
            expect(history).toHaveLength(0);
        });
    });

    describe('Performance Analysis', () => {
        describe('analyzePerformance', () => {
            it('should analyze performance with good metrics', () => {
                const analysis = optimizer.analyzePerformance(mockMetrics);
                
                expect(typeof analysis.efficiency).toBe('number');
                expect(analysis.efficiency).toBeGreaterThanOrEqual(0);
                expect(analysis.efficiency).toBeLessThanOrEqual(1);
                expect(Array.isArray(analysis.bottlenecks)).toBe(true);
                expect(Array.isArray(analysis.strengths)).toBe(true);
            });

            it('should identify bottlenecks in poor performance', () => {
                const poorMetrics: ParseMetrics = {
                    totalParses: 1000,
                    successfulParses: 800, // High error rate
                    failedParses: 200,
                    cachedParses: 100, // Low cache hit ratio
                    fastPathParses: 50, // Low fast path usage
                    averageExecutionTime: 10, // High execution time
                    strategyBreakdown: {
                        'fallback': 500, // High fallback usage
                        'string': 300,
                        'date': 200,
                        'number': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0
                    },
                    errorBreakdown: {
                        'InvalidInput': 100,
                        'ParseError': 80,
                        'ValidationError': 20
                    },
                    performanceProfile: {
                        fastest: { strategy: 'string', time: 2.0 },
                        slowest: { strategy: 'fallback', time: 20.0 },
                        mostUsed: { strategy: 'fallback', count: 500 },
                        mostSuccessful: { strategy: 'string', rate: 0.85 },
                        recommendations: ['Reduce fallback usage', 'Improve caching', 'Optimize slow strategies']
                    }
                };
                
                const analysis = optimizer.analyzePerformance(poorMetrics);
                
                expect(analysis.efficiency).toBeLessThan(0.5);
                expect(analysis.bottlenecks.length).toBeGreaterThan(0);
                expect(analysis.bottlenecks.some(b => b.includes('cache'))).toBe(true);
                expect(analysis.bottlenecks.some(b => b.includes('fast path'))).toBe(true);
                expect(analysis.bottlenecks.some(b => b.includes('error rate'))).toBe(true);
                expect(analysis.bottlenecks.some(b => b.includes('execution time'))).toBe(true);
                expect(analysis.bottlenecks.some(b => b.includes('fallback'))).toBe(true);
            });

            it('should identify strengths in good performance', () => {
                const excellentMetrics: ParseMetrics = {
                    totalParses: 1000,
                    successfulParses: 990, // Low error rate
                    failedParses: 10,
                    cachedParses: 800, // High cache hit ratio
                    fastPathParses: 600, // High fast path usage
                    averageExecutionTime: 0.5, // Fast execution
                    strategyBreakdown: {
                        'string': 500,
                        'date': 400,
                        'number': 90,
                        'fallback': 10, // Low fallback usage
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0
                    },
                    errorBreakdown: {
                        'InvalidInput': 8,
                        'ParseError': 2,
                        'ValidationError': 0
                    },
                    performanceProfile: {
                        fastest: { strategy: 'string', time: 0.2 },
                        slowest: { strategy: 'fallback', time: 2.0 },
                        mostUsed: { strategy: 'string', count: 500 },
                        mostSuccessful: { strategy: 'string', rate: 0.99 },
                        recommendations: ['Excellent performance', 'Continue current strategy']
                    }
                };
                
                const analysis = optimizer.analyzePerformance(excellentMetrics);
                
                expect(analysis.efficiency).toBeGreaterThan(0.7);
                expect(analysis.strengths.length).toBeGreaterThan(0);
                expect(analysis.strengths.some(s => s.includes('cache'))).toBe(true);
                expect(analysis.strengths.some(s => s.includes('fast path'))).toBe(true);
                expect(analysis.strengths.some(s => s.includes('error rate'))).toBe(true);
                expect(analysis.strengths.some(s => s.includes('execution time'))).toBe(true);
                expect(analysis.strengths.some(s => s.includes('fallback'))).toBe(true);
            });

            it('should handle zero operations gracefully', () => {
                const emptyMetrics: ParseMetrics = {
                    totalParses: 0,
                    successfulParses: 0,
                    failedParses: 0,
                    cachedParses: 0,
                    fastPathParses: 0,
                    averageExecutionTime: 0,
                    strategyBreakdown: {
                        'string': 0,
                        'number': 0,
                        'date': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0,
                        'fallback': 0
                    },
                    errorBreakdown: {},
                    performanceProfile: {
                        fastest: { strategy: 'fallback', time: 0 },
                        slowest: { strategy: 'fallback', time: 0 },
                        mostUsed: { strategy: 'fallback', count: 0 },
                        mostSuccessful: { strategy: 'fallback', rate: 1.0 },
                        recommendations: []
                    }
                };
                
                const analysis = optimizer.analyzePerformance(emptyMetrics);
                
                expect(analysis.efficiency).toBe(1); // Perfect efficiency for no operations
                expect(analysis.bottlenecks).toHaveLength(0);
                expect(analysis.strengths).toHaveLength(0);
            });
        });

        describe('generatePerformanceProfile', () => {
            it('should generate comprehensive performance profile', () => {
                const profile = optimizer.generatePerformanceProfile(mockMetrics);
                
                expect(typeof profile.fastest).toBe('object');
                expect(typeof profile.fastest.strategy).toBe('string');
                expect(typeof profile.fastest.time).toBe('number');
                
                expect(typeof profile.slowest).toBe('object');
                expect(typeof profile.slowest.strategy).toBe('string');
                expect(typeof profile.slowest.time).toBe('number');
                
                expect(typeof profile.mostUsed).toBe('object');
                expect(typeof profile.mostUsed.strategy).toBe('string');
                expect(typeof profile.mostUsed.count).toBe('number');
                
                expect(typeof profile.mostSuccessful).toBe('object');
                expect(typeof profile.mostSuccessful.strategy).toBe('string');
                expect(typeof profile.mostSuccessful.rate).toBe('number');
                
                expect(Array.isArray(profile.recommendations)).toBe(true);
            });

            it('should identify most used strategy correctly', () => {
                const profile = optimizer.generatePerformanceProfile(mockMetrics);
                
                // 'string' strategy has 400 uses, which should be the most
                expect(profile.mostUsed.strategy).toBe('string');
                expect(profile.mostUsed.count).toBe(400);
            });

            it('should handle empty metrics', () => {
                const emptyMetrics: ParseMetrics = {
                    totalParses: 0,
                    successfulParses: 0,
                    failedParses: 0,
                    cachedParses: 0,
                    fastPathParses: 0,
                    averageExecutionTime: 0,
                    strategyBreakdown: {
                        'string': 0,
                        'number': 0,
                        'date': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0,
                        'fallback': 0
                    },
                    errorBreakdown: {},
                    performanceProfile: {
                        fastest: { strategy: 'fallback', time: 0 },
                        slowest: { strategy: 'fallback', time: 0 },
                        mostUsed: { strategy: 'fallback', count: 0 },
                        mostSuccessful: { strategy: 'fallback', rate: 1.0 },
                        recommendations: []
                    }
                };
                
                const profile = optimizer.generatePerformanceProfile(emptyMetrics);
                
                expect(profile.fastest.strategy).toBe('fallback');
                expect(profile.slowest.strategy).toBe('fallback');
                expect(profile.mostUsed.strategy).toBe('fallback');
                expect(profile.mostSuccessful.strategy).toBe('fallback');
            });
        });
    });

    describe('Optimization Recommendations', () => {
        describe('generateRecommendations', () => {
            it('should generate recommendations for poor performance', () => {
                const poorMetrics: ParseMetrics = {
                    totalParses: 1000,
                    successfulParses: 800,
                    failedParses: 200,
                    cachedParses: 200, // Low cache hit ratio (20%)
                    fastPathParses: 100, // Low fast path usage (10%)
                    averageExecutionTime: 5, // High execution time
                    strategyBreakdown: {
                        'fallback': 300, // High fallback usage (30%)
                        'string': 400,
                        'date': 300,
                        'number': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0
                    },
                    errorBreakdown: {
                        'InvalidInput': 120,
                        'ParseError': 60,
                        'ValidationError': 20
                    },
                    performanceProfile: {
                        fastest: { strategy: 'string', time: 1.0 },
                        slowest: { strategy: 'fallback', time: 15.0 },
                        mostUsed: { strategy: 'string', count: 400 },
                        mostSuccessful: { strategy: 'string', rate: 0.80 },
                        recommendations: ['Reduce fallback usage', 'Improve error handling']
                    }
                };
                
                const recommendations = optimizer.generateRecommendations(poorMetrics);
                
                expect(recommendations.length).toBeGreaterThan(0);
                
                // Should have cache recommendation
                const cacheRec = recommendations.find(r => r.type === 'cache');
                expect(cacheRec).toBeDefined();
                if (cacheRec) {
                    expect(cacheRec.priority).toBe('high');
                    expect(cacheRec.autoApplicable).toBe(true);
                }
                
                // Should have strategy recommendation
                const strategyRec = recommendations.find(r => r.type === 'strategy');
                expect(strategyRec).toBeDefined();
                if (strategyRec) {
                    expect(strategyRec.priority).toBe('high');
                    expect(strategyRec.autoApplicable).toBe(false);
                }
                
                // Should have pattern recommendation
                const patternRec = recommendations.find(r => r.type === 'pattern');
                expect(patternRec).toBeDefined();
                if (patternRec) {
                    expect(patternRec.priority).toBe('medium');
                }
                
                // Should have configuration recommendation
                const configRec = recommendations.find(r => r.type === 'configuration');
                expect(configRec).toBeDefined();
                expect(configRec!.priority).toBe('medium');
            });

            it('should generate no recommendations for excellent performance', () => {
                const excellentMetrics: ParseMetrics = {
                    totalParses: 1000,
                    successfulParses: 995,
                    failedParses: 5,
                    cachedParses: 800, // High cache hit ratio
                    fastPathParses: 600, // High fast path usage
                    averageExecutionTime: 0.5, // Fast execution
                    strategyBreakdown: {
                        'string': 500,
                        'date': 400,
                        'number': 95,
                        'fallback': 5, // Low fallback usage
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0
                    },
                    errorBreakdown: {
                        'InvalidInput': 3,
                        'ParseError': 2,
                        'ValidationError': 0
                    },
                    performanceProfile: {
                        fastest: { strategy: 'string', time: 0.1 },
                        slowest: { strategy: 'fallback', time: 1.0 },
                        mostUsed: { strategy: 'string', count: 500 },
                        mostSuccessful: { strategy: 'string', rate: 0.995 },
                        recommendations: ['Maintain current performance']
                    }
                };
                
                const recommendations = optimizer.generateRecommendations(excellentMetrics);
                
                expect(recommendations).toHaveLength(0);
            });

            it('should sort recommendations by priority', () => {
                const poorMetrics: ParseMetrics = {
                    totalParses: 1000,
                    successfulParses: 700,
                    failedParses: 300,
                    cachedParses: 100,
                    fastPathParses: 50,
                    averageExecutionTime: 8,
                    strategyBreakdown: {
                        'fallback': 400,
                        'string': 600,
                        'number': 0,
                        'date': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0
                    },
                    errorBreakdown: {
                        'InvalidInput': 180,
                        'ParseError': 90,
                        'ValidationError': 30
                    },
                    performanceProfile: {
                        fastest: { strategy: 'string', time: 2.0 },
                        slowest: { strategy: 'fallback', time: 20.0 },
                        mostUsed: { strategy: 'string', count: 600 },
                        mostSuccessful: { strategy: 'string', rate: 0.70 },
                        recommendations: ['Critical performance issues', 'Immediate optimization needed']
                    }
                };
                
                const recommendations = optimizer.generateRecommendations(poorMetrics);
                
                // Should be sorted by priority (high first)
                for (let i = 0; i < recommendations.length - 1; i++) {
                    const current = recommendations[i];
                    const next = recommendations[i + 1];
                    
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    expect(priorityOrder[current.priority]).toBeGreaterThanOrEqual(priorityOrder[next.priority]);
                }
            });

            it('should handle zero operations', () => {
                const emptyMetrics: ParseMetrics = {
                    totalParses: 0,
                    successfulParses: 0,
                    failedParses: 0,
                    cachedParses: 0,
                    fastPathParses: 0,
                    averageExecutionTime: 0,
                    strategyBreakdown: {
                        'string': 0,
                        'number': 0,
                        'date': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0,
                        'fallback': 0
                    },
                    errorBreakdown: {},
                    performanceProfile: {
                        fastest: { strategy: 'fallback', time: 0 },
                        slowest: { strategy: 'fallback', time: 0 },
                        mostUsed: { strategy: 'fallback', count: 0 },
                        mostSuccessful: { strategy: 'fallback', rate: 1.0 },
                        recommendations: []
                    }
                };
                
                const recommendations = optimizer.generateRecommendations(emptyMetrics);
                
                expect(recommendations).toHaveLength(0);
            });
        });

        describe('applyRecommendations', () => {
            it('should apply auto-applicable cache recommendations', () => {
                const recommendations: ParseOptimizationRecommendation[] = [
                    {
                        type: 'cache',
                        priority: 'high',
                        description: 'Increase cache size to improve hit ratio',
                        impact: 'Could improve performance by 30%',
                        implementation: 'Increase ParseCache maxSize',
                        autoApplicable: true
                    }
                ];
                
                const initialSize = mockEngine.cache.getMaxSize();
                const applied = optimizer.applyRecommendations(recommendations, mockEngine);
                
                expect(applied).toHaveLength(1);
                expect(applied[0]).toContain('Increased cache size');
                expect(mockEngine.cache.getMaxSize()).toBeGreaterThan(initialSize);
            });

            it('should apply auto-applicable configuration recommendations', () => {
                const recommendations: ParseOptimizationRecommendation[] = [
                    {
                        type: 'configuration',
                        priority: 'medium',
                        description: 'Optimize parsing configuration for better performance',
                        impact: 'Could reduce average parsing time',
                        implementation: 'Enable aggressive caching',
                        autoApplicable: true
                    }
                ];
                
                const applied = optimizer.applyRecommendations(recommendations, mockEngine);
                
                expect(applied).toHaveLength(1);
                expect(applied[0]).toContain('Enabled aggressive caching');
            });

            it('should skip non-auto-applicable recommendations', () => {
                const recommendations: ParseOptimizationRecommendation[] = [
                    {
                        type: 'strategy',
                        priority: 'high',
                        description: 'Implement custom strategy',
                        impact: 'Could improve performance significantly',
                        implementation: 'Manual implementation required',
                        autoApplicable: false
                    }
                ];
                
                const applied = optimizer.applyRecommendations(recommendations, mockEngine);
                
                expect(applied).toHaveLength(0);
            });

            it('should record optimization history', () => {
                const recommendations: ParseOptimizationRecommendation[] = [
                    {
                        type: 'cache',
                        priority: 'high',
                        description: 'Increase cache size to improve hit ratio',
                        impact: 'Could improve performance by 30%',
                        implementation: 'Increase ParseCache maxSize',
                        autoApplicable: true
                    }
                ];
                
                optimizer.applyRecommendations(recommendations, mockEngine);
                
                const history = optimizer.getOptimizationHistory();
                
                expect(history).toHaveLength(1);
                expect(history[0].recommendations).toEqual(recommendations);
                expect(history[0].applied).toHaveLength(1);
                expect(typeof history[0].timestamp).toBe('number');
            });

            it('should handle errors gracefully', () => {
                const recommendations: ParseOptimizationRecommendation[] = [
                    {
                        type: 'cache',
                        priority: 'high',
                        description: 'Increase cache size to improve hit ratio',
                        impact: 'Could improve performance by 30%',
                        implementation: 'Increase ParseCache maxSize',
                        autoApplicable: true
                    }
                ];
                
                // Mock engine without cache
                const brokenEngine = {};
                
                expect(() => optimizer.applyRecommendations(recommendations, brokenEngine)).not.toThrow();
            });
        });
    });

    describe('Optimization History', () => {
        describe('getOptimizationHistory', () => {
            it('should return empty history initially', () => {
                const history = optimizer.getOptimizationHistory();
                
                expect(history).toHaveLength(0);
            });

            it('should return copy of history', () => {
                const recommendations: ParseOptimizationRecommendation[] = [
                    {
                        type: 'cache',
                        priority: 'high',
                        description: 'Test recommendation',
                        impact: 'Test impact',
                        implementation: 'Test implementation',
                        autoApplicable: true
                    }
                ];
                
                optimizer.applyRecommendations(recommendations, mockEngine);
                
                const history1 = optimizer.getOptimizationHistory();
                const history2 = optimizer.getOptimizationHistory();
                
                expect(history1).not.toBe(history2); // Different objects
                expect(history1).toEqual(history2); // Same content
            });

            it('should track multiple optimization sessions', () => {
                const recommendations1: ParseOptimizationRecommendation[] = [
                    {
                        type: 'cache',
                        priority: 'high',
                        description: 'First recommendation',
                        impact: 'First impact',
                        implementation: 'First implementation',
                        autoApplicable: true
                    }
                ];
                
                const recommendations2: ParseOptimizationRecommendation[] = [
                    {
                        type: 'configuration',
                        priority: 'medium',
                        description: 'Second recommendation',
                        impact: 'Second impact',
                        implementation: 'Second implementation',
                        autoApplicable: true
                    }
                ];
                
                optimizer.applyRecommendations(recommendations1, mockEngine);
                optimizer.applyRecommendations(recommendations2, mockEngine);
                
                const history = optimizer.getOptimizationHistory();
                
                expect(history).toHaveLength(2);
                expect(history[0].recommendations).toEqual(recommendations1);
                expect(history[1].recommendations).toEqual(recommendations2);
            });
        });
    });

    describe('Benchmarking', () => {
        describe('benchmarkOperations', () => {
            it('should benchmark parsing operations', async () => {
                const testInputs = [
                    { input: '2023-01-01T12:00:00Z', description: 'ISO string' },
                    { input: new Date('2023-01-01T12:00:00Z'), description: 'Date object' },
                    { input: 1672574400000, description: 'Timestamp' }
                ];
                
                const benchmark = await optimizer.benchmarkOperations(mockEngine, testInputs, 5);
                
                expect(benchmark.results).toHaveLength(3);
                expect(typeof benchmark.summary).toBe('object');
                
                benchmark.results.forEach(result => {
                    expect(typeof result.description).toBe('string');
                    expect(typeof result.avgTime).toBe('number');
                    expect(typeof result.minTime).toBe('number');
                    expect(typeof result.maxTime).toBe('number');
                    expect(typeof result.successRate).toBe('number');
                    expect(typeof result.strategy).toBe('string');
                    
                    expect(result.successRate).toBeGreaterThanOrEqual(0);
                    expect(result.successRate).toBeLessThanOrEqual(1);
                    expect(result.avgTime).toBeGreaterThanOrEqual(0);
                    expect(result.minTime).toBeGreaterThanOrEqual(0);
                    expect(result.maxTime).toBeGreaterThanOrEqual(result.avgTime);
                });
                
                expect(typeof benchmark.summary.totalTime).toBe('number');
                expect(typeof benchmark.summary.avgTime).toBe('number');
                expect(typeof benchmark.summary.fastestOperation).toBe('string');
                expect(typeof benchmark.summary.slowestOperation).toBe('string');
            });

            it('should handle failed operations in benchmark', async () => {
                const testInputs = [
                    { input: 'valid-input', description: 'Valid input' },
                    { input: 'fail', description: 'Failing input' }
                ];
                
                const benchmark = await optimizer.benchmarkOperations(mockEngine, testInputs, 3);
                
                expect(benchmark.results).toHaveLength(2);
                
                const validResult = benchmark.results.find(r => r.description === 'Valid input');
                const failResult = benchmark.results.find(r => r.description === 'Failing input');
                
                expect(validResult!.successRate).toBe(1);
                expect(failResult!.successRate).toBe(0);
            });

            it('should handle empty test inputs', async () => {
                const benchmark = await optimizer.benchmarkOperations(mockEngine, [], 5);
                
                expect(benchmark.results).toHaveLength(0);
                expect(benchmark.summary.totalTime).toBe(0);
                expect(benchmark.summary.avgTime).toBeNaN();
            });

            it('should use default iterations when not specified', async () => {
                const testInputs = [
                    { input: 'test-input', description: 'Test input' }
                ];
                
                const benchmark = await optimizer.benchmarkOperations(mockEngine, testInputs);
                
                expect(benchmark.results).toHaveLength(1);
                // With 100 iterations (default), success rate should be 1 for valid input
                expect(benchmark.results[0].successRate).toBe(1);
            });
        });
    });

    describe('Performance Reports', () => {
        describe('generatePerformanceReport', () => {
            it('should generate comprehensive performance report', () => {
                const report = optimizer.generatePerformanceReport(mockMetrics);
                
                expect(typeof report.summary).toBe('object');
                expect(typeof report.summary.totalOperations).toBe('number');
                expect(typeof report.summary.averageTime).toBe('number');
                expect(typeof report.summary.successRate).toBe('number');
                expect(typeof report.summary.cacheHitRate).toBe('number');
                expect(typeof report.summary.fastPathRate).toBe('number');
                
                expect(Array.isArray(report.strategies)).toBe(true);
                expect(Array.isArray(report.bottlenecks)).toBe(true);
                expect(Array.isArray(report.recommendations)).toBe(true);
                
                // Validate summary calculations
                expect(report.summary.totalOperations).toBe(mockMetrics.totalParses);
                expect(report.summary.averageTime).toBe(mockMetrics.averageExecutionTime);
                expect(report.summary.successRate).toBe(mockMetrics.successfulParses / mockMetrics.totalParses);
                expect(report.summary.cacheHitRate).toBe(mockMetrics.cachedParses / mockMetrics.totalParses);
                expect(report.summary.fastPathRate).toBe(mockMetrics.fastPathParses / mockMetrics.totalParses);
            });

            it('should include strategy performance details', () => {
                const report = optimizer.generatePerformanceReport(mockMetrics);
                
                expect(report.strategies.length).toBeGreaterThan(0);
                
                report.strategies.forEach(strategy => {
                    expect(typeof strategy.type).toBe('string');
                    expect(typeof strategy.usage).toBe('number');
                    expect(typeof strategy.averageTime).toBe('number');
                    expect(typeof strategy.successRate).toBe('number');
                    expect(typeof strategy.efficiency).toBe('number');
                    
                    expect(strategy.usage).toBeGreaterThanOrEqual(0);
                    expect(strategy.usage).toBeLessThanOrEqual(1);
                    expect(strategy.successRate).toBeGreaterThanOrEqual(0);
                    expect(strategy.successRate).toBeLessThanOrEqual(1);
                    expect(strategy.efficiency).toBeGreaterThanOrEqual(0);
                    expect(strategy.efficiency).toBeLessThanOrEqual(1);
                });
            });

            it('should include bottlenecks and recommendations', () => {
                const poorMetrics: ParseMetrics = {
                    totalParses: 1000,
                    successfulParses: 700,
                    failedParses: 300,
                    cachedParses: 100,
                    fastPathParses: 50,
                    averageExecutionTime: 8,
                    strategyBreakdown: {
                        'fallback': 400,
                        'string': 600,
                        'number': 0,
                        'date': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0
                    },
                    errorBreakdown: {
                        'InvalidInput': 180,
                        'ParseError': 90,
                        'ValidationError': 30
                    },
                    performanceProfile: {
                        fastest: { strategy: 'string', time: 2.0 },
                        slowest: { strategy: 'fallback', time: 20.0 },
                        mostUsed: { strategy: 'string', count: 600 },
                        mostSuccessful: { strategy: 'string', rate: 0.70 },
                        recommendations: ['Critical performance issues']
                    }
                };
                
                const report = optimizer.generatePerformanceReport(poorMetrics);
                
                expect(report.bottlenecks.length).toBeGreaterThan(0);
                expect(report.recommendations.length).toBeGreaterThan(0);
                
                report.bottlenecks.forEach(bottleneck => {
                    expect(typeof bottleneck.issue).toBe('string');
                    expect(typeof bottleneck.impact).toBe('string');
                    expect(typeof bottleneck.suggestion).toBe('string');
                });
                
                report.recommendations.forEach(recommendation => {
                    expect(typeof recommendation).toBe('string');
                });
            });

            it('should handle zero operations gracefully', () => {
                const emptyMetrics: ParseMetrics = {
                    totalParses: 0,
                    successfulParses: 0,
                    failedParses: 0,
                    cachedParses: 0,
                    fastPathParses: 0,
                    averageExecutionTime: 0,
                    strategyBreakdown: {
                        'string': 0,
                        'number': 0,
                        'date': 0,
                        'temporal-zoned': 0,
                        'temporal-plain-datetime': 0,
                        'temporal-plain-date': 0,
                        'temporal-instant': 0,
                        'firebase-timestamp': 0,
                        'temporal-wrapper': 0,
                        'temporal-like': 0,
                        'array-like': 0,
                        'fallback': 0
                    },
                    errorBreakdown: {},
                    performanceProfile: {
                        fastest: { strategy: 'fallback', time: 0 },
                        slowest: { strategy: 'fallback', time: 0 },
                        mostUsed: { strategy: 'fallback', count: 0 },
                        mostSuccessful: { strategy: 'fallback', rate: 1.0 },
                        recommendations: []
                    }
                };
                
                const report = optimizer.generatePerformanceReport(emptyMetrics);
                
                expect(report.summary.totalOperations).toBe(0);
                expect(report.strategies).toHaveLength(0);
                expect(report.bottlenecks).toHaveLength(0);
                expect(report.recommendations).toHaveLength(0);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle negative metrics gracefully', () => {
            const negativeMetrics: ParseMetrics = {
                totalParses: -1,
                successfulParses: -1,
                failedParses: -1,
                cachedParses: -1,
                fastPathParses: -1,
                averageExecutionTime: -1,
                strategyBreakdown: {
                    'string': 0,
                    'number': 0,
                    'date': 0,
                    'temporal-zoned': 0,
                    'temporal-plain-datetime': 0,
                    'temporal-plain-date': 0,
                    'temporal-instant': 0,
                    'firebase-timestamp': 0,
                    'temporal-wrapper': 0,
                    'temporal-like': 0,
                    'array-like': 0,
                    'fallback': 0
                },
                errorBreakdown: {},
                performanceProfile: {
                    fastest: { strategy: 'fallback', time: 0 },
                    slowest: { strategy: 'fallback', time: 0 },
                    mostUsed: { strategy: 'fallback', count: 0 },
                    mostSuccessful: { strategy: 'fallback', rate: 1.0 },
                    recommendations: []
                }
            };
            
            expect(() => optimizer.analyzePerformance(negativeMetrics)).not.toThrow();
            expect(() => optimizer.generateRecommendations(negativeMetrics)).not.toThrow();
            expect(() => optimizer.generatePerformanceReport(negativeMetrics)).not.toThrow();
        });

        it('should handle very large metrics', () => {
            const largeMetrics: ParseMetrics = {
                totalParses: Number.MAX_SAFE_INTEGER,
                successfulParses: Number.MAX_SAFE_INTEGER - 1,
                failedParses: 1,
                cachedParses: Number.MAX_SAFE_INTEGER / 2,
                fastPathParses: Number.MAX_SAFE_INTEGER / 3,
                averageExecutionTime: 1000,
                strategyBreakdown: {
                    'string': Number.MAX_SAFE_INTEGER / 2,
                    'date': Number.MAX_SAFE_INTEGER / 2,
                    'number': 0,
                    'temporal-zoned': 0,
                    'temporal-plain-datetime': 0,
                    'temporal-plain-date': 0,
                    'temporal-instant': 0,
                    'firebase-timestamp': 0,
                    'temporal-wrapper': 0,
                    'temporal-like': 0,
                    'array-like': 0,
                    'fallback': 0
                },
                errorBreakdown: {
                    'InvalidInput': 1
                },
                performanceProfile: {
                    fastest: { strategy: 'string', time: 500 },
                    slowest: { strategy: 'date', time: 1500 },
                    mostUsed: { strategy: 'string', count: Number.MAX_SAFE_INTEGER / 2 },
                    mostSuccessful: { strategy: 'string', rate: 0.999 },
                    recommendations: ['Handle large scale operations']
                }
            };
            
            expect(() => optimizer.analyzePerformance(largeMetrics)).not.toThrow();
            expect(() => optimizer.generateRecommendations(largeMetrics)).not.toThrow();
        });

        it('should handle inconsistent metrics', () => {
            const inconsistentMetrics: ParseMetrics = {
                totalParses: 100,
                successfulParses: 150, // More than total
                failedParses: 50,
                cachedParses: 200, // More than total
                fastPathParses: 300, // More than total
                averageExecutionTime: 2,
                strategyBreakdown: {
                    'string': 500, // More than total
                    'number': 0,
                    'date': 0,
                    'temporal-zoned': 0,
                    'temporal-plain-datetime': 0,
                    'temporal-plain-date': 0,
                    'temporal-instant': 0,
                    'firebase-timestamp': 0,
                    'temporal-wrapper': 0,
                    'temporal-like': 0,
                    'array-like': 0,
                    'fallback': 0
                },
                errorBreakdown: {
                    'InconsistentData': 50
                },
                performanceProfile: {
                    fastest: { strategy: 'string', time: 1.0 },
                    slowest: { strategy: 'string', time: 3.0 },
                    mostUsed: { strategy: 'string', count: 500 },
                    mostSuccessful: { strategy: 'string', rate: 0.30 },
                    recommendations: ['Fix data inconsistencies']
                }
            };
            
            expect(() => optimizer.analyzePerformance(inconsistentMetrics)).not.toThrow();
            expect(() => optimizer.generateRecommendations(inconsistentMetrics)).not.toThrow();
        });

        it('should handle empty strategy breakdown', () => {
            const emptyStrategyMetrics: ParseMetrics = {
                totalParses: 1000,
                successfulParses: 950,
                failedParses: 50,
                cachedParses: 300,
                fastPathParses: 200,
                averageExecutionTime: 2.5,
                strategyBreakdown: {
                    'string': 0,
                    'number': 0,
                    'date': 0,
                    'temporal-zoned': 0,
                    'temporal-plain-datetime': 0,
                    'temporal-plain-date': 0,
                    'temporal-instant': 0,
                    'firebase-timestamp': 0,
                    'temporal-wrapper': 0,
                    'temporal-like': 0,
                    'array-like': 0,
                    'fallback': 0
                },
                errorBreakdown: {
                    'UnknownError': 50
                },
                performanceProfile: {
                    fastest: { strategy: 'fallback', time: 2.5 },
                    slowest: { strategy: 'fallback', time: 2.5 },
                    mostUsed: { strategy: 'fallback', count: 0 },
                    mostSuccessful: { strategy: 'fallback', rate: 0.95 },
                    recommendations: ['Add strategy breakdown data']
                }
            };
            
            const analysis = optimizer.analyzePerformance(emptyStrategyMetrics);
            const profile = optimizer.generatePerformanceProfile(emptyStrategyMetrics);
            const report = optimizer.generatePerformanceReport(emptyStrategyMetrics);
            
            expect(analysis).toBeDefined();
            expect(profile).toBeDefined();
            expect(report).toBeDefined();
            expect(report.strategies).toHaveLength(0);
        });
    });
});