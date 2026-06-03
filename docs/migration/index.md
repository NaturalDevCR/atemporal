# Migrating to atemporal

atemporal aims to be the easiest possible migration target for
existing date/time libraries — and a friendlier layer on top of the
raw TC39 Temporal API.

## Guides by source library

- **[Migrating from Day.js](dayjs.md)** — most teams are here; format
  tokens and API are nearly identical.
- **[Migrating from Luxon](luxon.md)** — both libraries are immutable
  and IANA-aware; the surface maps cleanly.
- **[Migrating from moment.js](moment.md)** — moment is in maintenance
  mode; atemporal is a drop-in for 90% of usage.
- **[Migrating from raw TC39 Temporal](temporal.md)** — atemporal is
  a friendly layer on top, not a replacement.

## Why migrate?

| Reason                    | Details                                                  |
| ------------------------- | -------------------------------------------------------- |
| **Smaller bundle**        | atemporal is ~15 KB gzipped (vs moment ~70 KB).          |
| **Future-proof**          | Built on the standardized TC39 Temporal Stage 4 API.     |
| **Auto polyfill**         | Uses native Temporal when available, polyfill otherwise. |
| **Type-safe by default**  | Zero `any` in the public API surface.                    |
| **Fluent & immutable**    | Always returns new instances.                            |
| **Error codes**           | `ATEMPORAL_*` codes for i18n and dashboards.             |
| **Strict mode**           | Optional, opt-in warnings for ambiguous operations.      |

## What you do *not* lose

- moment-compatible format tokens.
- Immutable `.add()` / `.subtract()` semantics.
- IANA timezone support.
- Plugin ecosystem.
- Locale-aware formatting.

## What you gain

- All of the above, plus first-class Temporal-native features
  (`PlainDate`, `PlainDateTime`, `ZonedDateTime`, `Instant`).
- A `validate()` helper that returns structured results instead of
  throwing.
- A `try()` helper that returns `null` instead of throwing.
- A `presets` object with 12 battle-tested format strings.
- Strict mode for catching timezone bugs in tests.

## Migration tools

For large codebases, a codemod is available at
[`@atemporal/codemod`](https://github.com/NaturalDevCR/atemporal-codemod):

```bash
npx @atemporal/codemod src/
```

The codemod handles the most common Day.js and moment.js patterns
automatically. For Luxon and raw Temporal, the patterns are simple
enough that a manual search-and-replace is usually sufficient.

## After the migration

1. Enable strict mode in your test suite:
   ```ts
   // jest.setup.ts
   import atemporal from 'atemporal';
   atemporal.setStrictMode(true);
   ```
2. Switch untrusted user input to `atemporal.try()` or `atemporal.validate()`.
3. Add the new `atemporal.presets.*` constants to your codebase.
4. Update your CI to require TypeScript strict mode (now safe with atemporal's
   public typings).
