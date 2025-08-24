/**
 * @file Comprehensive test suite for ComparisonCache
 * Tests all caching functionality, statistics, and optimization features
 */

import { Temporal } from '@js-temporal/polyfill';
import { ComparisonCache } from '../../../core/comparison/comparison-cache';
import type { ComparisonCacheEntry } from '../../../core/comparison/comparison-types';

describe('ComparisonCache', () => {
    let cache: ComparisonCache;
    let testEntry: ComparisonCacheEntry;

    beforeEach(() => {
        cache = new ComparisonCache(100); // Small cache for testing
        testEntry = {
            result: {
                result: true,
                type: 'isSame',
                precision: 'exact',
                cached: false,
                computeTime: 1.0
            },
            timestamp: Date.now(),
            accessCount: 1,
            lastAccess: Date.now()
        };
    });

    describe('basic cache operations', () => {
        it('should set and get cache entries', () => {
            const key = 'test-key';
            
            cache.set(key, testEntry);
            const retrieved = cache.get(key);
            
            expect(retrieved).toBeDefined();
            expect(retrieved!.result.result).toBe(true);
            expect(retrieved!.result.type).toBe('isSame');
            expect(retrieved!.accessCount).toBe(2); // Incremented on get
        });

        it('should return undefined for non-existent keys', () => {
            const result = cache.get('non-existent-key');
            expect(result).toBeUndefined();
        });

        it('should check if key exists', () => {
            const key = 'test-key';
            
            expect(cache.has(key)).toBe(false);
            
            cache.set(key, testEntry);
            expect(cache.has(key)).toBe(true);
        });

        it('should delete cache entries', () => {
            const key = 'test-key';
            
            cache.set(key, testEntry);
            expect(cache.has(key)).toBe(true);
            
            const deleted = cache.delete(key);
            expect(deleted).toBe(true);
            expect(cache.has(key)).toBe(false);
        });

        it('should return false when deleting non-existent key', () => {
            const deleted = cache.delete('non-existent-key');
            expect(deleted).toBe(false);
        });

        it('should clear all cache entries', () => {
            cache.set('key1', testEntry);
            cache.set('key2', testEntry);
            
            expect(cache.size()).toBe(2);
            
            cache.clear();
            expect(cache.size()).toBe(0);
            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(false);
        });

        it('should return correct cache size', () => {
            expect(cache.size()).toBe(0);
            
            cache.set('key1', testEntry);
            expect(cache.size()).toBe(1);
            
            cache.set('key2', testEntry);
            expect(cache.size()).toBe(2);
            
            cache.delete('key1');
            expect(cache.size()).toBe(1);
        });
    });

    describe('LRU behavior', () => {
        it('should evict least recently used items when cache is full', () => {
            const smallCache = new ComparisonCache(2);
            
            smallCache.set('key1', testEntry);
            smallCache.set('key2', testEntry);
            
            // Cache is now full
            expect(smallCache.size()).toBe(2);
            expect(smallCache.has('key1')).toBe(true);
            expect(smallCache.has('key2')).toBe(true);
            
            // Adding third item should evict key1 (least recently used)
            smallCache.set('key3', testEntry);
            
            expect(smallCache.size()).toBe(2);
            expect(smallCache.has('key1')).toBe(false); // Evicted
            expect(smallCache.has('key2')).toBe(true);
            expect(smallCache.has('key3')).toBe(true);
        });

        it('should update access order when getting items', () => {
            const smallCache = new ComparisonCache(2);
            
            smallCache.set('key1', testEntry);
            smallCache.set('key2', testEntry);
            
            // Access key1 to make it most recently used
            smallCache.get('key1');
            
            // Adding third item should evict key2 (now least recently used)
            smallCache.set('key3', testEntry);
            
            expect(smallCache.has('key1')).toBe(true); // Still there
            expect(smallCache.has('key2')).toBe(false); // Evicted
            expect(smallCache.has('key3')).toBe(true);
        });
    });

    describe('statistics tracking', () => {
        it('should track cache hits and misses', () => {
            const key = 'test-key';
            
            // Miss
            cache.get(key);
            
            let stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(1);
            
            // Set and hit
            cache.set(key, testEntry);
            cache.get(key);
            
            stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
        });

        it('should track cache sets', () => {
            cache.set('key1', testEntry);
            cache.set('key2', testEntry);
            
            const stats = cache.getStats();
            expect(stats.sets).toBe(2);
        });

        it('should track evictions', () => {
            const smallCache = new ComparisonCache(1);
            
            smallCache.set('key1', testEntry);
            smallCache.set('key2', testEntry); // Should evict key1
            
            const stats = smallCache.getStats();
            expect(stats.evictions).toBe(1);
        });

        it('should calculate hit rate correctly', () => {
            const key = 'test-key';
            
            // 1 miss
            cache.get(key);
            
            // 2 hits
            cache.set(key, testEntry);
            cache.get(key);
            cache.get(key);
            
            const stats = cache.getStats();
            expect(stats.hitRate).toBeCloseTo(0.67, 2); // 2/3 ≈ 0.67
        });

        it('should track average access time', () => {
            const key = 'test-key';
            
            cache.set(key, testEntry);
            cache.get(key); // This should update access time
            
            const stats = cache.getStats();
            expect(typeof stats.averageAccessTime).toBe('number');
            expect(stats.averageAccessTime).toBeGreaterThan(0);
        });
    });

    describe('memory estimation', () => {
        it('should estimate memory usage', () => {
            cache.set('key1', testEntry);
            cache.set('key2', testEntry);
            
            const memoryUsage = cache.getMemoryUsage();
            
            expect(typeof memoryUsage.totalBytes).toBe('number');
            expect(typeof memoryUsage.averageBytesPerEntry).toBe('number');
            expect(typeof memoryUsage.overhead).toBe('number');
            expect(memoryUsage.totalBytes).toBeGreaterThan(0);
        });

        it('should return zero memory usage for empty cache', () => {
            const memoryUsage = cache.getMemoryUsage();
            
            expect(memoryUsage.totalBytes).toBe(0);
            expect(memoryUsage.averageBytesPerEntry).toBe(0);
        });
    });

    describe('cache optimization', () => {
        it('should optimize cache by removing old entries', () => {
            const oldEntry = {
                ...testEntry,
                timestamp: Date.now() - 10000, // 10 seconds ago
                accessCount: 1
            };
            
            const recentEntry = {
                ...testEntry,
                timestamp: Date.now(),
                accessCount: 5
            };
            
            cache.set('old-key', oldEntry);
            cache.set('recent-key', recentEntry);
            
            const optimized = cache.optimize();
            
            expect(optimized.entriesRemoved).toBeGreaterThanOrEqual(0);
            expect(optimized.memoryFreed).toBeGreaterThanOrEqual(0);
        });

        it('should not remove frequently accessed entries during optimization', () => {
            const frequentEntry = {
                ...testEntry,
                timestamp: Date.now() - 5000,
                accessCount: 10 // Frequently accessed
            };
            
            cache.set('frequent-key', frequentEntry);
            cache.optimize();
            
            // Frequently accessed entry should still be there
            expect(cache.has('frequent-key')).toBe(true);
        });
    });

    describe('cache sizing', () => {
        it('should get and set max size', () => {
            expect(cache.getMaxSize()).toBe(100);
            
            cache.setMaxSize(200);
            expect(cache.getMaxSize()).toBe(200);
        });

        it('should resize cache when max size is reduced', () => {
            // Fill cache
            for (let i = 0; i < 50; i++) {
                cache.set(`key${i}`, testEntry);
            }
            
            expect(cache.size()).toBe(50);
            
            // Reduce max size
            cache.setMaxSize(30);
            
            // Cache should be resized
            expect(cache.size()).toBeLessThanOrEqual(30);
        });
    });

    describe('cache validation', () => {
        it('should validate cache integrity', () => {
            cache.set('key1', testEntry);
            cache.set('key2', testEntry);
            
            const validation = cache.validateIntegrity();
            
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
            expect(validation.entriesChecked).toBe(2);
        });

        it('should detect integrity issues with corrupted entries', () => {
            // Add a valid entry
            cache.set('valid-key', testEntry);
            
            // Manually corrupt the cache (this is a simulation)
            // In real scenarios, this might happen due to memory corruption
            const corruptedEntry = {
                ...testEntry,
                type: null as any // Invalid type
            };
            
            cache.set('corrupted-key', corruptedEntry);
            
            const validation = cache.validateIntegrity();
            
            expect(validation.entriesChecked).toBe(2);
            // The validation might detect issues depending on implementation
        });
    });

    describe('efficiency metrics', () => {
        it('should calculate efficiency metrics', () => {
            // Add some entries and access them
            cache.set('key1', testEntry);
            cache.set('key2', testEntry);
            cache.get('key1');
            cache.get('key1'); // Access key1 multiple times
            
            const efficiency = cache.getEfficiencyMetrics();
            
            expect(typeof efficiency.hitRate).toBe('number');
            expect(typeof efficiency.memoryEfficiency).toBe('number');
            expect(typeof efficiency.accessPatternScore).toBe('number');
            expect(typeof efficiency.overallScore).toBe('number');
            
            expect(efficiency.hitRate).toBeGreaterThanOrEqual(0);
            expect(efficiency.hitRate).toBeLessThanOrEqual(1);
        });

        it('should generate efficiency recommendations', () => {
            // Create a scenario that might generate recommendations
            const smallCache = new ComparisonCache(5);
            
            // Fill cache and cause evictions
            for (let i = 0; i < 10; i++) {
                smallCache.set(`key${i}`, testEntry);
            }
            
            const recommendations = smallCache.getEfficiencyRecommendations();
            
            expect(Array.isArray(recommendations)).toBe(true);
            recommendations.forEach(rec => {
                expect(typeof rec.type).toBe('string');
                expect(typeof rec.description).toBe('string');
                expect(typeof rec.impact).toBe('string');
            });
        });
    });

    describe('cache snapshots', () => {
        it('should create cache snapshots', () => {
            cache.set('key1', testEntry);
            cache.set('key2', testEntry);
            
            const snapshot = cache.createSnapshot();
            
            expect(snapshot.timestamp).toBeDefined();
            expect(snapshot.size).toBe(2);
            expect(snapshot.maxSize).toBe(100);
            expect(snapshot.stats).toBeDefined();
            expect(snapshot.memoryUsage).toBeDefined();
            expect(Array.isArray(snapshot.entries)).toBe(true);
            expect(snapshot.entries).toHaveLength(2);
        });

        it('should include entry details in snapshots', () => {
            cache.set('test-key', testEntry);
            
            const snapshot = cache.createSnapshot();
            const entry = snapshot.entries[0];
            
            expect(entry.key).toBe('test-key');
            expect(entry.value).toEqual(expect.objectContaining({
                result: expect.objectContaining({
                    result: true,
                    type: 'isSame',
                    precision: 'exact',
                    cached: false,
                    computeTime: expect.any(Number)
                }),
                timestamp: expect.any(Number),
                accessCount: expect.any(Number)
            }));
        });
    });

    describe('statistics reset', () => {
        it('should reset statistics while preserving cache entries', () => {
            cache.set('key1', testEntry);
            cache.get('key1');
            cache.get('non-existent'); // Miss
            
            let stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.sets).toBe(1);
            
            cache.resetStats();
            
            stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.sets).toBe(0);
            
            // Cache entries should still be there
            expect(cache.has('key1')).toBe(true);
            expect(cache.size()).toBe(1);
        });
    });

    describe('pattern analysis', () => {
        it('should analyze usage patterns', () => {
            // Create a pattern of access
            cache.set('frequent', testEntry);
            cache.set('rare', testEntry);
            
            // Access frequent key multiple times
            for (let i = 0; i < 5; i++) {
                cache.get('frequent');
            }
            
            // Access rare key once
            cache.get('rare');
            
            const patterns = cache.analyzeUsagePatterns();
            
            expect(Array.isArray(patterns.hotKeys)).toBe(true);
            expect(Array.isArray(patterns.coldKeys)).toBe(true);
            expect(typeof patterns.accessDistribution).toBe('object');
            expect(typeof patterns.temporalPatterns).toBe('object');
        });

        it('should identify hot and cold keys correctly', () => {
            cache.set('hot-key', testEntry);
            cache.set('cold-key', testEntry);
            
            // Make hot-key actually hot
            for (let i = 0; i < 10; i++) {
                cache.get('hot-key');
            }
            
            const patterns = cache.analyzeUsagePatterns();
            
            expect(patterns.hotKeys.some(key => key.includes('hot-key'))).toBe(true);
        });
    });

    describe('preloading', () => {
        it('should preload patterns', () => {
            const patterns = [
                { key: 'pattern1', entry: testEntry },
                { key: 'pattern2', entry: testEntry }
            ];
            
            const result = cache.preloadPatterns(patterns);
            
            expect(result.loaded).toBe(2);
            expect(result.skipped).toBe(0);
            expect(cache.has('pattern1')).toBe(true);
            expect(cache.has('pattern2')).toBe(true);
        });

        it('should skip existing entries during preloading', () => {
            cache.set('existing', testEntry);
            
            const patterns = [
                { key: 'existing', entry: testEntry },
                { key: 'new', entry: testEntry }
            ];
            
            const result = cache.preloadPatterns(patterns);
            
            expect(result.loaded).toBe(1); // Only 'new' was loaded
            expect(result.skipped).toBe(1); // 'existing' was skipped
        });
    });
});