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
  - [Generating Date Ranges (`.range()`)](#generating-date-ranges-range)
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

### Generating Date Ranges (`.range()`)

The `.range()` method generates an array of dates between a start and end date. It can return either `atemporal` instances or formatted strings.

**API:** `start.range(endDate, unit, options)`
*   `endDate`: The end of the range.
*   `unit`: The step unit (e.g., `'day'`, `'week'`).
*   `options` (optional):
  *   `inclusivity`: `'[]'` (default), `'()'`, `'[)'`, `'(]'`.
  *   `format`: If provided, returns a `string[]` instead of `atemporal[]`.

```ts
const start = atemporal('2024-04-28');
const end = atemporal('2024-05-02');

// 1. Get an array of atemporal instances (default)
const dateRange = start.range(end, 'day');
// => [atemporal, atemporal, atemporal, atemporal, atemporal]

// 2. Get an array of formatted strings directly
const formattedRange = start.range(end, 'day', {
  format: 'YYYY-MM-DD',
  inclusivity: '[)' // Include start, exclude end
});
// => ['2024-04-28', '2024-04-29', '2024-04-30', '2024-05-01']

// 3. Generate by week
const weeklyRange = start.range(end, 'week', { format: 'MMMM Do' });
// => ['April 28th']
```

---

## 🔌 Plugins

Atemporal has a plugin system to extend its functionality.

### How to Use Plugins

#### Standard Plugin Loading

Import the plugin and extend `atemporal` using `atemporal.extend()`.

```ts
import atemporal from 'atemporal';
import myPlugin from 'atemporal/plugins/myPlugin';

atemporal.extend(myPlugin);
```

#### Lazy Loading Plugins

To reduce the initial bundle size, you can load plugins on demand:

```ts
import atemporal from 'atemporal';

// Load the plugin only when needed
async function showRelativeTime() {
  // Load the plugin on demand
  await atemporal.lazyLoad('relativeTime');
  
  // Now you can use the plugin's functionality
  const twoHoursAgo = atemporal().subtract(2, 'hour');
  console.log(twoHoursAgo.fromNow()); // "2 hours ago"
}

// Check if a plugin is loaded
console.log(atemporal.isPluginLoaded('relativeTime')); // false

// View all loaded plugins
console.log(atemporal.getLoadedPlugins()); // []
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

Allows creating an `atemporal` instance from a string with a custom format. Features high-performance parsing with intelligent caching, comprehensive error handling, and support for advanced date formats including 12-hour format with AM/PM, month names, day of year, and ambiguous time formats.

```ts
import customParseFormat, { getParseError } from 'atemporal/plugins/customParseFormat';
atemporal.extend(customParseFormat);

// Basic date parsing
const date1 = atemporal.fromFormat('15/03/2024 10:30', 'DD/MM/YYYY HH:mm');
console.log(date1.toString()); // "2024-03-15T10:30:00.000Z"

// Time-only formats (uses current date for missing parts)
const time = atemporal.fromFormat('14:30', 'HH:mm');
console.log(time.format('YYYY-MM-DD HH:mm')); // Uses today's date with 14:30

// Two-digit year support (Y2K compliant: 00-68 → 2000-2068, 69-99 → 1969-1999)
const y2k1 = atemporal.fromFormat('25-12-31', 'YY-MM-DD'); // 2025-12-31
const y2k2 = atemporal.fromFormat('85-06-15', 'YY-MM-DD'); // 1985-06-15

// Milliseconds support
const precise1 = atemporal.fromFormat('2024-01-01 12:30:45.123', 'YYYY-MM-DD HH:mm:ss.SSS');
const precise2 = atemporal.fromFormat('2024-01-01 12:30:45.12', 'YYYY-MM-DD HH:mm:ss.SS'); // 120ms
const precise3 = atemporal.fromFormat('2024-01-01 12:30:45.1', 'YYYY-MM-DD HH:mm:ss.S');   // 100ms

// 12-hour format with AM/PM
const ampm1 = atemporal.fromFormat('2024-01-01 02:30 PM', 'YYYY-MM-DD hh:mm A');
const ampm2 = atemporal.fromFormat('2024-01-01 11:45 am', 'YYYY-MM-DD h:mm a');

// Month names
const monthName1 = atemporal.fromFormat('January 15, 2024', 'MMMM DD, YYYY');
const monthName2 = atemporal.fromFormat('Jan 15, 2024', 'MMM DD, YYYY');

// Day of year
const dayOfYear = atemporal.fromFormat('2024-100', 'YYYY-DDD'); // 100th day of 2024

// Week of year
const weekOfYear1 = atemporal.fromFormat('2024-W15', 'YYYY-[W]WW'); // 15th week of 2024
const weekOfYear2 = atemporal.fromFormat('2024-W5', 'YYYY-[W]W');   // 5th week of 2024

// Ambiguous time formats
const ambiguous = atemporal.fromFormat('630', 'Hmm'); // 6:30 AM
const standard = atemporal.fromFormat('0630', 'HHmm');  // 6:30 AM

// Mixed single/double digit tokens
const mixed1 = atemporal.fromFormat('5/7/2024', 'D/M/YYYY');     // 5th July 2024
const mixed2 = atemporal.fromFormat('05/07/2024', 'DD/MM/YYYY'); // 5th July 2024

// With timezone
const withTz = atemporal.fromFormat('2024-01-01 15:30', 'YYYY-MM-DD HH:mm', 'America/New_York');

// Error handling - Default behavior (backward compatible)
const invalidDate = atemporal.fromFormat('invalid-date', 'YYYY-MM-DD');
if (!invalidDate.isValid()) {
    // Get detailed error information
    const error = getParseError(invalidDate);
    if (error) {
        console.log(`Error Type: ${error.type}`);
        console.log(`Error Message: ${error.message}`);
        console.log(`Input: ${error.dateString}`);
        console.log(`Format: ${error.formatString}`);
    }
}

// Strict error handling (throws exceptions)
try {
    const strictDate = atemporal.fromFormatStrict('2024-13-45', 'YYYY-MM-DD');
} catch (error) {
    if (error instanceof FormatMismatchError) {
        console.log('Format mismatch:', error.message);
    } else if (error instanceof InvalidDateComponentsError) {
        console.log('Invalid date components:', error.message);
    }
}

// Performance optimization - Cache management
console.log('Cache size:', atemporal.getFormatCacheSize());
atemporal.clearFormatCache(); // Clear cache if needed
```

**Supported Format Tokens:**
- `YYYY` - 4-digit year (e.g., 2024)
- `YY` - 2-digit year with Y2K logic (e.g., 24 → 2024, 85 → 1985)
- `MM` - 2-digit month (01-12)
- `M` - 1-2 digit month (1-12)
- `MMMM` - Full month name (e.g., January)
- `MMM` - Abbreviated month name (e.g., Jan)
- `DD` - 2-digit day (01-31)
- `D` - 1-2 digit day (1-31)
- `DDD` - Day of year (001-366)
- `HH` - 2-digit hour (00-23)
- `H` - 1-2 digit hour (0-23)
- `hh` - 2-digit hour (01-12)
- `h` - 1-2 digit hour (1-12)
- `mm` - 2-digit minute (00-59)
- `m` - 1-2 digit minute (0-59)
- `ss` - 2-digit second (00-59)
- `s` - 1-2 digit second (0-59)
- `SSS` - 3-digit milliseconds (000-999)
- `SS` - 2-digit centiseconds (00-99, converted to milliseconds)
- `S` - 1-digit deciseconds (0-9, converted to milliseconds)
- `A` - Uppercase AM/PM
- `a` - Lowercase am/pm
- `W` - Week of year (0-53)
- `WW` - Week of year with leading zero (00-53)
- `Hmm` - Ambiguous hour+minute format (e.g., 630 = 6:30)

**Enhanced Features:**

🚀 **High Performance**
- Intelligent regex caching with LRU eviction
- Pre-compiled month name lookups
- Optimized parsing algorithms
- Fast path for common formats

🛡️ **Robust Error Handling**
- **Default mode**: Returns invalid `TemporalWrapper` with error metadata (backward compatible)
- **Strict mode**: `fromFormatStrict()` throws detailed exceptions
- **Error inspection**: Use `getParseError()` to get detailed error information
- **Error types**: `InvalidFormat`, `FormatMismatch`, `InvalidDateComponents`, `InvalidAmPm`, `UnexpectedError`

📅 **Advanced Date Parsing**
- **12-hour format support**: Parse times with AM/PM indicators
- **Month name parsing**: Support for both full and abbreviated month names (English)
- **Day of year parsing**: Parse dates using day-of-year format (1-366)
- **Week of year parsing**: Support for week-based date formats
- **Ambiguous time formats**: Handle formats like 'Hmm' intelligently
- **Mixed precision**: Combine single and double-digit tokens seamlessly

⚡ **Performance Optimizations**
- Format regex compilation is cached (up to 100 formats)
- Month name lookups use `Map` for O(1) access
- Optimized validation functions
- Minimal memory allocation during parsing

**API Methods:**

```ts
// Main parsing method (backward compatible)
atemporal.fromFormat(dateString: string, formatString: string, timeZone?: string): TemporalWrapper

// Strict parsing method (throws errors)
atemporal.fromFormatStrict(dateString: string, formatString: string, timeZone?: string): TemporalWrapper

// Error inspection
getParseError(instance: TemporalWrapper): ParseErrorInfo | null

// Cache management
atemporal.getFormatCacheSize(): number
atemporal.clearFormatCache(): void
```

**Error Types:**

```ts
interface ParseErrorInfo {
    type: 'InvalidFormat' | 'FormatMismatch' | 'InvalidDateComponents' | 'InvalidAmPm' | 'UnexpectedError';
    message: string;
    dateString?: string;
    formatString?: string;
}
```

**Performance Notes:**
- First parse of a format compiles and caches the regex
- Subsequent parses with the same format are significantly faster
- Cache automatically manages memory with LRU eviction
- Month name parsing uses pre-compiled Maps for optimal performance
- Validation functions are optimized for common date ranges

### advancedFormat

Extends the `.format()` method to support advanced formatting tokens including ordinals and timezone names. Features high-performance caching, comprehensive locale support, and intelligent fallback mechanisms.

```ts
import advancedFormat from 'atemporal/plugins/advancedFormat';
atemporal.extend(advancedFormat);

// Ordinal formatting
const date = atemporal('2024-01-15');
console.log(date.format('Do MMMM YYYY')); // "15th January 2024"
console.log(date.format('MMMM Do, YYYY')); // "January 15th, 2024"

// Quarter ordinals
const q1 = atemporal('2024-02-15');
const q3 = atemporal('2024-08-15');
console.log(q1.format('Qo [quarter]')); // "1st quarter"
console.log(q3.format('Qo [quarter]')); // "3rd quarter"

// Timezone names (requires timezone-aware dates)
const nyTime = atemporal('2024-01-15T15:30:00', 'America/New_York');
console.log(nyTime.format('YYYY-MM-DD HH:mm zzz'));  // "2024-01-15 15:30 EST"
console.log(nyTime.format('YYYY-MM-DD HH:mm zzzz')); // "2024-01-15 15:30 Eastern Standard Time"

// Multi-language ordinal support
const spanishDate = atemporal('2024-01-15');
console.log(spanishDate.format('Do [de] MMMM', 'es')); // "15º de enero"

const frenchDate = atemporal('2024-01-01');
console.log(frenchDate.format('Do MMMM', 'fr')); // "1er janvier"

const chineseDate = atemporal('2024-01-15');
console.log(chineseDate.format('Do', 'zh')); // "第15"

// Combined formatting
const complexFormat = atemporal('2024-07-04T16:30:00', 'America/New_York');
console.log(complexFormat.format('Do MMMM YYYY, Qo [quarter], zzz'));
// "4th July 2024, 3rd quarter, EDT"

// Cache management for performance optimization
console.log('Cache stats:', atemporal.getAdvancedFormatCacheStats());
// { ordinal: { size: 15, maxSize: 200 }, timezone: { size: 8, maxSize: 100 } }

atemporal.clearAdvancedFormatCache(); // Clear caches if needed
```

**Supported Advanced Tokens:**
- `Do` - Day of month with ordinal suffix (e.g., "1st", "22nd", "3rd")
- `Qo` - Quarter of year with ordinal suffix (e.g., "1st", "2nd", "3rd", "4th")
- `zzz` - Short timezone name (e.g., "EST", "PDT", "GMT")
- `zzzz` - Long timezone name (e.g., "Eastern Standard Time", "Pacific Daylight Time")

**Multi-Language Ordinal Support:**
- **English (en)**: 1st, 2nd, 3rd, 4th, 21st, 22nd, 23rd...
- **Spanish (es)**: 1º, 2º, 3º, 4º...
- **French (fr)**: 1er, 2e, 3e, 4e...
- **German (de)**: 1., 2., 3., 4....
- **Italian (it)**: 1º, 2º, 3º, 4º...
- **Portuguese (pt)**: 1º, 2º, 3º, 4º...
- **Russian (ru)**: 1-й, 2-й, 3-й, 4-й...
- **Japanese (ja)**: 1番目, 2番目, 3番目, 4番目...
- **Korean (ko)**: 1번째, 2번째, 3번째, 4번째...
- **Chinese (zh)**: 第1, 第2, 第3, 第4... (prefix format)

**Enhanced Features:**

🚀 **High Performance**
- Intelligent LRU caching for ordinal generation (up to 200 entries)
- Timezone name caching with automatic invalidation (up to 100 entries)
- Pre-compiled regex patterns for token matching
- Optimized locale validation and normalization

🛡️ **Robust Error Handling**
- Graceful fallback for unsupported locales
- Error logging for debugging timezone formatting issues
- Automatic locale normalization (e.g., 'en_US' → 'en-US')
- Safe handling of invalid timezone identifiers

🌍 **Comprehensive Locale Support**
- Automatic locale validation and normalization
- Intelligent fallback to base language for unsupported locale variants
- Support for both underscore and hyphen locale formats
- Consistent behavior across different Intl.DateTimeFormat implementations

⚡ **Performance Optimizations**
- Ordinal generation results are cached per locale
- Timezone formatting uses cached DateTimeFormat instances
- LRU eviction prevents memory leaks in long-running applications
- Minimal overhead for cache hits

**API Methods:**

```ts
// Extended format method (automatically available after plugin loading)
instance.format(formatString: string, locale?: string): string

// Cache management methods
atemporal.getAdvancedFormatCacheStats(): {
  ordinal: { size: number; maxSize: number };
  timezone: { size: number; maxSize: number };
}

atemporal.clearAdvancedFormatCache(): void
```

**Performance Notes:**
- First ordinal generation for a number/locale combination is computed and cached
- Subsequent requests for the same ordinal are served from cache
- Timezone names are cached with timestamp-based invalidation
- Cache automatically manages memory with LRU eviction
- Locale validation is optimized for common locale formats

### durationHumanizer

Converts `Temporal.Duration` objects into human-readable, localized strings with intelligent caching and comprehensive multi-language support. Features high-performance LRU caching, enhanced error handling, and fallback mechanisms for robust internationalization.

```ts
import durationHumanizer from 'atemporal/plugins/durationHumanizer';
atemporal.extend(durationHumanizer);

// Basic duration humanization
const duration1 = { hours: 2, minutes: 30 };
console.log(atemporal.humanize(duration1)); // "2 hours and 30 minutes"

const duration2 = { years: 1, months: 6, days: 15 };
console.log(atemporal.humanize(duration2)); // "1 year, 6 months, and 15 days"

// Single unit durations
console.log(atemporal.humanize({ days: 1 })); // "1 day"
console.log(atemporal.humanize({ hours: 5 })); // "5 hours"

// Multi-language support
const duration = { hours: 2, minutes: 30 };

// Spanish
console.log(atemporal.humanize(duration, { locale: 'es' })); // "2 horas y 30 minutos"

// French
console.log(atemporal.humanize(duration, { locale: 'fr' })); // "2 heures et 30 minutes"

// German
console.log(atemporal.humanize(duration, { locale: 'de' })); // "2 Stunden und 30 Minuten"

// Italian
console.log(atemporal.humanize(duration, { locale: 'it' })); // "2 ore e 30 minuti"

// Portuguese
console.log(atemporal.humanize(duration, { locale: 'pt' })); // "2 horas e 30 minutos"

// Russian
console.log(atemporal.humanize(duration, { locale: 'ru' })); // "2 часа и 30 минут"

// Japanese
console.log(atemporal.humanize(duration, { locale: 'ja' })); // "2時間30分"

// Korean
console.log(atemporal.humanize(duration, { locale: 'ko' })); // "2시간 30분"

// Chinese
console.log(atemporal.humanize(duration, { locale: 'zh' })); // "2小时30分钟"

// Different unit display styles
const complexDuration = { hours: 3, minutes: 45, seconds: 30 };

// Long format (default)
console.log(atemporal.humanize(complexDuration, { unitDisplay: 'long' }));
// "3 hours, 45 minutes, and 30 seconds"

// Short format
console.log(atemporal.humanize(complexDuration, { unitDisplay: 'short' }));
// "3 hr, 45 min, and 30 sec"

// Narrow format
console.log(atemporal.humanize(complexDuration, { unitDisplay: 'narrow' }));
// "3h, 45m, and 30s"

// Different list styles
const listDuration = { hours: 1, minutes: 30, seconds: 15 };

console.log(atemporal.humanize(listDuration, { listStyle: 'long' }));
// "1 hour, 30 minutes, and 15 seconds"

console.log(atemporal.humanize(listDuration, { listStyle: 'short' }));
// "1 hour, 30 minutes, 15 seconds" (varies by locale)

console.log(atemporal.humanize(listDuration, { listStyle: 'narrow' }));
// "1 hour 30 minutes 15 seconds" (varies by locale)

// Working with Temporal.Duration instances
const temporalDuration = Temporal.Duration.from({ years: 2, months: 3, days: 10 });
console.log(atemporal.humanize(temporalDuration)); // "2 years, 3 months, and 10 days"

// Handling all duration units
const fullDuration = {
  years: 1,
  months: 2,
  weeks: 3,
  days: 4,
  hours: 5,
  minutes: 6,
  seconds: 7,
  milliseconds: 8
};
console.log(atemporal.humanize(fullDuration));
// "1 year, 2 months, 3 weeks, 4 days, 5 hours, 6 minutes, 7 seconds, and 8 milliseconds"

// Zero and empty durations
console.log(atemporal.humanize({ seconds: 0 })); // "0 seconds"
console.log(atemporal.humanize({})); // "0 seconds"

// Cache management for performance optimization
console.log('Cache stats:', atemporal.getDurationHumanizerCacheStats());
// { durationFormat: { size: 15, maxSize: 200 } }

atemporal.clearDurationHumanizerCache(); // Clear cache if needed
```

**Supported Duration Units:**
- `years` - Calendar years
- `months` - Calendar months
- `weeks` - Weeks (7 days)
- `days` - Calendar days
- `hours` - Hours (60 minutes)
- `minutes` - Minutes (60 seconds)
- `seconds` - Seconds
- `milliseconds` - Milliseconds

**Multi-Language Support:**
- **English (en)**: Full support with proper pluralization
- **Spanish (es)**: "año", "mes", "día", "hora", "minuto", "segundo"
- **French (fr)**: "année", "mois", "jour", "heure", "minute", "seconde"
- **German (de)**: "Jahr", "Monat", "Tag", "Stunde", "Minute", "Sekunde"
- **Italian (it)**: "anno", "mese", "giorno", "ora", "minuto", "secondo"
- **Portuguese (pt)**: "ano", "mês", "dia", "hora", "minuto", "segundo"
- **Russian (ru)**: "год", "месяц", "день", "час", "минута", "секунда"
- **Japanese (ja)**: "年", "月", "日", "時間", "分", "秒"
- **Korean (ko)**: "년", "월", "일", "시간", "분", "초"
- **Chinese (zh)**: "年", "月", "天", "小时", "分钟", "秒"

**Enhanced Features:**

🚀 **High Performance**
- Intelligent LRU caching for duration formatting (up to 200 entries)
- Pre-compiled unit mappings for all supported languages
- Optimized locale validation and normalization
- Fast path for cached results

🛡️ **Robust Error Handling**
- Graceful fallback for unsupported locales
- Enhanced error logging for debugging
- Automatic locale normalization (e.g., 'en_US' → 'en-US')
- Safe handling of invalid duration inputs
- Fallback to English for completely unsupported locales

🌍 **Comprehensive Locale Support**
- Automatic locale validation and normalization
- Intelligent fallback to base language for unsupported variants
- Support for both underscore and hyphen locale formats
- Enhanced pluralization rules for multiple languages
- Consistent behavior across different Intl implementations

⚡ **Performance Optimizations**
- Duration formatting results are cached per locale and unit display
- LRU eviction prevents memory leaks in long-running applications
- Minimal overhead for cache hits
- Optimized number formatting with cached Intl instances
- Smart handling of fractional values

**API Methods:**

```ts
// Main humanization method
atemporal.humanize(
  durationLike: Temporal.Duration | Temporal.DurationLike,
  options?: {
    locale?: string;           // Locale for formatting (default: 'en')
    listStyle?: 'long' | 'short' | 'narrow';  // List formatting style
    unitDisplay?: 'long' | 'short' | 'narrow'; // Unit display style
  }
): string

// Cache management methods
atemporal.getDurationHumanizerCacheStats(): {
  durationFormat: { size: number; maxSize: number };
}

atemporal.clearDurationHumanizerCache(): void
```

**Options Interface:**

```ts
interface HumanizeOptions {
  /** The locale to use for formatting (e.g., 'en-US', 'es-CR'). Defaults to 'en'. */
  locale?: string;
  /** The style for formatting the list of duration parts, per Intl.ListFormat. */
  listStyle?: 'long' | 'short' | 'narrow';
  /** The display style for the units, per Intl.NumberFormat. */
  unitDisplay?: 'long' | 'short' | 'narrow';
}
```

**Performance Notes:**
- First formatting of a duration with specific locale/options is computed and cached
- Subsequent requests with identical parameters are served from cache
- Cache automatically manages memory with LRU eviction (200 entry limit)
- Locale validation is optimized for common locale formats
- Enhanced fallback mechanisms ensure consistent behavior
- Number formatting uses cached Intl.NumberFormat instances for optimal performance

### dateRangeOverlap

Provides date range overlap detection capabilities, allowing you to check if two date ranges intersect and retrieve the overlapping period. Features high-performance caching, comprehensive input validation, and flexible configuration options.

```ts
import dateRangeOverlapPlugin from 'atemporal/plugins/dateRangeOverlap';
atemporal.extend(dateRangeOverlapPlugin);

// Basic overlap detection
const range1 = { start: '2024-01-01', end: '2024-01-15' };
const range2 = { start: '2024-01-10', end: '2024-01-20' };

const result = atemporal.checkDateRangeOverlap(range1, range2);
console.log(result.overlaps); // true
console.log(result.overlapRange); // { start: Date('2024-01-10'), end: Date('2024-01-15') }

// Non-overlapping ranges
const range3 = { start: '2024-01-01', end: '2024-01-10' };
const range4 = { start: '2024-01-15', end: '2024-01-20' };

const noOverlap = atemporal.checkDateRangeOverlap(range3, range4);
console.log(noOverlap.overlaps); // false
console.log(noOverlap.overlapRange); // null

// Instance method for single date vs range
const date = atemporal('2024-01-15');
const range = { start: '2024-01-10', end: '2024-01-20' };

const instanceResult = date.rangeOverlapsWith(range);
console.log(instanceResult.overlaps); // true
console.log(instanceResult.overlapRange); // { start: Date('2024-01-15'), end: Date('2024-01-15') }

// Create date ranges using the 'to' method
const startDate = atemporal('2024-01-01');
const dateRange = startDate.to('2024-01-15');
console.log(dateRange); // { start: Date('2024-01-01'), end: '2024-01-15' }

// Configuration options
const options = {
  includeBoundaries: false, // Don't count touching ranges as overlapping
  timezone: 'America/New_York',
  strictValidation: true
};

// Touching ranges with boundaries excluded
const touching1 = { start: '2024-01-01', end: '2024-01-15' };
const touching2 = { start: '2024-01-15', end: '2024-01-30' };

const touchingResult = atemporal.checkDateRangeOverlap(touching1, touching2, options);
console.log(touchingResult.overlaps); // false (boundaries excluded)

// With boundaries included (default)
const touchingDefault = atemporal.checkDateRangeOverlap(touching1, touching2);
console.log(touchingDefault.overlaps); // true (boundaries included)

// Different input types
const mixedRange1 = {
  start: new Date('2024-01-01'),
  end: atemporal('2024-01-15')
};
const mixedRange2 = {
  start: 1704844800000, // Unix timestamp
  end: '2024-01-20'
};

const mixedResult = atemporal.checkDateRangeOverlap(mixedRange1, mixedRange2);
console.log(mixedResult.overlaps); // true

// Zero-duration ranges (single points in time)
const point1 = { start: '2024-01-15', end: '2024-01-15' };
const range5 = { start: '2024-01-10', end: '2024-01-20' };

const pointResult = atemporal.checkDateRangeOverlap(point1, range5);
console.log(pointResult.overlaps); // true
console.log(pointResult.overlapRange); // { start: Date('2024-01-15'), end: Date('2024-01-15') }

// Error handling
try {
  const invalidRange = { start: 'invalid-date', end: '2024-01-15' };
  const validRange = { start: '2024-01-01', end: '2024-01-15' };
  atemporal.checkDateRangeOverlap(invalidRange, validRange);
} catch (error) {
  if (error instanceof InvalidDateRangeError) {
    console.log('Invalid date range:', error.message);
  }
}

// Performance with caching
const perfRange1 = { start: '2024-01-01', end: '2024-01-15' };
const perfRange2 = { start: '2024-01-10', end: '2024-01-20' };

// First call calculates and caches
const result1 = atemporal.checkDateRangeOverlap(perfRange1, perfRange2);

// Second call uses cache for better performance
const result2 = atemporal.checkDateRangeOverlap(perfRange1, perfRange2);

console.log(result1.overlaps === result2.overlaps); // true
```

**Supported Input Types:**
- **String**: ISO 8601 date strings (e.g., '2024-01-15', '2024-01-15T10:30:00')
- **Date**: JavaScript Date objects
- **Number**: Unix timestamps (milliseconds since epoch)
- **TemporalWrapper**: Atemporal instances
- **Mixed**: Any combination of the above types

**Configuration Options:**

```ts
interface OverlapOptions {
  /** Whether touching ranges (sharing a boundary) count as overlap. Defaults to true. */
  includeBoundaries?: boolean;
  /** Timezone for date interpretation. Uses default timezone if not specified. */
  timezone?: string;
  /** Whether to perform strict input validation. Defaults to true. */
  strictValidation?: boolean;
}
```

**Return Type:**

```ts
interface OverlapResult {
  /** Whether the two date ranges overlap */
  overlaps: boolean;
  /** The overlapping date range, or null if no overlap exists */
  overlapRange: DateRange | null;
}

interface DateRange {
  /** The start date of the range */
  start: DateInput;
  /** The end date of the range */
  end: DateInput;
}
```

**Enhanced Features:**

🚀 **High Performance**
- Intelligent LRU caching for overlap results (up to 200 entries)
- O(1) time complexity for overlap calculation
- Optimized validation and date parsing
- Fast path for cached results

🛡️ **Robust Error Handling**
- Custom error types: `InvalidDateRangeError`, `OverlapDetectionError`
- Comprehensive input validation with descriptive error messages
- Graceful handling of edge cases (null inputs, invalid dates)
- Optional strict validation mode

📅 **Flexible Input Support**
- Support for multiple date input formats
- Mixed input types within the same operation
- Timezone-aware date parsing and comparison
- Automatic date normalization

⚡ **Performance Optimizations**
- Results are cached per range combination and options
- LRU eviction prevents memory leaks
- Minimal object creation during calculations
- Efficient boundary condition handling

**API Methods:**

```ts
// Static method on atemporal factory
atemporal.checkDateRangeOverlap(
  range1: DateRange,
  range2: DateRange,
  options?: OverlapOptions
): OverlapResult

// Instance method for single date vs range comparison
instance.rangeOverlapsWith(
  range: DateRange,
  options?: OverlapOptions
): OverlapResult

// Helper method to create date ranges
instance.to(endDate: DateInput): DateRange
```

**Edge Cases Handled:**
- **Touching ranges**: Configurable behavior for ranges that share a boundary point
- **Zero-duration ranges**: Ranges where start equals end (single points in time)
- **Invalid dates**: Proper error handling for malformed date inputs
- **Reversed ranges**: Optional validation for ranges where start > end
- **Timezone differences**: Consistent handling of dates in different timezones
- **Null/undefined inputs**: Graceful error handling with descriptive messages

**Performance Notes:**
- First overlap check for a range combination is calculated and cached
- Subsequent checks with identical ranges and options use cached results
- Cache automatically manages memory with LRU eviction (200 entry limit)
- Validation is optimized for common date input formats
- Boundary condition checks are highly optimized for performance