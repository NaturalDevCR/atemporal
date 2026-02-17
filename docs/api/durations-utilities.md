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
