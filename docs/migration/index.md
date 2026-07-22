# Migrating to atemporal

A modern, Temporal-powered date-time library with a familiar Day.js-inspired
API. Atemporal is an ergonomic wrapper whose principal representation is
`Temporal.ZonedDateTime`; it is not a promise of full Temporal-model exposure
or full compatibility with each source library.

## Guides by source library

- **[Migrating from Day.js](dayjs.md)** — most teams are here; format
  tokens and common APIs are familiar. See the
  [Day.js compatibility matrix](dayjs-compatibility.md) for reviewed scope.
- **[Migrating from Luxon](luxon.md)** — both libraries are immutable
  and IANA-aware; the surface maps cleanly.
- **[Migrating from moment.js](moment.md)** — review the documented mappings
  before migration.
- **[Migrating from raw TC39 Temporal](temporal.md)** — atemporal is
  a friendly layer on top, not a replacement.

## Why migrate?

| Reason                    | Details                                                  |
| ------------------------- | -------------------------------------------------------- |
| **Measured size evidence** | See the [generated size report](https://github.com/NaturalDevCR/atemporal/blob/main/reports/size-report.md); core, tarball, and application-bundle measurements differ. |
| **Temporal runtime**      | `@js-temporal/polyfill` is a direct runtime dependency; its application-bundle cost is measured separately. |
| **Migration scope**       | The versioned compatibility matrix identifies supported mappings and semantic differences. |

## Review compatibility before migration

Shared method names do not establish equivalent semantics. Review construction,
time zones, formatting tokens, duration values, locale behavior, plugins, and
raw `Date` conversions in the source-library guide. The Day.js matrix labels
each reviewed item as compatible, semantically different, plugin-required,
unsupported, or better served by a different approach.

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

## Upgrading to v1.5

v1.5 is additive: `atemporal(input, timeZone?)` and existing plugins keep their
compatibility behaviour. New applications should use the explicit boundary APIs
when their data model needs a deterministic failure policy.

- Use `atemporal.parse(input, options)` to throw `InvalidDateError` for invalid
  values. Its defaults reject invalid calendar fields and DST gaps or overlaps.
- Use `atemporal.tryParse(input, options)` when invalid user input should become
  `null` instead of an exception.
- Select `disambiguation: "earlier"`, `"later"`, or `"compatible"` only as an
  intentional domain rule; the default is `"reject"`.
- `getLoadedPlugins()` still reports official plugins only. Use
  `getAppliedExtensions()` when diagnostics need to include third-party
  extensions that explicitly declare an ID.
- Use `getDiagnostics()`, `clearCaches()`, `resetDiagnostics()`, and `prewarm()`
  instead of importing any `atemporal/src/...` implementation detail.

## Preparing for v2

v2 raises the Node.js floor from 18 to **22**. It supports Node 22, 24, and
26. Browser support remains available through the packaged Temporal runtime
detection path and bundler fixtures. Upgrade the runtime before adopting v2;
the existing callable wrapper facade remains available during the migration.
