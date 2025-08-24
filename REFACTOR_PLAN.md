# TemporalUtils & TemporalWrapper Refactor Plan

## Executive Summary

This document outlines a comprehensive refactor plan for `TemporalUtils.ts` and `TemporalWrapper.ts` to improve performance, maintainability, and TypeScript typing while preserving all public APIs and runtime behavior.

## Current State Analysis

### Test Coverage
- **Overall**: 95.95% line coverage, 571 tests passing
- **TemporalUtils.ts**: High coverage with comprehensive behavioral baseline tests
- **TemporalWrapper.ts**: Well-tested public API surface

### Public API Surface

#### TemporalUtils (Static Utility Class)
- `from(input?: DateInput, timeZone?: string): Temporal.ZonedDateTime`
- `toDate(temporal: Temporal.ZonedDateTime): Date`
- `setDefaultLocale(code: string): void`
- `getDefaultLocale(): string`
- `setDefaultTimeZone(tz: string): void`
- `get defaultTimeZone(): string`
- `setWeekStartsOn(day: 0|1|2|3|4|5|6): void`
- `getWeekStartsOn(): number`
- `diff(a: DateInput, b: DateInput, unit?: TimeUnit): number`
- `isBefore/isAfter/isSameOrBefore/isSameOrAfter/isSameDay(a: DateInput, b: DateInput): boolean`

#### TemporalWrapper (Immutable Wrapper Class)
- **Static Factory Methods**: `from()`, `unix()`
- **Validation**: `isValid()`
- **Getters**: `year`, `month`, `day`, `hour`, `minute`, `second`, `millisecond`, `dayOfWeekName`, `timeZoneName`, `weekOfYear`, `daysInMonth`
- **Manipulation**: `add()`, `subtract()`, `set()`, `timeZone()`, `dayOfWeek()`, `quarter()`
- **Boundaries**: `startOf()`, `endOf()`
- **Formatting**: `format()`, `toString()`
- **Comparison**: `isBefore()`, `isAfter()`, `isSame()`, `isSameDay()`, `isBetween()`, `diff()`
- **Conversion**: `toDate()`, `clone()`
- **Utilities**: `isLeapYear()`, `range()`

## Identified Issues & Optimization Opportunities

### 1. Performance Issues

#### Critical Issues
- **Excessive object creation in `from()` method**: Multiple parsing attempts create temporary objects
- **Inefficient cache key generation**: JSON.stringify for complex objects in IntlCache
- **Redundant timezone validation**: Multiple Intl.DateTimeFormat instantiations
- **Format token regex compilation**: Repeated regex operations in formatting

#### Moderate Issues
- **WeakMap overhead in format cache**: Per-instance caching may be excessive
- **Dynamic cache resizing**: Frequent resize checks impact performance
- **Duplicate timezone conversions**: Multiple `withTimeZone()` calls

### 2. Code Organization Issues

#### Modularity Problems
- **Monolithic files**: TemporalUtils.ts (926 lines) contains multiple responsibilities
- **Mixed concerns**: Caching, utilities, and core logic intermingled
- **Internal classes exposed**: LRUCache, IntlCache, DiffCache should be internal

#### Maintainability Issues
- **Spanish comments mixed with English**: Inconsistent documentation language
- **Complex nested conditionals**: Deep nesting in `from()` method
- **Tight coupling**: Cache classes directly reference each other

### 3. TypeScript Typing Issues

#### Type Safety Problems
- **Loose `any` types**: Several instances of `any` in cache implementations
- **Missing generic constraints**: LRUCache could be more type-safe
- **Incomplete type guards**: Some validation functions lack proper typing

#### Developer Experience Issues
- **Missing JSDoc**: Incomplete documentation for internal APIs
- **Unclear type relationships**: Complex union types without proper discrimination

## Proposed Modularization Strategy

### Core Modules

