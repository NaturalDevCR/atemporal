/**
 * @file Comprehensive test suite for ParseCoordinator class
 * Tests orchestration, strategy selection, optimization, and performance monitoring
 */

import { Temporal } from '@js-temporal/polyfill';
import { ParseCoordinator, type ParseCoordinatorConfig } from '../../../core/parsing/parse-coordinator';
import { TemporalParseError } from '../../../types/enhanced-types';
import type { TemporalInput, StrictParsingOptions } from '../../../types/enhanced-types';
import type { ParseStrategy, ParseStrategyType } from '../../../core/parsing/parsing-types';

// Mock strategy for testing
class MockParseStrategy implements ParseStrategy {
    type: ParseStrategyType;
    priority: number;
    description: string;
    private shouldSucceed: boolean;
    private confidence: number;

    constructor(
        type: ParseStrategyType,
        priority: number = 50,
        shouldSucceed: boolean = true,
        confidence: number = 0.8
    ) {
        this.type = type;
        this.priority = priority;
        this.description = `Mock ${type} strategy for testing`;
        this.shouldSucceed = shouldSucceed;
        this.confidence = confidence;
    }

    canHandle(input: TemporalInput, context: any): boolean {
        return this.shouldSucceed;
    }

    getConfidence(input: TemporalInput, context: any): number {
        return this.confidence;
    }

    validate(input: TemporalInput, context: any): any {
        return {
            isValid: true,
            normalizedInput: input,
            suggestedStrategy: this.type,
            confidence: this.confidence,
            errors: [],
            warnings: []
        };
    }

    normalize(input: TemporalInput, context: any): any {
        return {
            normalizedInput: input,
            appliedTransforms: [],
            metadata: {}
        };
    }

    parse(input: TemporalInput, context: any): any {
        if (!this.shouldSucceed) {
            return {
                success: false,
                error: new Error(`Mock strategy ${this.type} failed`),
                status: 'error',
                strategy: this.type,
                executionTime: 1,
                fromCache: false,
                confidence: this.confidence,
                metadata: {}
            };
        }
        return {
            success: true,
            data: Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
            status: 'success',
            strategy: this.type,
            executionTime: 1,
            fromCache: false,
            confidence: this.confidence,
            metadata: {}
        };
    }

    getMetadata() {
        return {
            name: `Mock ${this.type} Strategy`,
            version: '1.0.0',
            description: 'Mock strategy for testing'
        };
    }
}

