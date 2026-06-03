# Core Concepts

## Why Atemporal?

- **Immutable & Chainable**: A fluid and predictable coding style, inspired by Day.js. Every manipulation returns a new instance.
- **Plugin-Powered Extensibility**: Add only the functionality you need, keeping the core lightweight. 8 official plugins available, plus the ability to create your own.
- **Localization-Ready**: Native integration with `Intl` for localized formats, weekday names, month names, and relative time.
- **Time Zone-Aware**: First-class support for IANA time zones (e.g., `America/New_York`, `Asia/Tokyo`). All operations respect time zone context.
- **Type-Safe**: Built in TypeScript for excellent autocompletion, rich type guards, and detailed type definitions.
- **Temporal-Powered**: Uses the TC39 Stage 4 Temporal API (ES2026) as its foundation, with automatic polyfill fallback.

## Immutability

All manipulation methods in Atemporal are immutable. This means that instead of modifying the existing instance, they return a new instance with the changes applied.

```ts
const original = atemporal();
const future = original.add(1, "day");

console.log(original.isSame(future)); // false — original is unchanged
```

This prevents the class of bugs caused by accidentally mutating date objects shared across different parts of an application.

## Plugin System

Atemporal has a lightweight plugin system that allows you to extend functionality only when needed. This keeps the core bundle small while enabling powerful features on demand.

### How Plugins Work

Plugins are functions that receive the `atemporal` factory and instances, allowing them to add new methods:

```ts
import atemporal from "atemporal";
import relativeTime from "atemporal/plugins/relativeTime";

// Register a plugin — it adds methods like .fromNow() and .toNow()
atemporal.extend(relativeTime);

// Now you can use plugin methods
atemporal().subtract(5, "minutes").fromNow(); // "5 minutes ago"
```

### Lazy Loading

To reduce initial bundle size, plugins can be loaded on demand:

```ts
// Load a plugin only when needed
await atemporal.lazyLoad("relativeTime");

// Load multiple plugins at once
await atemporal.lazyLoadMultiple(["businessDays", "timeSlots"]);
```

### Plugin Utilities

```ts
atemporal.isPluginLoaded("relativeTime");   // Check if a plugin is loaded
atemporal.getLoadedPlugins();                // List all loaded plugins
atemporal.getAvailablePlugins();             // List all plugins available for lazy loading
```

### Creating Your Own Plugin

You can create custom plugins using the `Plugin` type signature:

```ts
import type { Plugin } from "atemporal";
import { markAsPlugin } from "atemporal";

const myPlugin: Plugin = (Atemporal, atemporal, options) => {
  // Add instance methods to the prototype
  Atemporal.prototype.myMethod = function () {
    // 'this' refers to the atemporal instance
    return this.format("YYYY-MM-DD");
  };

  // Add static methods to the factory
  (atemporal as any).myStaticMethod = function () {
    return "hello from plugin";
  };
};

// Mark it as a valid atemporal plugin
markAsPlugin(myPlugin);

// Register it
atemporal.extend(myPlugin);
```

The `Plugin` type signature is:

```ts
type Plugin = (
  Atemporal: typeof TemporalWrapper,
  atemporal: AtemporalFactory,
  options?: any
) => void;
```

## Input Types (DateInput)

Atemporal accepts a wide variety of input types via the `DateInput` union type:

| Input Type | Example |
|------------|---------|
| `string` (ISO 8601) | `"2025-07-09T15:30:00Z"`, `"2025-07-09"` |
| `number` (timestamp ms) | `1752096000000` |
| `Date` | `new Date()` |
| `Temporal.ZonedDateTime` | `Temporal.ZonedDateTime.from(...)` |
| `Temporal.PlainDateTime` | `Temporal.PlainDateTime.from(...)` |
| `Temporal.PlainDate` | `Temporal.PlainDate.from(...)` |
| `Temporal.Instant` | `Temporal.Instant.fromEpochMilliseconds(...)` |
| `FirebaseTimestamp` | `{ seconds: 1672531200, nanoseconds: 0 }` |
| `Array` | `[2025, 7, 9, 15, 30]` (year, month, day, hour, min) |
| `Plain Object` | `{ year: 2025, month: 7, day: 9 }` |
| `TemporalWrapper` | Another atemporal instance (cloned) |

