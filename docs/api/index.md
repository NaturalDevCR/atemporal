# API Reference

Atemporal provides a comprehensive and type-safe API for date-time manipulation, built on top of the modern Temporal API.

## Core API

- [**Creating Instances**](./creating-instances): How to initialize Atemporal from strings, dates, timestamps, and Firestore objects.
- [**Manipulation**](./manipulation): Immutably adding, subtracting, and setting date components.
- [**Formatting**](./formatting): Versatile string formatting using tokens or `Intl` options.
- [**Comparison & Difference**](./comparison-difference): Comparing dates and calculating time differences.
- [**Durations & Utilities**](./durations-utilities): Working with Temporal Durations, type guards, and validators.
- [**Generating Ranges**](./ranges): Creating arrays of dates or formatted strings within a period.

## Static Utilities

The `atemporal` factory object exposes static utility methods beyond instance creation:

### Creators

| Method | Description |
|--------|-------------|
| `atemporal()` | Create current date/time instance |
| `atemporal(input, tz?)` | Create from any `DateInput` |
| `atemporal.from(input, tz?)` | Alias for `atemporal(input, tz?)` |
| `atemporal.unix(seconds)` | Create from Unix timestamp (seconds) |
| `atemporal.duration(like)` | Create a `Temporal.Duration` from an object or ISO string |

### Validation

| Method | Description |
|--------|-------------|
| `atemporal.isValid(input)` | Check if input can be parsed to a valid date |
| `atemporal.isAtemporal(input)` | Type guard: check if input is a `TemporalWrapper` instance |
| `atemporal.isDuration(input)` | Type guard: check if input is a `Temporal.Duration` |
| `atemporal.isValidTimeZone(tz)` | Validate IANA time zone string |
| `atemporal.isValidLocale(code)` | Validate locale identifier |
| `atemporal.isPlugin(input)` | Check if value is a valid atemporal plugin |

### Comparison

| Method | Description |
|--------|-------------|
| `atemporal.min(...dates)` | Return the earliest date from a list |
| `atemporal.max(...dates)` | Return the latest date from a list |

### Configuration

| Method | Description |
|--------|-------------|
| `atemporal.setDefaultLocale(code)` | Set the default locale for all new instances |
| `atemporal.setDefaultTimeZone(tz)` | Set the default IANA time zone |
| `atemporal.getDefaultLocale()` | Get the current default locale |
| `atemporal.getTemporalInfo()` | Get info about the Temporal implementation (`{ isNative, environment, version }`) |

### Plugin Management

| Method | Description |
|--------|-------------|
| `atemporal.extend(plugin, options?)` | Register and apply a plugin |
| `atemporal.lazyLoad(name, options?)` | Lazy-load one official plugin by name (async) |
| `atemporal.lazyLoadMultiple(names, options?)` | Lazy-load official plugins by name (async) |
| `atemporal.isPluginLoaded(name)` | Check if an official plugin has been loaded |
| `atemporal.getLoadedPlugins()` | Get loaded official plugin names; third-party extensions are not listed |
| `atemporal.getAvailablePlugins()` | Get official plugins available for lazy loading |

## Plugins

For extended functionality like relative time (`.fromNow()`), business day calculations, or appointment slots, check out the [Plugins](/plugins/) section.
