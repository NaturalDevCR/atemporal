# Getting Started

Atemporal is a modern, immutable, and ergonomic date-time library built on top of the new Temporal API — with support for formatting, localization, plugins, and time zones.

> ⚡️ Powered by the Temporal API and polyfilled automatically via `@js-temporal/polyfill` — no extra setup required.

## Installation

To install `atemporal`, run:

```bash
npm install atemporal
```

> 🔧 You don't need to install `@js-temporal/polyfill` separately — it's already bundled and applied automatically.

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
