# Atemporal

![npm](https://img.shields.io/npm/v/atemporal)
[![npm downloads](https://img.shields.io/npm/dm/atemporal.svg)](https://www.npmjs.com/package/atemporal)
![license](https://img.shields.io/npm/l/atemporal)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/NaturalDevCR/atemporal)

Atemporal is a modern, Temporal-powered date-time library with a familiar
Day.js-inspired API. Its principal representation is `Temporal.ZonedDateTime`,
so the wrapper does not expose the full Temporal model or promise full Day.js
compatibility. See the [Day.js compatibility matrix](./docs/migration/dayjs-compatibility.md)
for the reviewed scope.

## Key Features

- **Immutable & Chainable**: Fluid API inspired by Day.js, powered by the modern Temporal API. All operations return new instances.
- **Plugin-Powered**: Lightweight core with 8 official plugins. Extend only what you need, or lazy-load on demand.
- **Time Zone Aware**: First-class support for IANA time zones (e.g., `America/New_York`, `Asia/Tokyo`).
- **Localization**: Native integration with `Intl` for seamless i18n. Format dates in any locale.
- **Type-Safe**: Built with TypeScript for excellent developer experience, autocompletion, and type guards.
- **Firebase/Firestore Ready**: First-class support for Firebase Timestamps in both standard and underscore formats.
- **Temporal-Powered**: Uses the TC39 Stage 4 Temporal API with automatic native-to-polyfill fallback.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| **relativeTime** | `.fromNow()` and `.toNow()` support |
| **customParseFormat** | Parse complex date strings with custom format tokens |
| **advancedFormat** | Ordinal suffixes (`Do`, `Qo`) and timezone name tokens (`zzz`, `zzzz`) |
| **weekDay** | Configurable week start, enhanced weekday handling |
| **durationHumanizer** | Convert durations to human-readable, localized strings |
| **dateRangeOverlap** | Detect intersections between date ranges |
| **businessDays** | Working day calculations with holiday and weekend support |
| **timeSlots** | Find free time slots in a busy schedule |

## Why Atemporal?

| Feature | Atemporal | Day.js | Luxon | date-fns |
|---------|-----------|--------|-------|----------|
| Built on Temporal | Yes (TC39 Stage 4) | No | No | No |
| Immutable by default | Yes | Yes | Yes | Yes |
| Plugin system | 8 official plugins | Extensive | No | No |
| Firebase timestamps | Yes | No | No | No |
| Native Temporal fallback | Auto-detected | N/A | N/A | N/A |
| IANA time zones | Yes | Via plugin | Yes | Yes (v3+) |
| Size measurements | [CI size reports](https://github.com/NaturalDevCR/atemporal/actions/workflows/ci.yml) | Varies by use | Varies by use | Varies by use |

The `package-artifact-reports` artifact on each CI run includes `size-report.md`
with separate measurements for the core distribution, packed tarball, and
application bundle.
`@js-temporal/polyfill` is a direct runtime dependency, and its application-bundle
cost is measured separately rather than inferred from the core distribution.

## Documentation

For full guides and API reference, please visit:

**[naturaldevcr.github.io/atemporal](https://naturaldevcr.github.io/atemporal/)**

**[AI-Friendly Documentation (llms.txt)](https://naturaldevcr.github.io/atemporal/llms.txt)**

Use [llms-full.txt](https://naturaldevcr.github.io/atemporal/llms-full.txt) for
the complete API reference, plugin guides, migration instructions, and cookbook.

---

## Installation

**Node.js 22 or newer is required.** Atemporal supports Node 22, 24, and 26;
the default ESM entry requires ES2022 with top-level await. CommonJS remains
synchronous. See [Migrating to v3](docs/migration/v3.md) for the loading contract.

```bash
npm install atemporal
# or
pnpm add atemporal
```

The default entry loads `@js-temporal/polyfill` only when a complete global
Temporal implementation is unavailable. In ESM, initialization finishes before
importers run; date operations stay synchronous. Browser bundlers with code
splitting can keep the fallback in a separate, conditionally downloaded chunk.
In CommonJS, the polyfill is required synchronously only on the fallback path.

For ES2020 builds or tools without top-level await, use the compatibility entry:

```ts
import atemporal from 'atemporal/compat';
import relativeTime from 'atemporal/compat/plugins/relativeTime';

atemporal.extend(relativeTime);
```

Deployments that guarantee `globalThis.Temporal` can use `atemporal/native`
and `atemporal/native/plugins/*` to exclude the fallback entirely. The native
entry throws at import time when Temporal is unavailable. Use the same entry
family for the factory, named errors/helpers, and plugins. All eight plugins and `lazyLoad()` are
available in each distribution. Import plugins and overlap helpers from their
explicit `plugins/*` subpaths; the compat root retains the legacy named exports.

The polyfill remains installed for automatic fallback. Public Temporal types
are self-contained and support TypeScript 5.4+ without global Temporal types.

### Choose an entry for v3

| Entry | Module/build requirement | Temporal fallback |
| --- | --- | --- |
| `atemporal` (ESM) | ES2022 ESM with top-level await | Conditional dynamic import |
| `atemporal` (CommonJS) | Synchronous `require()` | Required only when native Temporal is unavailable |
| `atemporal/compat` | ES2020, including IIFE builds | Static polyfill import |
| `atemporal/native` | ES2020 and complete `globalThis.Temporal` | None; import fails if Temporal is missing/incomplete |

CommonJS reads the default exports explicitly:

```js
const { default: atemporal } = require('atemporal');
const { default: relativeTime } = require('atemporal/plugins/relativeTime');
atemporal.extend(relativeTime);
```

Browser download savings from the default ESM fallback require code splitting.
A single-file build can still contain the fallback, and total output includes
the optional chunks. `atemporal/native` excludes fallback code from the build
while the installed package still includes its polyfill dependency.

### Changed plugin imports

The default and native roots no longer export `dateRangeOverlapPlugin`,
`businessDaysPlugin`, `timeSlotsPlugin`, `checkDateRangeOverlap`,
`InvalidDateRangeError`, or `OverlapDetectionError`. Use the plugin subpaths:

```ts
import businessDays from 'atemporal/plugins/businessDays';
import timeSlots from 'atemporal/plugins/timeSlots';
import dateRangeOverlap, {
  checkDateRangeOverlap,
  InvalidDateRangeError,
  OverlapDetectionError,
} from 'atemporal/plugins/dateRangeOverlap';
```

Use matching `atemporal/native/plugins/*` paths with the native factory.
`atemporal/compat` retains all six legacy named exports. Installed plugin methods
and `lazyLoad()` continue to work; see the [v3 migration guide](docs/migration/v3.md).

## Quick Start

```ts
import atemporal from "atemporal";
import relativeTime from "atemporal/plugins/relativeTime";

// Extend atemporal with the plugins you need
atemporal.extend(relativeTime);

// Create instances from various inputs
const now = atemporal();
const fromString = atemporal("2025-07-09T15:30:00Z");
const fromUnix = atemporal.unix(1752096000);
const fromDate = atemporal(new Date());
const fromArray = atemporal([2025, 7, 9, 15, 30]);
const fromFirebase = atemporal({ seconds: 1672531200, nanoseconds: 0 });

// Create durations
const twoHours = atemporal.duration({ hours: 2, minutes: 30 });

// Manipulate dates immutably
const future = now.add(3, "days").startOf("day");

// Format dates
console.log(now.format("YYYY-MM-DD HH:mm:ss"));
console.log(now.format({ dateStyle: "full" }, "es-CR"));

// Compare dates
if (future.isAfter(now)) {
  console.log("The future is coming.");
}

// Use plugins
const past = now.subtract(5, "minutes");
console.log(past.fromNow()); // "5 minutes ago"
```

## Formatting and serialization

`.toString()` preserves the instance's local time and UTC offset. For the UTC
`Z` string returned by native `Date.toISOString()`, use `.toISOString()`:

```ts
const start = atemporal('2026-12-08T18:00:00', 'America/Puerto_Rico');

start.toString(); // '2026-12-08T18:00:00-04:00'
start.toISOString(); // '2026-12-08T22:00:00.000Z'
start.toDate().toISOString(); // Same UTC result; also works in earlier versions
```

When storing dates as strings for comparison or sorting (for example, Firestore
`orderBy('startsAt')`), use a consistent UTC format. Mixing offsets or fractional
second widths can break chronological ordering by string comparison.
`.toISOString()` always includes three millisecond digits, discards
sub-millisecond precision, and throws `RangeError` for an invalid instance,
matching native `Date.toISOString()`. `.toString()` returns `'Invalid Date'`
for invalid instances. See the [serialization reference](./docs/api/formatting.md#iso-serialization).

## Choose a value and parsing policy

When the value category is known, explicit constructors return raw Temporal
values with their own methods:

```ts
import atemporal from 'atemporal';

const event = atemporal.instant('2026-07-15T10:00:00.123456789Z'); // Temporal.Instant
const invoiceDate = atemporal.date('2026-07-15'); // Temporal.PlainDate
const openingTime = atemporal.plainDateTime('2026-07-15T09:00:00'); // Temporal.PlainDateTime
const meeting = atemporal.zonedDateTime('2026-07-15T10:00:00', {
  timeZone: 'America/Costa_Rica',
}); // Temporal.ZonedDateTime
```

For the chainable wrapper and its formatting/plugins, use strict parsing at
untrusted-input boundaries. `parse()` throws `InvalidDateError`; `tryParse()`
returns `null`. Both reject invalid calendar values and DST gaps/overlaps by
default. Choose a different disambiguation policy explicitly when needed:

```ts
const appointment = atemporal.tryParse('2026-11-01T01:30:00', {
  timeZone: 'America/New_York',
  disambiguation: 'later',
});
if (appointment) console.log(appointment.format('YYYY-MM-DD HH:mm Z'));
```

The callable `atemporal(input, timeZone?)` keeps compatibility parsing and can
return an invalid wrapper; check `.isValid()`. Raw Temporal values from the
explicit constructors do not have wrapper methods such as `.format()` or plugin
methods. See [Choosing the public API](docs/guide/choosing-an-api.md).

## Configuration

```ts
// Set global defaults
atemporal.setDefaultTimeZone("America/New_York");
atemporal.setDefaultLocale("en-US");

// Get current configuration
const locale = atemporal.getDefaultLocale();

// Check Temporal implementation
const info = atemporal.getTemporalInfo();
// { isNative: boolean, environment: "browser" | "node" | "unknown", version: "native" | "polyfill" }
```

## Testing and quality

Jest enforces global minimum coverage of 95% statements, 95% lines, 90%
branches, and 90% functions. Coverage collection includes public factory logic
such as `src/index.ts`. Codecov tracks coverage trends and pull-request diffs;
it does not enforce these thresholds.

Compatibility guaranteed: every pull request continuously tests installation, native imports, TypeScript resolution, core operations, formatting, and official plugin loading from the packed npm artifact.

Compatibility additionally validated: scheduled and release fixtures verify production Vite, Webpack, and Next.js SSR builds.

Pull requests block on all four coverage thresholds: 95% statements, 95% lines,
90% branches, and 90% functions. Core distribution and canonical application
bundle size budgets are contractual gates; packed-tarball and other application
bundle measurements are diagnostic context in the generated size report.

The performance regression gate runs in the weekly hosted Ubuntu 24.04/x64,
Node 24.12.0 validation job and again before a release. It compares hot-path
medians to a reviewed baseline. The manual hosted-baseline capture workflow
uploads a proposed schema baseline for human review; CI never writes or commits
a baseline. Every release publishes the exact tarball that its release-validation
job tested, rather than rebuilding a package in the publish job.

---

## Support & Contribution

If you'd like to support atemporal, the best ways are:

- **Star the repo** and share it with a colleague.
- **Open issues and PRs** — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- **Report security issues** privately — see [`SECURITY.md`](./SECURITY.md).
- **Sponsorship** — see the [`.github/FUNDING.yml`](./.github/FUNDING.yml)
  for the current list of sponsorship platforms (managed separately
  from the README to keep the project neutral).

---

## License

MIT [NaturalDevCR](https://github.com/NaturalDevCR)
