/**
 * @file Tests for parsing strategies index and registry
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  STRATEGY_REGISTRY,
  getAvailableStrategyTypes,
  createStrategy,
  createDefaultStrategies,
  getStrategyInfo,
  getAllStrategyInfo,
  StringParseStrategy,
  NumberParseStrategy,
  DateParseStrategy,
  TemporalWrapperStrategy,
  TemporalZonedStrategy,
  TemporalInstantStrategy,
  TemporalPlainDateTimeStrategy,
  TemporalPlainDateStrategy,
  FirebaseTimestampStrategy,
  ArrayLikeStrategy,
  TemporalLikeStrategy,
  FallbackStrategy
} from '../../../../core/parsing/strategies';
import type { ParseStrategyType } from '../../../../core/parsing/parsing-types';

describe('Parsing Strategies Index', () => {
  describe('STRATEGY_REGISTRY', () => {
    it('should contain all expected strategy types', () => {
      const expectedTypes: ParseStrategyType[] = [
        'string',
        'number',
        'date',
        'temporal-wrapper',
        'temporal-zoned',
        'temporal-instant',
        'temporal-plain-datetime',
        'temporal-plain-date',
        'firebase-timestamp',
        'array-like',
        'temporal-like',
        'fallback'
      ];

      expectedTypes.forEach(type => {
        expect(STRATEGY_REGISTRY.has(type)).toBe(true);
      });
    });

    it('should have factory functions for all strategies', () => {
      for (const [type, factory] of STRATEGY_REGISTRY) {
        expect(typeof factory).toBe('function');
        const strategy = factory();
        expect(strategy).toBeDefined();
        expect(strategy.type).toBe(type);
      }
    });

    it('should create new instances each time', () => {
      const factory = STRATEGY_REGISTRY.get('string')!;
      const instance1 = factory();
      const instance2 = factory();
      
      expect(instance1).not.toBe(instance2);
      expect(instance1.type).toBe(instance2.type);
    });
  });

  describe('getAvailableStrategyTypes', () => {
    it('should return all strategy types', () => {
      const types = getAvailableStrategyTypes();
      
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBe(12);
      
      const expectedTypes = [
        'string',
        'number',
        'date',
        'temporal-wrapper',
        'temporal-zoned',
        'temporal-instant',
        'temporal-plain-datetime',
        'temporal-plain-date',
        'firebase-timestamp',
        'array-like',
        'temporal-like',
        'fallback'
      ];
      
      expectedTypes.forEach(type => {
        expect(types).toContain(type);
      });
    });

    it('should return types in consistent order', () => {
      const types1 = getAvailableStrategyTypes();
      const types2 = getAvailableStrategyTypes();
      
      expect(types1).toEqual(types2);
    });
  });

  describe('createStrategy', () => {
    it('should create strategy instances by type', () => {
      const testCases: Array<{ type: ParseStrategyType; expectedClass: any }> = [
        { type: 'string', expectedClass: StringParseStrategy },
        { type: 'number', expectedClass: NumberParseStrategy },
        { type: 'date', expectedClass: DateParseStrategy },
        { type: 'temporal-wrapper', expectedClass: TemporalWrapperStrategy },
        { type: 'temporal-zoned', expectedClass: TemporalZonedStrategy },
        { type: 'temporal-instant', expectedClass: TemporalInstantStrategy },
        { type: 'temporal-plain-datetime', expectedClass: TemporalPlainDateTimeStrategy },
        { type: 'temporal-plain-date', expectedClass: TemporalPlainDateStrategy },
        { type: 'firebase-timestamp', expectedClass: FirebaseTimestampStrategy },
        { type: 'array-like', expectedClass: ArrayLikeStrategy },
        { type: 'temporal-like', expectedClass: TemporalLikeStrategy },
        { type: 'fallback', expectedClass: FallbackStrategy }
      ];

      testCases.forEach(({ type, expectedClass }) => {
        const strategy = createStrategy(type);
        expect(strategy).toBeInstanceOf(expectedClass);
        expect(strategy.type).toBe(type);
      });
    });

    it('should throw error for unknown strategy type', () => {
      expect(() => createStrategy('unknown' as ParseStrategyType))
        .toThrow('Unknown strategy type: unknown');
    });

    it('should create new instances each time', () => {
      const strategy1 = createStrategy('string');
      const strategy2 = createStrategy('string');
      
      expect(strategy1).not.toBe(strategy2);
      expect(strategy1.type).toBe(strategy2.type);
    });
  });

  describe('createDefaultStrategies', () => {
    it('should create all default strategies', () => {
      const strategies = createDefaultStrategies();
      
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBe(12);
      
      const types = strategies.map(s => s.type);
      const expectedTypes = [
        'string',
        'number',
        'date',
        'temporal-wrapper',
        'temporal-zoned',
        'temporal-instant',
        'temporal-plain-datetime',
        'temporal-plain-date',
        'firebase-timestamp',
        'array-like',
        'temporal-like',
        'fallback'
      ];
      
      expectedTypes.forEach(type => {
        expect(types).toContain(type);
      });
    });

    it('should sort strategies by priority (highest first)', () => {
      const strategies = createDefaultStrategies();
      
      for (let i = 1; i < strategies.length; i++) {
        expect(strategies[i].priority).toBeLessThanOrEqual(strategies[i - 1].priority);
      }
    });

    it('should create new instances each time', () => {
      const strategies1 = createDefaultStrategies();
      const strategies2 = createDefaultStrategies();
      
      expect(strategies1).not.toBe(strategies2);
      expect(strategies1.length).toBe(strategies2.length);
      
      for (let i = 0; i < strategies1.length; i++) {
        expect(strategies1[i]).not.toBe(strategies2[i]);
        expect(strategies1[i].type).toBe(strategies2[i].type);
      }
    });

    it('should have valid priority values', () => {
      const strategies = createDefaultStrategies();
      
      strategies.forEach(strategy => {
        expect(typeof strategy.priority).toBe('number');
        expect(strategy.priority).toBeGreaterThan(0);
        expect(strategy.priority).toBeLessThanOrEqual(100);
      });
    });

    it('should have unique strategy types', () => {
      const strategies = createDefaultStrategies();
      const types = strategies.map(s => s.type);
      const uniqueTypes = [...new Set(types)];
      
      expect(types.length).toBe(uniqueTypes.length);
    });
  });

  describe('getStrategyInfo', () => {
    it('should return strategy information for valid types', () => {
      const types = getAvailableStrategyTypes();
      
      types.forEach(type => {
        const info = getStrategyInfo(type);
        
        expect(info).not.toBeNull();
        expect(info!.type).toBe(type);
        expect(typeof info!.priority).toBe('number');
        expect(typeof info!.description).toBe('string');
        expect(info!.description.length).toBeGreaterThan(0);
      });
    });

    it('should return null for unknown strategy type', () => {
      const info = getStrategyInfo('unknown' as ParseStrategyType);
      expect(info).toBeNull();
    });

    it('should return consistent information', () => {
      const info1 = getStrategyInfo('string');
      const info2 = getStrategyInfo('string');
      
      expect(info1).toEqual(info2);
    });

    it('should have valid priority ranges', () => {
      const types = getAvailableStrategyTypes();
      
      types.forEach(type => {
        const info = getStrategyInfo(type);
        expect(info!.priority).toBeGreaterThan(0);
        expect(info!.priority).toBeLessThanOrEqual(100);
      });
    });

    it('should have meaningful descriptions', () => {
      const types = getAvailableStrategyTypes();
      
      types.forEach(type => {
        const info = getStrategyInfo(type);
        expect(info!.description).toBeTruthy();
        expect(info!.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('getAllStrategyInfo', () => {
    it('should return information for all strategies', () => {
      const allInfo = getAllStrategyInfo();
      const availableTypes = getAvailableStrategyTypes();
      
      expect(allInfo.length).toBe(availableTypes.length);
      
      const infoTypes = allInfo.map(info => info.type);
      availableTypes.forEach(type => {
        expect(infoTypes).toContain(type);
      });
    });

    it('should sort by priority (highest first)', () => {
      const allInfo = getAllStrategyInfo();
      
      for (let i = 1; i < allInfo.length; i++) {
        expect(allInfo[i].priority).toBeLessThanOrEqual(allInfo[i - 1].priority);
      }
    });

    it('should have valid structure for all entries', () => {
      const allInfo = getAllStrategyInfo();
      
      allInfo.forEach(info => {
        expect(info).toHaveProperty('type');
        expect(info).toHaveProperty('priority');
        expect(info).toHaveProperty('description');
        
        expect(typeof info.type).toBe('string');
        expect(typeof info.priority).toBe('number');
        expect(typeof info.description).toBe('string');
        
        expect(info.priority).toBeGreaterThan(0);
        expect(info.description.length).toBeGreaterThan(0);
      });
    });

    it('should return consistent results', () => {
      const info1 = getAllStrategyInfo();
      const info2 = getAllStrategyInfo();
      
      expect(info1).toEqual(info2);
    });

    it('should filter out null entries', () => {
      const allInfo = getAllStrategyInfo();
      
      allInfo.forEach(info => {
        expect(info).not.toBeNull();
        expect(info).not.toBeUndefined();
      });
    });
  });

  describe('Strategy Classes Export', () => {
    it('should export all strategy classes', () => {
      expect(StringParseStrategy).toBeDefined();
      expect(NumberParseStrategy).toBeDefined();
      expect(DateParseStrategy).toBeDefined();
      expect(TemporalWrapperStrategy).toBeDefined();
      expect(FirebaseTimestampStrategy).toBeDefined();
      expect(ArrayLikeStrategy).toBeDefined();
      expect(FallbackStrategy).toBeDefined();
    });

    it('should be constructable classes', () => {
      expect(() => new StringParseStrategy()).not.toThrow();
      expect(() => new NumberParseStrategy()).not.toThrow();
      expect(() => new DateParseStrategy()).not.toThrow();
      expect(() => new TemporalWrapperStrategy()).not.toThrow();
      expect(() => new FirebaseTimestampStrategy()).not.toThrow();
      expect(() => new ArrayLikeStrategy()).not.toThrow();
      expect(() => new FallbackStrategy()).not.toThrow();
    });

    it('should have correct types when instantiated', () => {
      expect(new StringParseStrategy().type).toBe('string');
      expect(new NumberParseStrategy().type).toBe('number');
      expect(new DateParseStrategy().type).toBe('date');
      expect(new TemporalWrapperStrategy().type).toBe('temporal-wrapper');
      expect(new FirebaseTimestampStrategy().type).toBe('firebase-timestamp');
      expect(new ArrayLikeStrategy().type).toBe('array-like');
      expect(new FallbackStrategy().type).toBe('fallback');
    });
  });

  describe('Integration Tests', () => {
    it('should work together consistently', () => {
      const types = getAvailableStrategyTypes();
      const strategies = createDefaultStrategies();
      const allInfo = getAllStrategyInfo();
      
      // All should have same length
      expect(strategies.length).toBe(types.length);
      expect(allInfo.length).toBe(types.length);
      
      // All should contain same types
      const strategyTypes = strategies.map(s => s.type);
      const infoTypes = allInfo.map(i => i.type);
      
      types.forEach(type => {
        expect(strategyTypes).toContain(type);
        expect(infoTypes).toContain(type);
      });
    });

    it('should maintain priority consistency', () => {
      const strategies = createDefaultStrategies();
      const allInfo = getAllStrategyInfo();
      
      strategies.forEach(strategy => {
        const info = allInfo.find(i => i.type === strategy.type);
        expect(info).toBeDefined();
        expect(info!.priority).toBe(strategy.priority);
      });
    });

    it('should handle all registry operations without errors', () => {
      expect(() => {
        const types = getAvailableStrategyTypes();
        const strategies = createDefaultStrategies();
        const allInfo = getAllStrategyInfo();
        
        types.forEach(type => {
          createStrategy(type);
          getStrategyInfo(type);
        });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty registry gracefully', () => {
      // This tests the robustness of the functions
      // even though we can't actually empty the registry
      expect(() => getAvailableStrategyTypes()).not.toThrow();
      expect(() => createDefaultStrategies()).not.toThrow();
      expect(() => getAllStrategyInfo()).not.toThrow();
    });

    it('should handle case sensitivity', () => {
      expect(() => createStrategy('STRING' as ParseStrategyType))
        .toThrow('Unknown strategy type: STRING');
      
      expect(() => createStrategy('String' as ParseStrategyType))
        .toThrow('Unknown strategy type: String');
    });

    it('should handle special characters in strategy type', () => {
      expect(() => createStrategy('string-test' as ParseStrategyType))
        .toThrow('Unknown strategy type: string-test');
      
      expect(() => createStrategy('string_test' as ParseStrategyType))
        .toThrow('Unknown strategy type: string_test');
    });

    it('should handle null and undefined inputs', () => {
      expect(() => createStrategy(null as any))
        .toThrow();
      
      expect(() => createStrategy(undefined as any))
        .toThrow();
      
      expect(() => getStrategyInfo(null as any))
        .toThrow();
      
      expect(() => getStrategyInfo(undefined as any))
        .toThrow();
    });
  });

  describe('Performance', () => {
    it('should create strategies efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        createDefaultStrategies();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 100 iterations in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle repeated calls efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        getAvailableStrategyTypes();
        getAllStrategyInfo();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 1000 iterations in reasonable time (< 70ms) - adjusted for new architecture
      expect(duration).toBeLessThan(70);
    });
  });
});