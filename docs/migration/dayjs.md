# Migrating from Day.js

This guide covers common Day.js idioms and their atemporal equivalents. The API
is intentionally familiar to Day.js users, but the libraries are not fully
interchangeable. Atemporal's principal representation is
`Temporal.ZonedDateTime`; it does not expose the full Temporal model or promise
full Day.js compatibility. Consult the [versioned compatibility matrix](dayjs-compatibility.md)
for the reviewed scope.

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

## Construction and representation

| Day.js                                  | atemporal                                          |
| --------------------------------------- | -------------------------------------------------- |
| `dayjs()`                               | `atemporal()`                                      |
| `dayjs('2024-01-15')`                   | `atemporal('2024-01-15')`                          |
| `dayjs(1640995200000)`                  | `atemporal(1640995200000)`                         |
| `dayjs(new Date())`                     | `atemporal(new Date())`                           |
| `dayjs.tz('2024-01-15', 'America/NY')`  | `atemporal('2024-01-15', 'America/New_York')`     |
| `dayjs.utc('2024-01-15')`               | `atemporal('2024-01-15', 'UTC')`                   |
| `dayjs.unix(1640995200)`                | `atemporal.unix(1640995200)` *(see below)*         |

`atemporal.unix(seconds)` is available and creates an instance from Unix
seconds.

## Formatting and locales

Common format tokens are familiar to Day.js users. Use the documented token
set for either library; advanced tokens and locale data are not a blanket
compatibility promise.

| Day.js               | atemporal                                  |
| -------------------- | ------------------------------------------ |
| `d.format()`         | `atemporal(d).format(atemporal.presets.ISO)` |
| `d.format('YYYY-MM-DD')` | `d.format('YYYY-MM-DD')` *(same)*      |
| `d.format('hh:mm A')` | `d.format('hh:mm A')` *(same)*            |

## Adding, subtracting, and comparisons

Both Day.js and atemporal are immutable: `.add()` returns a new instance.
Use the returned value in either library. Calendar arithmetic in atemporal is
performed by its `Temporal.ZonedDateTime` representation, so review behavior
that depends on time zones or calendar units.

| Day.js               | atemporal                                  |
| -------------------- | ------------------------------------------ |
| `d.add(1, 'day')`    | `d.add(1, 'day')`                          |
| `d.subtract(2, 'hour')` | `d.subtract(2, 'hour')`                 |
| `d.add(3, 'month')`  | `d.add(3, 'month')`                        |

| Day.js                       | atemporal                                |
| ---------------------------- | ---------------------------------------- |
| `a.isBefore(b)`              | `a.isBefore(b)`                          |
| `a.isSame(b)`                | `a.isSame(b)`                            |
| `a.isAfter(b)`               | `a.isAfter(b)`                           |
| `a.isBetween(b, c)`          | `a.isBetween(b, c)`                      |

## Time zones

Day.js timezone use is plugin-based. Atemporal accepts an IANA time zone when
constructing an instance and retains zone context in its
`Temporal.ZonedDateTime` representation. Migrations should review parsing and
conversion behavior instead of treating the APIs as aliases.

## Durations

`atemporal.duration(...)` returns a `Temporal.Duration`, rather than a Day.js
duration object. Use it when the application needs a Temporal duration; do not
assume the Day.js duration API is reproduced.

## Plugins and relative time

Atemporal's official plugins are installed with `atemporal.extend(...)`.
Relative-time output requires the `relativeTime` plugin. Day.js custom plugins
do not have a publicly guaranteed adapter, so migrate them as independent
extensions rather than loading them unchanged.

## Raw `Date` interop

Both libraries accept a JavaScript `Date` as construction input. Atemporal
returns its wrapper around `Temporal.ZonedDateTime`, not the original `Date`;
use `.toDate()` when an API requires a raw `Date`.

## Scope not covered by a one-to-one translation

- Day.js plugin interfaces are not a compatibility layer for arbitrary custom
  plugins.
- Duration and locale behavior should be reviewed against the matrix rather
  than inferred from method names.

## Automatic migration

For large codebases, you can use a codemod:

```bash
npx jscodeshift -t atemporal-codemod.js src/
```

The official codemod is published as `@atemporal/codemod`. See the
[codemod repo](https://github.com/NaturalDevCR/atemporal-codemod) for
details.