```
src/
├── core/
│   ├── TemporalUtils.ts          # Core parsing and utility functions
│   ├── TemporalWrapper.ts        # Main wrapper class (simplified)
│   └── types.ts                  # Core type definitions
├── parsing/
│   ├── InputParser.ts            # Centralized input parsing logic
│   ├── TypeDetector.ts           # Input type detection and validation
│   └── ParseStrategies.ts        # Strategy pattern for different input types
├── formatting/
│   ├── TokenFormatter.ts         # Day.js-style token formatting
│   ├── IntlFormatter.ts          # Intl.DateTimeFormat wrapper
│   └── FormatCache.ts            # Formatting-specific caching
├── caching/
│   ├── LRUCache.ts              # Generic LRU cache implementation
│   ├── CacheCoordinator.ts      # Global cache management
│   └── CacheOptimizer.ts        # Dynamic cache sizing logic
├── comparison/
│   ├── Comparators.ts           # Date comparison functions
│   └── DiffCalculator.ts        # Difference calculation with caching
└── utils/
    ├── TimezoneUtils.ts         # Timezone validation and conversion
    ├── LocaleUtils.ts           # Locale validation and normalization
    └── ValidationUtils.ts       # Input validation helpers
```

### Benefits of Modularization
- **Separation of Concerns**: Each module has a single responsibility
- **Testability**: Easier to unit test individual components
- **Tree Shaking**: Better bundle optimization for consumers
- **Maintainability**: Clearer code organization and dependencies

## Performance Optimizations

### 1. Input Parsing Optimization (High Impact)

**Current Issue**: Multiple parsing attempts with object creation
```typescript
// Current inefficient approach
try {
    const instant = Temporal.Instant.from(input);
    return instant.toZonedDateTimeISO(tz);
} catch (e) {
    try {
        const pdt = Temporal.PlainDateTime.from(input);
        return pdt.toZonedDateTime(tz);
    } catch (e2) {
        throw new InvalidDateError(`Invalid date string: ${input}`);
    }
}
```

**Proposed Solution**: Type-first parsing with strategy pattern
```typescript
class InputParser {
    private static strategies = new Map<string, ParseStrategy>();
    
    static parse(input: DateInput, timeZone?: string): Temporal.ZonedDateTime {
        const type = TypeDetector.detect(input);
        const strategy = this.strategies.get(type);
        return strategy.parse(input, timeZone);
    }
}
```

**Expected Impact**: 40-60% reduction in parsing time for common inputs

### 2. Cache Key Optimization (Medium Impact)

**Current Issue**: Expensive JSON.stringify for cache keys
```typescript
const key = `${locale}-${JSON.stringify(options)}`;
```

**Proposed Solution**: Structured cache keys
```typescript
class CacheKeyBuilder {
    static buildIntlKey(locale: string, options: Intl.DateTimeFormatOptions): string {
        return `${locale}:${options.dateStyle || ''}:${options.timeStyle || ''}:${options.timeZone || ''}`;
    }
}
```

**Expected Impact**: 20-30% improvement in cache operations

### 3. Format Token Optimization (Medium Impact)

**Current Issue**: Regex compilation and WeakMap overhead

**Proposed Solution**: Pre-compiled token maps with object pooling
```typescript
class TokenFormatter {
    private static tokenPool = new Map<string, FormatTokenMap>();
    
    static format(instance: TemporalWrapper, template: string, locale?: string): string {
        const key = this.buildTokenKey(instance, locale);
        let tokens = this.tokenPool.get(key);
        if (!tokens) {
            tokens = this.createTokenMap(instance, locale);
            this.tokenPool.set(key, tokens);
        }
        return this.applyTokens(template, tokens);
    }
}
```

**Expected Impact**: 15-25% improvement in formatting operations

## TypeScript Improvements

### 1. Enhanced Type Safety

```typescript
// Current loose typing
class LRUCache<K, V> {
    private cache = new Map<K, V>();
    // ...
}

// Proposed strict typing
interface CacheEntry<V> {
    value: V;
    timestamp: number;
    accessCount: number;
}

class LRUCache<K extends string | number | symbol, V> {
    private cache = new Map<K, CacheEntry<V>>();
    private readonly maxSize: number;
    
    constructor(maxSize: number) {
        if (maxSize < 1) {
            throw new TypeError('Cache size must be at least 1');
        }
        this.maxSize = maxSize;
    }
    // ...
}
```

