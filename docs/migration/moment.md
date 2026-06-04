# Migrating from moment.js

moment.js is in maintenance mode. If you are evaluating a migration, atemporal
is a good target because:

- The format tokens are moment-compatible (atemporal uses the same `YYYY`,
  `MM`, `DD`, `hh`, `mm`, `ss`, `A`, `Z` token vocabulary as moment).
- All atemporal instances are immutable, which matches moment's behaviour
  for `.add()` / `.subtract()` returning new instances.
- atemporal is roughly 2x smaller than moment and uses Temporal under the
  hood for correct timezone arithmetic.

## Importing

```ts
// moment.js
import moment from 'moment';
import 'moment/locale/es';
moment.locale('es');
```

```ts
// atemporal
import atemporal from 'atemporal';
atemporal.setDefaultLocale('es');
```

## Construction

| moment.js                              | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `moment()`                             | `atemporal()`                                |
| `moment('2024-01-15')`                 | `atemporal('2024-01-15')`                    |
| `moment(0)`                            | `atemporal(0)`                               |
| `moment(new Date())`                   | `atemporal(new Date())`                      |
| `moment.tz('2024-01-15', 'America/NY')`| `atemporal('2024-01-15', 'America/New_York')` |
| `moment.utc('2024-01-15')`             | `atemporal('2024-01-15', 'UTC')`             |
| `moment.unix(0)`                       | `atemporal(0).epochSeconds`                  |

## Formatting

Tokens are moment-compatible.

| moment.js                              | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `m.format()`                           | `m.format(atemporal.presets.ISO)`            |
| `m.format('YYYY-MM-DD')`               | `m.format('YYYY-MM-DD')`                     |
| `m.format('LLLL')`                     | `m.format('MMMM D, YYYY h:mm A')` *(manually translated)* |

## Arithmetic

| moment.js                              | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `m.add(1, 'days')`                     | `m.add(1, 'day')`                            |
| `m.subtract(2, 'hours')`               | `m.subtract(2, 'hour')`                      |
| `m.startOf('month')`                   | `m.startOf('month')`                         |
| `m.endOf('week')`                      | `m.endOf('week')`                            |

## Comparison

| moment.js                              | atemporal                                    |
| -------------------------------------- | -------------------------------------------- |
| `a.isBefore(b)`                        | `a.isBefore(b)`                              |
| `a.isSame(b)`                          | `a.isSame(b)`                                |
| `a.isAfter(b)`                         | `a.isAfter(b)`                               |
| `a.isBetween(b, c)`                    | `a.isBetween(b, c)`                          |
| `moment.min(a, b)`                     | `atemporal.min(a, b)`                        |

## Difference from moment: no mutation

moment.js historically had mutable behaviour; later versions (2.29+)
made `.add()` etc. return new instances. atemporal is *always* immutable:

```ts
// moment (mutable in < 2.29)
const m = moment();
m.add(1, 'day');
console.log(m.format()); // 'tomorrow'

// atemporal (always immutable)
const a = atemporal();
const tomorrow = a.add(1, 'day');
console.log(a.format());         // 'today'
console.log(tomorrow.format());  // 'tomorrow'
```

## Relative time

moment.js's `.fromNow()` and `.from(...)` are available in atemporal via
the [`relativeTime`](../plugins/relative-time.md) plugin:

```ts
import relativeTime from 'atemporal/plugins/relativeTime';
atemporal.extend(relativeTime);
const yesterday = atemporal().subtract(1, 'day');
yesterday.fromNow(); // '1 day ago'
```

## Durations

moment.js's `moment.duration(...)` is replaced by `atemporal.duration(...)`,
which returns a `Temporal.Duration`. The API surface is smaller:

```ts
// moment
const d = moment.duration({ days: 2, hours: 3 });
d.asHours();    // 51
d.days();       // 2

// atemporal
const d = atemporal.duration({ days: 2, hours: 3 });
d.total('hour'); // 51
d.days;          // 2
```

## What atemporal does not have

- **Token localization aliases** like `L`, `LL`, `LLL`, `LLLL` (use
  `atemporal.presets` for the common cases, or compose the format string
  by hand).
- **Custom calendar systems** (Hijri, Buddhist, etc.) — the TC39 Temporal
  API does not currently include non-Gregorian calendars; atemporal can
  be extended via plugins when Temporal lands calendar support.

## Automatic migration

For large codebases, use a codemod:

```bash
npx jscodeshift -t moment-to-atemporal.js src/
```

The official codemod is `@atemporal/codemod` (in development).
