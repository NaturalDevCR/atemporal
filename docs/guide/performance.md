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

## Measuring the v3 core

Maintainers can run `pnpm run size:core` for a pinned-esbuild source attribution
and budget check. It excludes the polyfill, keeps optional chunks separate, and
reports initial versus total bytes in `reports/core-source-size.json`. The check
also rejects async coordination, optional formatter/cache analysis, and token
pooling entering the factory graph.
See [the v3 core size report](../reports/v3-core-size) for the fixture and measured
parsing-runtime change. The reviewed baseline is never rewritten by this command.

The [formatter runtime size report](../reports/v3-formatting-runtime-size) records
the next reduction. Formatting retains shared caches and metrics while optional
analysis helpers remain separate. Deprecated pool counters are zero because
compiled tokens belong to the compiler cache rather than a temporary pool.

The [complete v3 review](../reports/v3-release-review) combines the parser,
formatter, and [plugin-boundary](../reports/v3-plugin-boundaries) results. The
unchanged native source fixture falls from 38,118 to 31,151 initial gzip bytes
(18.3%). These numbers exclude the fallback and differ from production-artifact
or tarball measurements. Default ESM download savings require code splitting;
`atemporal/native` excludes fallback code entirely.
