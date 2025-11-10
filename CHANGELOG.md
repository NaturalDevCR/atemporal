# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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