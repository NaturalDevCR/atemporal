# Atemporal
![npm](https://img.shields.io/npm/v/atemporal)
![license](https://img.shields.io/npm/l/atemporal)


Atemporal is a modern, immutable, and ergonomic date-time library built on top of the new Temporal API — with first-class support for formatting, localization, plugins, and time zones.

## Warning!
This is a work in progress, and is in a very alpha state, please don't use it in production yet.

> ⚡️ Powered by the Temporal API and polyfilled automatically via `@js-temporal/polyfill` — no extra setup required.

## 📦 Installation

```bash
npm install atemporal
```

> 🔧 You don't need to install `@js-temporal/polyfill` separately — it's already bundled and applied.

---

## 🚀 Quick Start

```ts
import atemporal from 'atemporal';

const now = atemporal();
console.log(now.format('YYYY-MM-DD HH:mm:ss'));

const future = now.add(3, 'days').startOf('day');
console.log(future.toString());

if (future.isAfter(now)) {
  console.log('The future is coming.');
}
```

---

## 🧠 Why Atemporal?

- ✅ Immutable and chainable API (like Day.js)
- 🧩 Plugin system for extensibility
- 🌐 Localization-ready (via `Intl`)
- 🌍 Time zone-aware using IANA names (e.g., `America/New_York`)
- 🔒 Type-safe and built in TypeScript
- 🎯 Uses Temporal under the hood — the future of JavaScript date handling

---

## 📚 Usage

### Creating instances

```ts
atemporal();                          // current datetime in default timezone (UTC)
atemporal('2025-07-09');             // parse ISO string
atemporal(new Date());               // from legacy Date
atemporal(atemporal());             // clone existing instance
atemporal('2025-01-01T12:00', 'America/New_York'); // specify time zone
```

### Manipulation

```ts
atemporal().add(5, 'minutes');       // add 5 minutes
atemporal().subtract(2, 'days');     // subtract 2 days
atemporal().set('hour', 9);          // set hour to 9
atemporal().startOf('week');         // start of week
atemporal().endOf('month');          // end of month
```

### Formatting

#### Token-based (Day.js style)

```ts
atemporal().format('YYYY-MM-DD HH:mm:ss');
// => "2025-07-09 14:23:00"
```

#### Intl.DateTimeFormat-based

```ts
atemporal().format({ dateStyle: 'full' }, 'es-CR');
// => "miércoles, 9 de julio de 2025"
```

### Comparison

```ts
atemporal('2025-01-01').isBefore('2025-01-02'); // true
atemporal('2025-01-01').isAfter('2024-12-31');  // true
atemporal('2025-01-01').isSame('2025-01-01');   // true
atemporal('2025-01-01').isSameDay('2025-01-01'); // true
atemporal().isBetween('2025-01-01', '2025-12-31'); // true
```

### Other features

```ts
atemporal().toDate();     // returns legacy JS Date
atemporal().toString();   // ISO 8601 string
atemporal().clone();      // deep copy
atemporal().isValid();    // input validation
atemporal().quarter;      // quarter of the year
atemporal().weekOfYear;   // ISO week number
```

---

## 🌍 Localization and Time Zones

```ts
atemporal.setDefaultLocale('es-CR');
atemporal.setDefaultTimeZone('America/Costa_Rica');

atemporal().format('dddd, DD MMMM YYYY');
// => "miércoles, 09 julio 2025"
```

---

## 🔌 Plugins

Atemporal supports a flexible plugin system.

### Example: `relativeTime` plugin

```ts
import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);

atemporal().subtract(5, 'minutes').fromNow(); // "5 minutes ago"
atemporal().add(2, 'hours').fromNow();        // "in 2 hours"
```

---

## ✨ API Summary

### Core Function

```ts
atemporal(input?: DateInput, timeZone?: string): TemporalWrapper
```

### Static Methods

```ts
atemporal.setDefaultLocale(code: string): void
atemporal.setDefaultTimeZone(tz: string): void
atemporal.getDefaultLocale(): string
atemporal.isValid(input: any): boolean
atemporal.extend(plugin: Plugin, options?: any): void
```

---

## 🧩 Types

```ts
type DateInput = string | Date | TemporalWrapper | Temporal.PlainDateTime | Temporal.ZonedDateTime;
type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
type SettableUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
```

---

## 📜 License

MIT — Josue Orozco A.

---

## 🛠 Roadmap (v1.0)

- Unit tests (Help is very welcomed) — Currently in early stages; improving test coverage is a top priority to ensure stability and reliability.

- Performance optimizations — Fine-tuning internal operations for faster response times.

- Expanded documentation — More examples, guides, and API details.

- Additional locale support — Increasing the number of built-in translations and custom locale options.

- Better error handling — Clearer and more descriptive error messages for easier debugging.

---

## Want to contribute?

Contributions are always welcome! The Temporal API is a major leap forward for JavaScript date handling, but my goal with Atemporal is to provide a simple, ergonomic, and chainable interface for everyday use. While Day.js offered a convenient API, it had limitations and quirks that made it less reliable. By building on top of Temporal, we can focus fully on abstraction and usability, delivering a robust and developer-friendly experience.

---
## Want to support my job?
<a href="https://buymeacoffee.com/naturaldevcr" target="_blank"><img src="https://github.com/user-attachments/assets/98a65e1b-2843-4333-8955-0db7a20477bf" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>

### [Donate - Paypal](https://www.paypal.com/donate/?hosted_button_id=A8MKF5RNGQ77U).