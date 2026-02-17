# Atemporal

![npm](https://img.shields.io/npm/v/atemporal)
![license](https://img.shields.io/npm/l/atemporal)

Atemporal is a modern, immutable, and ergonomic date-time library built on top of the new Temporal API — with support for formatting, localization, plugins, and time zones.

## ✨ Key Features

- ✅ **Immutable & Chainable**: Fluid API inspired by Day.js, powered by the modern Temporal API.
- 🧩 **Plugin-Powered**: Lightweight core with an extensible plugin system.
- 🌍 **Time Zone Aware**: First-class support for IANA time zones.
- 🌐 **Localization**: Native integration with `Intl` for seamless i18n.
- 🔒 **Type-Safe**: Built with TypeScript for excellent developer experience.

## 🔌 Available Plugins

- **relativeTime**: `.fromNow()` and `.toNow()` support.
- **customParseFormat**: Parse complex date strings with custom formats.
- **advancedFormat**: Ordinals (`Do`, `Qo`) and full/short timezone names.
- **weekDay**: Enhanced localized weekday handling.
- **durationHumanizer**: Turn durations into human-readable strings.
- **dateRangeOverlap**: Detect intersections between date ranges.
- **businessDays**: Working day calculations and holiday support.
- **timeSlots**: Find free slots in a busy schedule.

## 📖 Documentation

For full guides and API reference, please visit:

👉 **[naturaldevcr.github.io/atemporal](https://naturaldevcr.github.io/atemporal/)**

---

## 📦 Installation

```bash
npm install atemporal
```

## 🚀 Quick Start

```ts
import atemporal from "atemporal";
import relativeTime from "atemporal/plugins/relativeTime";

// Extend atemporal with the plugins you need
atemporal.extend(relativeTime);

// Create an instance with the current date and time
const now = atemporal();
console.log(now.format("YYYY-MM-DD HH:mm:ss"));

// Manipulate dates immutably
const future = now.add(3, "days").startOf("day");

// Use plugins
const past = now.subtract(5, "minutes");
console.log(past.fromNow()); // "5 minutes ago"
```

---

## ❤️ Support & Contribution

If you find this project useful and would like to support its development, you can make a donation via PayPal. Your support is greatly appreciated!

[![PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?style=flat-square&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/NaturalCloud)

**[Donate via PayPal](https://www.paypal.com/paypalme/NaturalCloud)**

---

## ⚖️ License

MIT © [Josue Orozco A.](https://github.com/NaturalDevCR)
