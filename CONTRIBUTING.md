# Contributing to atemporal

Thank you for your interest in contributing to **atemporal** — the
ergonomic, type-safe date/time library for the TC39 Temporal API.

This document explains how to set up the project, run the test suite, and
submit changes. For project context and the *why* behind our decisions,
read the docs in `docs/` and the architecture reports in
`docs/reports/`.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Workflow](#workflow)
- [Testing](#testing)
- [Linting and Type Checking](#linting-and-type-checking)
- [Documentation](#documentation)
- [Releasing](#releasing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
By participating, you agree to uphold its terms.

## Project Structure

```
atemporal/
├── src/
│   ├── index.ts                # Main entry point (factory + plugin loader)
│   ├── TemporalWrapper.ts      # Public wrapper class (the main API)
│   ├── TemporalUtils.ts        # Internal static utilities
│   ├── errors.ts               # Error classes (public)
│   ├── typeGuards.ts           # Type guard helpers
│   ├── types.ts                # Public type definitions
│   ├── core/                   # Internal engine modules
│   │   ├── temporal-api.ts     # Centralized Temporal re-export
│   │   ├── temporal-detection.ts  # Native vs polyfill detection
│   │   ├── caching/            # LRU, Intl, Diff, Coordinator caches
│   │   ├── comparison/         # Comparison engine + cache
│   │   ├── formatting/         # Format engine + token pool
│   │   ├── locale/             # Locale normalization
│   │   ├── parsing/            # Parse coordinator + 12 strategies
│   │   └── validation/         # Instance validation
│   ├── plugins/                # 8 official plugins
│   ├── types/                  # Internal/advanced types
│   └── __tests__/              # 99 test suites, 2965 tests
├── docs/                       # VitePress documentation
├── scripts/                    # Build/dev helper scripts
└── .github/
    ├── workflows/              # CI + docs deploy
    └── ISSUE_TEMPLATE/         # Issue templates
```

## Development Setup

### Prerequisites

- **Node.js** 18.x or 20.x (CI is run on both)
- **npm** 9+ (or pnpm/yarn — the lockfile is npm-only)
- A POSIX-compliant shell (macOS, Linux, WSL)

### First-time setup

```bash
git clone https://github.com/NaturalDevCR/atemporal.git
cd atemporal
npm install
```

This installs the one runtime peer dependency (`@js-temporal/polyfill`)
plus the dev toolchain (Jest, TypeScript, tsup, VitePress).

### Verifying the install

```bash
npm test                  # runs the full Jest suite (~13s)
npx tsc --noEmit         # type-checks the whole project (must be 0 errors)
npm run build             # builds CJS+ESM bundles to dist/
```

All three commands should succeed with **zero errors and zero warnings**.

## Workflow

1. **Open an issue first** for non-trivial changes. Discuss the design
   before you spend hours on a patch. We use GitHub Issues as the
   primary design surface.
2. **Fork the repository** and create a feature branch:
   ```bash
   git checkout -b fix/issue-123-overlap-edge-case
   ```
   Branch naming conventions:
   - `feat/<short-name>` for new features
   - `fix/<short-name>` for bug fixes
   - `refactor/<short-name>` for internal changes
   - `docs/<short-name>` for documentation-only changes
   - `test/<short-name>` for test-only changes
3. **Make focused commits.** One logical change per commit. Use
   [Conventional Commits](https://www.conventionalcommits.org/) so
   `standard-version` can generate the CHANGELOG.
4. **Write tests** for any behavioral change. Coverage must not drop
   below 95% statements.
5. **Run the full local checklist** (see below) before opening the PR.
6. **Open a pull request** against the `main` branch. Fill in the PR
   template. Link the issue it resolves with `Closes #123`.

### Local pre-PR checklist

```bash
npm test                  # 99 suites, ~3000 tests, all green
npx tsc --noEmit         # 0 errors
npm run build             # 0 errors, dist/ produced
npm run docs:build        # VitePress builds cleanly
```

If any of these fail, the PR will not be merged.

## Testing

The project uses **Jest** with `ts-jest`. Test files live in
`src/__tests__/` and mirror the source structure.

```bash
npm test                            # full suite with coverage
npm test -- --watch                 # watch mode
npm test -- path/to/file.test.ts    # single file
npm run test:ci                     # CI mode (no performance tests)
npm run test:performance            # performance tests only
```

### Coverage thresholds

We maintain **≥ 95% statements, ≥ 90% branches, ≥ 90% functions**.
Coverage is enforced via Jest's `coverageThreshold` configuration.

When adding tests for a new feature, aim for *behavioral* tests, not
*coverage* tests. A test that asserts a return value is more valuable
than a test that just calls a function to bump the %.

### What *not* to test

- Implementation details (e.g. "the internal cache has 200 entries").
- The behaviour of `@js-temporal/polyfill` (we trust it; we test our
  own logic on top of it).
- Private internals marked with `@internal` JSDoc.

## Linting and Type Checking

- **TypeScript** is the source of truth for types. Run `npx tsc --noEmit`
  before every commit.
- We do not currently run ESLint or Prettier. Code style is enforced
  by code review and the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).
- Watch for the 53-error regression we just fixed: any file that uses
  `Temporal.X` as a *type* must `import type { Temporal as TemporalNS }`
  from `@js-temporal/polyfill`. The runtime import is `Temporal` from
  `src/core/temporal-api`.

## Documentation

- **API reference** is generated from JSDoc on the source code. Use
  the `@example` tag liberally.
- **Guides** live in `docs/guide/*.md` and are written in Markdown with
  VitePress extensions (badges, code groups, etc.).
- **Plugin docs** live in `docs/plugins/<name>.md` and must include a
  "Quick start" and at least 2 realistic examples.
- **ADRs** (architecture decisions) go in `docs/adr/`. Use the template
  in `docs/adr/0000-template.md`.
- **Build & preview locally**:
  ```bash
  npm run docs:dev    # live-reload preview
  npm run docs:build  # static build to docs/.vitepress/dist
  ```

## Releasing

This project uses [standard-version](https://github.com/conventional-changelog/standard-version) for releases.

1. Merge all PRs intended for the release to `main`.
2. Run `npm run release -- --release-as <major|minor|patch>`.
3. Push the generated tag: `git push --follow-tags origin main`.
4. CI publishes to npm via the `prepublishOnly` script.

The CHANGELOG is auto-generated from conventional commits.

## Reporting Bugs

Use the **Bug report** issue template. Include:

- A minimal reproduction (gist, CodeSandbox, or local code block).
- The version of atemporal (`npm ls atemporal`).
- The version of Node.js and `@js-temporal/polyfill`.
- The expected vs actual behaviour.
- The full error message, if any.

## Suggesting Features

Use the **Feature request** issue template. Before opening one:

1. Search existing issues to avoid duplicates.
2. Check the [roadmap](docs/reports/REFACTOR_PLAN.md) — it may already
   be planned.
3. Be specific about the use case. "It would be nice to have
   `subtractBusinessDays`" is better than "more business day helpers".

## License

By contributing to atemporal, you agree that your contributions will be
licensed under the [MIT License](LICENSE).

---

Last updated: 2026-06-03
