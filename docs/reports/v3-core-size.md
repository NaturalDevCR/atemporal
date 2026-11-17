# v3 core size: synchronous parsing runtime

The normal factory parsed through `ParseCoordinator.getParseEngine()`. Although
that path is synchronous, importing the coordinator retained its async strategy
orchestration, optimizer, reporting, and benchmark methods in the browser bundle.

The factory now owns one lazy `ParseEngine` directly. A shared configuration
function preserves the strategy priorities, default options, TTL, and cache-size
policy used by the coordinator. Public parsing, strict errors, caches, and
`getDiagnostics()` keep the same engine and metrics. The standalone internal
`ParseCoordinator` still supports its existing tests and advanced operations.
Unused source-only `TemporalUtils` helpers for benchmark/report/configuration
were removed, along with an unused internal parsing barrel; none was exposed
by the package export map or public factory.

## Reproducible comparison

The before state is [commit 9ffd289](https://github.com/NaturalDevCR/atemporal/commit/9ffd2896b275bf33e1c151d615557fdd65ae33ed).
It contains the measurement tool before the parser refactor. Run
`node scripts/measure-core-source.cjs` there to reproduce the comparison.

`pnpm run size:core` uses the canonical fixture's pinned esbuild 0.25.12. It bundles
the TypeScript source as browser ESM targeting ES2020, substitutes the native-only
fallback provider, and separates dynamic chunks. The application imports only the
factory and formats a fixed ISO instant in America/Costa_Rica. Its hash and bundler
version are checked against `benchmarks/core-size-baseline.json`.

| Measurement | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Initial minified bytes | 149,911 | 139,873 | 10,038 (6.7%) |
| Initial gzip bytes | 38,118 | 35,556 | 2,562 (6.7%) |
| Total minified bytes | 170,602 | 160,564 | 10,038 (5.9%) |
| Parser attribution, initial bytes | 80,351 | 70,941 | 9,410 (11.7%) |

These are native **source fixture** measurements, not tarball size or the complete
fallback application. They intentionally differ from the production-artifact
loading report, whose example imports relativeTime and uses the root bundler.
Gzip initial bytes sum each initially imported chunk's compressed size. Per-source
attribution excludes generated bundler glue, so its sum differs from output bytes.

The committed limits allow small explicit headroom while preventing the previous
larger core from returning. CI also checks that coordinator/optimizer code is absent
from all output chunks for this fixture. Future improvements should preserve the
fixture, report initial/total bytes separately, and review any baseline change.
