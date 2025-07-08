# atemporal

![npm](https://img.shields.io/npm/v/atemporal)
![license](https://img.shields.io/npm/l/atemporal)

A modern and ergonomic date-time library for JavaScript, built on top of the native `Temporal` API. It provides a simple, chainable interface inspired by Day.js, while leveraging the precision and power of Temporal for all its operations.

## Key Features

* ✨ **Modern API**: Built on `Temporal`, avoiding the pitfalls of the legacy `Date` object.
* 🌍 **Timezone-First**: Robust, explicit timezone handling is a core feature, not an afterthought.
* ⛓️ **Chainable & Immutable**: All manipulation methods return a new `atemporal` instance, preventing bugs and side effects.
* 💪 **TypeScript Native**: Written entirely in TypeScript for a great developer experience with autocompletion and type safety.

---

## Installation

```
npm install atemporal

## Quickstart

import atemporal from 'atemporal';

// Create an instance with the current date and time
const now = atemporal();

// Chain methods to manipulate the date
const nextWeek = now.add(1, 'week').startOf('day');

// Format the output
console.log(nextWeek.format({
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}));
// => "Tuesday, July 15, 2025" (or the corresponding day)
```

## Usage Examples
### Parsing
Create atemporal instances from various inputs.

```
// From an ISO string
const eventDate = atemporal('2025-12-25T19:00:00-06:00');

// From a Date object
const legacyDate = atemporal(new Date());

// Invalid dates will throw an error
import { isValid } from 'atemporal';
console.log(isValid('not a date')); // false

```
