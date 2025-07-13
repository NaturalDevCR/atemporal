# Atemporal
![npm](https://img.shields.io/npm/v/atemporal)
![license](https://img.shields.io/npm/l/atemporal)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/NaturalDevCR/atemporal)

Atemporal is a modern, immutable, and ergonomic date-time library built on top of the new Temporal API — with first-class support for formatting, localization, plugins, and time zones.

> ⚡️ Powered by the Temporal API and polyfilled automatically via `@js-temporal/polyfill` — no extra setup required.

---

## ⚠️ ⚠️ Warning! ⚠️⚠️
This is a work in progress and is in a very alpha state. Please don't use it in production yet.

---

## 📚 Table of Contents

- [Why Atemporal?](#-why-atemporal)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage and API](#-usage-and-api)
  - [Creating Instances](#creating-instances)
  - [Manipulation](#manipulation)
  - [Getters](#getters)
  - [Formatting (`.format()`)](#formatting-format)
  - [Comparison](#comparison)
  - [Differences (`.diff()`)](#differences-diff)
  - [Durations](#durations)
- [Plugins](#-plugins)
  - [How to Use Plugins](#how-to-use-plugins)
  - [relativeTime](#relativetime)
  - [customParseFormat](#customparseformat)
  - [advancedFormat](#advancedformat)
  - [weekDay](#weekday)
  - [durationHumanizer](#durationhumanizer)
- [Validators and Type Guards](#-validators-and-type-guards)
- [Localization and Time Zones](#-localization-and-time-zones)
- [Browser Usage](#-browser-usage)
- [Contributing](#-want-to-contribute)
- [License](#-license)

---

## 🧠 Why Atemporal?

- ✅ **Immutable and Chainable API**: A fluid and predictable coding style, inspired by Day.js.
- 🧩 **Extensible Plugin System**: Add only the functionality you need, keeping the core lightweight.
- 🌐 **Localization-Ready**: Native integration with `Intl` for localized formats and names.
- 🌍 **Time Zone-Aware**: First-class support for IANA time zones (e.g., `America/New_York`).
- 🔒 **Type-Safe**: Built in TypeScript for an excellent developer experience and autocompletion.
- 🎯 **Temporal-Powered**: Uses the future standard JavaScript API for date handling, with a polyfill included.

---

## 📦 Installation

```bash
npm install atemporal
```

> 🔧 You don't need to install `@js-temporal/polyfill` separately — it's already bundled and applied automatically.

> Note on the Polyfill: For maximum compatibility, atemporal automatically imports @js-temporal/polyfill. This adds the Temporal object to the global scope (globalThis.Temporal), ensuring the API is available everywhere. This is designed for convenience, but be aware that it creates a global side effect.

---

## 🚀 Quick Start

```ts
import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

// Extend atemporal with the plugins you need
atemporal.extend(relativeTime);

// Create an instance with the current date and time
const now = atemporal();
console.log(now.format('YYYY-MM-DD HH:mm:ss'));
// => "2024-08-14 10:30:00" (example)

// Manipulate dates immutably
const future = now.add(3, 'days').startOf('day');
console.log(future.toString());
// => "2024-08-17T00:00:00Z" (example)

// Compare dates
if (future.isAfter(now)) {
  console.log('The future is coming.');
}

// Use plugins for extended functionality
const past = now.subtract(5, 'minutes');
console.log(past.fromNow());
// => "5 minutes ago"
```

---

## 📚 Usage and API

### Creating Instances

You can create an `atemporal` instance from various input types:

```ts
import atemporal from 'atemporal';

// Current date and time in the default time zone (UTC)
atemporal();

// From an ISO 8601 string (with or without 'Z')
atemporal('2025-07-09T15:30:00');
atemporal('2025-07-09T15:30:00Z');

// From a JavaScript Date object
atemporal(new Date());

// From a Unix timestamp (in seconds)
atemporal.unix(1752096000); // => 2025-07-09T00:00:00Z

// From a Unix timestamp (in milliseconds)
atemporal(1752096000000);

// From an array: [year, month, day, hour, min, sec, ms]
atemporal([2025, 7, 9, 15, 30]);

// From an object
atemporal({ year: 2025, month: 7, day: 9 });

// From a Firebase/Firestore Timestamp object (built-in support)
const firestoreTs = { seconds: 1672531200, nanoseconds: 500000000 };
const date = atemporal(firestoreTs);
console.log(date.toString());
// => "2023-01-01T00:00:00.500Z"

// Clone an existing instance
const original = atemporal();
const clone = atemporal(original);

// Specify a time zone on creation
atemporal('2025-01-01T12:00:00', 'America/New_York');
```

### Manipulation

All manipulation methods are immutable and return a new `atemporal` instance.

```ts
const date = atemporal('2024-08-14T10:00:00Z');

// Add time
date.add(5, 'days');       // Add 5 days
date.add(2, 'h');          // Add 2 hours (alias)
date.add({ months: 1, days: 10 }); // Add 1 month and 10 days

// Subtract time
date.subtract(2, 'weeks'); // Subtract 2 weeks
date.subtract(30, 'm');    // Subtract 30 minutes (alias)

// Set a value
date.set('year', 2025);    // Set the year to 2025
date.set('hour', 9);       // Set the hour to 9
date.set('quarter', 1);    // Set the date to the start of the 1st quarter

// Move to the start or end of a unit
date.startOf('month');     // Start of the month (e.g., 2024-08-01T00:00:00.000)
date.endOf('day');         // End of the day (e.g., 2024-08-14T23:59:59.999)

// Get or set the day of the week (1=Monday, 7=Sunday)
date.dayOfWeek();          // Getter: returns 3 (for a Wednesday)
date.dayOfWeek(1);         // Setter: moves the date to the Monday of that week
```

### Getters

Access parts of the date using properties and methods.

```ts
const date = atemporal('2024-08-14T10:30:45.123Z');

date.year;         // 2024
date.month;        // 8
date.day;          // 14
date.hour;         // 10
date.minute;       // 30
date.second;       // 45
date.millisecond;  // 123
date.daysInMonth;  // 31
date.weekOfYear;   // 33 (ISO week number)

// Methods
date.get('month'); // 8
date.quarter();    // 3 (third quarter)
date.isLeapYear(); // true (2024 is a leap year)
date.toDate();     // Convert to a JS `Date` object
date.toString();   // '2024-08-14T10:30:45.123Z'
date.raw;          // Access the underlying `Temporal.ZonedDateTime` object
```

### Formatting (`.format()`)

The `.format()` method is very versatile. It accepts a token string or an `Intl` options object.

#### Token-based Formatting

| Token  | Output Example        | Description                  |
| ------ | --------------------- | ---------------------------- |
| `YYYY` | `2025`                | 4-digit year                 |
| `YY`   | `25`                  | 2-digit year                 |
| `MM`   | `07`                  | Month, 2-digits (01-12)      |
| `M`    | `7`                   | Month (1-12)                 |
| `DD`   | `09`                  | Day of month, 2-digits (01-31)|
| `D`    | `9`                   | Day of month (1-31)          |
| `HH`   | `14`                  | Hour, 2-digits (00-23)       |
| `H`    | `14`                  | Hour (0-23)                  |
| `hh`   | `02`                  | Hour, 12-hour clock, 2-digits (01-12)|
| `h`    | `2`                   | Hour, 12-hour clock (1-12)    |
| `mm`   | `05`                  | Minute, 2-digits (00-59)     |
| `m`    | `5`                   | Minute (0-59)                |
| `ss`   | `02`                  | Second, 2-digits (00-59)     |
| `s`    | `2`                   | Second (0-59)                |
| `SSS`  | `123`                 | Millisecond, 3-digits        |
| `dddd` | `Wednesday`           | Full day of the week name    |
| `ddd`  | `Wed`                 | Short day of the week name   |
| `Z`    | `+02:00`              | Time zone offset with colon  |
| `ZZ`   | `+0200`               | Time zone offset without colon|
| `z`    | `America/New_York`    | IANA time zone name          |
| `zzz`  | `EST`                 | Short localized time zone name¹ |
| `zzzz` | `Eastern Standard Time` | Long localized time zone name¹ |
| `Do`   | `22nd`                | Day of month with ordinal¹   |
| `Qo`   | `2nd`                 | Quarter of year with ordinal¹|

¹ *Requires the `advancedFormat` plugin.*

*(Note: Characters in brackets `[]` are displayed literally.)*

```ts
atemporal().format('YYYY-MM-DD [at] HH:mm:ss');
// => "2025-07-09 at 14:23:00"
```

#### `Intl.DateTimeFormat`-based Formatting

For advanced localization, pass an options object.

```ts
atemporal().format({ dateStyle: 'full', timeStyle: 'medium' }, 'es-CR');
// => "miércoles, 9 de julio de 2025, 14:23:00"
```

### Comparison

```ts
const d1 = atemporal('2024-01-01');
const d2 = atemporal('2024-06-15');
const d3 = atemporal('2024-01-01');

d1.isBefore(d2);        // true
d2.isAfter(d1);         // true
d1.isSame(d3);          // true

// Compare only up to a specific unit
d1.isSame('2024-01-01T12:00:00', 'day'); // true
d1.isSameDay('2024-01-01T12:00:00');    // true (alias for .isSame(..., 'day'))

// New comparison methods
d1.isSameOrBefore(d2);  // true
d2.isSameOrAfter(d1);   // true

// Check if a date is between two others
d1.isBetween('2023-12-31', '2024-01-02'); // true
d1.isBetween('2024-01-01', '2024-01-02', '()'); // false (exclusive inclusivity)
```

### Differences (`.diff()`)

Calculate the difference between two dates.

```ts
const start = atemporal('2024-01-01T10:00:00');
const end = atemporal('2024-01-02T13:00:00'); // 27 hours later

// By default, returns a truncated integer
end.diff(start, 'day');    // 1
end.diff(start, 'hour');   // 27

// To get the exact floating-point value, pass `true`
end.diff(start, 'day', true); // 1.125
```

### Durations

Create and manipulate `Temporal.Duration` objects.

```ts
// Create a duration
const duration = atemporal.duration({ hours: 3, minutes: 30 });

// Use it in manipulations
const now = atemporal();
const future = now.add(duration);

console.log(future.format('HH:mm')); // => 3 hours and 30 minutes in the future
```

---

## 🔌 Plugins

Atemporal has a plugin system to extend its functionality.

### How to Use Plugins

Import the plugin and extend `atemporal` using `atemporal.extend()`.

```ts
import atemporal from 'atemporal';
import myPlugin from 'atemporal/plugins/myPlugin';

atemporal.extend(myPlugin);
```

### relativeTime

Adds the `.fromNow()` and `.toNow()` methods for displaying relative time.

```ts
import relativeTime from 'atemporal/plugins/relativeTime';
atemporal.extend(relativeTime);

atemporal().subtract(5, 'minutes').fromNow(); // "5 minutes ago"
atemporal().add(2, 'hours').fromNow();        // "in 2 hours"
```

### customParseFormat

Allows creating an `atemporal` instance from a string with a custom format.

```ts
import customParseFormat from 'atemporal/plugins/customParseFormat';
atemporal.extend(customParseFormat);

const date = atemporal.fromFormat('15/03/2024 10:30', 'DD/MM/YYYY HH:mm');
console.log(date.toString());
```

### advancedFormat

Extends `.format()` with advanced tokens like ordinals and quarters.

```ts
import advancedFormat from 'atemporal/plugins/advancedFormat';
atemporal.extend(advancedFormat);

const date = atemporal('2024-01-22');
date.format('Do MMMM YYYY'); // "22nd January 2024"

// With localization
date.format('Do MMMM YYYY', 'es'); // "22º de enero de 2024"

// Ordinal and Quarter tokens
date.format('Do MMMM YYYY'); // "22nd January 2024"
date.format('Qo [Quarter]'); // "1st Quarter"

// Timezone name tokens
date.format('HH:mm zzzz'); // "12:00 Eastern Standard Time"
```

### weekDay

Allows customizing the start of the week and adds the `.weekday()` method.

```ts
import weekDay from 'atemporal/plugins/weekDay';
atemporal.extend(weekDay);

const wed = atemporal('2024-08-14'); // A Wednesday

// Default: week starts on Monday (1). .weekday() is 0-indexed from start.
console.log(wed.weekday()); // 2 (Mon=0, Tue=1, Wed=2)
console.log(wed.startOf('week').format('dddd')); // "Monday"

// Change the start of the week to Sunday (0)
atemporal.setWeekStartsOn(0);
console.log(wed.weekday()); // 3 (Sun=0, Mon=1, Tue=2, Wed=3)
console.log(wed.startOf('week').format('dddd')); // "Sunday"
```

### durationHumanizer

Adds the static method `atemporal.humanize()` to turn durations into readable text. It also supports different display styles.

```ts
import durationHumanizer from 'atemporal/plugins/durationHumanizer';
atemporal.extend(durationHumanizer);

const d = { years: 2, months: 3, days: 5 };
atemporal.humanize(d); // "2 years, 3 months, and 5 days"
atemporal.humanize(d, { locale: 'es' }); // "2 años, 3 meses y 5 días"

// Using different unit displays
atemporal.humanize(d, { unitDisplay: 'short' }); // "2 yr, 3 mo, and 5 days"
```

---

## 🛡️ Validators and Type Guards

Atemporal includes static utilities for writing more robust code.

```ts
import atemporal from 'atemporal';
import { Temporal } from '@js-temporal/polyfill';

// Check if an input is an atemporal instance
atemporal.isAtemporal(atemporal()); // true
atemporal.isAtemporal(new Date());   // false

// Check if an input can be parsed into a valid date
atemporal.isValid('2024-05-10');   // true
atemporal.isValid('not a date');   // false

// Check if an object is a Temporal.Duration instance
atemporal.isDuration(Temporal.Duration.from({ hours: 1 })); // true

// Check if a string is a valid IANA time zone
atemporal.isValidTimeZone('America/Costa_Rica'); // true
atemporal.isValidTimeZone('Mars/Olympus_Mons');  // false

// Check if a string is a valid locale code
atemporal.isValidLocale('en-US'); // true
atemporal.isValidLocale('en_US'); // false
```

---

## 🌍 Localization and Time Zones

Configure global defaults for your entire application.

```ts
// Set the default locale and time zone
atemporal.setDefaultLocale('es-CR');
atemporal.setDefaultTimeZone('America/Costa_Rica');

// All new instances without arguments will use these defaults
const now = atemporal();
console.log(now.format('dddd, DD [de] MMMM [de] YYYY', 'es-CR'));
// => "miércoles, 14 de agosto de 2024" (example)

console.log(now.timeZoneName);
// => "America/Costa_Rica"

// You can override the time zone when creating an instance
const tokyoTime = atemporal('2024-01-01T12:00:00', 'Asia/Tokyo');
console.log(tokyoTime.format('HH:mm z')); // => "12:00 Asia/Tokyo"
```

---

### Error Handling

Atemporal uses custom error classes so you can handle failures in a specific and robust way, rather than relying on generic error messages.

```ts
import atemporal, { InvalidTimeZoneError } from 'atemporal';

try {
  // Attempt to use an invalid time zone
  atemporal.setDefaultTimeZone('Mars/Olympus_Mons');
} catch (e) {
  if (e instanceof InvalidTimeZoneError) {
    console.error('Caught error:', e.message);
    // => "Caught error: Invalid time zone: Mars/Olympus_Mons"
  }
}
```

The main error classes you can import are:
- `InvalidTimeZoneError`: For invalid IANA time zone identifiers.
- `InvalidDateError`: When an input cannot be parsed into a valid date.
- `InvalidAtemporalInstanceError`: When an operation is attempted on an invalid instance.

---

## 📜 License

MIT — Josue Orozco A.

---

## 🛠️ Roadmap (v1.0)

- **Unit Tests**: Specially Coverage
- **Performance Optimizations**: Fine-tuning internal operations for faster response times.
- **Expanded Documentation**: More examples, guides, and API details.
- **Additional Locale Support**: Increasing the number of built-in translations and custom locale options.
- **Better Error Handling**: Clearer and more descriptive error messages for easier debugging.

---

## 🛠️ Want to contribute?

Contributions are always welcome! This project follows the [standard fork & pull request workflow](https://gist.github.com/Chaser324/ce0505fbed06b947d962).

To get started:
1.  Fork the repository.
2.  Clone your fork: `git clone https://github.com/YOUR_USERNAME/atemporal.git`
3.  Install dependencies: `npm install`
4.  Run the tests: `npm test`

[//]: # (Please see our **Contributing Guide** for more details on our code standards and practices.)

---

## A Note on AI-Assisted Development
This library was developed with the support of AI coding assistants. These tools were instrumental in providing architectural guidance, accelerating debugging, and exploring code optimization strategies. The final architecture, implementation, and tests are the result of the author's direct work and final decisions.

---

## Want to support my work?
<a href="https://buymeacoffee.com/naturaldevcr" target="_blank"><img src="https://github.com/user-attachments/assets/98a65e1b-2843-4333-8955-0db7a20477bf" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>

### [Donate - Paypal](https://www.paypal.com/donate/?hosted_button_id=A8MKF5RNGQ77U).