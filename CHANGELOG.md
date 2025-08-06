# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.4](https://github.com/NaturalDevCR/atemporal/compare/v0.1.3...v0.1.4) (2025-08-06)

### [0.1.3](https://github.com/NaturalDevCR/atemporal/compare/v0.1.2...v0.1.3) (2025-08-06)


### Features

* comprehensive test coverage and performance optimizations ([ec78453](https://github.com/NaturalDevCR/atemporal/commit/ec784538e5353efb8850d7af038b4ccfd1205c72))


### Bug Fixes

* Ajustar thresholds de performance para entornos CI ([26c3935](https://github.com/NaturalDevCR/atemporal/commit/26c3935f9745c644e8c6bbf84229cc54b5f0a18f))

### [0.1.2](https://github.com/NaturalDevCR/atemporal/compare/v0.1.1...v0.1.2) (2025-07-22)

### [0.1.1](https://github.com/NaturalDevCR/atemporal/compare/v0.1.0...v0.1.1) (2025-07-21)


### Features

* **customParseFormat:** enhance parsing with advanced features ([4fba49b](https://github.com/NaturalDevCR/atemporal/commit/4fba49b483e19eba277c39385b1bde9ab5aeae93))


### Bug Fixes

* **cache:** add null check for oldestKey in LRUCache implementation ([0571825](https://github.com/NaturalDevCR/atemporal/commit/0571825fbaf3e4e5145e939ba631ac0c3dc61c93))

## [0.1.0](https://github.com/NaturalDevCR/atemporal/compare/v0.0.23...v0.1.0) (2025-07-18)


### ⚠ BREAKING CHANGES

* **customParseFormat:** Formats that only contain time or partial date parts (e.g., `HH:mm`, `DD HH:mm`) will now successfully parse using the current date for missing components. Previously, these formats would result in an invalid atemporal instance.

### Bug Fixes

* **customParseFormat:** default to current date for time-only formats ([cd3f1b6](https://github.com/NaturalDevCR/atemporal/commit/cd3f1b686cdfab631c5b9580893733976fc389c3))

### [0.0.23](https://github.com/NaturalDevCR/atemporal/compare/v0.0.22...v0.0.23) (2025-07-16)


### Features

* **core:** add .range() method ([a9da291](https://github.com/NaturalDevCR/atemporal/commit/a9da291c302f6690eedef304902688a643fb46d9))

### [0.0.22](https://github.com/NaturalDevCR/atemporal/compare/v0.0.21...v0.0.22) (2025-07-13)

### [0.0.21](https://github.com/NaturalDevCR/atemporal/compare/v0.0.20...v0.0.21) (2025-07-13)


### Bug Fixes

* README.md oops ([98bc5d5](https://github.com/NaturalDevCR/atemporal/commit/98bc5d5a3414fb962c7a0a2121dc87ba9f9c4ac4))

### [0.0.20](https://github.com/NaturalDevCR/atemporal/compare/v0.0.19...v0.0.20) (2025-07-13)

### [0.0.19](https://github.com/NaturalDevCR/atemporal/compare/v0.0.18...v0.0.19) (2025-07-11)


### Features

* **format extended:** Extend format to accept more tokens. ([df23077](https://github.com/NaturalDevCR/atemporal/commit/df23077e32bad6544bc66bd5dafc0e967bc0c840))

### [0.0.18](https://github.com/NaturalDevCR/atemporal/compare/v0.0.17...v0.0.18) (2025-07-11)


### Bug Fixes

* **firebaseTimestamp parsing:** removed Object.keys(input).length === 2 because firebase firestore tiemstamps DO have functions. ([0172370](https://github.com/NaturalDevCR/atemporal/commit/01723704a54fd42b760841681ea6336d35cb83a1))

### [0.0.17](https://github.com/NaturalDevCR/atemporal/compare/v0.0.16...v0.0.17) (2025-07-11)


### Bug Fixes

* **package.json -> plugins missing:** Added missing plugins on the package.json for tsup, and availability ([09f625c](https://github.com/NaturalDevCR/atemporal/commit/09f625cfd398655c6a2a244262c1b89462774d75))

### [0.0.16](https://github.com/NaturalDevCR/atemporal/compare/v0.0.15...v0.0.16) (2025-07-11)


### Features

* **core:** Add Firebase Timestamp support and improve parsing ([64b184c](https://github.com/NaturalDevCR/atemporal/commit/64b184c9ca3e3bc65298a4adf0237ddbdf730ed5))

### [0.0.15](https://github.com/NaturalDevCR/atemporal/compare/v0.0.14...v0.0.15) (2025-07-11)


### Features

* **plugin:** Add Firebase Timestamp interoperability ([576ee29](https://github.com/NaturalDevCR/atemporal/commit/576ee29eff5bcc57867082de656242b1368efd92))

### [0.0.14](https://github.com/NaturalDevCR/atemporal/compare/v0.0.13...v0.0.14) (2025-07-11)


### Features

* Error handling types, and README update ([5320cdc](https://github.com/NaturalDevCR/atemporal/commit/5320cdc513857d71a5d9e44ec5a2735f0da95e74))

### [0.0.13](https://github.com/NaturalDevCR/atemporal/compare/v0.0.12...v0.0.13) (2025-07-11)

### [0.0.12](https://github.com/NaturalDevCR/atemporal/compare/v0.0.11...v0.0.12) (2025-07-11)


### Features

* **core:** allow instance creation from arrays and objects ([2725da4](https://github.com/NaturalDevCR/atemporal/commit/2725da493f50441a583f8fdb7093f792324fa62a))
* **plugin:** add advancedFormat plugin for ordinals and long-form dates ([c30786f](https://github.com/NaturalDevCR/atemporal/commit/c30786f52324957e8768c4cc1e538221fe74ad5d))
* **plugin:** add weekDay plugin for customizable week start ([3a9c0aa](https://github.com/NaturalDevCR/atemporal/commit/3a9c0aa07e78b2d95eb494ba1475ce059992cc1f))

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