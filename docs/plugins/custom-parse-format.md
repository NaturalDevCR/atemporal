# customParseFormat

Allows creating an `atemporal` instance from a string with a custom format. Features high-performance parsing with intelligent caching and comprehensive date validation.

## Usage

```ts
import atemporal from "atemporal";
import customParseFormat from "atemporal/plugins/customParseFormat";

atemporal.extend(customParseFormat);

// Basic date parsing
const date1 = atemporal.fromFormat("15/03/2024 10:30", "DD/MM/YYYY HH:mm");
console.log(date1.toString()); // "2024-03-15T10:30:00.000Z"

// 12-hour format with AM/PM
const ampm = atemporal.fromFormat("2024-01-01 02:30 PM", "YYYY-MM-DD hh:mm A");

// With a specific time zone
const withTz = atemporal.fromFormat("2024-01-01 10:00", "YYYY-MM-DD HH:mm", "America/New_York");
```

## Supported Tokens

| Token  | Description                                       | Example Input    |
| ------ | ------------------------------------------------- | ---------------- |
| `YYYY` | 4-digit year                                       | `2024`           |
| `YY`   | 2-digit year (00-68 → 2000s, 69-99 → 1900s)      | `24` → `2024`    |
| `MMMM` | Full month name (case-insensitive)                 | `January`, `january` |
| `MMM`  | Abbreviated month name (case-insensitive)          | `Jan`, `jan`     |
| `MM`   | 2-digit month (01-12)                              | `03`             |
| `M`    | 1-2 digit month (1-12)                             | `3`              |
| `DD`   | 2-digit day of month (01-31)                       | `15`             |
| `D`    | 1-2 digit day of month (1-31)                      | `5`              |
| `DDD`  | Zero-padded day of year (001-366)                  | `074`            |
| `DDDD` | Non-padded day of year (1-366)                     | `74`             |
| `HH`   | 2-digit 24h hour (00-23)                           | `10`             |
| `H`    | 1-2 digit 24h hour (0-23)                          | `8`              |
| `hh`   | 2-digit 12h hour (01-12)                           | `02`             |
| `h`    | 1-2 digit 12h hour (1-12)                          | `2`              |
| `mm`   | 2-digit minute (00-59)                             | `30`             |
| `m`    | 1-2 digit minute (0-59)                            | `5`              |
| `ss`   | 2-digit second (00-59)                             | `45`             |
| `s`    | 1-2 digit second (0-59)                            | `9`              |
| `SSS`  | 3-digit millisecond (000-999)                      | `123`            |
| `SS`   | 2-digit centisecond (00-99)                        | `45`             |
| `S`    | 1-digit decisecond (0-9)                           | `3`              |
| `A`    | Uppercase AM/PM                                    | `PM`             |
| `a`    | Lowercase am/pm                                    | `pm`             |

## Error Handling

When the date string does not match the format, `fromFormat()` returns an **invalid instance** rather than throwing. Use `.isValid()` to check:

```ts
const result = atemporal.fromFormat("invalid", "YYYY-MM-DD");

if (!result.isValid()) {
  console.log("Failed to parse date");
}

// Invalid instances format as "Invalid Date"
console.log(result.format("YYYY-MM-DD")); // "Invalid Date"
```

This behavior is consistent with the rest of Atemporal — invalid inputs produce invalid instances rather than throwing exceptions.

## Cache Management

`customParseFormat` internally caches parsed format patterns for high-performance repeated parsing. You can interact with the cache:

```ts
// Clear format parsing cache
atemporal.clearFormatCache();

// Get the current cache size
console.log(atemporal.getFormatCacheSize());

// Get detailed cache statistics
console.log(atemporal.getFormatCacheStats());
// { size: number, hits: number, misses: number, hitRatio: number, ... }
```

## Advanced Controls

You can override the reference date used for `YY` year conversion:

```ts
import {
  setCurrentDateFunction,
  resetCurrentDateFunction,
} from "atemporal/plugins/customParseFormat";

// Override the date used as a reference point for YY year conversions
setCurrentDateFunction(() => new Date(2050, 0, 1));
atemporal.fromFormat("01-01-50", "DD-MM-YY"); // Will parse as 2050

resetCurrentDateFunction(); // Restore default Date.now reference
```

### Y2K Logic

Two-digit years are resolved as follows:
- `00` to `68` → `2000` to `2068`
- `69` to `99` → `1969` to `1999`

## Validation

The plugin performs rigorous date validation using `Temporal.PlainDate.from()` with `overflow: "reject"`. This means:

- Invalid dates (e.g., February 30th) are rejected
- Month names are validated against a lookup table
- Day-of-year tokens (`DDD`/`DDDD`) are validated for leap years
- All numeric ranges are enforced by regex patterns
