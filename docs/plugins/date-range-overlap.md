# dateRangeOverlap

Provides date range overlap detection capabilities.

## Usage

The plugin offers both a standalone static function and instance methods.

### Standalone Function

`checkDateRangeOverlap` is exported directly from the `atemporal` package — no plugin extension needed for the static function:

```ts
import atemporal, { checkDateRangeOverlap } from "atemporal";

const range1 = { start: "2024-01-01", end: "2024-01-15" };
const range2 = { start: "2024-01-10", end: "2024-01-20" };

const result = checkDateRangeOverlap(range1, range2);
console.log(result.overlaps); // true
console.log(result.overlapRange); // { start: ..., end: ... }
```

### Plugin Extension (Instance Methods)

For instance methods, extend atemporal with the plugin:

```ts
import atemporal from "atemporal";
import dateRangeOverlapPlugin from "atemporal/plugins/dateRangeOverlap";

atemporal.extend(dateRangeOverlapPlugin);

const range1 = { start: "2024-01-01", end: "2024-01-15" };
const range2 = { start: "2024-01-10", end: "2024-01-20" };

// Static method (also available directly via plugin)
const result = atemporal.checkDateRangeOverlap(range1, range2);
console.log(result.overlaps); // true
console.log(result.overlapRange); // { start: ..., end: ... }
```

## Instance Method

```ts
const date = atemporal("2024-01-15");
const range = { start: "2024-01-10", end: "2024-01-20" };

const result = date.rangeOverlapsWith(range);
console.log(result.overlaps); // true
console.log(result.overlapRange); // { start: 2024-01-15, end: 2024-01-15 } (point)
```

### `.to(endDate: DateInput)`

Returns a `DateRange` object bridging the instance to the given end date.

```ts
const start = atemporal("2024-01-01");
const rangeObj = start.to("2024-01-15");
// returns { start: atemporal("2024-01-01"), end: atemporal("2024-01-15") }

// Use the result directly with checkDateRangeOverlap
const overlap = checkDateRangeOverlap(
  start.to("2024-01-15"),
  atemporal("2024-01-10").to("2024-01-20")
);
console.log(overlap.overlaps); // true
```

## Configuration

```ts
const result = checkDateRangeOverlap(range1, range2, {
  includeBoundaries: true,   // Whether touching ranges count as overlap (default: true)
  timezone: "UTC",            // Timezone for date interpretation (default: UTC)
  strictValidation: true,     // Perform strict input validation (default: true)
});
```

- **`includeBoundaries`**: When `true` (default), adjacent ranges touching at a boundary count as overlapping. When `false`, they do not.
- **`timezone`**: The IANA time zone to interpret date strings in (default: UTC).
- **`strictValidation`**: When `true` (default), invalid inputs throw `InvalidDateRangeError`.

## Return Type

```ts
interface OverlapResult {
  overlaps: boolean;
  overlapRange: DateRange | null;
}
```

## Caching

Results are cached via `OverlapCache` (LRU-based, max 200 entries) for repeated checks on the same ranges. The cache is registered with the `GlobalCacheCoordinator` for unified cache management.

## Error Types

The plugin exports custom error classes available both from the plugin and the main package:

```ts
import {
  InvalidDateRangeError,
  OverlapDetectionError,
} from "atemporal";
// (also available from "atemporal/plugins/dateRangeOverlap")
```
