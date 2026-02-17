# dateRangeOverlap

Provides date range overlap detection capabilities.

## Usage

```ts
import atemporal from "atemporal";
import dateRangeOverlapPlugin from "atemporal/plugins/dateRangeOverlap";

atemporal.extend(dateRangeOverlapPlugin);

const range1 = { start: "2024-01-01", end: "2024-01-15" };
const range2 = { start: "2024-01-10", end: "2024-01-20" };

const result = atemporal.checkDateRangeOverlap(range1, range2);
console.log(result.overlaps); // true
console.log(result.overlapRange); // { start: ..., end: ... }
```

## Instance Method

```ts
const date = atemporal("2024-01-15");
const range = { start: "2024-01-10", end: "2024-01-20" };

date.rangeOverlapsWith(range); // overlaps: true
```

## Configuration

- `includeBoundaries`: Whether touching ranges count as overlap (default: `true`).
- `timezone`: Timezone for date interpretation.
- `strictValidation`: Whether to perform strict input validation (default: `true`).
