# Migrating from Luxon

Luxon and atemporal are both immutable, time-zone-aware libraries
backed by TC39 Temporal semantics (atemporal uses the Temporal polyfill
or the native API directly; Luxon implements its own IANA database).
This guide covers the most common migration paths.

## Importing

```ts
// Luxon
import { DateTime, Duration, Interval } from 'luxon';
```

```ts
// atemporal
import atemporal from 'atemporal';
```

## Construction

| Luxon                                  | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `DateTime.now()`                       | `atemporal()`                                |
| `DateTime.fromISO('2024-01-15')`       | `atemporal('2024-01-15')`                    |
| `DateTime.fromMillis(0)`               | `atemporal(0)`                               |
| `DateTime.fromObject({ year: 2024 })`  | `atemporal({ year: 2024 })`                  |
| `DateTime.fromSQL('2024-01-15')`       | `atemporal('2024-01-15').format(atemporal.presets.SQL_DATE)` |
| `DateTime.utc(2024, 1, 15)`            | `atemporal({ year: 2024, month: 1, day: 15 }, 'UTC')` |
| `DateTime.fromSeconds(0)`              | `atemporal(0).epochSeconds`                  |

## Time zones

| Luxon                                  | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `dt.setZone('America/New_York')`       | `dt.timeZone('America/New_York')`            |
| `dt.setZone('utc')`                    | `dt.timeZone('UTC')`                         |
| `dt.zoneName`                          | `dt.timeZoneId` *(see note)*                 |

> Note: atemporal's `TemporalWrapper` does not currently expose
> `timeZoneId` as a getter. Use `dt.format('TZ')` to render the IANA
> name in a string, or read `dt._datetime.timeZoneId` for advanced use.

## Formatting

| Luxon                                  | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `dt.toISO()`                           | `dt.format(atemporal.presets.ISO)`           |
| `dt.toISODate()`                       | `dt.format('YYYY-MM-DD')`                    |
| `dt.toLocaleString()`                  | `dt.format({ dateStyle: 'full', timeStyle: 'short' })` |
| `dt.toFormat('yyyy-MM-dd')`            | `dt.format('YYYY-MM-DD')`                    |

Luxon's lowercase `yyyy` is "calendar year"; atemporal uses uppercase
`YYYY` for the same concept. Luxon's `dd` is "day of month"; atemporal
uses `DD`. They are equivalent for non-locale-sensitive use, but in
localized contexts you may need a translation table.

## Arithmetic

| Luxon                                  | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `dt.plus({ days: 1 })`                 | `dt.add(1, 'day')`                           |
| `dt.minus({ hours: 2 })`               | `dt.subtract(2, 'hour')`                     |
| `dt.plus({ months: 3 })`               | `dt.add(3, 'month')`                         |

## Comparison

| Luxon                                  | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `a < b`                                | `a.isBefore(b)` (no operator overloading)    |
| `a > b`                                | `a.isAfter(b)`                               |
| `a.equals(b)`                          | `a.isSame(b)`                                |
| `DateTime.min(a, b)`                   | `atemporal.min(a, b)`                        |

## Durations

| Luxon                                  | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `Duration.fromObject({ days: 2 })`     | `atemporal.duration({ days: 2 })`            |
| `d.as('seconds')`                      | `d.total('second')`                          |

atemporal's `atemporal.duration(...)` returns a `Temporal.Duration`,
which has `.total(unit)`, `.days`, `.hours`, etc. — a different shape
than Luxon's `Duration`.

## Intervals

Luxon's `Interval` does not have a direct atemporal equivalent. Use
the official [`dateRangeOverlap`](../plugins/date-range-overlap.md)
plugin for range algebra, or do it manually:

```ts
const overlap = a.isBefore(c) && b.isAfter(a);
```

## Differences to be aware of

1. **No operator overloading.** Use `a.isBefore(b)` instead of `a < b`.
2. **Stricter input handling.** `atemporal('not a date')` returns an
   invalid wrapper. Use `atemporal.try()` for null-returning.
3. **Strict mode.** `atemporal.setStrictMode(true)` adds console warnings
   for ambiguous operations (Date input carrying host TZ, naive strings,
   etc.). Useful in tests.

## See also

- [Migration from Day.js](dayjs.md)
- [Migration from moment.js](moment.md)
- [Migration from raw Temporal](temporal.md)