When no input is provided (`atemporal()`), the current date and time is used. Passing `null` or `undefined` behaves the same way.

### Error Handling

Invalid inputs do **not** throw exceptions. Instead, an invalid instance is returned. You can check validity with `.isValid()`:

```ts
const maybeDate = atemporal("not a date");
console.log(maybeDate.isValid()); // false
console.log(maybeDate.format("YYYY-MM-DD")); // "Invalid Date"
```

You can also pre-validate inputs before creating instances:

```ts
if (atemporal.isValid(someInput)) {
  const date = atemporal(someInput);
  // ...
}
```

## Time Zone Management

Atemporal provides full IANA time zone support:

```ts
// Set a global default time zone (default: UTC)
atemporal.setDefaultTimeZone("America/New_York");

// Create instances in specific zones
const ny = atemporal("2025-01-01T12:00:00", "America/New_York");
const tokyo = ny.timeZone("Asia/Tokyo");

// Check the current default
atemporal.getDefaultLocale();
```

### Validating Time Zones

```ts
atemporal.isValidTimeZone("America/New_York"); // true
atemporal.isValidTimeZone("Invalid/Zone");     // false
```

## Locale & Internationalization

Atemporal uses the `Intl` API for locale-aware formatting:

```ts
// Set a global default locale (default: "en")
atemporal.setDefaultLocale("es-CR");

// Format with a specific locale
atemporal().format({ dateStyle: "full" }, "ja-JP"); // Japanese full date
atemporal().format("dddd, MMMM Do YYYY", "es");     // Spanish with ordinals
```

### Validating Locales

```ts
atemporal.isValidLocale("en-US");  // true
atemporal.isValidLocale("en");     // true
atemporal.isValidLocale("zz");     // false
```

## Temporal API

Atemporal is built directly on top of the [Temporal API](https://tc39.es/proposal-temporal/docs/), which is the modern standard for date and time in JavaScript (TC39 Stage 4, ES2026). It solves many of the problems with the legacy `Date` object:

- **Immutability**: Temporal objects are immutable by design
- **Time Zone Support**: `ZonedDateTime` provides accurate wall-clock time with IANA zones
- **Date-Only Types**: `PlainDate` and `PlainDateTime` for calendar operations without time zone concerns
- **Durations**: First-class `Duration` type with correct arithmetic
- **Non-Gregorian Calendars**: Built-in support for multiple calendar systems

### Accessing the Underlying Temporal Object

You can access the raw `Temporal.ZonedDateTime` for advanced use cases:

```ts
const date = atemporal();
const raw: Temporal.ZonedDateTime = date.datetime; // or date.raw
```

### Checking Temporal Implementation

```ts
const info = atemporal.getTemporalInfo();
// { isNative: boolean, environment: "browser" | "node" | "unknown", version: "native" | "polyfill" }
```

## Internal Architecture

Under the hood, Atemporal is powered by several high-performance subsystems:

- **ParseCoordinator**: Type-first parsing engine with 12 strategies (string, number, Date, Temporal variants, Firebase timestamps, arrays, objects). Uses intelligent caching and auto-optimization.
- **FormattingEngine**: Token-based formatter with token compilation, object pooling, and multi-level caching for high-throughput scenarios.
- **ComparisonEngine**: Optimized date comparison logic with its own cache layer.
- **DiffCache**: LRU-based cache for `diff()` calculations between recurring date pairs.
- **IntlCache**: Caches `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` instances to reduce GC pressure.
- **RegexCache**: Centralized regex cache with precompiled static patterns and LRU-backed dynamic regex.
- **GlobalCacheCoordinator**: Cross-plugin cache management with unified stats and bulk operations.

For advanced usage, see the [Performance & Caching](./performance) guide.