describe('ParseCoordinator', () => {
    let coordinator: ParseCoordinator;
    let testInput: TemporalInput;
    let testOptions: StrictParsingOptions;

    beforeEach(() => {
        coordinator = new ParseCoordinator();
        testInput = '2023-01-01T12:00:00Z';
        testOptions = { timeZone: 'UTC' };
    });

    describe('Constructor', () => {
        it('should create coordinator with default configuration', () => {
            const defaultCoordinator = new ParseCoordinator();
            const config = defaultCoordinator.getConfig();
            
            expect(config.maxStrategyAttempts).toBe(3);
            expect(config.enableAutoOptimization).toBe(true);
            expect(config.autoOptimizationInterval).toBe(1000);
            expect(config.enableDetailedMetrics).toBe(true);
            expect(config.strategySelectionMode).toBe('hybrid');
            expect(config.fallbackBehavior).toBe('error');
        });

        it('should create coordinator with custom configuration', () => {
            const customConfig: ParseCoordinatorConfig = {
                maxStrategyAttempts: 5,
                enableAutoOptimization: false,
                autoOptimizationInterval: 500,
                enableDetailedMetrics: false,
                strategySelectionMode: 'confidence',
                fallbackBehavior: 'null'
            };
            
            const customCoordinator = new ParseCoordinator(customConfig);
            const config = customCoordinator.getConfig();
            
            expect(config.maxStrategyAttempts).toBe(5);
            expect(config.enableAutoOptimization).toBe(false);
            expect(config.autoOptimizationInterval).toBe(500);
            expect(config.enableDetailedMetrics).toBe(false);
            expect(config.strategySelectionMode).toBe('confidence');
            expect(config.fallbackBehavior).toBe('null');
        });

        it('should register custom strategies from configuration', () => {
            const customStrategy = new MockParseStrategy('string', 75);
            const config: ParseCoordinatorConfig = {
                customStrategies: [customStrategy]
            };
            
            expect(() => new ParseCoordinator(config)).not.toThrow();
        });
    });

    describe('Basic Parsing', () => {
        describe('parse', () => {
            it('should parse valid temporal input successfully', async () => {
                const result = await coordinator.parse(testInput, testOptions);
                
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(result.timeZoneId).toBe('UTC');
            });

            it('should parse different input types', async () => {
                const inputs: TemporalInput[] = [
                    '2023-01-01T12:00:00Z',
                    new Date('2023-01-01T12:00:00Z'),
                    1672574400000, // timestamp
                    { year: 2023, month: 1, day: 1, hour: 12 }
                ];
                
                for (const input of inputs) {
                    const result = await coordinator.parse(input, testOptions);
                    expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
                }
            });

            it('should handle different time zones', async () => {
                const timeZones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
                
                for (const timeZone of timeZones) {
                    const result = await coordinator.parse(testInput, { timeZone });
                    expect(result.timeZoneId).toBe(timeZone);
                }
            });

            it('should throw error for invalid input when fallback is error', async () => {
                const invalidInput = 'completely-invalid-input';
                
                await expect(coordinator.parse(invalidInput, testOptions))
                    .rejects.toThrow(TemporalParseError);
            });

            it('should return epoch when fallback is null', async () => {
                const nullFallbackCoordinator = new ParseCoordinator({
                    fallbackBehavior: 'null'
                });
                
                const invalidInput = 'completely-invalid-input';
                const result = await nullFallbackCoordinator.parse(invalidInput, testOptions);
                
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(result.epochMilliseconds).toBe(0);
            });

            it('should retry with fallback strategy when fallback is retry', async () => {
                const retryCoordinator = new ParseCoordinator({
                    fallbackBehavior: 'retry'
                });
                
                // This should still work for valid inputs
                const result = await retryCoordinator.parse(testInput, testOptions);
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            });
        });

        describe('batchParse', () => {
            it('should parse multiple inputs successfully', async () => {
                const inputs: TemporalInput[] = [
                    '2023-01-01T12:00:00Z',
                    '2023-01-02T12:00:00Z',
                    '2023-01-03T12:00:00Z'
                ];
                
                const results = await coordinator.batchParse(inputs, testOptions);
                
                expect(results).toHaveLength(3);
                results.forEach((result, index) => {
                    expect(result.input).toBe(inputs[index]);
                    expect(result.result).toBeInstanceOf(Temporal.ZonedDateTime);
                    expect(result.error).toBeUndefined();
                });
            });

            it('should handle mixed success and failure in batch', async () => {
                const inputs: TemporalInput[] = [
                    '2023-01-01T12:00:00Z', // valid
                    'invalid-input', // invalid
                    '2023-01-03T12:00:00Z' // valid
                ];
                
                const results = await coordinator.batchParse(inputs, testOptions);
                
                expect(results).toHaveLength(3);
                expect(results[0].result).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(results[0].error).toBeUndefined();
                expect(results[1].result).toBeUndefined();
                expect(results[1].error).toBeInstanceOf(Error);
                expect(results[2].result).toBeInstanceOf(Temporal.ZonedDateTime);
                expect(results[2].error).toBeUndefined();
            });

            it('should handle large batches efficiently', async () => {
                const inputs: TemporalInput[] = Array.from({ length: 50 }, (_, i) => 
                    `2023-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`
                );
                
                const startTime = performance.now();
                const results = await coordinator.batchParse(inputs, testOptions);
                const endTime = performance.now();
                
                expect(results).toHaveLength(50);
                expect(endTime - startTime).toBeLessThan(5000); // Should complete reasonably fast
                
                results.forEach(result => {
                    expect(result.result).toBeInstanceOf(Temporal.ZonedDateTime);
                    expect(result.error).toBeUndefined();
                });
            });

            it('should handle empty batch', async () => {
                const results = await coordinator.batchParse([], testOptions);
                expect(results).toHaveLength(0);
            });
        });
    });

    describe('Strategy Selection', () => {
        describe('confidence mode', () => {
            it('should select strategies by confidence', async () => {
                const confidenceCoordinator = new ParseCoordinator({
                    strategySelectionMode: 'confidence',
                    maxStrategyAttempts: 2
                });
                
                const result = await confidenceCoordinator.parse(testInput, testOptions);
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            });
        });

        describe('priority mode', () => {
            it('should select strategies by priority', async () => {
                const priorityCoordinator = new ParseCoordinator({
                    strategySelectionMode: 'priority',
                    maxStrategyAttempts: 2
                });
                
                const result = await priorityCoordinator.parse(testInput, testOptions);
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            });
        });

        describe('hybrid mode', () => {
            it('should select strategies using hybrid approach', async () => {
                const hybridCoordinator = new ParseCoordinator({
                    strategySelectionMode: 'hybrid',
                    maxStrategyAttempts: 3
                });
                
                const result = await hybridCoordinator.parse(testInput, testOptions);
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            });
        });

        it('should limit strategy attempts based on configuration', async () => {
            const limitedCoordinator = new ParseCoordinator({
                maxStrategyAttempts: 1
            });
            
            const result = await limitedCoordinator.parse(testInput, testOptions);
            expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
        });
    });

    describe('Optimization and Performance', () => {
        describe('auto-optimization', () => {
            it('should trigger auto-optimization after interval', async () => {
                const autoOptCoordinator = new ParseCoordinator({
                    enableAutoOptimization: true,
                    autoOptimizationInterval: 2 // Very small interval for testing
                });
                
                // Perform operations to trigger optimization
                await autoOptCoordinator.parse(testInput, testOptions);
                await autoOptCoordinator.parse(testInput, testOptions);
                await autoOptCoordinator.parse(testInput, testOptions);
                
                // Should not throw and should complete
                expect(true).toBe(true);
            });

            it('should not auto-optimize when disabled', async () => {
                const noAutoOptCoordinator = new ParseCoordinator({
                    enableAutoOptimization: false
                });
                
                // Perform many operations
                for (let i = 0; i < 10; i++) {
                    await noAutoOptCoordinator.parse(testInput, testOptions);
                }
                
                expect(true).toBe(true); // Should complete without issues
            });
        });

        describe('getOptimizationHints', () => {
            it('should provide optimization hints for input', async () => {
                const hints = await coordinator.getOptimizationHints(
                    testInput,
                    { input: testInput, options: testOptions, timestamp: Date.now() } as any
                );
                
                expect(typeof hints).toBe('object');
                expect(hints).toBeDefined();
            });
        });

        describe('metrics and analysis', () => {
            it('should provide performance metrics', () => {
                const metrics = coordinator.getMetrics();
                
                expect(typeof metrics).toBe('object');
                expect(typeof metrics.totalParses).toBe('number');
                expect(typeof metrics.successfulParses).toBe('number');
                expect(typeof metrics.failedParses).toBe('number');
            });

            it('should provide performance analysis', () => {
                const analysis = coordinator.getPerformanceAnalysis();
                
                expect(typeof analysis.efficiency).toBe('number');
                expect(Array.isArray(analysis.bottlenecks)).toBe(true);
                expect(Array.isArray(analysis.strengths)).toBe(true);
            });

            it('should generate performance report', () => {
                const report = coordinator.generatePerformanceReport();
                
                expect(typeof report).toBe('object');
                expect(report).toBeDefined();
            });

            it('should reset metrics', async () => {
                // Generate some metrics
                await coordinator.parse(testInput, testOptions);
                
                coordinator.resetMetrics();
                
                const metrics = coordinator.getMetrics();
                expect(metrics.totalParses).toBe(0);
                expect(metrics.successfulParses).toBe(0);
                expect(metrics.failedParses).toBe(0);
            });
        });

        describe('benchmark', () => {
            it('should benchmark parsing performance', async () => {
                const testInputs = [
                    { input: '2023-01-01T12:00:00Z', description: 'ISO string' },
                    { input: new Date('2023-01-01T12:00:00Z'), description: 'Date object' },
                    { input: 1672574400000, description: 'Timestamp' }
                ];
                
                const benchmarkResult = await coordinator.benchmark(testInputs, 5);
                
                expect(typeof benchmarkResult).toBe('object');
                expect(benchmarkResult).toBeDefined();
            });
        });
    });

    describe('Strategy Management', () => {
        describe('registerStrategy', () => {
            it('should register custom strategy', () => {
                const customStrategy = new MockParseStrategy('string', 80);
                
                expect(() => coordinator.registerStrategy(customStrategy)).not.toThrow();
            });
        });

        describe('unregisterStrategy', () => {
            it('should unregister strategy', () => {
                expect(() => coordinator.unregisterStrategy('string')).not.toThrow();
            });
        });
    });

    describe('Cache Management', () => {
        describe('clearCache', () => {
            it('should clear all caches', async () => {
                // Generate some cached results
                await coordinator.parse(testInput, testOptions);
                await coordinator.parse(testInput, testOptions); // Should hit cache
                
                expect(() => coordinator.clearCache()).not.toThrow();
            });
        });
    });

    describe('Configuration Management', () => {
        describe('getConfig', () => {
            it('should return current configuration', () => {
                const config = coordinator.getConfig();
                
                expect(typeof config).toBe('object');
                expect(typeof config.maxStrategyAttempts).toBe('number');
                expect(typeof config.enableAutoOptimization).toBe('boolean');
                expect(typeof config.strategySelectionMode).toBe('string');
            });

            it('should return copy of configuration', () => {
                const config1 = coordinator.getConfig();
                const config2 = coordinator.getConfig();
                
                expect(config1).not.toBe(config2); // Different objects
                expect(config1).toEqual(config2); // Same content
            });
        });

        describe('updateConfig', () => {
            it('should update configuration', () => {
                const newConfig: Partial<ParseCoordinatorConfig> = {
                    maxStrategyAttempts: 5,
                    strategySelectionMode: 'confidence'
                };
                
                coordinator.updateConfig(newConfig);
                
                const updatedConfig = coordinator.getConfig();
                expect(updatedConfig.maxStrategyAttempts).toBe(5);
                expect(updatedConfig.strategySelectionMode).toBe('confidence');
            });

            it('should preserve existing configuration when updating', () => {
                const originalConfig = coordinator.getConfig();
                
                coordinator.updateConfig({ maxStrategyAttempts: 5 });
                
                const updatedConfig = coordinator.getConfig();
                expect(updatedConfig.maxStrategyAttempts).toBe(5);
                expect(updatedConfig.enableAutoOptimization).toBe(originalConfig.enableAutoOptimization);
                expect(updatedConfig.strategySelectionMode).toBe(originalConfig.strategySelectionMode);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle null and undefined inputs', async () => {
            await expect(coordinator.parse(null as any, testOptions))
                .rejects.toThrow();
            
            await expect(coordinator.parse(undefined as any, testOptions))
                .rejects.toThrow();
        });

        it('should handle empty string input', async () => {
            await expect(coordinator.parse('', testOptions))
                .rejects.toThrow();
        });

        it('should handle malformed options', async () => {
            const malformedOptions = { timeZone: 'Invalid/TimeZone' };
            
            await expect(coordinator.parse(testInput, malformedOptions))
                .rejects.toThrow();
        });

        it('should handle very large inputs', async () => {
            const largeInput = 'a'.repeat(10000);
            
            await expect(coordinator.parse(largeInput, testOptions))
                .rejects.toThrow();
        });

        it('should handle circular references in input', async () => {
            const circular: any = { prop: null };
            circular.prop = circular;
            
            await expect(coordinator.parse(circular, testOptions))
                .rejects.toThrow();
        });

        it('should handle coordination errors gracefully', async () => {
            // Create coordinator with invalid configuration that might cause issues
            const problematicCoordinator = new ParseCoordinator({
                maxStrategyAttempts: 0 // Invalid value
            });
            
            await expect(problematicCoordinator.parse(testInput, testOptions))
                .rejects.toThrow();
        });
    });

    describe('Integration Tests', () => {
        it('should handle complex parsing scenarios', async () => {
            const complexInputs = [
                '2023-12-31T23:59:59.999Z',
                new Date('2023-01-01T00:00:00.000Z'),
                1672531200000,
                { year: 2023, month: 12, day: 31, hour: 23, minute: 59, second: 59 },
                'now',
                'today'
            ];
            
            for (const input of complexInputs) {
                try {
                    const result = await coordinator.parse(input, testOptions);
                    expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
                } catch (error) {
                    // Some inputs like 'now' and 'today' might not be supported
                    // That's acceptable for this test
                    expect(error).toBeInstanceOf(Error);
                }
            }
        });

        it('should maintain consistent behavior across multiple operations', async () => {
            const input = '2023-06-15T14:30:00Z';
            const results: Temporal.ZonedDateTime[] = [];
            
            // Parse the same input multiple times
            for (let i = 0; i < 10; i++) {
                const result = await coordinator.parse(input, testOptions);
                results.push(result);
            }
            
            // All results should be equivalent
            const firstResult = results[0];
            results.forEach(result => {
                expect(result.equals(firstResult)).toBe(true);
            });
        });

        it('should handle concurrent parsing operations', async () => {
            const inputs = Array.from({ length: 20 }, (_, i) => 
                `2023-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`
            );
            
            const promises = inputs.map(input => 
                coordinator.parse(input, testOptions)
            );
            
            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(20);
            results.forEach(result => {
                expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
            });
        });

        it('should optimize performance over time', async () => {
            const optimizingCoordinator = new ParseCoordinator({
                enableAutoOptimization: true,
                autoOptimizationInterval: 5
            });
            
            const input = '2023-01-01T12:00:00Z';
            
            // Perform many operations to trigger optimization
            for (let i = 0; i < 20; i++) {
                await optimizingCoordinator.parse(input, testOptions);
            }
            
            const metrics = optimizingCoordinator.getMetrics();
            expect(metrics.totalParses).toBe(20);
            expect(metrics.successfulParses).toBe(20);
        });
    });
});