### 2. Better Generic Constraints

```typescript
// Enhanced input parsing with better type discrimination
type ParseableInput = 
    | { type: 'string'; value: string }
    | { type: 'number'; value: number }
    | { type: 'date'; value: Date }
    | { type: 'temporal'; value: Temporal.ZonedDateTime }
    | { type: 'firebase'; value: FirebaseTimestampLike };

class TypeDetector {
    static detect(input: DateInput): ParseableInput {
        // Type-safe detection logic
    }
}
```

### 3. Improved Error Types

```typescript
// More specific error types
export class ParseError extends Error {
    constructor(
        message: string,
        public readonly input: unknown,
        public readonly inputType: string
    ) {
        super(message);
        this.name = 'ParseError';
    }
}

export class TimezoneError extends Error {
    constructor(
        message: string,
        public readonly timezone: string
    ) {
        super(message);
        this.name = 'TimezoneError';
    }
}
```

## Risk Assessment

### Low Risk Changes (Safe to implement immediately)
- **Code organization**: Moving internal classes to separate files
- **Documentation improvements**: Adding JSDoc and fixing language consistency
- **Type safety enhancements**: Stricter typing without API changes
- **Performance optimizations**: Cache key improvements, object pooling

### Medium Risk Changes (Require careful testing)
- **Input parsing refactor**: Strategy pattern implementation
- **Cache architecture changes**: Modular cache system
- **Format token optimization**: Pre-compiled token maps

### High Risk Changes (Require deprecation cycle)
- **Internal API exposure**: Currently exported internal classes
- **Cache configuration**: Global cache settings might affect existing users

## Implementation Plan

### Phase 1: Foundation (Low Risk)
1. **File organization**: Split monolithic files into modules
2. **Type improvements**: Add strict typing and generic constraints
3. **Documentation**: Standardize comments and add missing JSDoc
4. **Test enhancements**: Add performance benchmarks

### Phase 2: Performance (Medium Risk)
1. **Input parsing**: Implement strategy pattern
2. **Cache optimization**: Improve key generation and storage
3. **Format optimization**: Pre-compiled tokens and object pooling
4. **Memory management**: Optimize object creation patterns

### Phase 3: Architecture (Medium Risk)
1. **Cache modularization**: Separate cache concerns
2. **Plugin system**: Prepare for better extensibility
3. **Bundle optimization**: Tree-shaking improvements

## Breaking Changes (None Planned)

All proposed changes maintain backward compatibility. The only potential breaking changes are:

1. **Internal class exports**: `LRUCache`, `IntlCache`, `DiffCache` should become internal
   - **Migration**: Provide deprecation warnings for 2 releases
   - **Alternative**: Export from dedicated `/internal` entry point

2. **Cache configuration**: Global cache settings might change behavior
   - **Migration**: Maintain current defaults, add opt-in new behavior

## Success Metrics

### Performance Targets
- **Parsing speed**: 40-60% improvement for common inputs
- **Memory usage**: 20-30% reduction in object allocation
- **Bundle size**: 10-15% reduction through better tree-shaking
- **Cache efficiency**: 90%+ hit ratio for formatting operations

### Quality Targets
- **Test coverage**: Maintain 95%+ coverage
- **Type safety**: Zero `any` types in public APIs
- **Documentation**: 100% JSDoc coverage for public APIs
- **Maintainability**: Reduce cyclomatic complexity by 30%

## Timeline Estimate

- **Phase 1**: 1-2 weeks (Foundation)
- **Phase 2**: 2-3 weeks (Performance)
- **Phase 3**: 1-2 weeks (Architecture)
- **Testing & Validation**: 1 week

**Total**: 5-8 weeks for complete implementation

## Conclusion

This refactor plan provides a comprehensive approach to improving the atemporal library while maintaining full backward compatibility. The modular architecture will improve maintainability, the performance optimizations will provide significant speed improvements, and the TypeScript enhancements will improve developer experience.

The phased approach allows for incremental delivery and risk mitigation, ensuring that each change is thoroughly tested before proceeding to the next phase.