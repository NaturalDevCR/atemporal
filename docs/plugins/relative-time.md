# relativeTime

The `relativeTime` plugin adds the `.fromNow()` and `.toNow()` methods for displaying relative time strings (e.g., "5 minutes ago").

## Usage

```ts
import atemporal from "atemporal";
import relativeTime from "atemporal/plugins/relativeTime";

atemporal.extend(relativeTime);

atemporal().subtract(5, "minutes").fromNow(); // "5 minutes ago"
atemporal().add(2, "hours").fromNow(); // "in 2 hours"
atemporal("2022-01-01").fromNow(); // "3 years ago" (example)
```

## Methods

### `.fromNow(withoutSuffix?: boolean)`

Returns the relative time from now.

```ts
const past = atemporal().subtract(45, "seconds");
past.fromNow();          // "a few seconds ago"
past.fromNow(true);      // "a few seconds"
```

### `.toNow(withoutSuffix?: boolean)`

Returns the relative time to now (inverse of `fromNow`).

```ts
const future = atemporal().add(3, "hours");
future.toNow();         // "in 3 hours"
future.toNow(true);     // "3 hours"
```

## Localization

`relativeTime` uses the default locale set via `atemporal.setDefaultLocale()`. The plugin leverages `Intl.RelativeTimeFormat` with an LRU cache for locale fallback:

```ts
atemporal.setDefaultLocale("es");
atemporal().subtract(1, "day").fromNow(); // "hace 1 día"

atemporal.setDefaultLocale("ja");
atemporal().subtract(1, "day").fromNow(); // "1日前"
```

## Threshold Logic

The plugin uses intelligent thresholds to decide which unit to display:

| Difference | Unit Displayed |
|------------|----------------|
| < 45 seconds | `"a few seconds"` |
| < 90 seconds | `"a minute"` |
| < 45 minutes | `seconds` |
| < 90 minutes | `"an hour"` |
| < 22 hours | `minutes` |
| < 36 hours | `hours` |
| < 26 days | `days` |
| < 45 days | `months` (approx.) |
| < 11 months | `months` |
| otherwise | `years` |

## Cache Management

The plugin caches `Intl.RelativeTimeFormat` instances and calculation results:

```ts
// Clear the relative time cache
atemporal.clearRelativeTimeCache();

// Get cache statistics
const stats = atemporal.getRelativeTimeCacheStats();
console.log(stats);
// { size: number, hits: number, misses: number, hitRatio: number, ... }
```
