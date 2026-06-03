# timeSlots

Find available free time slots in a schedule.

## Usage

```ts
import atemporal from "atemporal";
import timeSlots from "atemporal/plugins/timeSlots";

atemporal.extend(timeSlots);

const slots = atemporal.findAvailableSlots({
  range: { start: "2023-01-01T09:00:00", end: "2023-01-01T17:00:00" },
  duration: { minutes: 30 },
  interval: { minutes: 30 },
  busySlots: [{ start: "2023-01-01T12:00:00", end: "2023-01-01T13:00:00" }],
});

// slots is an array of TimeSlot objects:
// [
//   { start: atemporal("2023-01-01T09:00:00"), end: atemporal("2023-01-01T09:30:00") },
//   { start: atemporal("2023-01-01T09:30:00"), end: atemporal("2023-01-01T10:00:00") },
//   ...
// ]
```

## API

### `atemporal.findAvailableSlots(options)`

### Options

```ts
interface AvailabilityOptions {
  range: DateRange;                // { start, end } — the search window
  duration: Temporal.DurationLike; // Duration of each slot
  interval?: Temporal.DurationLike; // Gap between slot start times (default: same as duration)
  busySlots: Array<DateRange>;     // Array of { start, end } — occupied periods
}
```

### Return Type

```ts
interface TimeSlot {
  start: TemporalWrapper; // Start of the available slot
  end: TemporalWrapper;   // End of the available slot
}
```

## How It Works

The algorithm operates in two phases:

1. **Merge overlapping busy slots**: Overlapping or touching busy periods are merged into a single blocked span to simplify checking.
2. **Scan for free slots**: Starting from the beginning of the range, the algorithm advances in steps of `interval` and checks each potential slot against the merged busy periods. A slot is free when its end does not extend into the next busy period.

Touching boundaries are considered non-overlapping — a slot that ends exactly when a busy period starts is valid.

## Examples

### Basic 30-minute slots

```ts
const slots = atemporal.findAvailableSlots({
  range: { start: "2023-01-01T09:00:00", end: "2023-01-01T11:00:00" },
  duration: { minutes: 30 },
  busySlots: [{ start: "2023-01-01T09:30:00", end: "2023-01-01T10:00:00" }],
});

// 4 slots total (3 free + 1 blocked):
// 09:00-09:30 ✓
// 09:30-10:00 ✗ (busy)
// 10:00-10:30 ✓
// 10:30-11:00 ✓
```

### Multiple overlapping busy slots (auto-merged)

```ts
const slots = atemporal.findAvailableSlots({
  range: { start: "2023-01-01T09:00:00", end: "2023-01-01T12:00:00" },
  duration: { minutes: 30 },
  busySlots: [
    { start: "2023-01-01T09:30:00", end: "2023-01-01T10:00:00" },
    { start: "2023-01-01T09:45:00", end: "2023-01-01T10:15:00" }, // Overlaps with previous
  ],
});

// Overlapping busy slots are merged into 09:30-10:15
// Result: 09:00-09:30, 10:15-10:45, 10:45-11:15, 11:15-11:45
```

### Custom interval (gap between slots)

```ts
const slots = atemporal.findAvailableSlots({
  range: { start: "2023-01-01T09:00:00", end: "2023-01-01T10:00:00" },
  duration: { minutes: 15 },
  interval: { minutes: 30 }, // Slots start every 30 minutes
  busySlots: [],
});

// 15-minute slots starting every 30 minutes:
// 09:00-09:15, 09:30-09:45
```
