/**
 * @file Type registry system for managing and validating temporal types at runtime
 */

import type {
  TemporalInput,
  TemporalWrapper,
  FirebaseTimestamp,
  TemporalLike,
  ArrayLike,
  TimeUnit,
  SingularTimeUnit,
  PluralTimeUnit,
  LocaleString,
  TimezoneString,
  CalendarString,
  TemporalError,
  TemporalParseError,
  TemporalTimezoneError,
  TemporalFormatError,
  TemporalCacheError,
  StrictTemporalOptions,
  StrictParsingOptions,
  StrictFormattingOptions,
  StrictComparisonOptions,
  StrictDiffOptions,
  GlobalTemporalConfig,
  TemporalPlugin,
  PerformanceMetrics
} from './enhanced-types';

import { Temporal } from '@js-temporal/polyfill';

/**
 * Type validation result
 */
export interface TypeValidationResult {
  readonly isValid: boolean;
  readonly type: string;
  readonly confidence: number;
  readonly errors: string[];
  readonly suggestions: string[];
}

/**
 * Type converter function signature
 */
export type TypeConverter<T, R> = (input: T, options?: any) => R;

/**
 * Type validator function signature
 */
export type TypeValidator<T> = (input: unknown) => input is T;

/**
 * Type normalizer function signature
 */
export type TypeNormalizer<T> = (input: T) => T;

/**
 * Registry entry for a type
 */
export interface TypeRegistryEntry<T = unknown> {
  readonly name: string;
  readonly validator: TypeValidator<T>;
  readonly normalizer?: TypeNormalizer<T>;
  readonly converters: Map<string, TypeConverter<T, unknown>>;
  readonly priority: number;
  readonly description: string;
}

/**
 * Type registry for managing temporal types
 */
export class TemporalTypeRegistry {
  private readonly entries = new Map<string, TypeRegistryEntry>();
  private readonly aliases = new Map<string, string>();
  private readonly converterCache = new Map<string, TypeConverter<unknown, unknown>>();
  private readonly validationCache = new Map<string, TypeValidationResult>();
  private cacheEnabled = true;
  private maxCacheSize = 1000;

  constructor() {
    this.registerBuiltinTypes();
  }

  /**
   * Register a new type in the registry
   */
  register<T>(
    name: string,
    validator: TypeValidator<T>,
    options: {
      normalizer?: TypeNormalizer<T>;
      converters?: Record<string, TypeConverter<T, unknown>>;
      priority?: number;
      description?: string;
      aliases?: string[];
    } = {}
  ): void {
    const {
      normalizer,
      converters = {},
      priority = 0,
      description = '',
      aliases = []
    } = options;

    const entry: TypeRegistryEntry<T> = {
      name,
      validator,
      normalizer,
      converters: new Map(Object.entries(converters)),
      priority,
      description
    };

    this.entries.set(name, entry as TypeRegistryEntry);

    // Register aliases
    for (const alias of aliases) {
      this.aliases.set(alias, name);
    }

    // Clear cache when registry changes
    this.clearCache();
  }

  /**
   * Unregister a type from the registry
   */
  unregister(name: string): boolean {
    const resolved = this.resolveName(name);
    const removed = this.entries.delete(resolved);
    
    if (removed) {
      // Remove aliases
      for (const [alias, target] of Array.from(this.aliases.entries())) {
        if (target === resolved) {
          this.aliases.delete(alias);
        }
      }
      
      this.clearCache();
    }
    
    return removed;
  }

  /**
   * Check if a type is registered
   */
  has(name: string): boolean {
    return this.entries.has(this.resolveName(name));
  }

  /**
   * Get a type entry
   */
  get(name: string): TypeRegistryEntry | undefined {
    return this.entries.get(this.resolveName(name));
  }

