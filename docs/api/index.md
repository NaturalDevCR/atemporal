# API Reference

Atemporal provides a comprehensive and type-safe API for date-time manipulation, built on top of the modern Temporal API.

## Core API

- [**Creating Instances**](./creating-instances): How to initialize Atemporal from strings, dates, timestamps, and Firestore objects.
- [**Manipulation**](./manipulation): Immutably adding, subtracting, and setting date components.
- [**Formatting**](./formatting): Versatile string formatting using tokens or `Intl` options.
- [**Comparison & Difference**](./comparison-difference): Comparing dates and calculating time differences.
- [**Durations & Utilities**](./durations-utilities): Working with Temporal Durations and TypeScript type guards.
- [**Generating Ranges**](./ranges): Creating arrays of dates or formatted strings within a period.

## Plugins

For extended functionality like relative time (`.fromNow()`), business day calculations, or appointment slots, check out the [Plugins](/plugins/) section.
