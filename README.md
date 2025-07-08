# atemporal

![npm](https://img.shields.io/npm/v/atemporal)
![license](https://img.shields.io/npm/l/atemporal)

## Warning!
This is a work in progress, and is in a very alpha state, please don't use it in production yet.


## Overview

A modern and ergonomic date-time library for JavaScript, built on top of the native `Temporal` API. It provides a simple, chainable interface inspired by Day.js, while leveraging the precision and power of Temporal for all its operations.

---
## Key Features

*   ✨ **Modern API**: Built on the TC39 `Temporal` proposal, the future of dates in JavaScript.
*   🌍 **Timezone-First**: Robust, explicit timezone handling is a core feature, not an afterthought.
*   ⛓️ **Chainable & Immutable**: All manipulation methods return a new `atemporal` instance, preventing bugs and side effects.
*   💪 **TypeScript Native**: Written entirely in TypeScript for a great developer experience with autocompletion and type safety.
*   🛡️ **Robust Error Handling**: Invalid dates don't throw errors. Instead, they create invalid instances that you can safely check with `.isValid()`.
*
---

## Core Concepts

### Inmutability
All atemporal instances are immutable. When you call a manipulation method like .add() or .startOf(), it does not change the original instance. Instead, it returns a new atemporal instance with the updated value.


### Handling Invalid Dates

Unlike the legacy `Date` object or libraries that throw errors, `atemporal` handles invalid inputs gracefully. If you provide an invalid date string or object, it will create an invalid `atemporal` instance. You can check for this using the `.isValid()` method.

Any operation performed on an invalid instance will return a sensible "invalid" value (e.g., `NaN`, `false`, or the string `'Invalid Date'`).

You can also use the static `atemporal.isValid()` to check an input before creating an instance.



## API Reference

### Get & Set

Access date parts using convenient getters or the `.get()` method.



## Plugins

Extend `atemporal`'s functionality with plugins.

### Using a Plugin

To use a plugin, import it and pass it to the `atemporal.extend()` method.


## Installation

`npm install atemporal`

## Quickstart

```typescript

import atemporal from 'atemporal';

// Global Configuration
// Set the default timezone and locale for all new `atemporal` instances.

atemporal.setDefaultLocale('en-US');
atemporal.setDefaultTimeZone('America/New_York');

// Create an instance with the current date and time
const now = atemporal();

// Chain methods to manipulate the date
const nextWeek = now.add(1, 'week').startOf('day');

```

## Usage Examples
### Parsing
Create atemporal instances from various inputs.

```typescript
// From an ISO string
const eventDate = atemporal('2025-12-25T19:00:00-06:00');

// From a Date object
const legacyDate = atemporal(new Date());

// Invalid dates will throw an error
import { isValid } from 'atemporal';
console.log(isValid('not a date')); // false

```


