# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.11](https://github.com/NaturalDevCR/atemporal/compare/v0.0.10...v0.0.11) (2025-07-11)

### [0.0.10](https://github.com/NaturalDevCR/atemporal/compare/v0.0.9...v0.0.10) (2025-07-11)

### [0.0.9](https://github.com/NaturalDevCR/atemporal/compare/v0.0.8...v0.0.9) (2025-07-11)


### Features

* **api:** Add Duration support and flexible unit aliases ([1994292](https://github.com/NaturalDevCR/atemporal/commit/1994292b85043b7a410cc09b564d168252095070))
* **core:** add .dayOfWeek() manipulation method ([1fcd5bb](https://github.com/NaturalDevCR/atemporal/commit/1fcd5bbcf754d07c5ba3a2c88fb96d11d4291758))
* **core:** add .daysInMonth getter ([8b24651](https://github.com/NaturalDevCR/atemporal/commit/8b2465194525d32e25e48cc62d1025827394382e))

### [0.0.8](https://github.com/NaturalDevCR/atemporal/compare/v0.0.7...v0.0.8) (2025-07-10)


### Features

* **core:** Add validation utilities and new comparison methods ([46f9b92](https://github.com/NaturalDevCR/atemporal/commit/46f9b92782aaf387bec687cc373193feeacb2c26))

### [0.0.7](https://github.com/NaturalDevCR/atemporal/compare/v0.0.6...v0.0.7) (2025-07-10)

### [0.0.6](https://github.com/NaturalDevCR/atemporal/compare/v0.0.5...v0.0.6) (2025-07-10)

### [0.0.5](https://github.com/NaturalDevCR/atemporal/compare/v0.0.4...v0.0.5) (2025-07-10)


### Bug Fixes

* **atemporal.timezone.test.ts:** Fixed tests to work with github CI ([639e4ff](https://github.com/NaturalDevCR/atemporal/commit/639e4ff6d035acd55404db5758e61b4b89ed57d4))

### [0.0.4](https://github.com/NaturalDevCR/atemporal/compare/v0.0.3...v0.0.4) (2025-07-10)


### Features

* **format:** Añadir tokens de zona horaria y corregir caché de localización ([90840b6](https://github.com/NaturalDevCR/atemporal/commit/90840b6511243c30518d65a14538427058faf31e))

### [0.0.3](https://github.com/NaturalDevCR/atemporal/compare/v0.0.2...v0.0.3) (2025-07-10)


### Bug Fixes

* **core:** Refactor parsing engine to fix widespread test failures ([cca6447](https://github.com/NaturalDevCR/atemporal/commit/cca64476f1cd6713d45d5da2545b92f51d51e6aa))

### [0.0.2](https://github.com/NaturalDevCR/atemporal/compare/v0.0.1...v0.0.2) (2025-07-10)

### 0.0.1 (2025-07-10)


### Bug Fixes

* **relativeTime:** Corregir cálculo de tiempo relativo ([a40e91e](https://github.com/NaturalDevCR/atemporal/commit/a40e91e5cd20be830815260d75884af954ee0462))
* Remove unnecessary folders ([455bd3f](https://github.com/NaturalDevCR/atemporal/commit/455bd3f1992d68a840a690b5c1648606e0a326ec))

## [0.0.1] - 2024-05-21

This is the first public release of `atemporal`, a modern, immutable, and powerful library for date and time manipulation, built on top of the `Temporal` API.

### Added

*   **Library Core:** Created the `TemporalWrapper` class with a chainable and immutable API.
*   **Date Manipulation:** Robust methods like `.add()`, `.subtract()`, `.set()`, `.startOf()`, and `.endOf()`.
*   **Comparisons:** Precise comparison methods like `.isBefore()`, `.isAfter()`, `.isBetween()`, and `.isSame()`.
*   **Advanced Formatting:** A versatile `.format()` method that supports both Day.js-style tokens and `Intl.DateTimeFormat` options for advanced localization.
*   **`relativeTime` Plugin:** Added the plugin to display relative time (e.g., "5 minutes ago", "in 2 hours") with localization support via `fromNow()` and `toNow()`.
*   **`customParseFormat` Plugin:** Added the plugin to create dates from strings with custom formats, via the new static method `atemporal.fromFormat()`.
*   **Full Documentation:** Added exhaustive JSDoc documentation to the entire public API for an excellent developer experience with IDE autocompletion.
*   **Additional Helpers:** Included useful methods like `.isLeapYear()`, `.unix()`, `.clone()`, and `.toDate()`.

### Changed

*   **`.diff()` Behavior:** The `.diff()` method now returns a **truncated** integer by default for more predictable behavior. To get the exact floating-point value, `true` must be passed as the third argument (e.g., `.diff(other, 'days', true)`).

### Fixed

*   **`relativeTime` Plugin:** Fixed the relative time calculation to work correctly with the new `.diff()` behavior, ensuring rounding is accurate.