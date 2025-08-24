/**
 * @file Comprehensive test suite for ParseEngine class
 * Tests orchestration of parsing strategies and performance optimization
 */

import { Temporal } from '@js-temporal/polyfill';
import { ParseEngine } from '../../../core/parsing/parse-engine';
import { TemporalParseError } from '../../../types/enhanced-types';
import {
    type ParseStrategy,
    type ParseContext,
    type ParseResult,
    type ParseStrategyType,
    type ParseOptions,
    type ParseEngineConfig,
    createParseResult,
    createParseError,
    PARSE_THRESHOLDS
} from '../../../core/parsing/parsing-types';

// Mock strategy for testing
class MockParseStrategy implements ParseStrategy {
    readonly type: ParseStrategyType;
    readonly priority: number;
    readonly description: string;
    private shouldSucceed: boolean;
    private parseTime: number;
    private resultData?: Temporal.ZonedDateTime;
    private errorToThrow?: Error;
    private canHandleResult: boolean;
    private confidence: number;
    private fastPathResult?: { canUseFastPath: boolean; result?: Temporal.ZonedDateTime; confidence: number };

    constructor(
        type: ParseStrategyType,
        priority: number,
        options: {
            shouldSucceed?: boolean;
            parseTime?: number;
            resultData?: Temporal.ZonedDateTime;
            errorToThrow?: Error;
            canHandleResult?: boolean;
            confidence?: number;
            fastPathResult?: { canUseFastPath: boolean; result?: Temporal.ZonedDateTime; confidence: number };
        } = {}
    ) {
        this.type = type;
        this.priority = priority;
        this.description = `Mock ${type} strategy for testing`;
        this.shouldSucceed = options.shouldSucceed ?? true;
        this.parseTime = options.parseTime ?? 1;
        this.resultData = options.resultData || Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
        this.errorToThrow = options.errorToThrow;
        this.canHandleResult = options.canHandleResult ?? true;
        this.confidence = options.confidence ?? 0.8;
        this.fastPathResult = options.fastPathResult;
    }

    canHandle(input: any, context: ParseContext): boolean {
        return this.canHandleResult;
    }

    getConfidence(input: any, context: ParseContext): number {
        return this.confidence;
    }

    parse(input: any, context: ParseContext): ParseResult {
        if (!this.shouldSucceed && this.errorToThrow) {
            return createParseError(
                new TemporalParseError(this.errorToThrow.message, 'strategy-error'),
                this.type,
                this.parseTime
            );
        }
        
        if (!this.shouldSucceed) {
            return createParseError(
                new TemporalParseError('Mock parse failure', 'invalid-input'),
                this.type,
                this.parseTime
            );
        }

        return createParseResult(this.resultData!, this.type, this.parseTime, false, this.confidence);
    }

    normalize(input: any, context: ParseContext) {
        return {
            normalizedInput: input,
            appliedTransforms: [],
            metadata: {}
        };
    }

    validate(input: any, context: ParseContext) {
        return {
            isValid: this.shouldSucceed,
            normalizedInput: input,
            suggestedStrategy: this.type,
            confidence: this.confidence,
            errors: this.shouldSucceed ? [] : ['Mock validation error'],
            warnings: []
        };
    }

    checkFastPath(input: any, context: ParseContext) {
        if (this.fastPathResult) {
            return {
                ...this.fastPathResult,
                strategy: this.type
            };
        }
        return {
            canUseFastPath: false,
            strategy: this.type,
            confidence: 0
        };
    }

    getOptimizationHints(input: any, context: ParseContext) {
        return {
            preferredStrategy: this.type,
            shouldCache: true,
            canUseFastPath: this.fastPathResult?.canUseFastPath || false,
            estimatedComplexity: 'medium' as const,
            suggestedOptions: {},
            warnings: []
        };
    }
}

