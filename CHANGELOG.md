# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/NaturalDevCR/atemporal/compare/v1.4.3...v2.0.0) (2026-07-16)


### ⚠ BREAKING CHANGES

* None - fully backward compatible
* **customParseFormat:** Formats that only contain time or partial date parts (e.g., `HH:mm`, `DD HH:mm`) will now successfully parse using the current date for missing components. Previously, these formats would result in an invalid atemporal instance.

### Features

* add date range overlap detection plugin ([816a21e](https://github.com/NaturalDevCR/atemporal/commit/816a21e8915e579d4d89c15107ab5fc21b04086e))
* add date range overlap detection plugin and improve console logging ([6d7da4c](https://github.com/NaturalDevCR/atemporal/commit/6d7da4c6f8db97cb99b607a61b778e49a32b5e51))
* add new plugins (businessDays, timeSlots), improve test coverage, and update documentation ([3a1d03a](https://github.com/NaturalDevCR/atemporal/commit/3a1d03ab2c6c06eb153f36c6e10f2fae674a3a5e))
* add support for Firebase/Firestore underscore timestamp format ([58b5c9f](https://github.com/NaturalDevCR/atemporal/commit/58b5c9fb6148931de1443660320d58f94dc794c8))
* **api:** Add Duration support and flexible unit aliases ([1994292](https://github.com/NaturalDevCR/atemporal/commit/1994292b85043b7a410cc09b564d168252095070))
* comprehensive improvements to performance, testing, and caching ([fcc2936](https://github.com/NaturalDevCR/atemporal/commit/fcc29360c50b49c9f5198ff9519fe2ec52151ca4))
* comprehensive test coverage and performance optimizations ([ec78453](https://github.com/NaturalDevCR/atemporal/commit/ec784538e5353efb8850d7af038b4ccfd1205c72))
* **core:** add .dayOfWeek() manipulation method ([1fcd5bb](https://github.com/NaturalDevCR/atemporal/commit/1fcd5bbcf754d07c5ba3a2c88fb96d11d4291758))
* **core:** add .daysInMonth getter ([8b24651](https://github.com/NaturalDevCR/atemporal/commit/8b2465194525d32e25e48cc62d1025827394382e))
* **core:** add .range() method ([a9da291](https://github.com/NaturalDevCR/atemporal/commit/a9da291c302f6690eedef304902688a643fb46d9))
* **core:** Add Firebase Timestamp support and improve parsing ([64b184c](https://github.com/NaturalDevCR/atemporal/commit/64b184c9ca3e3bc65298a4adf0237ddbdf730ed5))
* **core:** Add validation utilities and new comparison methods ([46f9b92](https://github.com/NaturalDevCR/atemporal/commit/46f9b92782aaf387bec687cc373193feeacb2c26))
* **core:** allow instance creation from arrays and objects ([2725da4](https://github.com/NaturalDevCR/atemporal/commit/2725da493f50441a583f8fdb7093f792324fa62a))
* **customParseFormat:** enhance parsing with advanced features ([4fba49b](https://github.com/NaturalDevCR/atemporal/commit/4fba49b483e19eba277c39385b1bde9ab5aeae93))
* Error handling types, and README update ([5320cdc](https://github.com/NaturalDevCR/atemporal/commit/5320cdc513857d71a5d9e44ec5a2735f0da95e74))
* **format extended:** Extend format to accept more tokens. ([df23077](https://github.com/NaturalDevCR/atemporal/commit/df23077e32bad6544bc66bd5dafc0e967bc0c840))
* **format:** Añadir tokens de zona horaria y corregir caché de localización ([90840b6](https://github.com/NaturalDevCR/atemporal/commit/90840b6511243c30518d65a14538427058faf31e))
* implement comprehensive refactor with native Temporal detection system ([b22089f](https://github.com/NaturalDevCR/atemporal/commit/b22089fb08ce3291026af9ae80ab986e1a5dd5e6))
* **plugin:** add advancedFormat plugin for ordinals and long-form dates ([c30786f](https://github.com/NaturalDevCR/atemporal/commit/c30786f52324957e8768c4cc1e538221fe74ad5d))
* **plugin:** Add Firebase Timestamp interoperability ([576ee29](https://github.com/NaturalDevCR/atemporal/commit/576ee29eff5bcc57867082de656242b1368efd92))
* **plugin:** add weekDay plugin for customizable week start ([3a9c0aa](https://github.com/NaturalDevCR/atemporal/commit/3a9c0aa07e78b2d95eb494ba1475ce059992cc1f))
* v1.2.0 - code quality, deterministic profiler, plugin system improvements ([4081e01](https://github.com/NaturalDevCR/atemporal/commit/4081e011b73dae460b35e1df0ef92445cc14584d))


### Bug Fixes

* add missing method signatures to AtemporalFactory interface ([f8d757e](https://github.com/NaturalDevCR/atemporal/commit/f8d757ecf19247d93efb36aff1fe9816690376a9))
* Ajustar thresholds de performance para entornos CI ([26c3935](https://github.com/NaturalDevCR/atemporal/commit/26c3935f9745c644e8c6bbf84229cc54b5f0a18f))
* align pnpm with supported Node versions ([13adffe](https://github.com/NaturalDevCR/atemporal/commit/13adffeda8ce693cc95e18cf5085725732caf5bb))
* **atemporal.timezone.test.ts:** Fixed tests to work with github CI ([639e4ff](https://github.com/NaturalDevCR/atemporal/commit/639e4ff6d035acd55404db5758e61b4b89ed57d4))
* build test fixtures before matrix validation ([18b921b](https://github.com/NaturalDevCR/atemporal/commit/18b921be32833172f1a74dcfc19056b900a36373))
* **cache:** add null check for oldestKey in LRUCache implementation ([0571825](https://github.com/NaturalDevCR/atemporal/commit/0571825fbaf3e4e5145e939ba631ac0c3dc61c93))
* **caching:** use unit normalization in diff calculations ([63ed48f](https://github.com/NaturalDevCR/atemporal/commit/63ed48f25438f42501226c705fe1155319825914))
* **ci:** ignore one medium-severity dev-only CVE in OSV-Scanner ([c20df67](https://github.com/NaturalDevCR/atemporal/commit/c20df67ae70a0cb26602852c430f29561f8533a7))
* **ci:** lychee config + property-based test flake ([049d290](https://github.com/NaturalDevCR/atemporal/commit/049d29030c53997c78ee9093bbd43b31739d4104))
* **ci:** simplify lychee config + fix cookbook SECURITY link + osv-scanner v2 schema ([ea692f9](https://github.com/NaturalDevCR/atemporal/commit/ea692f9817bd48676fd061d78247cc26a65c47e3))
* **ci:** stabilize workflows and docs ([15aa796](https://github.com/NaturalDevCR/atemporal/commit/15aa7968fcc56e1ec6bf350b5980c1795175a716))
* **ci:** unblock the supply-chain hardening pipeline ([e838297](https://github.com/NaturalDevCR/atemporal/commit/e83829781d93744134f22f7e6331000d698e5373))
* **core:** Refactor parsing engine to fix widespread test failures ([cca6447](https://github.com/NaturalDevCR/atemporal/commit/cca64476f1cd6713d45d5da2545b92f51d51e6aa))
* **customParseFormat:** default to current date for time-only formats ([cd3f1b6](https://github.com/NaturalDevCR/atemporal/commit/cd3f1b686cdfab631c5b9580893733976fc389c3))
* **diff:** normalize plural time units to singular in calculateDiff ([2bdb0d0](https://github.com/NaturalDevCR/atemporal/commit/2bdb0d00944277912c3ca2ddf8428d0743bc8784))
* **diff:** normalize ZonedDateTime to polyfill before calling since() ([f8ea619](https://github.com/NaturalDevCR/atemporal/commit/f8ea61988196bd4b32a06fa21f90aa910504ea54))
* **docs:** add base path for GitHub Pages styling ([5ae1ee8](https://github.com/NaturalDevCR/atemporal/commit/5ae1ee84daf59a245a09272779e8bb3ae3a91f18))
* fail closed on invalid performance medians ([f9c67f1](https://github.com/NaturalDevCR/atemporal/commit/f9c67f1071b19641b567c73373fa5c10b4b21442))
* **firebaseTimestamp parsing:** removed Object.keys(input).length === 2 because firebase firestore tiemstamps DO have functions. ([0172370](https://github.com/NaturalDevCR/atemporal/commit/01723704a54fd42b760841681ea6336d35cb83a1))
* harden release artifact publication ([0792585](https://github.com/NaturalDevCR/atemporal/commit/07925856355aa184ec7891adad91e25af4d564af))
* initialize pnpm before CI cache setup ([026ce01](https://github.com/NaturalDevCR/atemporal/commit/026ce01d90b7746d79cf5fbdd6f916ad261afa7b))
* initialize pnpm before CI cache setup ([f9e4a93](https://github.com/NaturalDevCR/atemporal/commit/f9e4a939c8b3341e5c3276192cf783da77f987e6))
* make Atemporal's public guarantees verifiable ([a9c6056](https://github.com/NaturalDevCR/atemporal/commit/a9c6056224cfdba56e57318b6437a8c5fbd223af))
* mock performance.now correctly in tests and enable manual workflow trigger ([eb20091](https://github.com/NaturalDevCR/atemporal/commit/eb200916cac313e96ee7b431c5fb2376e22211a4))
* **package.json -> plugins missing:** Added missing plugins on the package.json for tsup, and availability ([09f625c](https://github.com/NaturalDevCR/atemporal/commit/09f625cfd398655c6a2a244262c1b89462774d75))
* pin canonical bundle dependency resolution ([e423880](https://github.com/NaturalDevCR/atemporal/commit/e4238809942fc78c9a25dbd8b444cfcc37b75206))
* pin canonical bundle dependency resolution ([9c290b0](https://github.com/NaturalDevCR/atemporal/commit/9c290b05a42a6b604ec16a4db0b704dee3170e4f))
* preserve null error on valid wrapper fast path ([26dab8f](https://github.com/NaturalDevCR/atemporal/commit/26dab8fac3595066ecaf749c44facffd4e2c98b9))
* preserve pnpm script arguments in CI ([d5191bd](https://github.com/NaturalDevCR/atemporal/commit/d5191bdbae051faf9d2604af0ab10d471bb72832))
* prevent duplicate 'Using polyfilled Temporal API' console messages ([1a46b64](https://github.com/NaturalDevCR/atemporal/commit/1a46b64f80066c26b444a87fbbaef7729de0f9cd))
* README.md oops ([98bc5d5](https://github.com/NaturalDevCR/atemporal/commit/98bc5d5a3414fb962c7a0a2121dc87ba9f9c4ac4))
* **relativeTime:** Corregir cálculo de tiempo relativo ([a40e91e](https://github.com/NaturalDevCR/atemporal/commit/a40e91e5cd20be830815260d75884af954ee0462))
* remediate dependency security advisories ([c899048](https://github.com/NaturalDevCR/atemporal/commit/c89904847bc9a951512ec3f3c71cf3cf23b2e90b))
* Remove unnecessary folders ([455bd3f](https://github.com/NaturalDevCR/atemporal/commit/455bd3f1992d68a840a690b5c1648606e0a326ec))
* replace dynamic require with static import for bundler compatibility ([a7ca6b2](https://github.com/NaturalDevCR/atemporal/commit/a7ca6b2c138e6bbf7993ce912e32b9a20ea95d6e))
* restore canonical fixture dependencies ([8481530](https://github.com/NaturalDevCR/atemporal/commit/84815303b58b18fa9e21b0606c7e8b7c47dbd527))
* security hardening and code quality improvements across the library ([74978bb](https://github.com/NaturalDevCR/atemporal/commit/74978bbf025c66f14a885b366142bd06fefef879))
* **temporal-api:** correct type exports for DTS compatibility ([4d44a98](https://github.com/NaturalDevCR/atemporal/commit/4d44a981e149932f573171110d96d01155b4e968))
* **test:** use robust performance mocking for ZonedDateTime strategy ([dfedc79](https://github.com/NaturalDevCR/atemporal/commit/dfedc7967561cd417c6a756359fee8e4b39deef9))
* track directly extended official plugins ([9d2e7de](https://github.com/NaturalDevCR/atemporal/commit/9d2e7def2d8dab5455a563505b75d36bd1810efd))
* unblock pnpm CI security gates ([497b661](https://github.com/NaturalDevCR/atemporal/commit/497b661cef96f715023ed56e0a1fe291e5cc3691))

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
