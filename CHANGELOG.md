# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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