# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.3.5](https://github.com/NaturalDevCR/atemporal/compare/v1.3.0...v1.3.5) (2026-04-07)


### Bug Fixes

* **diff:** normalize ZonedDateTime to polyfill before calling since() ([f8ea619](https://github.com/NaturalDevCR/atemporal/commit/f8ea61988196bd4b32a06fa21f90aa910504ea54))
* **temporal-api:** correct type exports for DTS compatibility ([4d44a98](https://github.com/NaturalDevCR/atemporal/commit/4d44a981e149932f573171110d96d01155b4e968))

## [1.3.0](https://github.com/NaturalDevCR/atemporal/compare/v1.1.1...v1.3.0) (2026-04-04)


### Features

* v1.2.0 - code quality, deterministic profiler, plugin system improvements ([4081e01](https://github.com/NaturalDevCR/atemporal/commit/4081e011b73dae460b35e1df0ef92445cc14584d)), closes [#1](https://github.com/NaturalDevCR/atemporal/issues/1) [#2](https://github.com/NaturalDevCR/atemporal/issues/2) [#3](https://github.com/NaturalDevCR/atemporal/issues/3) [#7](https://github.com/NaturalDevCR/atemporal/issues/7) [#8](https://github.com/NaturalDevCR/atemporal/issues/8) [#9](https://github.com/NaturalDevCR/atemporal/issues/9) [#4](https://github.com/NaturalDevCR/atemporal/issues/4) [#6](https://github.com/NaturalDevCR/atemporal/issues/6)


### Bug Fixes

* **caching:** use unit normalization in diff calculations ([63ed48f](https://github.com/NaturalDevCR/atemporal/commit/63ed48f25438f42501226c705fe1155319825914))
* **diff:** normalize plural time units to singular in calculateDiff ([2bdb0d0](https://github.com/NaturalDevCR/atemporal/commit/2bdb0d00944277912c3ca2ddf8428d0743bc8784))

### [1.1.1](https://github.com/NaturalDevCR/atemporal/compare/v1.0.0...v1.1.1) (2026-02-18)


### Bug Fixes

* **docs:** add base path for GitHub Pages styling ([5ae1ee8](https://github.com/NaturalDevCR/atemporal/commit/5ae1ee84daf59a245a09272779e8bb3ae3a91f18))
* mock performance.now correctly in tests and enable manual workflow trigger ([eb20091](https://github.com/NaturalDevCR/atemporal/commit/eb200916cac313e96ee7b431c5fb2376e22211a4))
* **test:** use robust performance mocking for ZonedDateTime strategy ([dfedc79](https://github.com/NaturalDevCR/atemporal/commit/dfedc7967561cd417c6a756359fee8e4b39deef9))

## [1.0.0](https://github.com/NaturalDevCR/atemporal/compare/v0.4.0...v1.0.0) (2026-02-17)

## [0.3.0] - 2025-01-09

### Added
- **Enhanced Firebase/Firestore Timestamp Support**: Added support for both standard and underscore formats
  - Standard format: `{ seconds: number, nanoseconds: number }`
  - Underscore format: `{ _seconds: number, _nanoseconds: number }`
  - Automatic detection and parsing of both formats
  - Full backward compatibility with existing Firebase timestamp usage

### Changed
- Improved `FirebaseTimestampStrategy` to handle both timestamp formats seamlessly
- Enhanced type definitions to support `FirebaseTimestampLike` interface
- Updated validation logic to recognize both format variations
- Refined confidence scoring for Firebase timestamp parsing

### Technical Details
- Added `extractFirebaseTimestampValues()` utility function to normalize both formats
- Enhanced `isFirebaseTimestamp()` and `isFirebaseTimestampLike()` type guards
- Updated `hasFirebaseTimestampStructure()` to detect both format patterns
- Comprehensive test coverage for both timestamp formats

## [0.2.0] - 2024-01-XX

### Added
- Initial Firebase/Firestore timestamp support (standard format only)
- Plugin system with multiple formatting and utility plugins
- Comprehensive date manipulation and comparison methods
- Full TypeScript support with detailed type definitions

## [0.1.0] - 2024-01-XX

### Added
- Initial release with core temporal functionality
- Basic date parsing and formatting
- Immutable API design
- Temporal API integration