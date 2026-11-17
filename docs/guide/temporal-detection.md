# Temporal Detection

Atemporal automatically detects whether the native Temporal API is available in the current environment. This ensures you always get the best performance without changing your code.

## How It Works

- **Native Temporal Available**: Uses the runtime's native implementation.
- **Native Temporal Not Available**: Falls back to `@js-temporal/polyfill`
  automatically.

The detection runs once and is cached for the lifetime of your application. It searches for `Temporal` in `globalThis`, `window`, `global`, and `self` in that order.

Native availability is a runtime capability, not a version promise in this
guide. Check it with `atemporal.getTemporalInfo()` in the environment you
deploy. CI validates the native path on Node 26 and validates the polyfill path
across the supported Node matrix.

## Loading Contract in v3

| Entry | Initialization | Polyfill behavior |
| --- | --- | --- |
| `atemporal` with ESM | ES2022, top-level await | Dynamically imported only when Temporal is unavailable |
| `atemporal` with CommonJS | Synchronous, Node 22+ | Required only when Temporal is unavailable |
| `atemporal/compat` | Synchronous, ES2020 | Static fallback import for legacy bundlers |
| `atemporal/native` | Synchronous, ES2020 | No fallback; requires global Temporal |

For the default ESM entry, module initialization completes before an importing
module executes. The public date API stays synchronous: no `init()` call or
`await atemporal(...)` is needed. Import failures propagate to the importer.
Both entry formats select one implementation and share it with their plugins.

With browser code splitting enabled, the dynamic import keeps the polyfill in
its own chunk. Environments with native Temporal do not request that chunk.
Without code splitting, a bundler may still include it in the same file; its
initialization remains conditional. The total build can include fallback bytes
even when the initial download excludes them.

ES2020 builds, IIFE output, and tools without top-level await should use:

```ts
import atemporal from 'atemporal/compat';
import relativeTime from 'atemporal/compat/plugins/relativeTime';

atemporal.extend(relativeTime);
```

## Excluding the Polyfill from a Bundle

Deployments that guarantee `globalThis.Temporal` can exclude the fallback
entirely, including from the total build:

```ts
import atemporal from 'atemporal/native';
import relativeTime from 'atemporal/native/plugins/relativeTime';

atemporal.extend(relativeTime);
console.log(atemporal.getTemporalInfo().isNative); // true
```

All eight plugins and `lazyLoad()` are available in each distribution. Keep
factory and plugin imports in the same family: `atemporal/plugins/*`,
`atemporal/compat/plugins/*`, or `atemporal/native/plugins/*`. Each distribution
owns its runtime, caches, and plugin state.

The native entry throws during import if Temporal is missing or incomplete.
The polyfill remains an installed dependency for the automatic fallback entries.
Public declarations include a local Temporal contract; TypeScript 5.4+ consumers
do not resolve declarations from the polyfill or require global Temporal types.
Keep `globalThis.Temporal` unchanged after initialization.

Run `pnpm run check:loading` after building to verify conditional loading and
initial versus total browser bundle sizes. The report is
`reports/temporal-loading.json`. `pnpm run check:native` verifies the strict
native distribution and compiles isolated consumers without polyfill packages.

## Checking the Implementation

```ts
import atemporal from "atemporal";

const info = atemporal.getTemporalInfo();
console.log(info);
// {
//   isNative: false,        // true if native Temporal found
//   environment: 'node',    // 'browser', 'node', or 'unknown'
//   version: 'polyfill'     // 'native' or 'polyfill'
// }
```

## Benefits

- **Synchronous date operations**: Native and fallback implementations use the same public API.
- **Automatic performance**: Native Temporal is faster than the polyfill, and you get it for free
- **Conditional fallback**: The default entry loads the polyfill only when needed.
  Browser download savings depend on code splitting; total build size still
  includes the fallback.
- **Seamless migration**: As more browsers adopt Temporal, your app automatically benefits

## Runtime Support

Temporal implementation status changes independently by runtime and release.
Do not branch application behavior on a guessed browser or Node version. Use
`getTemporalInfo()` when diagnostics or observability need to distinguish the
native and polyfill paths.

## Migration

v3 changes the default ESM loading contract. Check the [v3 migration guide](../migration/v3)
for ES2020, IIFE, and bundler requirements. Date operations keep their existing behavior:

```ts
// This works identically with both native and polyfill Temporal
const date = atemporal("2023-12-25");
const formatted = date.format("YYYY-MM-DD");
```

## Testing

For testing scenarios where you need to simulate native Temporal support:

```ts
// Mock the global Temporal object in your test setup
globalThis.Temporal = {
  Now: { zonedDateTimeISO: () => { /* mock */ } },
  ZonedDateTime: { from: () => { /* mock */ } },
  // ... other required methods
};
```

## For More Details

See the full [Temporal Detection deep dive](./temporal-detection) for information about the detection algorithm internals, caching, cross-platform support, and helper utilities like `isBrowserEnvironment()` and `isNodeEnvironment()`.