describe('ParseEngine', () => {
    let engine: ParseEngine;

    beforeEach(() => {
        engine = new ParseEngine();
    });

    describe('Constructor', () => {
        it('should create engine with default configuration', () => {
            const stats = engine.getStats();
            expect(stats.strategies).toBeGreaterThan(0);
            expect(stats.uptime).toBeGreaterThanOrEqual(0);
            expect(stats.metrics.totalParses).toBe(0);
        });

        it('should create engine with custom configuration', () => {
            const config: Partial<ParseEngineConfig> = {
                defaultOptions: {
                    enableFastPath: false,
                    enableCaching: false
                },
                cacheConfig: {
                    enabled: false,
                    maxSize: 500,
                    ttl: 300000
                }
            };

            const customEngine = new ParseEngine(config);
            const stats = customEngine.getStats();
            expect(stats.strategies).toBeGreaterThan(0);
        });
    });

    describe('Strategy Management', () => {
        describe('registerStrategy', () => {
            it('should register custom strategy', () => {
                const customStrategy = new MockParseStrategy('string', 75);
                
                engine.registerStrategy(customStrategy);
                
                const strategies = engine.getStrategies();
                expect(strategies).toContain('string');
            });

            it('should replace existing strategy', () => {
                const strategy1 = new MockParseStrategy('string', 50);
                const strategy2 = new MockParseStrategy('string', 80);
                
                engine.registerStrategy(strategy1);
                engine.registerStrategy(strategy2);
                
                const strategyObjects = engine.getStrategyObjects();
                const stringStrategy = strategyObjects.find(s => s.type === 'string');
                expect(stringStrategy?.priority).toBe(80);
            });
        });

        describe('unregisterStrategy', () => {
            it('should unregister existing strategy', () => {
                const customStrategy = new MockParseStrategy('string', 50);
                engine.registerStrategy(customStrategy);
                
                const result = engine.unregisterStrategy('string');
                
                expect(result).toBe(true);
                const strategies = engine.getStrategies();
                expect(strategies).not.toContain('string');
            });

            it('should return false for non-existent strategy', () => {
                const result = engine.unregisterStrategy('non-existent' as ParseStrategyType);
                expect(result).toBe(false);
            });
        });

        describe('getStrategies', () => {
            it('should return list of registered strategy types', () => {
                const strategies = engine.getStrategies();
                expect(Array.isArray(strategies)).toBe(true);
                expect(strategies.length).toBeGreaterThan(0);
            });
        });

        describe('getStrategyObjects', () => {
            it('should return list of strategy objects', () => {
                const strategyObjects = engine.getStrategyObjects();
                expect(Array.isArray(strategyObjects)).toBe(true);
                expect(strategyObjects.length).toBeGreaterThan(0);
                
                strategyObjects.forEach(strategy => {
                    expect(strategy).toHaveProperty('type');
                    expect(strategy).toHaveProperty('priority');
                    expect(strategy).toHaveProperty('parse');
                });
            });
        });
    });

    describe('parse', () => {
        it('should parse valid input successfully', () => {
            const result = engine.parse('2023-01-01T12:00:00Z');
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(result.strategy).toBeDefined();
                expect(result.executionTime).toBeGreaterThan(0);
            }
        });

        it('should use fast path when enabled', () => {
            const fastPathStrategy = new MockParseStrategy('string', 80, {
                fastPathResult: {
                    canUseFastPath: true,
                    result: Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]'),
                    confidence: 0.9
                }
            });
            
            engine.registerStrategy(fastPathStrategy);
            
            const result = engine.parse('test-input', { enableFastPath: true });
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.strategy).toBe('string');
            }
        });

        it('should use cache when enabled', () => {
            const input = '2023-01-01T12:00:00Z';
            
            // First parse
            const result1 = engine.parse(input, { enableCaching: true });
            expect(result1.success).toBe(true);
            expect(result1.fromCache).toBe(false);
            
            // Second parse should use cache
            const result2 = engine.parse(input, { enableCaching: true });
            expect(result2.success).toBe(true);
            expect(result2.fromCache).toBe(true);
        });

        it('should try multiple strategies until one succeeds', () => {
            const failingStrategy = new MockParseStrategy('string', 80, { shouldSucceed: false });
            const successStrategy = new MockParseStrategy('fallback', 10, { shouldSucceed: true });
            
            engine.registerStrategy(failingStrategy);
            engine.registerStrategy(successStrategy);
            
            const result = engine.parse('test-input');
            
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.strategy).toBe('fallback');
            }
        });

        it('should return error when all strategies fail', () => {
            const failingStrategy1 = new MockParseStrategy('string', 80, { shouldSucceed: false });
            const failingStrategy2 = new MockParseStrategy('date', 60, { shouldSucceed: false });
            
            // Clear existing strategies and add only failing ones
            const existingStrategies = engine.getStrategies();
            existingStrategies.forEach(type => engine.unregisterStrategy(type));
            
            engine.registerStrategy(failingStrategy1);
            engine.registerStrategy(failingStrategy2);
            
            const result = engine.parse('invalid-input');
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(TemporalParseError);
            }
        });

        it('should handle parsing exceptions gracefully', () => {
            const throwingStrategy = new MockParseStrategy('string', 80, {
                shouldSucceed: false,
                errorToThrow: new Error('Strategy internal error')
            });
            const fallbackStrategy = new MockParseStrategy('fallback', 10, { shouldSucceed: true });
            
            engine.registerStrategy(throwingStrategy);
            engine.registerStrategy(fallbackStrategy);
            
            const result = engine.parse('test-input');
            
            expect(result.success).toBe(true); // Fallback should succeed
        });

        it('should validate options and normalize input', () => {
            const result = engine.parse('  2023-01-01T12:00:00Z  ', {
                timeZone: 'UTC',
                enableCaching: true
            });
            
            expect(result.success).toBe(true);
        });

        it('should handle different input types', () => {
            const inputs = [
                '2023-01-01T12:00:00Z',
                new Date(),
                1640995200000,
                { year: 2023, month: 1, day: 1 },
                Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]')
            ];
            
            inputs.forEach((input, index) => {
                const result = engine.parse(input);
                if (!result.success) {
                    console.log(`Input ${index} failed:`, {
                        input: input,
                        inputType: typeof input,
                        inputConstructor: input?.constructor?.name,
                        error: result.error?.message,
                        strategy: result.strategy
                    });
                    
                    // Debug: Check if temporal-like strategy can handle this input
                    if (index === 3) {
                        const strategies = engine.getStrategies();
                        console.log('Available strategies:', strategies);
                        
                        // Test temporal-like strategy directly
                        const temporalLikeStrategy = engine['strategies'].get('temporal-like');
                        if (temporalLikeStrategy) {
                            const debugContext = {
                                input: input,
                                options: {},
                                inferredType: 'temporal-like' as ParseStrategyType,
                                confidence: 0.8,
                                startTime: performance.now(),
                                metadata: {}
                            };
                            console.log('TemporalLike canHandle:', temporalLikeStrategy.canHandle(input, debugContext));
                        } else {
                            console.log('TemporalLike strategy not found');
                        }
                    }
                }
                expect(result.success).toBe(true);
            });
        });
    });

    describe('parseBatch', () => {
        it('should parse multiple inputs', () => {
            const inputs = [
                '2023-01-01T12:00:00Z',
                '2023-01-02T12:00:00Z',
                '2023-01-03T12:00:00Z'
            ];
            
            const results = engine.parseBatch(inputs);
            
            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
        });

        it('should handle mixed success/failure in batch', () => {
            const failingStrategy = new MockParseStrategy('string', 80, { shouldSucceed: false });
            const successStrategy = new MockParseStrategy('fallback', 10, { shouldSucceed: true });
            
            engine.registerStrategy(failingStrategy);
            engine.registerStrategy(successStrategy);
            
            const inputs = ['valid-input', 'another-input'];
            const results = engine.parseBatch(inputs);
            
            expect(results).toHaveLength(2);
            results.forEach(result => {
                expect(result.success).toBe(true); // Fallback should work
            });
        });
    });

    describe('validate', () => {
        it('should validate input without parsing', () => {
            const mockStrategy = new MockParseStrategy('string', 50, { shouldSucceed: true });
            engine.registerStrategy(mockStrategy);
            
            const validation = engine.validate('2023-01-01');
            
            expect(validation.isValid).toBe(true);
            expect(validation.suggestedStrategy).toBe('string');
            expect(validation.confidence).toBeGreaterThan(0);
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
        });

        it('should return invalid for unsupported input', () => {
            const validation = engine.validate('unsupported-input-type');
            
            expect(validation.isValid).toBeDefined();
            expect(validation.suggestedStrategy).toBeDefined();
        });
    });

    describe('getOptimizationHints', () => {
        it('should provide optimization hints', () => {
            const mockStrategy = new MockParseStrategy('string', 50);
            engine.registerStrategy(mockStrategy);
            
            const hints = engine.getOptimizationHints('2023-01-01');
            
            expect(hints.preferredStrategy).toBeDefined();
            expect(typeof hints.shouldCache).toBe('boolean');
            expect(typeof hints.canUseFastPath).toBe('boolean');
            expect(hints.estimatedComplexity).toBeDefined();
            expect(typeof hints.suggestedOptions).toBe('object');
            expect(Array.isArray(hints.warnings)).toBe(true);
        });

        it('should return default hints for unknown strategy', () => {
            // Clear all strategies
            const existingStrategies = engine.getStrategies();
            existingStrategies.forEach(type => engine.unregisterStrategy(type));
            
            const hints = engine.getOptimizationHints('test-input');
            
            expect(hints.preferredStrategy).toBeDefined();
            expect(hints.shouldCache).toBe(true);
            expect(hints.canUseFastPath).toBe(false);
        });
    });

    describe('parseWithStrategy', () => {
        it('should parse with specific strategy', () => {
            const mockStrategy = new MockParseStrategy('string', 50, { shouldSucceed: true });
            engine.registerStrategy(mockStrategy);
            
            const context = {
                input: 'test-input',
                options: {},
                inferredType: 'string' as ParseStrategyType,
                confidence: 0.8,
                startTime: performance.now(),
                metadata: {}
            };
            
            const result = engine.parseWithStrategy('test-input', context, 'string');
            
            expect(result.success).toBe(true);
            if (result.success && result.temporal) {
                expect(result.temporal).toBeInstanceOf(Temporal.ZonedDateTime);
            }
        });

        it('should return error for non-existent strategy', () => {
            const context = {
                input: 'test-input',
                options: {},
                inferredType: 'string' as ParseStrategyType,
                confidence: 0.8,
                startTime: performance.now(),
                metadata: {}
            };
            
            const result = engine.parseWithStrategy('test-input', context, 'non-existent' as ParseStrategyType);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toContain('Strategy not found');
            }
        });
    });

    describe('Cache Management', () => {
        describe('clearCache', () => {
            it('should clear the cache', () => {
                // Parse something to populate cache
                engine.parse('2023-01-01T12:00:00Z', { enableCaching: true });
                
                engine.clearCache();
                
                const cacheStats = engine.getCacheStats();
                expect(cacheStats.size).toBe(0);
            });
        });

        describe('getCacheStats', () => {
            it('should return cache statistics', () => {
                const stats = engine.getCacheStats();
                
                expect(typeof stats.size).toBe('number');
                expect(typeof stats.hits).toBe('number');
                expect(typeof stats.misses).toBe('number');
                expect(typeof stats.hitRate).toBe('number');
            });
        });
    });

    describe('Metrics and Performance', () => {
        describe('getMetrics', () => {
            it('should return performance metrics', () => {
                // Perform some parses to generate metrics
                engine.parse('2023-01-01T12:00:00Z');
                engine.parse('2023-01-02T12:00:00Z');
                
                const metrics = engine.getMetrics();
                
                expect(metrics.totalParses).toBeGreaterThan(0);
                expect(metrics.successfulParses).toBeGreaterThan(0);
                expect(metrics.averageExecutionTime).toBeGreaterThan(0);
                expect(typeof metrics.strategyBreakdown).toBe('object');
                expect(typeof metrics.errorBreakdown).toBe('object');
                expect(typeof metrics.performanceProfile).toBe('object');
            });
        });

        describe('resetMetrics', () => {
            it('should reset all metrics', () => {
                // Generate some metrics
                engine.parse('2023-01-01T12:00:00Z');
                
                engine.resetMetrics();
                
                const metrics = engine.getMetrics();
                expect(metrics.totalParses).toBe(0);
                expect(metrics.successfulParses).toBe(0);
                expect(metrics.failedParses).toBe(0);
            });
        });

        describe('getPerformanceProfile', () => {
            it('should return performance profile', () => {
                engine.parse('2023-01-01T12:00:00Z');
                
                const profile = engine.getPerformanceProfile();
                
                expect(profile.fastest).toHaveProperty('strategy');
                expect(profile.fastest).toHaveProperty('time');
                expect(profile.slowest).toHaveProperty('strategy');
                expect(profile.slowest).toHaveProperty('time');
                expect(profile.mostUsed).toHaveProperty('strategy');
                expect(profile.mostUsed).toHaveProperty('count');
                expect(profile.mostSuccessful).toHaveProperty('strategy');
                expect(profile.mostSuccessful).toHaveProperty('rate');
                expect(Array.isArray(profile.recommendations)).toBe(true);
            });
        });
    });

    describe('optimize', () => {
        it('should optimize engine based on usage patterns', () => {
            // Generate some usage data
            for (let i = 0; i < 10; i++) {
                engine.parse(`2023-01-0${(i % 9) + 1}T12:00:00Z`);
            }
            
            expect(() => engine.optimize()).not.toThrow();
        });
    });

    describe('getStats', () => {
        it('should return comprehensive engine statistics', () => {
            const stats = engine.getStats();
            
            expect(typeof stats.strategies).toBe('number');
            expect(typeof stats.uptime).toBe('number');
            expect(typeof stats.metrics).toBe('object');
            expect(typeof stats.cache).toBe('object');
            expect(stats.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle null and undefined inputs', () => {
            const nullResult = engine.parse(null);
            const undefinedResult = engine.parse(undefined);
            
            expect(nullResult.success).toBe(false);
            expect(undefinedResult.success).toBe(false);
        });

        it('should handle very large inputs', () => {
            const largeString = 'a'.repeat(10000);
            const result = engine.parse(largeString);
            
            // Should not crash, though may fail to parse
            expect(result).toBeDefined();
        });

        it('should handle circular references gracefully', () => {
            const circular: any = { prop: null };
            circular.prop = circular;
            
            const result = engine.parse(circular);
            expect(result).toBeDefined();
        });

        it('should handle strategies that throw exceptions', () => {
            const throwingStrategy = new MockParseStrategy('string', 80, {
                shouldSucceed: false,
                errorToThrow: new Error('Unexpected error')
            });
            
            engine.registerStrategy(throwingStrategy);
            
            const result = engine.parse('test-input');
            expect(result).toBeDefined();
        });

        it('should maintain performance under load', () => {
            const startTime = performance.now();
            
            // Parse many inputs
            for (let i = 0; i < 100; i++) {
                engine.parse(`2023-01-01T${String(i % 24).padStart(2, '0')}:00:00Z`);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            // Should complete in reasonable time (adjust threshold as needed)
            expect(totalTime).toBeLessThan(5000); // 5 seconds
        });
    });

    describe('Integration Tests', () => {
        it('should work with real temporal inputs', () => {
            const inputs = [
                '2023-01-01T12:00:00Z',
                '2023-01-01T12:00:00+05:00',
                '2023-01-01',
                new Date('2023-01-01T12:00:00Z'),
                1640995200000, // Unix timestamp
                Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                Temporal.Instant.from('2023-01-01T12:00:00Z'),
                Temporal.PlainDateTime.from('2023-01-01T12:00:00'),
                Temporal.PlainDate.from('2023-01-01')
            ];
            
            inputs.forEach((input, index) => {
                const result = engine.parse(input);
                if (!result.success) {
                    console.log(`Input ${index + 1} failed:`, {
                        input: input,
                        inputType: typeof input,
                        constructor: input?.constructor?.name,
                        error: result.error?.message,
                        strategy: result.strategy
                    });
                }
                expect(result.success).toBe(true);
                if (result.success && result.data) {
                    expect(result.data).toBeInstanceOf(Temporal.ZonedDateTime);
                }
            });
        });

        it('should maintain consistent behavior across multiple parses', () => {
            const input = '2023-01-01T12:00:00Z';
            const results: ParseResult[] = [];
            
            for (let i = 0; i < 5; i++) {
                results.push(engine.parse(input));
            }
            
            // All results should be successful and consistent
            results.forEach(result => {
                expect(result.success).toBe(true);
                if (result.success && result.data && results[0].success && results[0].data) {
                    expect(result.data.toString()).toBe(results[0].data.toString());
                }
            });
        });
    });
});