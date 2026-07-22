# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.5.0](https://github.com/NaturalDevCR/atemporal/compare/v1.4.3...v1.5.0) (2026-07-22)


### Features

* add strict parsing and operational LLM guides ([8f2e90c](https://github.com/NaturalDevCR/atemporal/commit/8f2e90c451ea3d44b41f21faa9e320aedff98cc1))
* add strict parsing with DST policy ([f1f5771](https://github.com/NaturalDevCR/atemporal/commit/f1f577194b7b76cf72afee92040a5011880bec4f))
* declare strict parsing and diagnostics API ([198b27d](https://github.com/NaturalDevCR/atemporal/commit/198b27d6c7c4c9911e4ff148650fe181c5adb827))
* expose snapshot diagnostics API ([dd11db3](https://github.com/NaturalDevCR/atemporal/commit/dd11db3f215a820c7f1967052f0834d1f7ea484a))
* inspect applied third-party extensions ([0e18bc1](https://github.com/NaturalDevCR/atemporal/commit/0e18bc18e1455acd64140ce939d7d10c48f7ffe9))

## [1.4.3](https://github.com/NaturalDevCR/atemporal/compare/v1.4.2...v1.4.3) (2026-07-15)

### Bug Fixes

* **core:** preserve explicit `null` errors on the validated-wrapper fast path
* **plugins:** use explicit official-plugin metadata for direct extensions and lazy loading
* **package:** validate the packed tarball, CJS and ESM declarations, and public plugin exports

### Documentation

* clarify the Day.js-inspired compatibility contract and its semantic differences

### Build System

* enforce coverage, package-size, canonical bundle, integration, and release-artifact contracts

## [1.4.2](https://github.com/NaturalDevCR/atemporal/compare/v1.4.1...v1.4.2) (2026-06-04)


### Bug Fixes

* **package:** install Temporal polyfill as a direct runtime dependency for pnpm consumers

## [1.4.1](https://github.com/NaturalDevCR/atemporal/compare/v1.4.0...v1.4.1) (2026-06-04)


### Bug Fixes

* **ci:** stabilize workflows and docs ([15aa796](https://github.com/NaturalDevCR/atemporal/commit/15aa7968fcc56e1ec6bf350b5980c1795175a716))

## [1.4.0](https://github.com/NaturalDevCR/atemporal/compare/v1.3.7...v1.4.0) (2026-06-03)


### Features

* **api:** add `atemporal.try()`, `atemporal.iso()`, `atemporal.validate()` ergonomic static helpers ([Sprint 1.1](#))
* **errors:** publish the full `ATEMPORAL_*` error-code catalog in `src/errors.ts` JSDoc; codes are now a documented public contract
* **formatting:** expose `atemporal.presets.list()` and `atemporal.presets.get(name)` as the programmatic preset API
* **strict-mode:** ship `atemporal.setStrictMode`, `isStrictMode`, `getStrictModeFlags`, `clearStrictWarnings` as the supported API (no longer internal)
* **llms.txt:** comprehensive LLM-friendly documentation bundle (5 500+ lines) with method index, cookbook, migration guides, threat model, and ADRs
* **supply-chain:** mutation testing (Stryker), SBOM (SPDX + CycloneDX), signed releases with `--provenance` (SLSA OIDC), Codecov coverage trend, Dependabot auto-updates, license allow-list, performance regression gate, doc link checker, secret scanning (gitleaks), dependency CVE gate (npm audit --audit-level=high + OSV-Scanner)


### Bug Fixes

* **parsing:** harden parse strategies against malformed inputs (firebase, string, fallback, temporal-instant, temporal-plain-date, temporal-plain-datetime, temporal-wrapper, temporal-zoned)
* **caching:** invalidate the diff cache when the diff function's unit normalizer changes
* **bench:** import the published `dist/index.mjs` instead of the source tree, so the benchmark measures what we ship


### Documentation

* complete and reorganise the cookbook (audit logs, business hours, REST validation, Prisma, Drizzle, RSC, Cloudflare Workers, structured logging, microservice timezones, i18n)
* complete migration guides (Day.js, Luxon, moment.js, raw Temporal)
* add ADR 0007 — supply chain hardening
* threat model rewritten as a public-facing document in `docs/security/threat-model.md`


### [1.3.7](https://github.com/NaturalDevCR/atemporal/compare/v1.3.6...v1.3.7) (2026-05-07)


### Bug Fixes

* security hardening and code quality improvements across the library ([74978bb](https://github.com/NaturalDevCR/atemporal/commit/74978bbf025c66f14a885b366142bd06fefef879))

### [1.3.6](https://github.com/NaturalDevCR/atemporal/compare/v1.3.5...v1.3.6) (2026-04-07)

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
