# Durations & Utilities

## Durations

Create and manipulate `Temporal.Duration` objects.

```ts
// Create a duration
const duration = atemporal.duration({ hours: 3, minutes: 30 });

// Use it in manipulations
const now = atemporal();
const future = now.add(duration);

console.log(future.format("HH:mm")); // => 3 hours and 30 minutes in the future
```

> [!TIP]
> Check out the [durationHumanizer](/plugins/duration-humanizer) plugin for human-readable duration strings.

## Validators & Type Guards

Atemporal provides TypeScript type guards for Firebase timestamps:

```ts
import { isFirebaseTimestamp, isFirebaseTimestampLike } from "atemporal";

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

## Formatting Performance Utilities

Atemporal includes a high-performance engine for string formats. If you need to monitor, pre-warm or reset this engine, you can use these static utilities:

```ts
// Pre-warms the formatting system with common patterns (useful during app startup)
atemporal.prewarmFormattingSystem();

// Get the raw formatting metrics object
const metrics = atemporal.getFormattingMetrics();
console.log(metrics.totalFormats);

// Get a human readable formatting performance report
console.log(atemporal.getFormattingPerformanceReport());

// Clear all formatting caches and resets metrics
atemporal.resetFormattingSystem();
```

