import { RegexCache } from '../RegexCache';

// Mock the LRUCache class
jest.mock('../TemporalUtils', () => {
  return {
    LRUCache: class MockLRUCache<K, V> {
      private maxSize: number;
      private cache: Map<K, V>;
      
      constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.cache = new Map<K, V>();
      }
      
      get(key: K): V | undefined {
        return this.cache.get(key);
      }
      
      set(key: K, value: V): void {
        this.cache.set(key, value);
      }
      
      clear(): void {
        this.cache.clear();
      }
      
      get size(): number {
        return this.cache.size;
      }
    }
  };
});

describe('RegexCache', () => {
  // Reset the cache before each test to ensure isolation
  beforeEach(() => {
    RegexCache.clear();
  });

  describe('getPrecompiled', () => {
    it('should return precompiled regex patterns', () => {
      const tokenRegex = RegexCache.getPrecompiled('tokenRegex');
      expect(tokenRegex).toBeInstanceOf(RegExp);
      
      const isoUtcRegex = RegexCache.getPrecompiled('isoUtcRegex');
      expect(isoUtcRegex).toBeInstanceOf(RegExp);
      
      const customFormatTokenRegex = RegexCache.getPrecompiled('customFormatTokenRegex');
      expect(customFormatTokenRegex).toBeInstanceOf(RegExp);
    });

    it('should return undefined for non-existent patterns', () => {
      const nonExistentRegex = RegexCache.getPrecompiled('nonExistentPattern');
      expect(nonExistentRegex).toBeUndefined();
    });
  });

  describe('getDynamic', () => {
    it('should create and cache a new regex', () => {
      const pattern = '\\d{4}';
      const regex = RegexCache.getDynamic(pattern);
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.source).toBe(pattern);
      
      // Should return the same instance on second call
      const cachedRegex = RegexCache.getDynamic(pattern);
      expect(cachedRegex).toBe(regex);
    });

    it('should handle regex flags', () => {
      const pattern = 'abc';
      const regex = RegexCache.getDynamic(pattern, 'i');
      expect(regex.flags).toBe('i');
      
      // Different flags should create different instances
      const regexWithDifferentFlags = RegexCache.getDynamic(pattern, 'g');
      expect(regexWithDifferentFlags).not.toBe(regex);
    });
  });

  describe('clear', () => {
    it('should clear the dynamic regex cache', () => {
      // Add some items to the cache
      const regex1 = RegexCache.getDynamic('pattern1');
      const regex2 = RegexCache.getDynamic('pattern2');
      
      // Clear the cache
      RegexCache.clear();
      
      // Should create new instances after clearing
      const newRegex1 = RegexCache.getDynamic('pattern1');
      expect(newRegex1).not.toBe(regex1);
    });
  });

  describe('setMaxCacheSize', () => {
    it('should update the cache size', () => {
      // Set a small cache size
      RegexCache.setMaxCacheSize(2);
      
      // Add items to fill the cache
      RegexCache.getDynamic('pattern1');
      RegexCache.getDynamic('pattern2');
      
      // This should cause the first pattern to be evicted
      RegexCache.getDynamic('pattern3');
      
      // First pattern should be recreated (not from cache)
      const originalRegex = RegexCache.getDynamic('pattern1');
      const cachedRegex = RegexCache.getDynamic('pattern1');
      
      // Should be the same instance after caching again
      expect(cachedRegex).toBe(originalRegex);
    });

    it('should throw an error for invalid cache sizes', () => {
      expect(() => RegexCache.setMaxCacheSize(0)).toThrow('Cache size must be at least 1');
      expect(() => RegexCache.setMaxCacheSize(-1)).toThrow('Cache size must be at least 1');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      // Add some dynamic patterns
      RegexCache.getDynamic('pattern1');
      RegexCache.getDynamic('pattern2');
      
      const stats = RegexCache.getStats();
      
      expect(stats).toHaveProperty('precompiled');
      expect(stats).toHaveProperty('dynamic');
      expect(stats).toHaveProperty('maxSize');
      
      expect(stats.precompiled).toBeGreaterThan(0); // Should have precompiled patterns
      expect(stats.dynamic).toBe(2); // We added 2 dynamic patterns
    });
  });
});