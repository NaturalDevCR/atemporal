/**
 * @file Comprehensive tests for formatting-cache module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import { FormattingCache } from '../../../core/formatting/formatting-cache';
import { ResizableLRUCache } from '../../../core/caching/lru-cache';

// Mock dependencies
jest.mock('../../../core/caching/lru-cache');

const MockedResizableLRUCache = ResizableLRUCache as jest.MockedClass<typeof ResizableLRUCache>;

describe('FormattingCache', () => {
    let mockLRUCache: jest.Mocked<ResizableLRUCache<string, any>>;
    let testDate: Temporal.ZonedDateTime;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create mock LRU cache instance
        mockLRUCache = {
            get: jest.fn(),
            set: jest.fn(),
            has: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            setMaxSize: jest.fn(),
            getMetrics: jest.fn().mockReturnValue({
                size: 0,
                maxSize: 1000,
                hits: 0,
                misses: 0
            })
        } as any;
        
        // Mock constructor to return our mock instance
        MockedResizableLRUCache.mockImplementation(() => mockLRUCache);
        
        // Reset the static cache by accessing the private property
        (FormattingCache as any).cache = mockLRUCache;
        
        // Reset static stats
        (FormattingCache as any).stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0
        };
        
        // Create test date
        testDate = Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]');
    });

    afterEach(() => {
        FormattingCache.clear();
    });

    describe('get', () => {
        it('should return cached value and increment hits', () => {
            const key = 'test-key';
            const result = 'formatted-result';
            const entry = {
                result,
                timestamp: Date.now(),
                dateKey: '2023-1-1-12-0-0-0-UTC'
            };
            
            mockLRUCache.get.mockReturnValue(entry);
            
            const cachedResult = FormattingCache.get(key, testDate);
            
            expect(cachedResult).toBe(result);
            expect(mockLRUCache.get).toHaveBeenCalledWith(key);
        });

        it('should return null and increment misses when not found', () => {
            const key = 'missing-key';
            mockLRUCache.get.mockReturnValue(undefined);
            
            const result = FormattingCache.get(key, testDate);
            
            expect(result).toBeNull();
            expect(mockLRUCache.get).toHaveBeenCalledWith(key);
        });

        it('should return null when date key does not match', () => {
            const key = 'test-key';
            const entry = {
                result: 'formatted-result',
                timestamp: Date.now(),
                dateKey: 'different-date-key'
            };
            
            mockLRUCache.get.mockReturnValue(entry);
            
            const result = FormattingCache.get(key, testDate);
            
            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should set value and increment sets counter', () => {
            const key = 'test-key';
            const result = 'formatted-result';
            
            FormattingCache.set(key, testDate, result);
            
            expect(mockLRUCache.set).toHaveBeenCalledWith(key, expect.objectContaining({
                result,
                dateKey: expect.any(String),
                timestamp: expect.any(Number)
            }));
        });
    });

    describe('has', () => {
        it('should return true when key exists with matching date', () => {
            const key = 'existing-key';
            const entry = {
                result: 'formatted-result',
                timestamp: Date.now(),
                dateKey: '2023-1-1-12-0-0-0-UTC'
            };
            
            mockLRUCache.get.mockReturnValue(entry);
            
            const result = FormattingCache.has(key, testDate);
            
            expect(result).toBe(true);
        });

        it('should return false when key does not exist', () => {
            const key = 'missing-key';
            mockLRUCache.get.mockReturnValue(undefined);
            
            const result = FormattingCache.has(key, testDate);
            
            expect(result).toBe(false);
        });

        it('should return false when date key does not match', () => {
            const key = 'test-key';
            const entry = {
                result: 'formatted-result',
                timestamp: Date.now(),
                dateKey: 'different-date-key'
            };
            
            mockLRUCache.get.mockReturnValue(entry);
            
            const result = FormattingCache.has(key, testDate);
            
            expect(result).toBe(false);
        });
    });

    describe('delete', () => {
        it('should delete key and return true when key exists', () => {
            const key = 'existing-key';
            mockLRUCache.delete.mockReturnValue(true);
            
            const result = FormattingCache.delete(key);
            
            expect(result).toBe(true);
            expect(mockLRUCache.delete).toHaveBeenCalledWith(key);
        });

        it('should return false when key does not exist', () => {
            const key = 'missing-key';
            mockLRUCache.delete.mockReturnValue(false);
            
            const result = FormattingCache.delete(key);
            
            expect(result).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear cache and reset stats', () => {
            FormattingCache.clear();
            
            expect(mockLRUCache.clear).toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', () => {
            const stats = FormattingCache.getStats();
            
            expect(stats).toHaveProperty('size');
            expect(stats).toHaveProperty('maxSize');
            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('misses');
            expect(stats).toHaveProperty('sets');
            expect(stats).toHaveProperty('hitRatio');
            expect(stats).toHaveProperty('efficiency');
        });
    });

    describe('getDetailedStats', () => {
        it('should return detailed cache information', () => {
            const stats = FormattingCache.getDetailedStats();
            
            expect(stats).toHaveProperty('memoryUsage');
            expect(stats).toHaveProperty('averageEntryAge');
            expect(stats).toHaveProperty('cacheMetrics');
            expect(stats).toHaveProperty('performance');
        });
    });

    describe('setMaxSize and getMaxSize', () => {
        it('should set and get maximum cache size', () => {
            const newSize = 500;
            
            FormattingCache.setMaxSize(newSize);
            
            expect(mockLRUCache.setMaxSize).toHaveBeenCalledWith(newSize);
        });

        it('should get current maximum cache size', () => {
            FormattingCache.getMaxSize();
            
            expect(mockLRUCache.getMetrics).toHaveBeenCalled();
        });
    });

    describe('optimize', () => {
        it('should not throw when optimizing', () => {
            expect(() => FormattingCache.optimize()).not.toThrow();
        });
    });

    describe('validateCache', () => {
        it('should return validation result', () => {
            const validation = FormattingCache.validateCache();
            
            expect(validation).toHaveProperty('isValid');
            expect(validation).toHaveProperty('errors');
            expect(validation).toHaveProperty('warnings');
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle null/undefined cache entries', () => {
            mockLRUCache.get.mockReturnValue(null);
            
            const result = FormattingCache.get('test-key', testDate);
            
            expect(result).toBeNull();
        });

        it('should handle malformed cache entries', () => {
            mockLRUCache.get.mockReturnValue({ invalid: 'entry' });
            
            const result = FormattingCache.get('test-key', testDate);
            
            expect(result).toBeNull();
        });

        it('should handle different timezone dates', () => {
            const utcDate = Temporal.ZonedDateTime.from('2023-01-01T12:00:00[UTC]');
            const nyDate = Temporal.ZonedDateTime.from('2023-01-01T12:00:00[America/New_York]');
            
            const key = 'timezone-test';
            const result = 'formatted-result';
            
            FormattingCache.set(key, utcDate, result);
            
            // Should not find entry for different timezone
            const found = FormattingCache.has(key, nyDate);
            expect(found).toBe(false);
        });
    });

    describe('performance characteristics', () => {
        it('should handle rapid cache operations', () => {
            const operations: (() => void)[] = [];
            
            for (let i = 0; i < 100; i++) {
                const key = `rapid${i}`;
                const result = `value${i}`;
                operations.push(() => FormattingCache.set(key, testDate, result));
                operations.push(() => FormattingCache.get(key, testDate));
                operations.push(() => FormattingCache.has(key, testDate));
            }
            
            expect(() => {
                operations.forEach(op => op());
            }).not.toThrow();
        });

        it('should handle large cache operations', () => {
            for (let i = 0; i < 1000; i++) {
                FormattingCache.set(`key${i}`, testDate, `value${i}`);
                FormattingCache.get(`key${i % 100}`, testDate);
            }
            
            expect(() => FormattingCache.getStats()).not.toThrow();
        });
    });
});