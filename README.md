# Atemporal

![npm](https://img.shields.io/npm/v/atemporal)
![license](https://img.shields.io/npm/l/atemporal)
![bundle size](https://img.shields.io/bundlephobia/min/atemporal)

Atemporal is a modern, immutable, and ergonomic date-time library built on top of the new Temporal API (TC39 Stage 4, ES2026) — with support for formatting, localization, plugins, and time zones.

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
| Immutable by default | Yes | No | Yes | Yes |
| Plugin system | 8 official plugins | Extensive | No | No |
| Firebase timestamps | Yes | No | No | No |
| Native Temporal fallback | Auto-detected | N/A | N/A | N/A |
| IANA time zones | Yes | Via plugin | Yes | Yes (v3+) |
| Bundle (min) | ~15KB | ~2KB | ~60KB | Tree-shakeable |

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
