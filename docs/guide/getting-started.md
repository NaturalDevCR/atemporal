# Getting Started

Atemporal is a modern, immutable, and ergonomic date-time library built on top of the new Temporal API — with support for formatting, localization, plugins, and time zones.

> Powered by the Temporal API and polyfilled automatically via `@js-temporal/polyfill` — no extra setup required.

## Installation

Install `atemporal` with your package manager:

```bash
# Preferred
pnpm add atemporal

# Also supported
npm install atemporal
```

> You don't need to install `@js-temporal/polyfill` separately. It is a direct
> runtime dependency of `atemporal`, so your package manager installs it with
> the package. It is not a separate plugin or peer dependency.

Atemporal ships with full TypeScript declarations. Autocompletion and type checking work out of the box.

## Quick Start

```ts
import atemporal from "atemporal";
import relativeTime from "atemporal/plugins/relativeTime";

// Extend atemporal with the plugins you need
atemporal.extend(relativeTime);

// Create an instance with the current date and time
const now = atemporal();
console.log(now.format("YYYY-MM-DD HH:mm:ss"));
// => "2024-08-14 10:30:00" (example)

// Manipulate dates immutably
const future = now.add(3, "days").startOf("day");
console.log(future.toString());
// => "2024-08-17T00:00:00Z" (example)

// Compare dates
if (future.isAfter(now)) {
  console.log("The future is coming.");
}

// Use plugins for extended functionality
const past = now.subtract(5, "minutes");
console.log(past.fromNow());
// => "5 minutes ago"
```

### CommonJS

When consuming the CommonJS export, read the default export explicitly:

```js
const { default: atemporal } = require("atemporal");
const { default: relativeTime } = require("atemporal/plugins/relativeTime");

atemporal.extend(relativeTime);
```

## Basic Operations

### Creating Instances

```ts
// Current time (uses default time zone, UTC by default)
atemporal();

// From ISO 8601 string
atemporal("2025-07-09T15:30:00Z");

// From a JavaScript Date
atemporal(new Date());

// From a Unix timestamp (seconds)
atemporal.unix(1752096000); // => 2025-07-09T00:00:00Z

// From a Unix timestamp (milliseconds)
atemporal(1752096000000);

// From an array [year, month, day, hour, min, sec, ms]
atemporal([2025, 7, 9, 15, 30]);

// From a plain object
atemporal({ year: 2025, month: 7, day: 9 });

// From Firebase/Firestore timestamps
atemporal({ seconds: 1672531200, nanoseconds: 0 });

// Clone an existing instance
const original = atemporal();
const clone = atemporal(original);

// Specify a time zone
atemporal("2025-01-01T12:00:00", "America/New_York");
```

### Working with Durations

```ts
// Create a duration
const twoHours = atemporal.duration({ hours: 2, minutes: 30 });

// From an ISO string
const fromString = atemporal.duration("PT2H30M");

// Use in manipulations
const now = atemporal();
const future = now.add(twoHours);

// Subtract with a duration
const past = now.subtract({ hours: 1, minutes: 15 });
```

### Global Configuration

```ts
// Set default time zone (affects all new instances)
atemporal.setDefaultTimeZone("America/New_York");

// Set default locale (affects formatting)
atemporal.setDefaultLocale("es-CR");

// Get current defaults
const locale = atemporal.getDefaultLocale(); // "es-CR"
```

### Validation

```ts
// Check if input can be parsed
atemporal.isValid("2025-07-09"); // true
atemporal.isValid("not a date"); // false

// Check timezone validity
atemporal.isValidTimeZone("Asia/Tokyo"); // true
atemporal.isValidTimeZone("Narnia");     // false

// Check locale validity
atemporal.isValidLocale("en-US"); // true
atemporal.isValidLocale("zz");    // false
```

### Formatting

```ts
const date = atemporal("2025-07-09T14:30:00Z");

// Token-based formatting
date.format("YYYY-MM-DD");                     // "2025-07-09"
date.format("dddd, MMMM Do YYYY [at] HH:mm"); // "Wednesday, July 9th 2025 at 14:30"

// Intl-based formatting
date.format({ dateStyle: "full" }, "es-CR");   // "miércoles, 9 de julio de 2025"
```

## Next Steps

- [Core Concepts](./core-concepts) — Understand immutability, plugins, input types, and architecture
- [API Reference](/api/) — Complete reference for all methods
- [Plugins](/plugins/) — Explore all 8 official plugins
