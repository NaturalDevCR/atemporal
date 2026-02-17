# Core Concepts

## Why Atemporal?

- ✅ **Immutable and Chainable API**: A fluid and predictable coding style, inspired by Day.js.
- 🧩 **Extensible Plugin System**: Add only the functionality you need, keeping the core lightweight.
- 🌐 **Localization-Ready**: Native integration with `Intl` for localized formats and names.
- 🌍 **Time Zone-Aware**: First-class support for IANA time zones (e.g., `America/New_York`).
- 🔒 **Type-Safe**: Built in TypeScript for an excellent developer experience and autocompletion.
- 🎯 **Temporal-Powered**: Uses the future standard JavaScript API for date handling, with a polyfill included.

## Immutability

All manipulation methods in Atemporal are immutable. This means that instead of modifying the existing instance, they return a new instance with the changes applied.

```ts
const original = atemporal();
const future = original.add(1, "day");

console.log(original.isSame(future)); // false
```

## Temporal API

Atemporal is built directly on top of the [Temporal API](https://tc39.es/proposal-temporal/docs/), which is the new standard for date and time in JavaScript. It solves many of the problems with the legacy `Date` object, such as:

- Mutability
- Difficulties with time zones
- Lack of support for non-Gregorian calendars
- Missing common functionality like date-only types

Atemporal provides a more ergonomic wrapper around this powerful API.
