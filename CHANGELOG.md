# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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