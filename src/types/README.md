# Type System

This directory holds the **internal type system** for atemporal's parser,
registry, and assertion utilities. It is **not** the public API surface.

## Separation of concerns

atemporal has two distinct type layers that intentionally coexist:

### `src/types.ts` (root) — Public API types
The user-facing type contract: what callers can pass to `atemporal(...)` and
what the factory exposes. This file is part of the published `dist/` typings
and must remain stable across minor versions.

Contents:
- `DateInput` — accepted input types for `atemporal(input)`
- `TimeUnit`, `SettableUnit` — units of time accepted by API methods
- `DateRange`, `OverlapResult`, `OverlapOptions` — public date-range types
- `AtemporalFactory`, `AtemporalFunction`, `Plugin` — plugin contract

### `src/types/` (this directory) — Internal parser/registry types
Implementation details for the parse coordinator, the type registry, and
runtime assertions. These types are exported (e.g. `TemporalInput`,
`FirebaseTimestamp`, `DEFAULT_TEMPORAL_CONFIG`) for advanced consumers
and plugin authors, but they are not part of the core ergonomic API.

Contents:
- `enhanced-types.ts` — `TemporalInput`, `FirebaseTimestamp`, error
  classes (`TemporalParseError`, `TemporalTimezoneError`,
  `TemporalFormatError`, `TemporalCacheError`), and `assert*` helpers.
- `type-registry.ts` — `TemporalTypeRegistry` and the conversion/validation
  pipeline used by the parse coordinator.
- `index.ts` — barrel re-export of both.

## Why two layers?

`DateInput` (public) is deliberately a *narrow* union of the most common
inputs the library accepts. `TemporalInput` (internal) is a *broad* union
that includes less common types used by the parse strategies
(`Temporal.PlainTime`, `Temporal.Instant`, etc.) and structural fallbacks.

Keeping them separate lets us:
1. Give the public a clean, documented contract.
2. Evolve the internal parser without breaking the public surface.
3. Surface advanced types to plugin authors without polluting the README
   and getting-started docs.

## How to import

```ts
// Public API types
import type { DateInput, TimeUnit, AtemporalFactory } from 'atemporal';

// Internal / advanced types (for plugin authors)
import type { TemporalInput, DEFAULT_TEMPORAL_CONFIG } from 'atemporal';
// (these are re-exported from the root typings via the `types/` module)
```

If you are a **consumer** of atemporal, you only need `src/types.ts`.
If you are a **plugin author** or contributing to the parser, you may
also need the contents of this directory.
