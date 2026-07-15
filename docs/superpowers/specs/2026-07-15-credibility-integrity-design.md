# Credibility and Release-Artifact Integrity Design

**Date:** 2026-07-15
**Status:** Approved design — awaiting written-spec review

## Objective

Correct specific public-contract defects, make Atemporal's quality and
compatibility claims verifiable, and communicate precisely that Atemporal is a
Day.js-inspired API centred on `Temporal.ZonedDateTime`. This work must not
claim full Day.js compatibility or hide the current cost of the Temporal
polyfill.

## Scope

This design covers:

1. Two implementation defects: valid wrapper errors and official-plugin load
   tracking.
2. Documentation accuracy: Day.js immutability, `atemporal.unix()`, Temporal
   positioning, coverage, and bundle-size claims.
3. A versioned Day.js-to-Atemporal compatibility matrix.
4. Blocking coverage thresholds and accurate coverage scope.
5. A tarball-first compatibility contract for published artifacts.
6. Extended integration validation for important build and SSR environments.
7. Reproducible size and performance reports, budgets, and release gates.

Deliberately out of scope: a new multi-type Temporal API such as
`atemporal.date()`, `atemporal.instant()`, or `atemporal.zoned()`. That is a
separate API-design project and must not be introduced incidentally.

## Public Contract Corrections

### Valid wrapper errors

Every valid `TemporalWrapper`, including instances created by the optimized
`_fromZonedDateTime()` path, has `error === null`. Invalid instances retain a
string error. This maintains the declared `string | null` contract and prevents
an internal construction path from returning `undefined`.

### Official-plugin tracking

Official plugins receive explicit stable metadata; plugin identity must not be
derived from `Function.name`, a filename, or a minifier-sensitive convention.
The chosen mechanism will extend the existing plugin-marking facility with
metadata equivalent to:

```ts
markAsPlugin(relativeTime, { name: "relativeTime", official: true });
```

`extend(relativeTime)` and `lazyLoad("relativeTime")` therefore produce the
same official-plugin state. `isPluginLoaded("relativeTime")` returns `true`
after either path. `getLoadedPlugins()` returns only installed official plugin
names. Third-party plugins still apply normally, but are intentionally absent
from that official list; any future inspection API for arbitrary extensions is
a separately named public API.

### Documentation and product position

The README, Day.js migration guide, and generated public documentation will:

- correctly say that Day.js is immutable;
- correctly document `atemporal.unix(seconds)` as available;
- position Atemporal as “a modern, Temporal-powered date-time library with a
  familiar Day.js-inspired API”, rather than a better or fully compatible
  Day.js replacement;
- describe the main model honestly as ergonomic wrapping around
  `Temporal.ZonedDateTime`;
- remove claims that native Temporal automatically removes the bundle cost of
  the statically imported polyfill;
- distinguish core, tarball, and application-bundle size measurements; and
- distinguish compatibility guaranteed by CI from additional compatibility
  validated by extended fixtures.

## Versioned Compatibility Matrix

A formal documentation matrix will be reviewed against a pinned Day.js
version (initially Day.js 1.11.21). Every entry has one of these categories:

| Category | Meaning |
| --- | --- |
| Compatible | The call and semantic result are equivalent. |
| Equivalent with semantic differences | Migration is mechanical, but temporal zone, parsing, unit, indexing, or returned type differs. |
| Plugin required | The capability is available after installing and extending the stated plugin. |
| Not supported | No publicly guaranteed equivalent exists. |
| Different recommended approach | Atemporal handles the use case, but imitating Day.js would be conceptually incorrect. |

The matrix will state the reviewed Day.js version and link each non-trivial
difference to its migration guidance. It is a compatibility guide, not a
claim that the two APIs are interchangeable.

## Coverage Contract

Jest enforces global, blocking thresholds of at least:

| Metric | Minimum |
| --- | ---: |
| Statements | 95% |
| Lines | 95% |
| Branches | 90% |
| Functions | 90% |

Coverage collection includes public logic such as `src/index.ts`. Exclusions
are restricted to purely declarative type files, re-export-only modules, and
examples. Codecov remains a non-authoritative trend and PR-diff signal; it is
not the mechanism that enforces the contract. Tests must assert observable
behaviour, not merely execute lines.

## Published-Artifact Test Architecture

