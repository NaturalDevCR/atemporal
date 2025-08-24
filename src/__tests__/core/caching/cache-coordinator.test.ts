/**
 * @file Tests for GlobalCacheCoordinator
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GlobalCacheCoordinator, RegisterableCache } from '../../../core/caching/cache-coordinator';
import { IntlCache } from '../../../core/caching/intl-cache';
import { DiffCache } from '../../../core/caching/diff-cache';
import type { CacheMetrics } from '../../../core/caching/lru-cache';

// Mock the cache modules
jest.mock('../../../core/caching/intl-cache');
jest.mock('../../../core/caching/diff-cache');

const MockedIntlCache = IntlCache as any;
const MockedDiffCache = DiffCache as any;

// Mock cache implementation for testing
class MockCache implements RegisterableCache {
    private cleared = false;
    private optimized = false;
    private stats = {
        size: 10,
        hits: 80,
        misses: 20,
        hitRatio: 0.8
    };
    private metrics: CacheMetrics = {
        size: 10,
        maxSize: 50,
        hits: 80,
        misses: 20,
        hitRatio: 0.8,
        utilization: 0.2
    };

    clear(): void {
        this.cleared = true;
        this.stats.size = 0;
        this.metrics.size = 0;
    }

    getStats(): any {
        return { ...this.stats };
    }

    getMetrics(): CacheMetrics {
        return { ...this.metrics };
    }

    optimize(): void {
        this.optimized = true;
    }

    // Test helpers
    wasCleared(): boolean {
        return this.cleared;
    }

    wasOptimized(): boolean {
        return this.optimized;
    }

    setStats(stats: Partial<typeof this.stats>): void {
        this.stats = { ...this.stats, ...stats };
    }

    setMetrics(metrics: Partial<CacheMetrics>): void {
        this.metrics = { ...this.metrics, ...metrics };
    }
}

// Failing cache for error testing
class FailingCache implements RegisterableCache {
    clear(): void {
        throw new Error('Clear failed');
    }

    getStats(): any {
        throw new Error('GetStats failed');
    }

    optimize(): void {
        throw new Error('Optimize failed');
    }
}

describe('GlobalCacheCoordinator', () => {
    let mockCache1: MockCache;
    let mockCache2: MockCache;
    let failingCache: FailingCache;
    let consoleSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup console spy
        consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        // Create mock caches
        mockCache1 = new MockCache();
        mockCache2 = new MockCache();
        failingCache = new FailingCache();
        
        // Setup IntlCache mocks
        MockedIntlCache.clearAll.mockImplementation(() => {});
        MockedIntlCache.optimize.mockImplementation(() => {});
        MockedIntlCache.setMaxCacheSize.mockImplementation(() => {});
        MockedIntlCache.setDynamicSizing.mockImplementation(() => {});
        MockedIntlCache.isDynamicSizingEnabled.mockReturnValue(true);
        MockedIntlCache.getStats.mockReturnValue({
            dateTimeFormat: 5,
            relativeTimeFormat: 3,
            numberFormat: 2,
            listFormat: 1,
            total: 11,
            maxSize: 200
        });
        MockedIntlCache.getDetailedStats.mockReturnValue({
            dateTimeFormat: { size: 5, hits: 40, misses: 10, hitRatio: 0.8, utilization: 0.1 },
            relativeTimeFormat: { size: 3, hits: 24, misses: 6, hitRatio: 0.8, utilization: 0.06 },
            numberFormat: { size: 2, hits: 16, misses: 4, hitRatio: 0.8, utilization: 0.04 },
            listFormat: { size: 1, hits: 8, misses: 2, hitRatio: 0.8, utilization: 0.02 }
        });
        MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
            totalCacheSize: 11,
            averageHitRatio: 0.8,
            memoryEfficiency: 0.85,
            recommendations: []
        });
        
        // Setup DiffCache mocks
        MockedDiffCache.clear.mockImplementation(() => {});
        MockedDiffCache.optimize.mockImplementation(() => {});
        MockedDiffCache.setMaxCacheSize.mockImplementation(() => {});
        MockedDiffCache.setDynamicSizing.mockImplementation(() => {});
        MockedDiffCache.isDynamicSizingEnabled.mockReturnValue(true);
        MockedDiffCache.getStats.mockReturnValue({
            diffCache: 8,
            maxSize: 100
        });
        MockedDiffCache.getDetailedStats.mockReturnValue({
            size: 8,
            hits: 64,
            misses: 16,
            hitRatio: 0.8,
            utilization: 0.08,
            efficiency: 85
        });
        MockedDiffCache.getEfficiencyMetrics.mockReturnValue({
            cacheSize: 8,
            hitRatio: 0.8,
            efficiency: 85,
            recommendations: []
        });
        
        // Clear any registered caches from previous tests
        const registeredNames = GlobalCacheCoordinator.getRegisteredCacheNames();
        registeredNames.forEach(name => {
            GlobalCacheCoordinator.unregisterCache(name);
        });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        
        // Clean up registered caches
        const registeredNames = GlobalCacheCoordinator.getRegisteredCacheNames();
        registeredNames.forEach(name => {
            GlobalCacheCoordinator.unregisterCache(name);
        });
    });

    describe('cache registration', () => {
        it('should register a cache', () => {
            GlobalCacheCoordinator.registerCache('test-cache', mockCache1);
            
            const registeredNames = GlobalCacheCoordinator.getRegisteredCacheNames();
            expect(registeredNames).toContain('test-cache');
        });

        it('should register multiple caches', () => {
            GlobalCacheCoordinator.registerCache('cache1', mockCache1);
            GlobalCacheCoordinator.registerCache('cache2', mockCache2);
            
            const registeredNames = GlobalCacheCoordinator.getRegisteredCacheNames();
            expect(registeredNames).toContain('cache1');
            expect(registeredNames).toContain('cache2');
            expect(registeredNames).toHaveLength(2);
        });

        it('should unregister a cache', () => {
            GlobalCacheCoordinator.registerCache('test-cache', mockCache1);
            
            const result = GlobalCacheCoordinator.unregisterCache('test-cache');
            expect(result).toBe(true);
            
            const registeredNames = GlobalCacheCoordinator.getRegisteredCacheNames();
            expect(registeredNames).not.toContain('test-cache');
        });

        it('should return false when unregistering non-existent cache', () => {
            const result = GlobalCacheCoordinator.unregisterCache('non-existent');
            expect(result).toBe(false);
        });

        it('should replace existing cache when registering with same name', () => {
            GlobalCacheCoordinator.registerCache('test-cache', mockCache1);
            GlobalCacheCoordinator.registerCache('test-cache', mockCache2);
            
            const registeredNames = GlobalCacheCoordinator.getRegisteredCacheNames();
            expect(registeredNames).toHaveLength(1);
            expect(registeredNames).toContain('test-cache');
        });

        it('should return empty array when no caches registered', () => {
            const registeredNames = GlobalCacheCoordinator.getRegisteredCacheNames();
            expect(registeredNames).toEqual([]);
        });
    });

    describe('clearAll', () => {
        it('should clear all core caches', () => {
            GlobalCacheCoordinator.clearAll();
            
            expect(MockedIntlCache.clearAll).toHaveBeenCalledTimes(1);
            expect(MockedDiffCache.clear).toHaveBeenCalledTimes(1);
        });

        it('should clear all registered caches', () => {
            GlobalCacheCoordinator.registerCache('cache1', mockCache1);
            GlobalCacheCoordinator.registerCache('cache2', mockCache2);
            
            GlobalCacheCoordinator.clearAll();
            
            expect(mockCache1.wasCleared()).toBe(true);
            expect(mockCache2.wasCleared()).toBe(true);
        });

        it('should handle cache clear failures gracefully', () => {
            GlobalCacheCoordinator.registerCache('failing-cache', failingCache);
            
            expect(() => {
                GlobalCacheCoordinator.clearAll();
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith('Failed to clear cache:', expect.any(Error));
        });

        it('should clear core caches even if plugin caches fail', () => {
            GlobalCacheCoordinator.registerCache('failing-cache', failingCache);
            
            GlobalCacheCoordinator.clearAll();
            
            expect(MockedIntlCache.clearAll).toHaveBeenCalledTimes(1);
            expect(MockedDiffCache.clear).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAllStats', () => {
        it('should return comprehensive stats from all caches', () => {
            GlobalCacheCoordinator.registerCache('test-cache', mockCache1);
            
            const stats = GlobalCacheCoordinator.getAllStats();
            
            expect(stats).toHaveProperty('intl');
            expect(stats).toHaveProperty('diff');
            expect(stats).toHaveProperty('plugins');
            expect(stats).toHaveProperty('total');
            
            expect(stats.intl.summary).toEqual({
                dateTimeFormat: 5,
                relativeTimeFormat: 3,
                numberFormat: 2,
                listFormat: 1,
                total: 11,
                maxSize: 200
            });
            
            expect(stats.diff.summary).toEqual({
                diffCache: 8,
                maxSize: 100
            });
            
            expect(stats.plugins['test-cache']).toEqual(mockCache1.getStats());
        });

        it('should calculate total stats correctly', () => {
            const stats = GlobalCacheCoordinator.getAllStats();
            
            expect(stats.total.cacheCount).toBe(19); // 11 + 8
            expect(stats.total.maxSize).toBe(300); // 200 + 100
            expect(stats.total.efficiency).toBe(80); // Weighted average
        });

        it('should handle plugin cache stats failures', () => {
            GlobalCacheCoordinator.registerCache('failing-cache', failingCache);
            
            const stats = GlobalCacheCoordinator.getAllStats();
            
            expect(stats.plugins['failing-cache']).toEqual({ error: 'Failed to get stats' });
        });

        it('should include multiple plugin caches', () => {
            mockCache1.setStats({ size: 5, hits: 40, misses: 10, hitRatio: 0.8 });
            mockCache2.setStats({ size: 3, hits: 24, misses: 6, hitRatio: 0.8 });
            
            GlobalCacheCoordinator.registerCache('cache1', mockCache1);
            GlobalCacheCoordinator.registerCache('cache2', mockCache2);
            
            const stats = GlobalCacheCoordinator.getAllStats();
            
            expect(stats.plugins['cache1']).toEqual(mockCache1.getStats());
            expect(stats.plugins['cache2']).toEqual(mockCache2.getStats());
        });
    });

    describe('optimizeAll', () => {
        it('should optimize all core caches', () => {
            GlobalCacheCoordinator.optimizeAll();
            
            expect(MockedIntlCache.optimize).toHaveBeenCalledTimes(1);
            expect(MockedDiffCache.optimize).toHaveBeenCalledTimes(1);
        });

        it('should optimize all registered caches', () => {
            GlobalCacheCoordinator.registerCache('cache1', mockCache1);
            GlobalCacheCoordinator.registerCache('cache2', mockCache2);
            
            GlobalCacheCoordinator.optimizeAll();
            
            expect(mockCache1.wasOptimized()).toBe(true);
            expect(mockCache2.wasOptimized()).toBe(true);
        });

        it('should handle cache optimization failures gracefully', () => {
            GlobalCacheCoordinator.registerCache('failing-cache', failingCache);
            
            expect(() => {
                GlobalCacheCoordinator.optimizeAll();
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith('Failed to optimize cache:', expect.any(Error));
        });

        it('should skip optimization for caches without optimize method', () => {
            const cacheWithoutOptimize: RegisterableCache = {
                clear: jest.fn(),
                getStats: jest.fn().mockReturnValue({})
            };
            
            GlobalCacheCoordinator.registerCache('no-optimize', cacheWithoutOptimize);
            
            expect(() => {
                GlobalCacheCoordinator.optimizeAll();
            }).not.toThrow();
        });

        it('should update last optimization timestamp', () => {
            const beforeOptimization = Date.now();
            GlobalCacheCoordinator.optimizeAll();
            
            // Check that optimization was recent (within last second)
            expect(GlobalCacheCoordinator.shouldOptimize()).toBe(false);
        });
    });

    describe('cache size management', () => {
        it('should set intl cache size', () => {
            GlobalCacheCoordinator.setMaxCacheSizes({ intl: 150 });
            
            expect(MockedIntlCache.setMaxCacheSize).toHaveBeenCalledWith(150);
        });

        it('should set diff cache size', () => {
            GlobalCacheCoordinator.setMaxCacheSizes({ diff: 75 });
            
            expect(MockedDiffCache.setMaxCacheSize).toHaveBeenCalledWith(75);
        });

        it('should set both cache sizes', () => {
            GlobalCacheCoordinator.setMaxCacheSizes({ intl: 150, diff: 75 });
            
            expect(MockedIntlCache.setMaxCacheSize).toHaveBeenCalledWith(150);
            expect(MockedDiffCache.setMaxCacheSize).toHaveBeenCalledWith(75);
        });

        it('should handle empty size configuration', () => {
            expect(() => {
                GlobalCacheCoordinator.setMaxCacheSizes({});
            }).not.toThrow();
            
            expect(MockedIntlCache.setMaxCacheSize).not.toHaveBeenCalled();
            expect(MockedDiffCache.setMaxCacheSize).not.toHaveBeenCalled();
        });

        it('should handle plugin sizes (placeholder functionality)', () => {
            expect(() => {
                GlobalCacheCoordinator.setMaxCacheSizes({
                    plugins: { 'test-cache': 50 }
                });
            }).not.toThrow();
        });
    });

    describe('dynamic sizing management', () => {
        it('should enable dynamic sizing for all caches', () => {
            GlobalCacheCoordinator.setDynamicSizing(true);
            
            expect(MockedIntlCache.setDynamicSizing).toHaveBeenCalledWith(true);
            expect(MockedDiffCache.setDynamicSizing).toHaveBeenCalledWith(true);
        });

        it('should disable dynamic sizing for all caches', () => {
            GlobalCacheCoordinator.setDynamicSizing(false);
            
            expect(MockedIntlCache.setDynamicSizing).toHaveBeenCalledWith(false);
            expect(MockedDiffCache.setDynamicSizing).toHaveBeenCalledWith(false);
        });

        it('should get dynamic sizing status', () => {
            MockedIntlCache.isDynamicSizingEnabled.mockReturnValue(true);
            MockedDiffCache.isDynamicSizingEnabled.mockReturnValue(false);
            
            const status = GlobalCacheCoordinator.getDynamicSizingStatus();
            
            expect(status).toEqual({
                intl: true,
                diff: false
            });
        });
    });

    describe('optimization interval management', () => {
        it('should set optimization interval', () => {
            expect(() => {
                GlobalCacheCoordinator.setOptimizationInterval(120000); // 2 minutes
            }).not.toThrow();
        });

        it('should reject intervals less than 60 seconds', () => {
            expect(() => {
                GlobalCacheCoordinator.setOptimizationInterval(30000); // 30 seconds
            }).toThrow('Optimization interval must be at least 60 seconds');
        });

        it('should accept exactly 60 seconds', () => {
            expect(() => {
                GlobalCacheCoordinator.setOptimizationInterval(60000); // 60 seconds
            }).not.toThrow();
        });
    });

    describe('optimization timing', () => {
        it('should indicate optimization is not needed immediately after optimization', () => {
            GlobalCacheCoordinator.optimizeAll();
            expect(GlobalCacheCoordinator.shouldOptimize()).toBe(false);
        });

        it('should indicate optimization is needed after interval', () => {
            // Set a very short interval for testing
            GlobalCacheCoordinator.setOptimizationInterval(60000); // 1 minute
            
            // Mock Date.now to simulate time passage
            const originalNow = Date.now;
            const baseTime = originalNow();
            
            // First optimization
            (Date.now as any) = jest.fn().mockReturnValue(baseTime);
            GlobalCacheCoordinator.optimizeAll();
            
            // Simulate time passage
            (Date.now as any) = jest.fn().mockReturnValue(baseTime + 61000); // 61 seconds later
            
            expect(GlobalCacheCoordinator.shouldOptimize()).toBe(true);
            
            // Restore original Date.now
            Date.now = originalNow;
        });

        it('should auto-optimize when interval has passed', () => {
            const optimizeSpy = jest.spyOn(GlobalCacheCoordinator, 'optimizeAll');
            
            // Set a very short interval
            GlobalCacheCoordinator.setOptimizationInterval(60000);
            
            // Mock time passage
            const originalNow = Date.now;
            const baseTime = originalNow();
            
            (Date.now as any) = jest.fn().mockReturnValue(baseTime);
            GlobalCacheCoordinator.optimizeAll();
            optimizeSpy.mockClear();
            
            (Date.now as any) = jest.fn().mockReturnValue(baseTime + 61000);
            GlobalCacheCoordinator.autoOptimize();
            
            expect(optimizeSpy).toHaveBeenCalledTimes(1);
            
            Date.now = originalNow;
            optimizeSpy.mockRestore();
        });

        it('should not auto-optimize when interval has not passed', () => {
            const optimizeSpy = jest.spyOn(GlobalCacheCoordinator, 'optimizeAll');
            
            GlobalCacheCoordinator.optimizeAll();
            optimizeSpy.mockClear();
            
            GlobalCacheCoordinator.autoOptimize();
            
            expect(optimizeSpy).not.toHaveBeenCalled();
            
            optimizeSpy.mockRestore();
        });
    });

    describe('memory usage analysis', () => {
        it('should calculate memory usage correctly', () => {
            GlobalCacheCoordinator.registerCache('cache1', mockCache1);
            GlobalCacheCoordinator.registerCache('cache2', mockCache2);
            
            const memoryUsage = GlobalCacheCoordinator.getMemoryUsage();
            
            expect(memoryUsage.totalCaches).toBe(4); // 2 core + 2 registered
            expect(memoryUsage.totalEntries).toBe(19); // 11 + 8 from mocked stats
            expect(memoryUsage.estimatedMemoryKB).toBe(19); // 1KB per entry
        });

        it('should provide recommendations for high memory usage', () => {
            // Mock high memory usage scenario
            MockedIntlCache.getStats.mockReturnValue({
                dateTimeFormat: 500,
                relativeTimeFormat: 300,
                numberFormat: 200,
                listFormat: 100,
                total: 1100,
                maxSize: 2000
            });
            
            const memoryUsage = GlobalCacheCoordinator.getMemoryUsage();
            
            expect(memoryUsage.recommendations).toContain(
                'Consider reducing cache sizes - high memory usage detected'
            );
        });

        it('should provide recommendations for low efficiency', () => {
            // Mock low efficiency scenario
            MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
                totalCacheSize: 11,
                averageHitRatio: 0.3, // Low hit ratio
                memoryEfficiency: 0.3,
                recommendations: []
            });
            
            MockedDiffCache.getEfficiencyMetrics.mockReturnValue({
                cacheSize: 8,
                hitRatio: 0.3, // Low hit ratio
                efficiency: 30,
                recommendations: []
            });
            
            const memoryUsage = GlobalCacheCoordinator.getMemoryUsage();
            
            expect(memoryUsage.recommendations).toContain(
                'Cache efficiency is low - consider optimization'
            );
        });

        it('should provide recommendations for many caches', () => {
            // Register many caches
            for (let i = 0; i < 10; i++) {
                GlobalCacheCoordinator.registerCache(`cache${i}`, new MockCache());
            }
            
            const memoryUsage = GlobalCacheCoordinator.getMemoryUsage();
            
            expect(memoryUsage.recommendations).toContain(
                'Many caches registered - consider consolidation'
            );
        });
    });

    describe('health report', () => {
        it('should generate excellent health report', () => {
            // Mock excellent performance
            MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
                totalCacheSize: 11,
                averageHitRatio: 0.9,
                memoryEfficiency: 0.9,
                recommendations: []
            });
            
            MockedDiffCache.getEfficiencyMetrics.mockReturnValue({
                cacheSize: 8,
                hitRatio: 0.9,
                efficiency: 90,
                recommendations: []
            });
            
            const healthReport = GlobalCacheCoordinator.getHealthReport();
            
            expect(healthReport.overall).toBe('excellent');
            expect(healthReport.efficiency).toBeGreaterThanOrEqual(85);
        });

        it('should generate good health report', () => {
            // Mock good performance
            MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
                totalCacheSize: 11,
                averageHitRatio: 0.75,
                memoryEfficiency: 0.75,
                recommendations: []
            });
            
            MockedDiffCache.getEfficiencyMetrics.mockReturnValue({
                cacheSize: 8,
                hitRatio: 0.75,
                efficiency: 75,
                recommendations: []
            });
            
            const healthReport = GlobalCacheCoordinator.getHealthReport();
            
            expect(healthReport.overall).toBe('good');
            expect(healthReport.efficiency).toBeGreaterThanOrEqual(70);
            expect(healthReport.efficiency).toBeLessThan(85);
        });

        it('should generate fair health report with recommendations', () => {
            // Mock fair performance
            MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
                totalCacheSize: 11,
                averageHitRatio: 0.6,
                memoryEfficiency: 0.6,
                recommendations: []
            });
            
            MockedDiffCache.getEfficiencyMetrics.mockReturnValue({
                cacheSize: 8,
                hitRatio: 0.6,
                efficiency: 60,
                recommendations: []
            });
            
            const healthReport = GlobalCacheCoordinator.getHealthReport();
            
            expect(healthReport.overall).toBe('fair');
            expect(healthReport.recommendations).toContain('Cache performance could be improved');
        });

        it('should generate poor health report with urgent recommendations', () => {
            // Mock poor performance
            MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
                totalCacheSize: 11,
                averageHitRatio: 0.3,
                memoryEfficiency: 0.3,
                recommendations: []
            });
            
            MockedDiffCache.getEfficiencyMetrics.mockReturnValue({
                cacheSize: 8,
                hitRatio: 0.3,
                efficiency: 30,
                recommendations: []
            });
            
            const healthReport = GlobalCacheCoordinator.getHealthReport();
            
            expect(healthReport.overall).toBe('poor');
            expect(healthReport.recommendations).toContain('Cache performance needs immediate attention');
        });

        it('should recommend optimization when overdue', () => {
            // Mock time passage to make optimization overdue
            const originalNow = Date.now;
            const baseTime = originalNow();
            
            (Date.now as any) = jest.fn().mockReturnValue(baseTime);
            GlobalCacheCoordinator.setOptimizationInterval(60000);
            GlobalCacheCoordinator.optimizeAll();
            
            (Date.now as any) = jest.fn().mockReturnValue(baseTime + 61000);
            
            const healthReport = GlobalCacheCoordinator.getHealthReport();
            
            expect(healthReport.recommendations).toContain(
                'Cache optimization is overdue - run optimizeAll()'
            );
            
            Date.now = originalNow;
        });

        it('should include last optimization timestamp', () => {
            const beforeOptimization = Date.now();
            GlobalCacheCoordinator.optimizeAll();
            
            const healthReport = GlobalCacheCoordinator.getHealthReport();
            
            expect(healthReport.lastOptimization).toBeInstanceOf(Date);
            expect(healthReport.lastOptimization.getTime()).toBeGreaterThanOrEqual(beforeOptimization);
        });
    });

    describe('reset functionality', () => {
        it('should reset all caches and timers', () => {
            GlobalCacheCoordinator.registerCache('test-cache', mockCache1);
            
            // Perform some operations
            GlobalCacheCoordinator.optimizeAll();
            
            // Reset
            GlobalCacheCoordinator.reset();
            
            // Verify core caches were cleared
            expect(MockedIntlCache.clearAll).toHaveBeenCalled();
            expect(MockedDiffCache.clear).toHaveBeenCalled();
            
            // Verify registered cache was cleared
            expect(mockCache1.wasCleared()).toBe(true);
        });

        it('should reset optimization timer', () => {
            // Set short interval and wait
            GlobalCacheCoordinator.setOptimizationInterval(60000);
            
            const originalNow = Date.now;
            const baseTime = originalNow();
            
            (Date.now as any) = jest.fn().mockReturnValue(baseTime);
            GlobalCacheCoordinator.optimizeAll();
            
            (Date.now as any) = jest.fn().mockReturnValue(baseTime + 61000);
            expect(GlobalCacheCoordinator.shouldOptimize()).toBe(true);
            
            // Reset should update the timer
            (Date.now as any) = jest.fn().mockReturnValue(baseTime + 61000);
            GlobalCacheCoordinator.reset();
            expect(GlobalCacheCoordinator.shouldOptimize()).toBe(false);
            
            Date.now = originalNow;
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle zero cache efficiency gracefully', () => {
            MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
                totalCacheSize: 0,
                averageHitRatio: 0,
                memoryEfficiency: 0,
                recommendations: []
            });
            
            MockedDiffCache.getEfficiencyMetrics.mockReturnValue({
                cacheSize: 0,
                hitRatio: 0,
                efficiency: 0,
                recommendations: []
            });
            
            expect(() => {
                const stats = GlobalCacheCoordinator.getAllStats();
                const healthReport = GlobalCacheCoordinator.getHealthReport();
                const memoryUsage = GlobalCacheCoordinator.getMemoryUsage();
            }).not.toThrow();
        });

        it('should handle missing efficiency metrics', () => {
            MockedIntlCache.getEfficiencyMetrics.mockReturnValue({
                totalCacheSize: undefined as any,
                averageHitRatio: undefined as any,
                memoryEfficiency: 0,
                recommendations: []
            });
            
            expect(() => {
                GlobalCacheCoordinator.getAllStats();
            }).not.toThrow();
        });

        it('should handle concurrent cache operations', () => {
            GlobalCacheCoordinator.registerCache('cache1', mockCache1);
            GlobalCacheCoordinator.registerCache('cache2', mockCache2);
            
            // Simulate concurrent operations
            expect(() => {
                GlobalCacheCoordinator.clearAll();
                GlobalCacheCoordinator.optimizeAll();
                GlobalCacheCoordinator.getAllStats();
                GlobalCacheCoordinator.getHealthReport();
            }).not.toThrow();
        });

        it('should maintain state consistency after errors', () => {
            GlobalCacheCoordinator.registerCache('failing-cache', failingCache);
            GlobalCacheCoordinator.registerCache('working-cache', mockCache1);
            
            // Operations should continue working despite one cache failing
            GlobalCacheCoordinator.clearAll();
            GlobalCacheCoordinator.optimizeAll();
            
            const stats = GlobalCacheCoordinator.getAllStats();
            expect(stats.plugins['working-cache']).toBeDefined();
            expect(stats.plugins['failing-cache']).toEqual({ error: 'Failed to get stats' });
        });
    });
});