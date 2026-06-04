# Migrating from raw TC39 Temporal

If you are already using the raw TC39 Temporal API, atemporal gives you
a much friendlier ergonomic layer on top — without giving up access to
the underlying `Temporal.*` values when you need them.

## The mental model

| Raw Temporal                                              | atemporal                                     |
| --------------------------------------------------------- | --------------------------------------------- |
| `Temporal.PlainDate.from(...)`                            | `atemporal(...)` *(one entry point)*          |
| `Temporal.PlainDateTime.from(...)`                        | `atemporal(...)`                              |
| `Temporal.ZonedDateTime.from(...)`                        | `atemporal(..., tz)`                          |
| `Temporal.Instant.from(...)`                              | `atemporal(...).instant()` *(escape hatch)*   |
| `dt.add({ days: 1 })`                                     | `dt.add(1, 'day')`                            |
| `dt.subtract({ months: 3 })`                              | `dt.subtract(3, 'month')`                     |
| `Temporal.PlainDate.compare(a, b)`                        | `a.until(b).total('day')`                     |
| `dt.toString()`                                           | `dt.format(atemporal.presets.ISO)`            |
| `dt.toLocaleString(locale, opts)`                         | `dt.format(opts, locale)`                     |

## Why use atemporal on top of Temporal?

1. **One entry point.** atemporal's `atemporal(input, tz)` accepts strings,
   numbers, `Date`, `Temporal.*` values, plain objects, Firebase Timestamps,
   etc. With raw Temporal you have to pick the right `from` method for
   each input type.

2. **Immutability by default.** atemporal's `TemporalWrapper` is always
   immutable. Raw Temporal also returns new values, but you can accidentally
   pass a mutable array/object literal in some operations.

3. **Fluent chained API.** `atemporal().add(1, 'day').startOf('week').format('YYYY-MM-DD')`
   reads top-to-bottom. Raw Temporal requires nested calls.

4. **Format strings.** atemporal's formatting engine takes moment-style
   `YYYY-MM-DD` tokens, which your team already knows. Raw Temporal
   requires `Intl.DateTimeFormat` options.

5. **Sensible defaults.** atemporal handles "now", default timezone, and
   default locale with three setters; raw Temporal makes you pass
   `Temporal.Now.*()` and an explicit timezone to every call.

6. **Error codes.** atemporal's errors carry stable `ATEMPORAL_*` codes
   for i18n, structured logging, and dashboards.

7. **Strict mode.** `atemporal.setStrictMode(true)` warns on ambiguous
   operations in development.

## The escape hatches

atemporal is a *layer*, not a replacement. You can drop down to raw
Temporal at any time:

```ts
const a = atemporal('2024-01-15');

// Get the underlying ZonedDateTime:
a.toZonedDateTime(); // or a['_datetime'] (private)

// Construct from raw Temporal:
atemporal(Temporal.PlainDate.from('2024-01-15'));

// Wrap a Temporal.Duration:
atemporal.duration({ days: 1 });

// Or just call Temporal directly — atemporal and raw Temporal coexist
// without conflicts because they share the same global `Temporal` object.
const zdt = Temporal.ZonedDateTime.from('2024-01-15T00:00:00[UTC]');
const wrapped = atemporal(zdt);
```

## Performance: native vs polyfill

atemporal automatically uses the **native** Temporal implementation
when available (Chrome 144+, Firefox 139+, Node 22+ when unflagged)
and falls back to `@js-temporal/polyfill` otherwise. The performance
gap is significant for the polyfill path, but the API surface is
identical.

You can check which one is in use:

```ts
atemporal.getTemporalInfo();
// { isNative: true, environment: 'node', version: 'native' }
// or
// { isNative: false, environment: 'browser', version: 'polyfill' }
```

## Patterns atemporal adds on top

### Validation without throwing

```ts
// Raw Temporal — throws RangeError
try { Temporal.PlainDate.from('not a date'); } catch (e) { ... }

// atemporal — structured result, no throw
const r = atemporal.validate('not a date');
if (!r.ok) {
  console.error(r.code, r.reason);
}
```

### Try-style construction

```ts
// atemporal — returns null on failure
const a = atemporal.try(input);
if (a === null) { /* skip */ }
```

### Preset format strings

```ts
// atemporal — no string juggling
m.format(atemporal.presets.RFC2822);
m.format(atemporal.presets.SQL_DATETIME);
m.format(atemporal.presets.ISO);
```

### Strict mode for safety in production

```ts
// atemporal — opt-in during test/CI runs
atemporal.setStrictMode(true);
```

## What atemporal does *not* hide

- The fact that `Temporal.PlainDate` has no time component.
- The fact that calendar arithmetic can produce out-of-range values
  (`month: 13` → ISO month 1 of next year).
- The fact that zoned datetimes have non-trivial IANA semantics
  (DST, gap, overlap).

These are features of the underlying spec, and atemporal faithfully
exposes them.

## See also

- [Migration from Day.js](dayjs.md)
- [Migration from Luxon](luxon.md)
- [Migration from moment.js](moment.md)
- [Core concepts](../guide/core-concepts.md)
