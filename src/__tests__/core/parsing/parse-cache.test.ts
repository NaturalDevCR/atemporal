/**
 * @file Comprehensive test suite for ParseCache class
 * Tests caching functionality, metrics, and optimization features
 */

import { Temporal } from '@js-temporal/polyfill';
import { ParseCache, type ParseCacheConfig } from '../../../core/parsing/parse-cache';
import {
    type ParseResult,
    type ParseCacheEntry,
    type ParseStrategyType,
    createParseResult
} from '../../../core/parsing/parsing-types';
import type { TemporalInput, StrictParsingOptions } from '../../../types/enhanced-types';

describe('ParseCache', () => {
    let cache: ParseCache;
    let testResult: ParseResult;
    let testInput: TemporalInput;
    let testOptions: StrictParsingOptions;

    beforeEach(() => {
        cache = new ParseCache();
        testResult = createParseResult(
            Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
            'string',
            5.5
        );
        testInput = '2023-01-01T12:00:00Z';
        testOptions = { timeZone: 'UTC' };
    });

    describe('Constructor', () => {
        it('should create cache with default configuration', () => {
            const defaultCache = new ParseCache();
            const stats = defaultCache.getStats();
            
            expect(stats.size).toBe(0);
            expect(stats.maxSize).toBe(1000);
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });

        it('should create cache with custom configuration', () => {
            const config: Partial<ParseCacheConfig> = {
                enabled: true,
                maxSize: 500,
                ttl: 60000,
                enableMetrics: true,
                enableOptimization: false
            };
            
            const customCache = new ParseCache(config);
            const stats = customCache.getStats();
            
            expect(stats.maxSize).toBe(500);
        });

        it('should create disabled cache', () => {
            const disabledCache = new ParseCache({ enabled: false });
            
            disabledCache.set(testInput, testOptions, testResult);
            const retrieved = disabledCache.get(testInput, testOptions);
            
            expect(retrieved).toBeUndefined();
        });
    });

    describe('Basic Cache Operations', () => {
        describe('set and get', () => {
            it('should store and retrieve cache entries', () => {
                cache.set(testInput, testOptions, testResult);
                const retrieved = cache.get(testInput, testOptions);
                
                expect(retrieved).toBeDefined();
                expect(retrieved!.result.equals(testResult.data!)).toBe(true);
                expect(retrieved!.strategy).toBe('string');
                expect(retrieved!.executionTime).toBe(5.5);
            });

            it('should not store unsuccessful results', () => {
                const errorResult: ParseResult = {
                    success: false,
                    error: new Error('Parse failed') as any,
                    status: 'error',
                    strategy: 'string',
                    executionTime: 2.0,
                    fromCache: false,
                    confidence: 0,
                    metadata: {}
                };
                
                cache.set(testInput, testOptions, errorResult);
                const retrieved = cache.get(testInput, testOptions);
                
                expect(retrieved).toBeUndefined();
            });

            it('should handle different input types', () => {
                const inputs: TemporalInput[] = [
                    '2023-01-01T12:00:00Z',
                    new Date('2023-01-01T12:00:00Z'),
                    1640995200000,
                    { year: 2023, month: 1, day: 1 }
                ];
                
                inputs.forEach((input, index) => {
                    const result = createParseResult(
                        Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                        'string',
                        index + 1
                    );
                    
                    cache.set(input, testOptions, result);
                    const retrieved = cache.get(input, testOptions);
                    
                    expect(retrieved).toBeDefined();
                    expect(retrieved!.executionTime).toBe(index + 1);
                });
            });

            it('should handle different options', () => {
                const options1 = { timeZone: 'UTC' };
                const options2 = { timeZone: 'America/New_York' };
                
                cache.set(testInput, options1, testResult);
                cache.set(testInput, options2, testResult);
                
                const retrieved1 = cache.get(testInput, options1);
                const retrieved2 = cache.get(testInput, options2);
                
                expect(retrieved1).toBeDefined();
                expect(retrieved2).toBeDefined();
            });
        });

        describe('has', () => {
            it('should return true for existing entries', () => {
                cache.set(testInput, testOptions, testResult);
                
                expect(cache.has(testInput, testOptions)).toBe(true);
            });

            it('should return false for non-existing entries', () => {
                expect(cache.has(testInput, testOptions)).toBe(false);
            });

            it('should return false for expired entries', () => {
                const shortTtlCache = new ParseCache({ ttl: 1 }); // 1ms TTL
                
                shortTtlCache.set(testInput, testOptions, testResult);
                
                // Wait for expiration
                return new Promise(resolve => {
                    setTimeout(() => {
                        expect(shortTtlCache.has(testInput, testOptions)).toBe(false);
                        resolve(undefined);
                    }, 10);
                });
            });
        });

        describe('delete', () => {
            it('should delete existing entries', () => {
                cache.set(testInput, testOptions, testResult);
                
                const deleted = cache.delete(testInput, testOptions);
                
                expect(deleted).toBe(true);
                expect(cache.has(testInput, testOptions)).toBe(false);
            });

            it('should return false for non-existing entries', () => {
                const deleted = cache.delete(testInput, testOptions);
                
                expect(deleted).toBe(false);
            });
        });

        describe('clear', () => {
            it('should clear all entries', () => {
                // Add multiple entries
                for (let i = 0; i < 5; i++) {
                    cache.set(`input-${i}`, testOptions, testResult);
                }
                
                expect(cache.size()).toBe(5);
                
                cache.clear();
                
                expect(cache.size()).toBe(0);
            });

            it('should reset metrics when clearing', () => {
                cache.set(testInput, testOptions, testResult);
                cache.get(testInput, testOptions); // Generate hit
                cache.get('non-existent', testOptions); // Generate miss
                
                cache.clear();
                
                const stats = cache.getStats();
                expect(stats.hits).toBe(0);
                expect(stats.misses).toBe(0);
            });
        });

        describe('size and maxSize', () => {
            it('should track cache size correctly', () => {
                expect(cache.size()).toBe(0);
                
                cache.set(testInput, testOptions, testResult);
                expect(cache.size()).toBe(1);
                
                cache.set('another-input', testOptions, testResult);
                expect(cache.size()).toBe(2);
                
                cache.delete(testInput, testOptions);
                expect(cache.size()).toBe(1);
            });

            it('should return correct max size', () => {
                expect(cache.maxSize()).toBe(1000);
                
                const smallCache = new ParseCache({ maxSize: 100 });
                expect(smallCache.maxSize()).toBe(100);
            });

            it('should update max size', () => {
                cache.setMaxSize(500);
                expect(cache.maxSize()).toBe(500);
            });
        });
    });

    describe('TTL and Expiration', () => {
        it('should expire entries after TTL', () => {
            const shortTtlCache = new ParseCache({ ttl: 10 }); // 10ms TTL
            
            shortTtlCache.set(testInput, testOptions, testResult);
            
            // Should be available immediately
            expect(shortTtlCache.get(testInput, testOptions)).toBeDefined();
            
            // Should expire after TTL
            return new Promise(resolve => {
                setTimeout(() => {
                    expect(shortTtlCache.get(testInput, testOptions)).toBeUndefined();
                    resolve(undefined);
                }, 20);
            });
        });

        it('should remove expired entries on access', () => {
            const shortTtlCache = new ParseCache({ ttl: 1 });
            
            shortTtlCache.set(testInput, testOptions, testResult);
            
            return new Promise(resolve => {
                setTimeout(() => {
                    const sizeBefore = shortTtlCache.size();
                    shortTtlCache.get(testInput, testOptions); // Should trigger cleanup
                    const sizeAfter = shortTtlCache.size();
                    
                    expect(sizeAfter).toBeLessThan(sizeBefore);
                    resolve(undefined);
                }, 10);
            });
        });
    });

    describe('Metrics and Statistics', () => {
        describe('getStats', () => {
            it('should return comprehensive statistics', () => {
                // Add some entries
                cache.set(testInput, testOptions, testResult);
                cache.set('input2', testOptions, testResult);
                
                // Generate hits and misses
                cache.get(testInput, testOptions); // Hit
                cache.get('non-existent', testOptions); // Miss
                
                const stats = cache.getStats();
                
                expect(stats.size).toBe(2);
                expect(stats.maxSize).toBe(1000);
                expect(stats.hits).toBe(1);
                expect(stats.misses).toBe(1);
                expect(stats.hitRatio).toBe(0.5);
                expect(stats.averageAccessTime).toBeGreaterThan(0);
                expect(stats.memoryUsage).toBeGreaterThan(0);
                expect(stats.efficiency).toBeGreaterThan(0);
                expect(typeof stats.entryBreakdown).toBe('object');
                expect(typeof stats.ageDistribution).toBe('object');
            });

            it('should track entry breakdown by strategy', () => {
                const stringResult = createParseResult(
                    Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                    'string',
                    1
                );
                const dateResult = createParseResult(
                    Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                    'date',
                    2
                );
                
                cache.set('input1', testOptions, stringResult);
                cache.set('input2', testOptions, stringResult);
                cache.set('input3', testOptions, dateResult);
                
                const stats = cache.getStats();
                
                expect(stats.entryBreakdown.string).toBe(2);
                expect(stats.entryBreakdown.date).toBe(1);
            });

            it('should track age distribution', () => {
                cache.set(testInput, testOptions, testResult);
                
                const stats = cache.getStats();
                
                expect(stats.ageDistribution.fresh).toBe(1);
                expect(stats.ageDistribution.recent).toBe(0);
                expect(stats.ageDistribution.old).toBe(0);
            });
        });

        describe('resetMetrics', () => {
            it('should reset all metrics', () => {
                // Generate some metrics
                cache.set(testInput, testOptions, testResult);
                cache.get(testInput, testOptions);
                cache.get('non-existent', testOptions);
                
                cache.resetMetrics();
                
                const stats = cache.getStats();
                expect(stats.hits).toBe(0);
                expect(stats.misses).toBe(0);
                expect(stats.averageAccessTime).toBe(0);
            });
        });
    });

    describe('Optimization and Efficiency', () => {
        describe('optimize', () => {
            it('should remove expired entries during optimization', () => {
                const shortTtlCache = new ParseCache({ ttl: 1, enableOptimization: true });
                
                shortTtlCache.set(testInput, testOptions, testResult);
                
                return new Promise(resolve => {
                    setTimeout(() => {
                        const sizeBefore = shortTtlCache.size();
                        shortTtlCache.optimize();
                        const sizeAfter = shortTtlCache.size();
                        
                        expect(sizeAfter).toBeLessThanOrEqual(sizeBefore);
                        resolve(undefined);
                    }, 10);
                });
            });

            it('should not optimize when disabled', () => {
                const noOptCache = new ParseCache({ enableOptimization: false });
                
                expect(() => noOptCache.optimize()).not.toThrow();
            });
        });

        describe('getEfficiencyMetrics', () => {
            it('should return efficiency metrics', () => {
                cache.set(testInput, testOptions, testResult);
                cache.get(testInput, testOptions);
                
                const efficiency = cache.getEfficiencyMetrics();
                
                expect(typeof efficiency.hitRatio).toBe('number');
                expect(typeof efficiency.memoryEfficiency).toBe('number');
                expect(typeof efficiency.accessPatternEfficiency).toBe('number');
                expect(typeof efficiency.ageEfficiency).toBe('number');
                expect(typeof efficiency.overallEfficiency).toBe('number');
                
                expect(efficiency.hitRatio).toBeGreaterThanOrEqual(0);
                expect(efficiency.hitRatio).toBeLessThanOrEqual(1);
            });
        });

        describe('getRecommendations', () => {
            it('should provide recommendations based on usage', () => {
                const recommendations = cache.getRecommendations();
                
                expect(Array.isArray(recommendations)).toBe(true);
            });

            it('should recommend increasing cache for low hit ratio', () => {
                // Generate many misses
                for (let i = 0; i < 10; i++) {
                    cache.get(`non-existent-${i}`, testOptions);
                }
                
                const recommendations = cache.getRecommendations();
                const hasLowHitRatioRecommendation = recommendations.some(r => 
                    r.includes('Low cache hit ratio')
                );
                
                expect(hasLowHitRatioRecommendation).toBe(true);
            });
        });
    });

    describe('Advanced Features', () => {
        describe('createSnapshot', () => {
            it('should create comprehensive snapshot', () => {
                cache.set(testInput, testOptions, testResult);
                cache.get(testInput, testOptions);
                
                const snapshot = cache.createSnapshot();
                
                expect(typeof snapshot.timestamp).toBe('number');
                expect(typeof snapshot.stats).toBe('object');
                expect(typeof snapshot.efficiency).toBe('object');
                expect(Array.isArray(snapshot.recommendations)).toBe(true);
                expect(typeof snapshot.config).toBe('object');
            });
        });

        describe('validateIntegrity', () => {
            it('should validate cache integrity', () => {
                cache.set(testInput, testOptions, testResult);
                
                const validation = cache.validateIntegrity();
                
                expect(typeof validation.isValid).toBe('boolean');
                expect(Array.isArray(validation.issues)).toBe(true);
            });

            it('should detect expired entries', () => {
                const shortTtlCache = new ParseCache({ ttl: 1 });
                shortTtlCache.set(testInput, testOptions, testResult);
                
                return new Promise(resolve => {
                    setTimeout(() => {
                        const validation = shortTtlCache.validateIntegrity();
                        
                        expect(validation.issues.length).toBeGreaterThan(0);
                        expect(validation.issues[0]).toContain('expired');
                        resolve(undefined);
                    }, 10);
                });
            });
        });

        describe('preload', () => {
            it('should preload common patterns', () => {
                const patterns = [
                    {
                        input: '2023-01-01T12:00:00Z',
                        options: { timeZone: 'UTC' },
                        result: Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                        strategy: 'string' as ParseStrategyType
                    },
                    {
                        input: '2023-01-02T12:00:00Z',
                        options: { timeZone: 'UTC' },
                        result: Temporal.ZonedDateTime.from('2023-01-02T12:00:00[UTC]'),
                        strategy: 'string' as ParseStrategyType
                    }
                ];
                
                cache.preload(patterns);
                
                expect(cache.size()).toBe(2);
                
                const retrieved1 = cache.get(patterns[0].input, patterns[0].options);
                const retrieved2 = cache.get(patterns[1].input, patterns[1].options);
                
                expect(retrieved1).toBeDefined();
                expect(retrieved2).toBeDefined();
                expect(retrieved1!.metadata.preloaded).toBe(true);
                expect(retrieved2!.metadata.preloaded).toBe(true);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle null and undefined inputs', () => {
            const nullResult = createParseResult(
                Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                'fallback',
                1
            );
            
            expect(() => cache.set(null, testOptions, nullResult)).not.toThrow();
            expect(() => cache.set(undefined, testOptions, nullResult)).not.toThrow();
            expect(() => cache.get(null, testOptions)).not.toThrow();
            expect(() => cache.get(undefined, testOptions)).not.toThrow();
        });

        it('should handle very large inputs', () => {
            const largeInput = 'a'.repeat(10000);
            
            expect(() => cache.set(largeInput, testOptions, testResult)).not.toThrow();
            expect(() => cache.get(largeInput, testOptions)).not.toThrow();
        });

        it('should handle circular references in input', () => {
            const circular: any = { prop: null };
            circular.prop = circular;
            
            expect(() => cache.set(circular, testOptions, testResult)).not.toThrow();
        });

        it('should handle disabled cache gracefully', () => {
            const disabledCache = new ParseCache({ enabled: false });
            
            expect(disabledCache.get(testInput, testOptions)).toBeUndefined();
            expect(disabledCache.has(testInput, testOptions)).toBe(false);
            expect(disabledCache.delete(testInput, testOptions)).toBe(false);
            expect(() => disabledCache.set(testInput, testOptions, testResult)).not.toThrow();
        });

        it('should handle cache operations with disabled metrics', () => {
            const noMetricsCache = new ParseCache({ enableMetrics: false });
            
            noMetricsCache.set(testInput, testOptions, testResult);
            noMetricsCache.get(testInput, testOptions);
            noMetricsCache.get('non-existent', testOptions);
            
            const stats = noMetricsCache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });
    });

    describe('Performance and Memory', () => {
        it('should handle large number of entries efficiently', () => {
            const startTime = performance.now();
            
            // Add many entries
            for (let i = 0; i < 1000; i++) {
                const result = createParseResult(
                    Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                    'string',
                    1
                );
                cache.set(`input-${i}`, testOptions, result);
            }
            
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(1000); // Should complete in reasonable time
            expect(cache.size()).toBe(1000);
        });

        it('should estimate memory usage reasonably', () => {
            cache.set(testInput, testOptions, testResult);
            
            const stats = cache.getStats();
            expect(stats.memoryUsage).toBeGreaterThan(0);
            expect(stats.memoryUsage).toBeLessThan(10000); // Should be reasonable for one entry
        });

        it('should handle LRU eviction when cache is full', () => {
            const smallCache = new ParseCache({ maxSize: 3 });
            
            // Fill cache beyond capacity
            for (let i = 0; i < 5; i++) {
                const result = createParseResult(
                    Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]'),
                    'string',
                    1
                );
                smallCache.set(`input-${i}`, testOptions, result);
            }
            
            expect(smallCache.size()).toBeLessThanOrEqual(3);
            
            // First entries should be evicted
            expect(smallCache.has('input-0', testOptions)).toBe(false);
            expect(smallCache.has('input-1', testOptions)).toBe(false);
            
            // Last entries should remain
            expect(smallCache.has('input-4', testOptions)).toBe(true);
        });
    });
});