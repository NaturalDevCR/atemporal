# v3.0.0 release review

v3 separates native Temporal use from fallback loading and removes optional
coordination, formatter analysis, token pooling, and eager plugins from the
normal application graph. The factory's parsing/formatting methods remain
synchronous after module initialization. All eight official plugins remain.

## Migration contract

- Default ESM requires ES2022 with top-level await. Missing or incomplete native
  Temporal triggers one conditional fallback import; failure rejects initialization.
- CommonJS initializes synchronously and requires the fallback only when needed.
- `atemporal/native` and matching plugin paths require global Temporal and exclude
  fallback bytes. They fail clearly if the native implementation is missing.
- `atemporal/compat` keeps ES2020/IIFE support, a static fallback import, and the
  six legacy plugin/helper/error root exports. Default/native users import those
  exports from explicit plugin subpaths.
- Keep factory and plugin imports in one family. Public Temporal declarations
  are self-contained. Deprecated token-pool diagnostics retain zero-valued fields.

See [Migrating to v3](../migration/v3.md) for complete examples.

## Size evidence

Pinned source fixture: native provider, ES2020, esbuild 0.25.12, unchanged fixture
hash. Gzip is summed per initially loaded chunk. These numbers exclude Temporal's
fallback and do not describe the npm tarball or every consumer application.

| Step | Initial minified bytes | Initial gzip bytes | Total minified bytes |
| --- | ---: | ---: | ---: |
| Before core optimization | 149,911 | 38,118 | 170,602 |
| Shared synchronous parser | 139,873 | 35,556 | 160,564 |
| Formatter/cache runtime | 132,589 | 33,744 | 153,280 |
| Explicit plugin boundaries | 126,742 | 31,151 | 152,914 |
| Reduction | 15.5% | 18.3% | 10.4% |

Reproduce with `pnpm run size:core`. Historical commit references and explanations:
[parser](v3-core-size.md), [formatter](v3-formatting-runtime-size.md),
[plugins](v3-plugin-boundaries.md). Budgets reject optional analysis modules from
all chunks and plugin modules from the initial static graph.

The production-artifact loading example also imports relativeTime and uses
esbuild 0.28.2. Its split default ESM build has 130,432 initial minified bytes
(32,800 gzip) and 315,870 total bytes. The compat example has 297,637 initial
bytes (81,941 gzip) and 315,697 total bytes. The native example has 129,464 initial
bytes (32,468 gzip) and 152,963 total bytes. These are fixture measurements,
not a claim that dynamic loading removes fallback bytes from the complete build.
`pnpm run check:loading` executes the split outputs and traces actual fallback
chunk requests. Native runtimes skip that request in the default family.

## Validation and publication

PR CI covers Node 22/24/26, native production execution on Node 26, fallback
execution, concurrent/plugin-first imports, entry-family identities, ES2020/IIFE,
TypeScript 5.4/7 packed contracts, coverage, size budgets, dependency audit,
licenses, secret scanning, and documentation links. Local validation also builds
the docs and the packed Vite, Webpack, and Next.js production fixtures.

The weekly validation workflow can be dispatched on the integration branch to
run the complete release gates before publication. It retains the tarball,
fixture reports, bundler diagnostics, coverage, and warmed benchmark samples.
The existing performance baseline and 25% tolerance are unchanged. Benchmark
initialization now uses native `import()` outside timed samples; CI runs a
one-operation launch check to catch loader failures independently of performance.

The release manifest and package version are both 3.0.0. Publication stays on
`main`: merging the final [integration PR #94](https://github.com/NaturalDevCR/atemporal/pull/94)
triggers the release workflow, which validates one tarball before trusted npm
publication, then creates the GitHub Release with SBOMs. Documentation deployment
also remains restricted to `main`.