  /**
   * Get all registered type names
   */
  getTypeNames(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get all aliases
   */
  getAliases(): Record<string, string> {
    return Object.fromEntries(this.aliases.entries());
  }

  /**
   * Validate input against a specific type
   */
  validate<T>(input: unknown, typeName: string): input is T {
    const entry = this.get(typeName);
    if (!entry) {
      throw new Error(`Type '${typeName}' is not registered`);
    }
    
    return entry.validator(input);
  }

  /**
   * Validate input and return detailed result
   */
  validateDetailed(input: unknown, typeName?: string): TypeValidationResult {
    const cacheKey = typeName ? `${typeName}:${this.getInputHash(input)}` : this.getInputHash(input);
    
    if (this.cacheEnabled && this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    let result: TypeValidationResult;

    if (typeName) {
      // Validate against specific type
      result = this.validateAgainstType(input, typeName);
    } else {
      // Infer type
      result = this.inferType(input);
    }

    if (this.cacheEnabled) {
      this.setCachedValidation(cacheKey, result);
    }

    return result;
  }

  /**
   * Infer the type of input
   */
  inferType(input: unknown): TypeValidationResult {
    const candidates: Array<{ name: string; entry: TypeRegistryEntry; confidence: number }> = [];
    
    for (const [name, entry] of Array.from(this.entries.entries())) {
      if (entry.validator(input)) {
        candidates.push({
          name,
          entry,
          confidence: this.calculateConfidence(input, entry)
        });
      }
    }

    if (candidates.length === 0) {
      return {
        isValid: false,
        type: 'unknown',
        confidence: 0,
        errors: ['No matching type found'],
        suggestions: this.getSuggestions(input)
      };
    }

    // Sort by priority and confidence
    candidates.sort((a, b) => {
      if (a.entry.priority !== b.entry.priority) {
        return b.entry.priority - a.entry.priority;
      }
      return b.confidence - a.confidence;
    });

    const best = candidates[0];
    return {
      isValid: true,
      type: best.name,
      confidence: best.confidence,
      errors: [],
      suggestions: candidates.slice(1).map(c => c.name)
    };
  }

  /**
   * Normalize input using registered normalizer
   */
  normalize<T>(input: T, typeName: string): T {
    const entry = this.get(typeName);
    if (!entry || !entry.normalizer) {
      return input;
    }
    
    return (entry.normalizer as TypeNormalizer<T>)(input);
  }

  /**
   * Convert input from one type to another
   */
  convert<T, R>(input: T, fromType: string, toType: string, options?: any): R {
    const cacheKey = `${fromType}->${toType}:${this.getInputHash(input)}`;
    
    if (this.cacheEnabled && this.converterCache.has(cacheKey)) {
      return this.converterCache.get(cacheKey) as R;
    }

    const fromEntry = this.get(fromType);
    if (!fromEntry) {
      throw new Error(`Source type '${fromType}' is not registered`);
    }

    const converter = fromEntry.converters.get(toType);
    if (!converter) {
      throw new Error(`No converter from '${fromType}' to '${toType}'`);
    }

    const result = converter(input, options) as R;
    
    if (this.cacheEnabled) {
      this.setCachedConverter(cacheKey, result);
    }

    return result;
  }

  /**
   * Get available conversions for a type
   */
  getConversions(typeName: string): string[] {
    const entry = this.get(typeName);
    return entry ? Array.from(entry.converters.keys()) : [];
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.validationCache.clear();
    this.converterCache.clear();
  }

  /**
   * Configure cache settings
   */
  configureCaching(enabled: boolean, maxSize?: number): void {
    this.cacheEnabled = enabled;
    if (maxSize !== undefined) {
      this.maxCacheSize = maxSize;
    }
    
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalTypes: number;
    totalAliases: number;
    cacheSize: number;
    cacheHitRatio: number;
  } {
    return {
      totalTypes: this.entries.size,
      totalAliases: this.aliases.size,
      cacheSize: this.validationCache.size + this.converterCache.size,
      cacheHitRatio: this.calculateCacheHitRatio()
    };
  }

  /**
   * Export registry configuration
   */
  export(): {
    types: Array<{ name: string; priority: number; description: string }>;
    aliases: Record<string, string>;
  } {
    return {
      types: Array.from(this.entries.entries()).map(([name, entry]) => ({
        name,
        priority: entry.priority,
        description: entry.description
      })),
      aliases: this.getAliases()
    };
  }

  /**
   * Import registry configuration
   */
  import(config: {
    types: Array<{ name: string; priority: number; description: string }>;
    aliases: Record<string, string>;
  }): void {
    // Note: This only imports metadata, not the actual validators/converters
    // Those need to be registered separately
    for (const [alias, target] of Object.entries(config.aliases)) {
      if (this.entries.has(target)) {
        this.aliases.set(alias, target);
      }
    }
  }

  /**
   * Register built-in temporal types
   */
  private registerBuiltinTypes(): void {
    // String type
    this.register('string', 
      (input): input is string => typeof input === 'string',
      {
        priority: 1,
        description: 'String input for parsing',
        aliases: ['str'],
        converters: {
          'temporal': (input: string) => Temporal.ZonedDateTime.from(input)
        }
      }
    );

    // Number type
    this.register('number',
      (input): input is number => typeof input === 'number' && !isNaN(input),
      {
        priority: 1,
        description: 'Numeric timestamp',
        aliases: ['num', 'timestamp'],
        converters: {
          'temporal': (input: number) => Temporal.Instant.fromEpochMilliseconds(input).toZonedDateTimeISO('UTC')
        }
      }
    );

    // Date type
    this.register('date',
      (input): input is Date => input instanceof Date && !isNaN(input.getTime()),
      {
        priority: 2,
        description: 'JavaScript Date object',
        converters: {
          'temporal': (input: Date) => Temporal.Instant.fromEpochMilliseconds(input.getTime()).toZonedDateTimeISO('UTC')
        }
      }
    );

    // Temporal types
    this.register('temporal-zoned',
      (input): input is Temporal.ZonedDateTime => input instanceof Temporal.ZonedDateTime,
      {
        priority: 10,
        description: 'Temporal ZonedDateTime',
        aliases: ['zoned', 'temporal']
      }
    );

    this.register('temporal-plain-datetime',
      (input): input is Temporal.PlainDateTime => input instanceof Temporal.PlainDateTime,
      {
        priority: 8,
        description: 'Temporal PlainDateTime',
        aliases: ['plain-datetime'],
        converters: {
          'temporal': (input: Temporal.PlainDateTime, options: { timeZone?: string } = {}) => 
            input.toZonedDateTime(options.timeZone || 'UTC')
        }
      }
    );

    this.register('temporal-plain-date',
      (input): input is Temporal.PlainDate => input instanceof Temporal.PlainDate,
      {
        priority: 7,
        description: 'Temporal PlainDate',
        aliases: ['plain-date'],
        converters: {
          'temporal': (input: Temporal.PlainDate, options: { timeZone?: string } = {}) => 
            input.toZonedDateTime(options.timeZone || 'UTC')
        }
      }
    );

    this.register('temporal-instant',
      (input): input is Temporal.Instant => input instanceof Temporal.Instant,
      {
        priority: 9,
        description: 'Temporal Instant',
        aliases: ['instant'],
        converters: {
          'temporal': (input: Temporal.Instant, options: { timeZone?: string } = {}) => 
            input.toZonedDateTimeISO(options.timeZone || 'UTC')
        }
      }
    );

    // Firebase Timestamp
    this.register('firebase-timestamp',
      (input): input is FirebaseTimestamp => {
        return typeof input === 'object' &&
               input !== null &&
               'seconds' in input &&
               'nanoseconds' in input &&
               'toDate' in input &&
               typeof (input as any).toDate === 'function';
      },
      {
        priority: 5,
        description: 'Firebase Timestamp',
        aliases: ['firebase'],
        converters: {
          'temporal': (input: FirebaseTimestamp) => 
            Temporal.Instant.fromEpochMilliseconds(input.toDate().getTime()).toZonedDateTimeISO('UTC')
        }
      }
    );

    // TemporalWrapper
    this.register('temporal-wrapper',
      (input): input is TemporalWrapper => {
        return typeof input === 'object' &&
               input !== null &&
               '_isTemporalWrapper' in input &&
               (input as any)._isTemporalWrapper === true;
      },
      {
        priority: 15,
        description: 'TemporalWrapper instance',
        aliases: ['wrapper']
      }
    );

    // Temporal-like object
    this.register('temporal-like',
      (input): input is TemporalLike => {
        if (typeof input !== 'object' || input === null) {
          return false;
        }
        
        const obj = input as Record<string, unknown>;
        const temporalKeys = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond', 'timeZone', 'calendar'];
        
        return temporalKeys.some(key => key in obj);
      },
      {
        priority: 3,
        description: 'Object with temporal properties',
        aliases: ['like', 'object'],
        converters: {
          'temporal': (input: TemporalLike) => {
            const { timeZone = 'UTC', calendar = 'iso8601', ...dateTime } = input;
            return Temporal.ZonedDateTime.from({ ...dateTime, timeZone, calendar });
          }
        }
      }
    );

    // Array-like
    this.register('array-like',
      (input): input is ArrayLike<number> => {
        return typeof input === 'object' &&
               input !== null &&
               'length' in input &&
               typeof (input as any).length === 'number';
      },
      {
        priority: 2,
        description: 'Array-like object with numeric values',
        aliases: ['array'],
        converters: {
          'temporal': (input: ArrayLike<number>) => {
            const arr = Array.from(input);
            if (arr.length >= 3) {
              return Temporal.ZonedDateTime.from({
                year: arr[0],
                month: arr[1] || 1,
                day: arr[2] || 1,
                hour: arr[3] || 0,
                minute: arr[4] || 0,
                second: arr[5] || 0,
                millisecond: arr[6] || 0,
                timeZone: 'UTC'
              });
            }
            throw new Error('Array must have at least 3 elements (year, month, day)');
          }
        }
      }
    );
  }

  /**
   * Resolve type name (handle aliases)
   */
  private resolveName(name: string): string {
    return this.aliases.get(name) || name;
  }

  /**
   * Validate input against a specific type
   */
  private validateAgainstType(input: unknown, typeName: string): TypeValidationResult {
    const entry = this.get(typeName);
    if (!entry) {
      return {
        isValid: false,
        type: typeName,
        confidence: 0,
        errors: [`Type '${typeName}' is not registered`],
        suggestions: this.getClosestTypeNames(typeName)
      };
    }

    const isValid = entry.validator(input);
    return {
      isValid,
      type: typeName,
      confidence: isValid ? 1 : 0,
      errors: isValid ? [] : [`Input does not match type '${typeName}'`],
      suggestions: isValid ? [] : this.getSuggestions(input)
    };
  }

  /**
   * Calculate confidence score for type match
   */
  private calculateConfidence(input: unknown, entry: TypeRegistryEntry): number {
    // Base confidence from priority
    let confidence = entry.priority / 20;
    
    // Adjust based on input characteristics
    if (typeof input === 'string' && entry.name === 'string') {
      confidence += 0.3;
    } else if (typeof input === 'number' && entry.name === 'number') {
      confidence += 0.3;
    } else if (input instanceof Date && entry.name === 'date') {
      confidence += 0.5;
    }
    
    return Math.min(1, confidence);
  }

  /**
   * Get suggestions for unmatched input
   */
  private getSuggestions(input: unknown): string[] {
    const suggestions: string[] = [];
    
    if (typeof input === 'string') {
      suggestions.push('string', 'temporal-like');
    } else if (typeof input === 'number') {
      suggestions.push('number', 'timestamp');
    } else if (input instanceof Date) {
      suggestions.push('date');
    } else if (Array.isArray(input)) {
      suggestions.push('array-like');
    } else if (typeof input === 'object' && input !== null) {
      suggestions.push('temporal-like', 'firebase-timestamp');
    }
    
    return suggestions.slice(0, 3);
  }

  /**
   * Get closest type names using simple string distance
   */
  private getClosestTypeNames(target: string): string[] {
    const names = this.getTypeNames();
    return names
      .map(name => ({ name, distance: this.levenshteinDistance(target, name) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(item => item.name);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  /**
   * Generate hash for input (for caching)
   */
  private getInputHash(input: unknown): string {
    if (input === null) return 'null';
    if (input === undefined) return 'undefined';
    
    const type = typeof input;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return `${type}:${input}`;
    }
    
    if (input instanceof Date) {
      return `date:${input.getTime()}`;
    }
    
    if (typeof input === 'object') {
      try {
        return `object:${JSON.stringify(input)}`;
      } catch {
        return `object:${Object.prototype.toString.call(input)}`;
      }
    }
    
    return `${type}:${String(input)}`;
  }

  /**
   * Set cached validation result
   */
  private setCachedValidation(key: string, result: TypeValidationResult): void {
    if (this.validationCache.size >= this.maxCacheSize) {
      // Simple LRU: remove oldest entry
      const firstKey = this.validationCache.keys().next().value;
      if (firstKey !== undefined) {
        this.validationCache.delete(firstKey);
      }
    }
    this.validationCache.set(key, result);
  }

  /**
   * Set cached converter result
   */
  private setCachedConverter(key: string, result: unknown): void {
    if (this.converterCache.size >= this.maxCacheSize) {
      // Simple LRU: remove oldest entry
      const firstKey = this.converterCache.keys().next().value;
      if (firstKey !== undefined) {
        this.converterCache.delete(firstKey);
      }
    }
    this.converterCache.set(key, result as any);
  }

  /**
   * Calculate cache hit ratio
   */
  private calculateCacheHitRatio(): number {
    // This would need to be tracked with additional counters in a real implementation
    return 0.85; // Placeholder
  }
}

/**
 * Global type registry instance
 */
export const globalTypeRegistry = new TemporalTypeRegistry();

/**
 * Convenience functions using global registry
 */
export function validateType<T>(input: unknown, typeName: string): input is T {
  return globalTypeRegistry.validate<T>(input, typeName);
}

export function inferInputType(input: unknown): TypeValidationResult {
  return globalTypeRegistry.inferType(input);
}

export function convertType<T, R>(input: T, fromType: string, toType: string, options?: any): R {
  return globalTypeRegistry.convert<T, R>(input, fromType, toType, options);
}

export function normalizeInput<T>(input: T, typeName: string): T {
  return globalTypeRegistry.normalize(input, typeName);
}

export function registerCustomType<T>(
  name: string,
  validator: TypeValidator<T>,
  options?: {
    normalizer?: TypeNormalizer<T>;
    converters?: Record<string, TypeConverter<T, unknown>>;
    priority?: number;
    description?: string;
    aliases?: string[];
  }
): void {
  globalTypeRegistry.register(name, validator, options);
}