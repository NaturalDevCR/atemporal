# Performance & caching

Atemporal caches parsing, formatting, and repeated difference calculations internally. Consumer code should use the public factory diagnostics rather than importing internal cache classes. The API returns snapshots, so modifying a returned object never changes library state.

```ts
import atemporal from "atemporal";

atemporal.prewarm({
  formatPatterns: ["YYYY-MM-DD", "YYYY-MM-DD HH:mm"],
});

const diagnostics = atemporal.getDiagnostics();
console.log(diagnostics.temporal);
console.log(diagnostics.caches.parsing);
console.log(diagnostics.caches.formatting);
console.log(diagnostics.caches.diff);
```

## Public operations

| Method | Use |
| --- | --- |
| `atemporal.getDiagnostics()` | Get a detached, serializable snapshot of Temporal runtime and cache metrics. |
| `atemporal.clearCaches()` | Drop cached parsing, formatting, and diff entries without changing defaults or counters. |
| `atemporal.resetDiagnostics()` | Clear caches and reset parser/formatter counters without changing the configured locale or time zone. |
| `atemporal.prewarm({ formatPatterns })` | Initialize formatting and compile the supplied application patterns during startup. |

Use `prewarm` only for a small, stable set of hot patterns. It is usually best called once during application initialization, not for every request or render.

## Boundaries and measurements

Diagnostics are intentionally observational: no cache or parsing engine is public API. Do not mutate the snapshot, retain assumptions about its internal counters, or import `atemporal/src/...` in application code.

For release-size and benchmark policy, see the repository's generated reports. Application bundles depend on the bundler, your imports, and whether the Temporal polyfill is included; treat those as separate measurements from the distributed core size.
