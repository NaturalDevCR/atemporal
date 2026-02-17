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
```

## API

`atemporal.findAvailableSlots(options)`

### Options

- `range`: `{ start, end }`.
- `duration`: `Temporal.DurationLike`.
- `interval`: Defaults to `duration`.
- `busySlots`: Array of `{ start, end }`.
