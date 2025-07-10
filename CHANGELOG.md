# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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