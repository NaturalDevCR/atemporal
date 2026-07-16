# Atemporal

![npm](https://img.shields.io/npm/v/atemporal)
[![npm downloads](https://img.shields.io/npm/dm/atemporal.svg)](https://www.npmjs.com/package/atemporal)
![license](https://img.shields.io/npm/l/atemporal)

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
| Size measurements | [Generated report](https://github.com/NaturalDevCR/atemporal/blob/main/reports/size-report.md) | Varies by use | Varies by use | Varies by use |

Core distribution, packed-tarball, and application-bundle sizes are separate
measurements; see the [generated size report](https://github.com/NaturalDevCR/atemporal/blob/main/reports/size-report.md).
`@js-temporal/polyfill` is a direct runtime dependency, and its application-bundle
cost is measured separately rather than inferred from the core distribution.

## Documentation

For full guides and API reference, please visit:

**[naturaldevcr.github.io/atemporal](https://naturaldevcr.github.io/atemporal/)**

**[AI-Friendly Documentation (llms.txt)](https://naturaldevcr.github.io/atemporal/llms.txt)**

---

## Installation

```bash
npm install atemporal
```

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
Node 20.19.0 validation job and again before a release. It compares hot-path
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