### One tarball per execution

All integration tests use precisely one package artifact:

```text
build → npm pack --json → artifacts/atemporal-{package-version}.tgz
                              ↓
                       every fixture
```

The build job validates the `npm pack --json` manifest before fixtures run:
both CJS and ESM output, declarations, exported plugins, README, licence, and
required package metadata must be present. Fixtures never create their own
tarball and never import `src/` or use a local package link.

Contract fixtures begin from clean disposable copies and consume the shared
tarball. This deliberately tests the dependency resolution a normal consumer
receives; the report records the effective installed polyfill version. The
canonical size fixture instead pins the exact polyfill and bundler versions
(using exact dependencies or `overrides`) so its budget remains reproducible.
The fixture runner must verify that no versioned fixture file changed after the
run; installing in a disposable copy is the preferred implementation.

```bash
npm ci
npm install --no-save --package-lock=false ../../artifacts/atemporal-*.tgz
npm run typecheck
npm run build
npm test
```

Fixture lockfiles pin their own toolchains. Dependabot may propose controlled
updates, but tool versions do not drift silently.

### Contract fixtures: required on every PR

`integration/contract/` contains independent minimal projects for:

- native Node ESM;
- native Node CommonJS;
- TypeScript `moduleResolution: node16`;
- TypeScript `moduleResolution: nodenext`; and
- TypeScript `moduleResolution: bundler`.

Each verifies installation, root and plugin import, applicable native module
syntax, declarations, instance creation, a chained operation, formatting, and
plugin extension. The representative value is:

```ts
atemporal.extend(relativeTime);
const result = atemporal("2026-07-15T10:00:00Z")
  .timeZone("America/Costa_Rica")
  .add(1, "day")
  .format("YYYY-MM-DD HH:mm");
// result === "2026-07-16 04:00"
```

The CommonJS fixture uses native `require()` and asserts the documented export
shape explicitly; neither Babel nor ts-node may mask resolution defects. All
three TypeScript modes run `tsc --noEmit`. `node16` and `nodenext` additionally
compile and execute their emitted runtime output. The matrix tests the oldest
supported TypeScript version and the current stable TypeScript version.

### Extended fixtures: scheduled and release validation

`integration/extended/` contains Vite, Webpack, and Next.js projects that use
the shared tarball. They type-check, build in production mode, and execute a
representative runtime test. Next.js also runs a real production server:

1. `next build`;
2. `next start`;
3. HTTP request to a rendered route;
4. assertion of the expected date; and
5. controlled shutdown.

The Next.js fixture covers both server rendering and a small client component.
This targets module resolution, tree-shaking, SSR, production output, and
native-Temporal/polyfill behaviour without pretending that every UI framework
needs separate coverage.

## Size Measurement and Budget Policy

### Measurements

The size workflow produces these reproducible measurements:

1. Distributed core: raw and deterministic gzip sizes of `dist/index.js` and
   `dist/index.mjs`.
2. npm tarball: `size` and `unpackedSize` from `npm pack --json`.
3. Canonical application bundle: production bundle that imports a
   representative core operation.
4. Canonical application bundle with plugin: equivalent bundle importing
   `relativeTime`.

The canonical bundle fixture is deliberately independent of Vite, Webpack,
and Next.js. Its total output is the contractual application-size metric.
Vite/Rollup metadata, Webpack `stats.json`, and Next.js build output are used
only for diagnostics in their extended fixtures.

Reports may attribute code to Atemporal, `@js-temporal/polyfill`, and runtime
or other dependencies, but that attribution is diagnostic because minification,
concatenation, shared chunks, and framework runtimes differ. Bundle total is
the reproducible contractual number.

Measurement runs use fixed tool versions, production mode, cleaned output
directories, a deterministic compression algorithm and options, and no
timestamp-dependent input.

### Budgets

Existing blocking core budgets remain:

| Artifact | Raw | Gzip |
| --- | ---: | ---: |
| `dist/index.js` (CJS) | 20 KB | 5 KB |
| `dist/index.mjs` (ESM) | 15 KB | 5 KB |

There are two independent, blocking canonical-bundle budgets:
`canonicalCoreBundle.total` and `canonicalRelativeTimeBundle.total`. Their
initial limits are proposed independently by their first reproducible
measurements using `measurement + max(5%, 1 KiB)`, then explicitly reviewed
and committed. They are never accepted or updated automatically; an
improvement in one bundle cannot compensate for a regression in the other.

