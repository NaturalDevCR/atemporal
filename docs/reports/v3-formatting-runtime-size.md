# v3 formatter and cache runtime size

The normal formatter imported analysis/tuning methods and a token pool. It
prewarmed 125 pooled tokens but never called the scope's `getToken()`: compiled
formats already owned their tokens. Each uncached compiled format allocated an
empty scope and disposed it without reusing a token.

## Runtime boundaries

The public factory, wrapper, diagnostics, and cache coordinator now import lean
formatter/cache runtime modules directly. Optional internal `formatting-engine`
and `formatting-cache` tooling decorate the same constructors, preserving cache,
configuration, and counter identity across formatting, tuning, and resets.
Subclassing would fork static state after reset, so the facades do not subclass.

Token pooling stays available to its standalone internal tests but is absent
from the default dependency graph. The unused formatting barrel is removed.
Output tokens, escaping, locale handling, fast paths, cache keys, bounded eviction,
compiler custom replacements, and prewarming retain their existing code paths.

`tokenPoolStats` keeps its public shape with deprecated zero-valued fields. The
runtime no longer allocates pooled tokens. Internal `poolTokens` options remain
accepted but have no effect. This diagnostic difference is documented for v3.

## Reproducible measurements

Before state: [commit efc2dd4](https://github.com/NaturalDevCR/atemporal/commit/efc2dd46a009628ac8e41a4faa6859f88c0f7d58).
Run `node scripts/measure-core-source.cjs` there and on this change. Both use the
same fixture hash, native-only provider, ES2020 target, and pinned esbuild 0.25.12.

| Measurement | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Initial minified bytes | 139,873 | 132,589 | 7,284 (5.2%) |
| Initial gzip bytes | 35,556 | 33,744 | 1,812 (5.1%) |
| Total minified bytes | 160,564 | 153,280 | 7,284 (4.5%) |
| Formatting initial attribution | 21,591 | 14,323 | 7,268 (33.7%) |

The parser and formatter steps together reduce this initial native source fixture
from 149,911 to 132,589 bytes (11.6%). These are source fixture measurements;
production artifacts, tarballs, and applications importing plugins differ.

`benchmarks/core-size-baseline.json` retains the prior parser measurements in
history, tightens the limits, and rejects the optional facades/pool in all output
chunks. `size:core` reports measurements without rewriting the reviewed baseline.
