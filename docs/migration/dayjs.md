# Migrating from Day.js

This guide shows the one-to-one translation between common Day.js idioms
and atemporal idioms. The atemporal API surface is intentionally
familiar to Day.js users — most of the conversion is mechanical.

## Importing

```ts
// Day.js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
```

```ts
// atemporal — no plugin setup required; first-class timezones
import atemporal from 'atemporal';
```

## Construction

| Day.js                                  | atemporal                                          |
| --------------------------------------- | -------------------------------------------------- |
| `dayjs()`                               | `atemporal()`                                      |
| `dayjs('2024-01-15')`                   | `atemporal('2024-01-15')`                          |
| `dayjs(1640995200000)`                  | `atemporal(1640995200000)`                         |
| `dayjs(new Date())`                     | `atemporal(new Date())`                           |
| `dayjs.tz('2024-01-15', 'America/NY')`  | `atemporal('2024-01-15', 'America/New_York')`     |
| `dayjs.utc('2024-01-15')`               | `atemporal('2024-01-15', 'UTC')`                   |
| `dayjs.unix(1640995200)`                | `atemporal.unix(1640995200)` *(see below)*         |

`atemporal` does not currently ship a `unix(seconds)` shortcut. Use
`atemporal(seconds * 1000)` (milliseconds) or the `X` format token
(`atemporal(seconds * 1000).format('X')`).

## Formatting

The format tokens are compatible with Day.js and moment.js.

| Day.js               | atemporal                                  |
| -------------------- | ------------------------------------------ |
| `d.format()`         | `atemporal(d).format(atemporal.presets.ISO)` |
| `d.format('YYYY-MM-DD')` | `d.format('YYYY-MM-DD')` *(same)*      |
| `d.format('hh:mm A')` | `d.format('hh:mm A')` *(same)*            |

## Adding and subtracting

Day.js's `.add()` mutates the instance. atemporal's `.add()` returns a
new instance (immutable).

| Day.js               | atemporal                                  |
| -------------------- | ------------------------------------------ |
| `d.add(1, 'day')`    | `d.add(1, 'day')`                          |
| `d.subtract(2, 'hour')` | `d.subtract(2, 'hour')`                 |
| `d.add(3, 'month')`  | `d.add(3, 'month')`                        |

## Comparison

| Day.js                       | atemporal                                |
| ---------------------------- | ---------------------------------------- |
| `a.isBefore(b)`              | `a.isBefore(b)`                          |
| `a.isSame(b)`                | `a.isSame(b)`                            |
| `a.isAfter(b)`               | `a.isAfter(b)`                           |
| `a.isBetween(b, c)`          | `a.isBetween(b, c)`                      |

## Differences

1. **Immutability.** atemporal never mutates. Use `const d2 = d.add(1, 'day');`
   instead of `d.add(1, 'day')` and expecting `d` to change.
2. **No plugins needed.** atemporal ships with first-class time zones,
   ISO formatting, and custom parsing — no `dayjs.extend()` calls.
3. **Stricter input validation.** `atemporal('not a date')` returns an
   *invalid* wrapper (use `.isValid()` to check) instead of returning
   a NaN-laden Day.js object. Use `atemporal.try()` for a null-returning
   variant.
4. **Error codes.** atemporal errors carry a stable `code` field
   (`ATEMPORAL_INVALID_DATE`, etc.) for i18n and dashboards.
5. **Native Temporal under the hood.** atemporal auto-uses the TC39
   Temporal proposal when available (Chrome 144+, Firefox 139+) and
   otherwise falls back to the polyfill.

## What Day.js has that atemporal does not (yet)

- `dayjs.duration(...)` — partial; use `atemporal.duration(...)` which
  returns a `Temporal.Duration` (a different type).
- Locale-aware relative time formatting — atemporal has a separate
  `relativeTime` plugin with comparable functionality.

## Automatic migration

For large codebases, you can use a codemod:

```bash
npx jscodeshift -t atemporal-codemod.js src/
```

The official codemod is published as `@atemporal/codemod`. See the
[codemod repo](https://github.com/NaturalDevCR/atemporal-codemod) for
details.