Every later budget change records the previous value, new value, absolute and
percentage delta, cause, and the change reference that justifies it. A
versioned configuration stores the limits. Core and total-bundle budget
overruns block CI; diagnostic attribution does not.

## Performance Regression Policy

The hot-path contract remains per operation: `parse`, `format`, `add`, `diff`,
and `validate`. A path may not regress more than 25% over its committed GitHub
Actions baseline. A path is evaluated independently; one improvement cannot
hide another path's regression.

Benchmarks run only on `ubuntu-24.04`, `x64`, Node `20.19.0`, with 100,000
operations per sample, one warm-up per hot path, seven measured samples per
hot path, and a 15-minute job timeout. They compare the post-warm-up median
after initialization and record minimum, maximum, median, p95, and median
absolute deviation. The baseline and each report identify this methodology,
the GitHub Actions image version, and the full environment; a different
environment requires a deliberate new baseline.

Performance runs are intentionally outside normal PR latency: the scheduled
workflow and the release workflow enforce this gate. The release workflow
runs it afresh rather than trusting a previous scheduled result.

## CI and Evidence Retention

| Suite | Frequency | Status |
| --- | --- | --- |
| Unit tests and coverage | Every PR | Blocking |
| Contract fixtures | Every PR | Blocking |
| Core and canonical-bundle size budgets | Every PR | Blocking on budget overrun |
| Extended fixtures | Weekly schedule and release | Blocking for release |
| Bundle attribution | Weekly schedule and release | Informational |
| Performance | Weekly schedule and release | Blocking for release |

The release validation has one unbroken artifact flow:

```text
checkout → build → npm pack once → unit/coverage → contract fixtures
         → extended fixtures → size → performance → publish that same tarball
```

It must not rebuild before publishing. Once successfully created, the tarball
and all available machine-readable and human-readable reports, bundler
metadata, and benchmark results are uploaded even when a later gate fails.
Weekly artifacts retain for 30 days; release evidence is retained longer and
associated with the release where GitHub permits.

## Report Schema

Both size and performance outputs have a machine-readable report with a
versioned schema and a matching Markdown summary. Minimum JSON fields include:

```json
{
  "schemaVersion": 1,
    "commitSha": "40-character Git SHA",
    "generatedAtUtc": "RFC 3339 UTC timestamp",
  "environment": {
    "os": "runner operating-system identifier",
    "architecture": "x64",
    "node": "semantic version",
    "npm": "semantic version"
  },
  "tools": {
    "typescript": "semantic version or null",
    "canonicalBundler": "semantic version",
    "vite": "semantic version or null",
    "webpack": "semantic version or null",
    "next": "semantic version or null",
    "dayjs": "1.11.21",
    "temporalPolyfill": "effective semantic version",
    "atemporal": "package version"
  },
  "tarball": {
    "name": "generated tarball filename",
    "sha512": "SHA-512 integrity digest",
    "size": 0,
    "unpackedSize": 0
  },
  "mode": "production",
  "executedSuites": ["core-size", "canonical-core-bundle", "canonical-plugin-bundle"],
  "budgets": [],
  "results": [],
  "status": "pass"
}
```

Each budget result includes the applicable limit, observed value, delta from
the budget, and delta from its baseline where relevant. Schema changes require
a `schemaVersion` increment and documented migration semantics.

## Acceptance Criteria

- Valid wrapper paths consistently return `null` for `error`.
- Direct and lazy installation of every official plugin report identical
  official-plugin state through public APIs.
- Public claims no longer misstate Day.js immutability, `atemporal.unix()`,
  coverage enforcement, package size, or Temporal/polyfill bundling.
- A versioned compatibility matrix defines all five categories and does not
  claim full replacement compatibility.
- Jest blocks coverage below the defined four thresholds while covering public
  logic.
- Every PR validates one packed artifact through native ESM/CJS and the
  specified TypeScript resolution modes.
- Weekly and release checks validate Vite, Webpack, and production Next.js
  SSR against that same artifact.
- Once packing succeeds, reports and all available validation artifacts are
  retained on success and failure.
- Release publishes the already validated tarball, not a reconstructed one.
