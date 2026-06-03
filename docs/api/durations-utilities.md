# Durations & Utilities

## Durations

Create and manipulate `Temporal.Duration` objects.

```ts
// Create a duration
const duration = atemporal.duration({ hours: 3, minutes: 30 });

// From an ISO duration string
const fromISO = atemporal.duration("PT2H30M");

// Use it in manipulations
const now = atemporal();
const future = now.add(duration);

console.log(future.format("HH:mm")); // => 3 hours and 30 minutes in the future
```

Duration objects support their own arithmetic:

```ts
const d1 = atemporal.duration({ hours: 1 });
const d2 = atemporal.duration({ minutes: 30 });
const total = d1.add(d2); // Temporal.Duration of 1 hour 30 minutes

const diff = d1.subtract({ minutes: 10 }); // 50 minutes
```

> [!TIP]
> Check out the [durationHumanizer](/plugins/duration-humanizer) plugin for human-readable duration strings.

## Static Validators & Type Guards

Atemporal provides several type guard functions for runtime validation:

### `atemporal.isValid(input)`

Check if any input can be parsed to a valid date:

```ts
atemporal.isValid("2025-07-09");    // true
atemporal.isValid("not a date");     // false
atemporal.isValid(1752096000000);    // true
atemporal.isValid({ seconds: 1672531200, nanoseconds: 0 }); // true
```

### `atemporal.isAtemporal(input)`

TypeScript type guard — checks if a value is an `atemporal` (TemporalWrapper) instance:

```ts
const value: unknown = atemporal();

if (atemporal.isAtemporal(value)) {
  // TypeScript now knows 'value' is a TemporalWrapper instance
  console.log(value.format("YYYY-MM-DD"));
}
```

### `atemporal.isDuration(input)`

TypeScript type guard — checks if a value is a `Temporal.Duration`:

```ts
const dur = atemporal.duration({ hours: 2 });

if (atemporal.isDuration(dur)) {
  // TypeScript narrows to Temporal.Duration
  console.log(dur.hours); // 2
}
```

### `atemporal.isValidTimeZone(tz)`

Validates IANA time zone strings:

```ts
atemporal.isValidTimeZone("America/New_York"); // true
atemporal.isValidTimeZone("UTC");              // true
atemporal.isValidTimeZone("Invalid/Zone");     // false
```

### `atemporal.isValidLocale(code)`

Validates locale identifiers:

```ts
atemporal.isValidLocale("en-US"); // true
atemporal.isValidLocale("en");    // true
atemporal.isValidLocale("zz");    // false
```

### `atemporal.isPlugin(input)`

Checks if a value is a valid atemporal plugin:

```ts
import relativeTime from "atemporal/plugins/relativeTime";

atemporal.isPlugin(relativeTime); // true
atemporal.isPlugin(() => {});     // false
```

## Firebase Timestamp Type Guards

Atemporal exports Firebase timestamp type guards that are available from the main entry point:

```ts
import {
  isFirebaseTimestamp,
  isFirebaseTimestampLike,
} from "atemporal/types/enhanced-types";

const unknownValue: unknown = { seconds: 1672531200, nanoseconds: 0 };

if (isFirebaseTimestamp(unknownValue)) {
  // TypeScript now knows this is a valid Firebase timestamp
  const date = atemporal(unknownValue);
}

// Check for timestamp-like objects (more lenient)
if (isFirebaseTimestampLike(unknownValue)) {
  const date = atemporal(unknownValue);
}
```

> [!NOTE]
> These Firebase type guards are exported from `atemporal/types/enhanced-types`. They are part of the internal type system but available for direct import.

## Type Safety Utilities

Atemporal also exports plugin authoring utilities:

```ts
import { markAsPlugin, PLUGIN_SENTINEL } from "atemporal";

// Mark a function as a verified plugin
const myPlugin = markAsPlugin((Atemporal, atemporal, options) => {
  // plugin implementation
});

// Check if something is a plugin
atemporal.isPlugin(myPlugin); // true
```

> [!NOTE]
> Looking for Performance and Caching utilities? Check out the comprehensive **[Performance & Caching Guide](/guide/performance)**.
