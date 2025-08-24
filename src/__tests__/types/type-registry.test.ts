/**
 * @file Comprehensive tests for type-registry module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  TemporalTypeRegistry,
  globalTypeRegistry,
  validateType,
  inferInputType,
  convertType,
  normalizeInput,
  registerCustomType,
  type TypeValidationResult,
  type TypeConverter,
  type TypeValidator,
  type TypeNormalizer,
  type TypeRegistryEntry
} from '../../types/type-registry';
import { Temporal } from '@js-temporal/polyfill';

describe('type-registry', () => {
  let registry: TemporalTypeRegistry;

  beforeEach(() => {
    registry = new TemporalTypeRegistry();
  });

  describe('TemporalTypeRegistry', () => {
    describe('constructor', () => {
      it('should initialize with built-in types', () => {
        expect(registry.has('string')).toBe(true);
        expect(registry.has('number')).toBe(true);
        expect(registry.has('date')).toBe(true);
        expect(registry.has('temporal')).toBe(true);
      });

      it('should register aliases for built-in types', () => {
        expect(registry.has('str')).toBe(true); // alias for string
        expect(registry.has('num')).toBe(true); // alias for number
      });
    });

    describe('register', () => {
      it('should register a new type', () => {
        const validator: TypeValidator<boolean> = (input): input is boolean => typeof input === 'boolean';
        
        registry.register('boolean', validator, {
          description: 'Boolean type',
          priority: 5
        });
        
        expect(registry.has('boolean')).toBe(true);
        expect(registry.validate(true, 'boolean')).toBe(true);
        expect(registry.validate('not boolean', 'boolean')).toBe(false);
      });

      it('should register type with normalizer', () => {
        const validator: TypeValidator<string> = (input): input is string => typeof input === 'string';
        const normalizer: TypeNormalizer<string> = (input: string) => input.trim().toLowerCase();
        
        registry.register('trimmed-string', validator, {
          normalizer,
          description: 'Trimmed and lowercased string'
        });
        
        const result = registry.normalize('  HELLO WORLD  ', 'trimmed-string');
        expect(result).toBe('hello world');
      });

      it('should register type with converters', () => {
        const validator: TypeValidator<number> = (input): input is number => typeof input === 'number';
        const converters = {
          'string': (input: number) => input.toString(),
          'boolean': (input: number) => input !== 0
        };
        
        registry.register('custom-number', validator, {
          converters,
          description: 'Number with converters'
        });
        
        expect(registry.convert(42, 'custom-number', 'string')).toBe('42');
        expect(registry.convert(0, 'custom-number', 'boolean')).toBe(false);
        expect(registry.convert(1, 'custom-number', 'boolean')).toBe(true);
      });

      it('should register type with aliases', () => {
        const validator: TypeValidator<symbol> = (input): input is symbol => typeof input === 'symbol';
        
        registry.register('symbol', validator, {
          aliases: ['sym', 'symbol-type'],
          description: 'Symbol type'
        });
        
        expect(registry.has('symbol')).toBe(true);
        expect(registry.has('sym')).toBe(true);
        expect(registry.has('symbol-type')).toBe(true);
      });

      it('should clear cache when registering new type', () => {
        const clearCacheSpy = jest.spyOn(registry as any, 'clearCache');
        const validator: TypeValidator<boolean> = (input): input is boolean => typeof input === 'boolean';
        
        registry.register('test-type', validator);
        
        expect(clearCacheSpy).toHaveBeenCalled();
      });
    });

    describe('unregister', () => {
      it('should unregister existing type', () => {
        const validator: TypeValidator<boolean> = (input): input is boolean => typeof input === 'boolean';
        registry.register('test-type', validator);
        
        expect(registry.has('test-type')).toBe(true);
        
        const result = registry.unregister('test-type');
        
        expect(result).toBe(true);
        expect(registry.has('test-type')).toBe(false);
      });

      it('should return false for non-existent type', () => {
        const result = registry.unregister('non-existent');
        expect(result).toBe(false);
      });

      it('should remove aliases when unregistering', () => {
        const validator: TypeValidator<boolean> = (input): input is boolean => typeof input === 'boolean';
        registry.register('test-type', validator, {
          aliases: ['test-alias']
        });
        
        expect(registry.has('test-alias')).toBe(true);
        
        registry.unregister('test-type');
        
        expect(registry.has('test-alias')).toBe(false);
      });

      it('should clear cache when unregistering', () => {
        const clearCacheSpy = jest.spyOn(registry as any, 'clearCache');
        const validator: TypeValidator<boolean> = (input): input is boolean => typeof input === 'boolean';
        registry.register('test-type', validator);
        
        registry.unregister('test-type');
        
        expect(clearCacheSpy).toHaveBeenCalled();
      });
    });

    describe('has', () => {
      it('should return true for registered types', () => {
        expect(registry.has('string')).toBe(true);
        expect(registry.has('number')).toBe(true);
      });

      it('should return false for unregistered types', () => {
        expect(registry.has('unregistered')).toBe(false);
      });

      it('should resolve aliases', () => {
        expect(registry.has('str')).toBe(true); // alias for string
      });
    });

    describe('get', () => {
      it('should return entry for registered type', () => {
        const entry = registry.get('string');
        
        expect(entry).toBeDefined();
        expect(entry!.name).toBe('string');
        expect(typeof entry!.validator).toBe('function');
      });

      it('should return undefined for unregistered type', () => {
        const entry = registry.get('unregistered');
        expect(entry).toBeUndefined();
      });

      it('should resolve aliases', () => {
        const entry = registry.get('str');
        expect(entry).toBeDefined();
        expect(entry!.name).toBe('string');
      });
    });

    describe('getTypeNames', () => {
      it('should return all registered type names', () => {
        const names = registry.getTypeNames();
        
        expect(names).toContain('string');
        expect(names).toContain('number');
        expect(names).toContain('date');
        expect(names).toContain('temporal-zoned');
        expect(Array.isArray(names)).toBe(true);
      });
    });

    describe('getAliases', () => {
      it('should return all aliases', () => {
        const aliases = registry.getAliases();
        
        expect(aliases).toHaveProperty('str', 'string');
        expect(aliases).toHaveProperty('num', 'number');
        expect(typeof aliases).toBe('object');
      });
    });

    describe('validate', () => {
      it('should validate input against registered type', () => {
        expect(registry.validate('hello', 'string')).toBe(true);
        expect(registry.validate(123, 'string')).toBe(false);
        expect(registry.validate(123, 'number')).toBe(true);
        expect(registry.validate('hello', 'number')).toBe(false);
      });

      it('should throw for unregistered type', () => {
        expect(() => {
          registry.validate('test', 'unregistered');
        }).toThrow("Type 'unregistered' is not registered");
      });

      it('should work with aliases', () => {
        expect(registry.validate('hello', 'str')).toBe(true);
        expect(registry.validate(123, 'num')).toBe(true);
      });
    });

    describe('validateDetailed', () => {
      it('should return detailed validation for specific type', () => {
        const result = registry.validateDetailed('hello', 'string');
        
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('string');
        expect(result.confidence).toBe(1);
        expect(result.errors).toEqual([]);
      });

      it('should return detailed validation for invalid input', () => {
        const result = registry.validateDetailed(123, 'string');
        
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('string');
        expect(result.confidence).toBe(0);
        expect(result.errors).toContain("Input does not match type 'string'");
      });

      it('should infer type when no type specified', () => {
        const result = registry.validateDetailed('hello');
        
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('string');
        expect(result.confidence).toBeGreaterThan(0);
      });

      it('should handle unregistered type', () => {
        const result = registry.validateDetailed('test', 'unregistered');
        
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('unregistered');
        expect(result.errors).toContain("Type 'unregistered' is not registered");
      });

      it('should use cache for repeated validations', () => {
        registry.configureCaching(true);
        
        const result1 = registry.validateDetailed('hello', 'string');
        const result2 = registry.validateDetailed('hello', 'string');
        
        expect(result1).toEqual(result2);
      });
    });

    describe('inferType', () => {
      it('should infer string type', () => {
        const result = registry.inferType('hello');
        
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('string');
      });

      it('should infer number type', () => {
        const result = registry.inferType(123);
        
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('number');
      });

      it('should infer date type', () => {
        const result = registry.inferType(new Date());
        
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('date');
      });

      it('should handle unknown types', () => {
        const result = registry.inferType(Symbol('test'));
        
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('unknown');
        expect(result.errors).toContain('No matching type found');
        expect(Array.isArray(result.suggestions)).toBe(true);
      });

      it('should prioritize by priority and confidence', () => {
        // Register two types that could match the same input
        const validator1: TypeValidator<any> = (input): input is any => true;
        const validator2: TypeValidator<any> = (input): input is any => true;
        
        registry.register('low-priority', validator1, { priority: 1 });
        registry.register('high-priority', validator2, { priority: 10 });
        
        const result = registry.inferType('test');
        
        // Should prefer higher priority
        expect(result.type).toBe('high-priority');
      });
    });

    describe('normalize', () => {
      it('should normalize input using registered normalizer', () => {
        const validator: TypeValidator<string> = (input): input is string => typeof input === 'string';
        const normalizer: TypeNormalizer<string> = (input: string) => input.toUpperCase();
        
        registry.register('upper-string', validator, { normalizer });
        
        const result = registry.normalize('hello', 'upper-string');
        expect(result).toBe('HELLO');
      });

      it('should return input unchanged when no normalizer', () => {
        const result = registry.normalize('hello', 'string');
        expect(result).toBe('hello');
      });

      it('should return input unchanged for unregistered type', () => {
        const result = registry.normalize('hello', 'unregistered');
        expect(result).toBe('hello');
      });
    });

    describe('convert', () => {
      it('should convert between registered types', () => {
        // Built-in string type should have temporal converter
        const temporal = registry.convert('2024-03-15T10:30:00Z[UTC]', 'string', 'temporal');
        expect(temporal).toBeInstanceOf(Temporal.ZonedDateTime);
      });

      it('should throw for unregistered source type', () => {
        expect(() => {
          registry.convert('test', 'unregistered', 'string');
        }).toThrow("Source type 'unregistered' is not registered");
      });

      it('should throw for unavailable conversion', () => {
        expect(() => {
          registry.convert('test', 'string', 'unavailable');
        }).toThrow("No converter from 'string' to 'unavailable'");
      });

      it('should use cache for repeated conversions', () => {
        registry.configureCaching(true);
        
        const result1 = registry.convert('2024-01-01T10:00:00Z[UTC]', 'string', 'temporal');
        const result2 = registry.convert('2024-01-01T10:00:00Z[UTC]', 'string', 'temporal');
        
        // Results should be equivalent (though not necessarily same object)
        expect((result1 as any)?.toString()).toBe((result2 as any)?.toString());
      });
    });

    describe('getConversions', () => {
      it('should return available conversions for type', () => {
        const conversions = registry.getConversions('string');
        
        expect(Array.isArray(conversions)).toBe(true);
        expect(conversions).toContain('temporal');
      });

      it('should return empty array for unregistered type', () => {
        const conversions = registry.getConversions('unregistered');
        expect(conversions).toEqual([]);
      });
    });

    describe('clearCache', () => {
      it('should clear validation and converter caches', () => {
        registry.configureCaching(true);
        
        // Populate cache
        registry.validateDetailed('test', 'string');
        
        const stats1 = registry.getStats();
        expect(stats1.cacheSize).toBeGreaterThan(0);
        
        registry.clearCache();
        
        const stats2 = registry.getStats();
        expect(stats2.cacheSize).toBe(0);
      });
    });

    describe('configureCaching', () => {
      it('should enable caching', () => {
        registry.configureCaching(true, 500);
        
        // Cache should be used
        const result1 = registry.validateDetailed('test', 'string');
        const result2 = registry.validateDetailed('test', 'string');
        
        expect(result1).toEqual(result2);
      });

      it('should disable caching', () => {
        registry.configureCaching(false);
        
        const stats = registry.getStats();
        expect(stats.cacheSize).toBe(0);
      });

      it('should clear cache when disabling', () => {
        registry.configureCaching(true);
        registry.validateDetailed('test', 'string');
        
        expect(registry.getStats().cacheSize).toBeGreaterThan(0);
        
        registry.configureCaching(false);
        
        expect(registry.getStats().cacheSize).toBe(0);
      });
    });

    describe('getStats', () => {
      it('should return registry statistics', () => {
        const stats = registry.getStats();
        
        expect(stats).toHaveProperty('totalTypes');
        expect(stats).toHaveProperty('totalAliases');
        expect(stats).toHaveProperty('cacheSize');
        expect(stats).toHaveProperty('cacheHitRatio');
        
        expect(typeof stats.totalTypes).toBe('number');
        expect(typeof stats.totalAliases).toBe('number');
        expect(typeof stats.cacheSize).toBe('number');
        expect(typeof stats.cacheHitRatio).toBe('number');
      });
    });

    describe('export/import', () => {
      it('should export registry configuration', () => {
        const config = registry.export();
        
        expect(config).toHaveProperty('types');
        expect(config).toHaveProperty('aliases');
        expect(Array.isArray(config.types)).toBe(true);
        expect(typeof config.aliases).toBe('object');
        
        // Check that exported types have required properties
        config.types.forEach(type => {
          expect(type).toHaveProperty('name');
          expect(type).toHaveProperty('priority');
          expect(type).toHaveProperty('description');
        });
      });

      it('should import registry configuration', () => {
         // First register the type that the alias will point to
         registry.register('custom-test', (input): input is string => typeof input === 'string', {
           description: 'Test type'
         });
         
         const config = {
           types: [{
             name: 'custom-test',
             priority: 5,
             description: 'Test type'
           }],
           aliases: { 'test-alias': 'custom-test' }
         };
         
         registry.import(config);
         
         expect(registry.has('custom-test')).toBe(true);
         expect(registry.has('test-alias')).toBe(true);
       });
       
       it('should handle import with aliases', () => {
         const config = {
           types: [],
           aliases: { 'str-alias': 'string' } // Use existing type
         };
         
         registry.import(config);
         expect(registry.has('str-alias')).toBe(true);
       });
    });

    describe('getConversions', () => {
      it('should return available conversions for a type', () => {
        registry.register('test-converter', 
          (input): input is string => typeof input === 'string',
          {
            converters: {
              'target1': (input: string) => input.toUpperCase(),
              'target2': (input: string) => input.toLowerCase()
            }
          }
        );
        
        const conversions = registry.getConversions('test-converter');
        expect(conversions).toEqual(['target1', 'target2']);
      });

      it('should return empty array for non-existent type', () => {
        const conversions = registry.getConversions('non-existent');
        expect(conversions).toEqual([]);
      });

      it('should return empty array for type with no converters', () => {
        registry.register('no-converters', (input): input is string => typeof input === 'string');
        const conversions = registry.getConversions('no-converters');
        expect(conversions).toEqual([]);
      });
    });

    describe('convert method error cases', () => {
      it('should throw error for unregistered source type', () => {
        expect(() => {
          registry.convert('test', 'unregistered-type', 'target');
        }).toThrow("Source type 'unregistered-type' is not registered");
      });

      it('should throw error for missing converter', () => {
        registry.register('source-type', (input): input is string => typeof input === 'string');
        
        expect(() => {
          registry.convert('test', 'source-type', 'missing-target');
        }).toThrow("No converter from 'source-type' to 'missing-target'");
      });
    });

    describe('cache management', () => {
      it('should handle cache size limits', () => {
        const smallRegistry = new TemporalTypeRegistry();
        smallRegistry.configureCaching(true, 2); // Very small cache
        
        // Fill cache beyond limit
        smallRegistry.validateDetailed('test1', 'string');
        smallRegistry.validateDetailed('test2', 'string');
        smallRegistry.validateDetailed('test3', 'string'); // Should evict oldest
        
        const stats = smallRegistry.getStats();
        expect(stats.cacheSize).toBeLessThanOrEqual(2);
      });

      it('should handle converter cache size limits', () => {
        const smallRegistry = new TemporalTypeRegistry();
        smallRegistry.configureCaching(true, 2);
        
        // Test converter caching with size limits
        try {
          smallRegistry.convert('2024-01-01T10:00:00Z[UTC]', 'string', 'temporal');
          smallRegistry.convert('2024-01-02T10:00:00Z[UTC]', 'string', 'temporal');
          smallRegistry.convert('2024-01-03T10:00:00Z[UTC]', 'string', 'temporal');
        } catch (error) {
          // Expected for some conversions
        }
        
        const stats = smallRegistry.getStats();
        expect(stats.cacheSize).toBeLessThanOrEqual(4); // validation + converter caches
      });
    });

    describe('private method coverage', () => {
      it('should handle complex input hashing', () => {
        const complexObject = {
          nested: { deep: { value: 'test' } },
          array: [1, 2, 3],
          date: new Date('2024-01-01')
        };
        
        // This will exercise the getInputHash method
        const result1 = registry.validateDetailed(complexObject);
        const result2 = registry.validateDetailed(complexObject);
        
        // Should get same result (testing caching)
        expect(result1.type).toBe(result2.type);
      });

      it('should handle circular reference hashing', () => {
        const circular: any = { prop: 'value' };
        circular.self = circular;
        
        // Should not throw error when hashing circular reference
        expect(() => {
          registry.validateDetailed(circular);
        }).not.toThrow();
      });

      it('should calculate confidence scores correctly', () => {
        // Test confidence calculation by checking inference results
        const stringResult = registry.inferType('test-string');
        const numberResult = registry.inferType(12345);
        const dateResult = registry.inferType(new Date());
        
        expect(stringResult.confidence).toBeGreaterThan(0);
        expect(numberResult.confidence).toBeGreaterThan(0);
        expect(dateResult.confidence).toBeGreaterThan(0);
        
        // Date should have higher confidence than string for Date objects
        expect(dateResult.confidence).toBeGreaterThan(stringResult.confidence);
      });

      it('should provide type suggestions', () => {
        const result = registry.validateDetailed('test', 'non-existent-type');
        
        expect(result.isValid).toBe(false);
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions).toContain('string');
      });

      it('should calculate Levenshtein distance for suggestions', () => {
        // Test by validating against a slightly misspelled type name
        const result = registry.validateDetailed('test', 'strng'); // missing 'i'
        
        expect(result.isValid).toBe(false);
        expect(result.suggestions).toContain('string');
      });
    });

    describe('additional utility methods', () => {
      it('should handle normalize method', () => {
        const result = registry.normalize('test string', 'string');
        expect(typeof result).toBe('string');
      });

      it('should handle normalize with unregistered type', () => {
        const result = registry.normalize('test', 'unregistered-type');
        expect(result).toBe('test');
      });

      it('should get all registered type names', () => {
        const typeNames = registry.getTypeNames();
        expect(Array.isArray(typeNames)).toBe(true);
        expect(typeNames.length).toBeGreaterThan(0);
        expect(typeNames).toContain('string');
        expect(typeNames).toContain('number');
      });

      it('should get type info for registered types', () => {
        const stringInfo = registry.get('string');
        expect(stringInfo).toHaveProperty('name', 'string');
        expect(stringInfo).toHaveProperty('validator');
      });

      it('should return undefined for unregistered type info', () => {
        const info = registry.get('non-existent');
        expect(info).toBeUndefined();
      });

      it('should handle aliases correctly', () => {
        const validator: TypeValidator<string> = (input): input is string => typeof input === 'string';
        registry.register('test-type', validator, {
          aliases: ['test-alias']
        });
        expect(registry.has('test-alias')).toBe(true);
        expect(registry.has('non-existent-alias')).toBe(false);
      });

      it('should handle getAliases method', () => {
        const aliases = registry.getAliases();
        expect(typeof aliases).toBe('object');
        expect(aliases['str']).toBe('string');
        expect(aliases['num']).toBe('number');
      });
    });

    describe('built-in type converters', () => {
       it('should convert string to temporal', () => {
         const result = registry.convert('2024-01-01T10:00:00Z[UTC]', 'string', 'temporal');
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
       });

       it('should convert number to temporal', () => {
         const timestamp = Date.now();
         const result = registry.convert(timestamp, 'number', 'temporal');
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
       });

       it('should convert Date to temporal', () => {
         const date = new Date();
         const result = registry.convert(date, 'date', 'temporal');
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
       });

       it('should convert PlainDateTime to temporal with timezone', () => {
         const plainDateTime = Temporal.PlainDateTime.from('2024-01-01T10:00:00');
         const result = registry.convert(plainDateTime, 'temporal-plain-datetime', 'temporal', { timeZone: 'America/New_York' });
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
         expect((result as any).timeZoneId).toBe('America/New_York');
       });

       it('should convert PlainDate to temporal with timezone', () => {
         const plainDate = Temporal.PlainDate.from('2024-01-01');
         const result = registry.convert(plainDate, 'temporal-plain-date', 'temporal', { timeZone: 'Europe/London' });
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
         expect((result as any).timeZoneId).toBe('Europe/London');
       });

       it('should convert Instant to temporal with timezone', () => {
         const instant = Temporal.Instant.from('2024-01-01T10:00:00Z');
         const result = registry.convert(instant, 'temporal-instant', 'temporal', { timeZone: 'Asia/Tokyo' });
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
         expect((result as any).timeZoneId).toBe('Asia/Tokyo');
       });

       it('should convert temporal-like object to temporal', () => {
         const temporalLike = {
           year: 2024,
           month: 1,
           day: 15,
           hour: 10,
           minute: 30,
           timeZone: 'UTC'
         };
         const result = registry.convert(temporalLike, 'temporal-like', 'temporal');
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
         expect((result as any).year).toBe(2024);
         expect((result as any).month).toBe(1);
         expect((result as any).day).toBe(15);
       });

       it('should convert array-like to temporal', () => {
         const arrayLike = [2024, 1, 15, 10, 30, 45];
         const result = registry.convert(arrayLike, 'array-like', 'temporal');
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
         expect((result as any).year).toBe(2024);
         expect((result as any).month).toBe(1);
         expect((result as any).day).toBe(15);
       });

       it('should throw error for array-like with insufficient elements', () => {
         const shortArray = [2024, 1]; // Missing day
         expect(() => {
           registry.convert(shortArray, 'array-like', 'temporal');
         }).toThrow('Array must have at least 3 elements');
       });

       it('should handle firebase timestamp conversion', () => {
         const mockFirebaseTimestamp = {
           seconds: 1640995200,
           nanoseconds: 0,
           toDate: () => new Date(1640995200000)
         };
         
         const result = registry.convert(mockFirebaseTimestamp, 'firebase-timestamp', 'temporal');
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
       });
     });

     describe('private methods', () => {
      describe('calculateConfidence', () => {
        it('should calculate confidence based on type match', () => {
          const entry = registry.get('string')!;
          const confidence = (registry as any).calculateConfidence('test', entry);
          
          expect(typeof confidence).toBe('number');
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(1);
        });
      });

      describe('getSuggestions', () => {
        it('should provide suggestions for different input types', () => {
          const stringSuggestions = (registry as any).getSuggestions('test');
          const numberSuggestions = (registry as any).getSuggestions(123);
          const dateSuggestions = (registry as any).getSuggestions(new Date());
          const arraySuggestions = (registry as any).getSuggestions([1, 2, 3]);
          const objectSuggestions = (registry as any).getSuggestions({ prop: 'value' });
          
          expect(Array.isArray(stringSuggestions)).toBe(true);
          expect(Array.isArray(numberSuggestions)).toBe(true);
          expect(Array.isArray(dateSuggestions)).toBe(true);
          expect(Array.isArray(arraySuggestions)).toBe(true);
          expect(Array.isArray(objectSuggestions)).toBe(true);
          
          expect(stringSuggestions).toContain('string');
          expect(numberSuggestions).toContain('number');
          expect(dateSuggestions).toContain('date');
          expect(arraySuggestions).toContain('array-like');
        });
      });

      describe('getClosestTypeNames', () => {
        it('should find closest type names using string distance', () => {
          const closest = (registry as any).getClosestTypeNames('strin');
          
          expect(Array.isArray(closest)).toBe(true);
          expect(closest).toContain('string');
        });
      });

      describe('levenshteinDistance', () => {
        it('should calculate string distance correctly', () => {
          const distance1 = (registry as any).levenshteinDistance('string', 'string');
          const distance2 = (registry as any).levenshteinDistance('string', 'strin');
          const distance3 = (registry as any).levenshteinDistance('string', 'number');
          
          expect(distance1).toBe(0);
          expect(distance2).toBe(1);
          expect(distance3).toBeGreaterThan(distance2);
        });
      });

      describe('getInputHash', () => {
        it('should generate hash for different input types', () => {
          const nullHash = (registry as any).getInputHash(null);
          const undefinedHash = (registry as any).getInputHash(undefined);
          const stringHash = (registry as any).getInputHash('test');
          const numberHash = (registry as any).getInputHash(123);
          const booleanHash = (registry as any).getInputHash(true);
          const dateHash = (registry as any).getInputHash(new Date('2024-01-01'));
          const objectHash = (registry as any).getInputHash({ prop: 'value' });
          
          expect(nullHash).toBe('null');
          expect(undefinedHash).toBe('undefined');
          expect(stringHash).toBe('string:test');
          expect(numberHash).toBe('number:123');
          expect(booleanHash).toBe('boolean:true');
          expect(dateHash).toContain('date:');
          expect(objectHash).toContain('object:');
        });

        it('should handle circular references', () => {
          const circular: any = { prop: 'value' };
          circular.self = circular;
          
          const hash = (registry as any).getInputHash(circular);
          expect(typeof hash).toBe('string');
          expect(hash).toContain('object:');
        });
      });
    });
  });

  describe('global registry functions', () => {
    describe('validateType', () => {
      it('should validate using global registry', () => {
        expect(validateType('test', 'string')).toBe(true);
        expect(validateType(123, 'string')).toBe(false);
      });
    });

    describe('inferInputType', () => {
      it('should infer type using global registry', () => {
        const result = inferInputType('test');
        
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('string');
      });
    });

    describe('convertType', () => {
       it('should convert using global registry', () => {
         const result = convertType('2024-03-15T10:30:00Z[UTC]', 'string', 'temporal');
         expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
       });
     });

    describe('normalizeInput', () => {
      it('should normalize using global registry', () => {
        const result = normalizeInput('test', 'string');
        expect(result).toBe('test');
      });
    });

    describe('registerCustomType', () => {
      it('should register type in global registry', () => {
        const validator: TypeValidator<bigint> = (input): input is bigint => typeof input === 'bigint';
        
        registerCustomType('bigint', validator, {
          description: 'BigInt type',
          aliases: ['big']
        });
        
        expect(globalTypeRegistry.has('bigint')).toBe(true);
        expect(globalTypeRegistry.has('big')).toBe(true);
        expect(validateType(BigInt(123), 'bigint')).toBe(true);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null and undefined inputs', () => {
      expect(() => registry.validateDetailed(null)).not.toThrow();
      expect(() => registry.validateDetailed(undefined)).not.toThrow();
    });

    it('should handle extreme values', () => {
      expect(() => registry.validateDetailed(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(() => registry.validateDetailed(Number.MIN_SAFE_INTEGER)).not.toThrow();
      expect(() => registry.validateDetailed(Infinity)).not.toThrow();
      expect(() => registry.validateDetailed(-Infinity)).not.toThrow();
      expect(() => registry.validateDetailed(NaN)).not.toThrow();
    });

    it('should handle complex objects', () => {
      const complexObject = {
        nested: {
          deep: {
            array: [1, 2, 3],
            date: new Date(),
            func: () => {}
          }
        }
      };
      
      expect(() => registry.validateDetailed(complexObject)).not.toThrow();
    });

    it('should handle cache overflow', () => {
      registry.configureCaching(true, 2); // Very small cache
      
      // Fill cache beyond capacity
      registry.validateDetailed('test1', 'string');
      registry.validateDetailed('test2', 'string');
      registry.validateDetailed('test3', 'string'); // Should evict oldest
      
      const stats = registry.getStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(4); // 2 validation + 2 converter cache
    });

    it('should handle type registration conflicts', () => {
      const validator1: TypeValidator<boolean> = (input): input is boolean => typeof input === 'boolean';
      const validator2: TypeValidator<boolean> = (input): input is boolean => typeof input === 'boolean';
      
      registry.register('conflict-type', validator1);
      
      // Should overwrite existing registration
      expect(() => {
        registry.register('conflict-type', validator2);
      }).not.toThrow();
      
      expect(registry.has('conflict-type')).toBe(true);
    });

    it('should handle converter errors gracefully', () => {
      const validator: TypeValidator<string> = (input): input is string => typeof input === 'string';
      const errorConverter: TypeConverter<string, never> = () => {
        throw new Error('Conversion failed');
      };
      
      registry.register('error-type', validator, {
        converters: {
          'error-target': errorConverter
        }
      });
      
      expect(() => {
        registry.convert('test', 'error-type', 'error-target');
      }).toThrow('Conversion failed');
    });
  });

  describe('performance characteristics', () => {
    it('should handle rapid type registrations', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const validator: TypeValidator<any> = (input): input is any => true;
        registry.register(`type-${i}`, validator);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000);
      expect(registry.getTypeNames().length).toBeGreaterThanOrEqual(100);
    });

    it('should handle rapid validations', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        registry.validateDetailed(`test-${i}`, 'string');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 50 }, (_, i) => 
        Promise.resolve().then(() => {
          const validator: TypeValidator<any> = (input): input is any => true;
          registry.register(`concurrent-${i}`, validator);
          return registry.validateDetailed(`test-${i}`, `concurrent-${i}`);
        })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });
  });
});