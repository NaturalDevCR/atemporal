---
layout: home

hero:
  name: "Atemporal"
  text: "Modern Date-Time Library"
  tagline: An immutable, chainable wrapper around the Temporal API for easier and safer date-time manipulation.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: LLMs documentation
      link: /atemporal/llms.txt
    - theme: alt
      text: View on GitHub
      link: https://github.com/NaturalDevCR/atemporal

features:
  - title: Temporal API Power
    details: Built on top of the TC39 Stage 4 Temporal API (ES2026) with automatic native-to-polyfill fallback. No extra setup required.
  - title: Immutable & Chainable
    details: All operations return new instances — no side effects. Fluent API inspired by Day.js for easy-to-read method chaining.
  - title: Plugin-Powered
    details: Lightweight core with 8 official plugins. Extend only the functionality you need, or lazy-load plugins on demand.
  - title: Time Zone & Locale Aware
    details: "First-class IANA time zone support. Native Intl integration for seamless i18n — format dates in any locale with full customization."
  - title: Type-Safe
    details: Built with TypeScript for excellent autocompletion, rich type guards, and comprehensive type definitions.
  - title: Firestore & Firebase Ready
    details: First-class support for Firebase/Firestore timestamps in both standard and underscore formats. Parse them directly.
---

## Available Plugins

| Plugin | Description |
|--------|-------------|
| **relativeTime** | `.fromNow()` and `.toNow()` support |
| **customParseFormat** | Parse complex date strings with custom format tokens |
| **advancedFormat** | Ordinal day/quarter suffixes (`Do`, `Qo`), timezone name tokens (`zzz`, `zzzz`) |
| **weekDay** | Configurable week start, enhanced weekday handling |
| **durationHumanizer** | Convert durations to human-readable, localized strings |
| **dateRangeOverlap** | Detect intersections between date ranges with boundary options |
| **businessDays** | Working day calculations with holiday and weekend support |
| **timeSlots** | Find free time slots in a busy schedule |

[Browse all plugins →](/plugins/)
