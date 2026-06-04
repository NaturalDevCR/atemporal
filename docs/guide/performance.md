# Performance & Caching

Atemporal is built with performance in mind. To handle intensive formatting, parsing, and difference calculations, it implements several internal caching mechanisms and coordinators.

In this guide, you will learn how Atemporal optimizes operations and how you can interact with these engines to monitor or fine-tune performance.

## Internal Caching Systems

Atemporal relies on several key optimization engines:

- **ParseCoordinator**: Speeds up parsing by caching string inputs and dynamically choosing the most efficient parsing strategy based on the input type. Uses 12 specialized strategies (string, number, Date, Temporal variants, Firebase timestamps, arrays, objects).
- **FormattingEngine**: Pools tokens and caches format compilations to drastically reduce the overhead of string formatting. Pre-compiles common patterns on initialization.
- **DiffCache**: Caches the results of difference calculations (`diff()`) for recurring date pairs using an LRU strategy.
- **IntlCache**: Caches `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` instances to avoid repeated construction costs.
- **LRUCache**: Generic Least Recently Used cache implementation used throughout the library.
- **RegexCache**: Centralized regex cache with precompiled static patterns and LRU-backed dynamic pattern caching.

## Formatting Performance Utilities

If you are using Atemporal in an environment with high formatting throughput (like a large list rendering in a UI framework), you can interact directly with the formatting engine.

```ts
import atemporal from "atemporal";

// Pre-warms the formatting system with common patterns
// Useful to call during app startup so initial renders are lightning fast
atemporal.prewarmFormattingSystem();

// Get a human readable formatting performance report
console.log(atemporal.getFormattingPerformanceReport());

// Get the raw formatting metrics object
const metrics = atemporal.getFormattingMetrics();
/* {
     totalFormats: number,
     averageFormatTime: number,
     cacheHits: number,
     fastPathHits: number,
     // ...
   }
*/

// Clear all formatting caches and resets metrics
atemporal.resetFormattingSystem();
```

## Parsing Performance Utilities

Parsing strings into dates is notoriously slow in JS. Atemporal exposes static methods via `TemporalUtils` to benchmark and manage parsing.

> [!NOTE]
> Since these are advanced utilities, they are not exported on the main `atemporal` factory. You must import `TemporalUtils` from the internal source path.

```ts
import { TemporalUtils } from "atemporal/src/TemporalUtils";

// Get a comprehensive human-readable parsing performance report
console.log(TemporalUtils.getParsingPerformanceReport());

// Get raw parsing metrics (cache hit ratio, strategy usage)
const metrics = TemporalUtils.getParsingMetrics();

// Benchmark parsing for different input types
const results = TemporalUtils.benchmarkParsing();
console.log(results);

// Clear the parsing cache (useful for testing or memory management)
TemporalUtils.clearParsingCache();

// Reset metrics for benchmarking
TemporalUtils.resetParsingMetrics();

// Update parsing configuration
TemporalUtils.updateParsingConfig({
  enableAutoOptimization: true,
  autoOptimizationInterval: 60000,
  maxStrategyAttempts: 3
});
```

## Diff Cache

The `DiffCache` caches results from `diff()` calculations. It is exported from the same module as `TemporalUtils`:

```ts
import { DiffCache, TemporalUtils } from "atemporal/src/TemporalUtils";

// Get diff cache statistics
const stats = DiffCache.getStats();
// { size: number, hits: number, misses: number, hitRatio: number, ... }

// Clear the diff cache
DiffCache.clear();
```

## Intl Cache

The `IntlCache` reuses `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` instances:

```ts
import { IntlCache } from "atemporal/src/TemporalUtils";

// Pre-warm the Intl cache with common locale/option combinations
// This is done automatically by the FormattingEngine
const formatter = IntlCache.get("en-US", { dateStyle: "full" });
```

## LRU Cache

A generic `LRUCache<K, V>` is available for custom caching needs:

```ts
import { LRUCache } from "atemporal/src/TemporalUtils";

const cache = new LRUCache<string, number>(100); // max 100 entries

cache.set("key1", 42);
console.log(cache.get("key1")); // 42
console.log(cache.getMetrics());
// { hits: 1, misses: 0, hitRatio: 1.0, size: 1, maxSize: 100, utilization: 0.01 }
```

You can also use `ResizableLRUCache<K, V>` which extends `Map` and supports dynamic resizing:

```ts
import { ResizableLRUCache } from "atemporal/src/TemporalUtils"; // via LRUCache module

const cache = new ResizableLRUCache<string, number>(200);
cache.setMaxSize(500); // Resize on demand
cache.setResizeInterval(60000); // Auto-resize every 60 seconds
```

## Global Cache Coordinator

For complete control over all caches, Atemporal exports `GlobalCacheCoordinator`.

```ts
import { GlobalCacheCoordinator } from "atemporal/src/TemporalUtils";

// Clear ALL caches (Parsing, Formatting, Diff, and any plugin-registered caches)
GlobalCacheCoordinator.clearAll();

// Get combined stats across all caching engines
const stats = GlobalCacheCoordinator.getAllStats();
console.log(stats.total.cacheCount);

// Register a custom cache to be managed by the coordinator
GlobalCacheCoordinator.registerCache("myCache", myCacheInstance);
```
