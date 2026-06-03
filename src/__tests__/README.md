# Test suite layout

This directory holds the **Jest** test suite. It mirrors the source
layout in `src/` so each module has its own test file.

## Naming conventions

| Pattern                                  | When to use                                          |
| ---------------------------------------- | ---------------------------------------------------- |
| `atemporal.<feature>.test.ts`            | High-level user-facing behaviour (factory, presets, etc.) |
| `<module>.test.ts`                       | Tests for a specific source file                     |
| `core/<area>/<file>.test.ts`             | Tests for internal modules                           |
| `plugins/<plugin>.test.ts`               | Tests for a single plugin                            |
| `types/<module>.test.ts`                 | Tests for the type-system                            |

### What *not* to name a test

The following suffixes are **legacy** from an earlier coverage
campaign and are discouraged in new tests:

- `*-coverage.test.ts`
- `*-coverage-boost.test.ts`
- `*-ultra-precise.test.ts`
- `*-ultra-targeted.test.ts`
- `*-additional-coverage.test.ts`
- `*-final-coverage.test.ts`
- `*-precise-coverage.test.ts`
- `*-90-percent.test.ts`
- `coverage-boost.test.ts`
- `coverage-improvements.test.ts`
- `consolidated.test.ts` (3 files)
- `unified.test.ts`

These files are kept because they exercise real code paths, but
**new tests should be named for the behaviour they test, not the
coverage delta they generate.**

## What to test

- **Public API behaviour.** `atemporal(input).format(fmt)` should
  produce the expected string.
- **Edge cases of the parser.** Naive strings, ISO strings, RFC 2822,
  Firebase Timestamps, plain objects, etc.
- **Error codes.** Every `ATEMPORAL_*` code should have a test that
  confirms it is emitted by the right code path.
- **Plugin contracts.** Each plugin's `extend()` and method
  behaviour.

## What *not* to test

- The behaviour of `@js-temporal/polyfill` — we trust it.
- Private internals marked with `@internal` JSDoc.
- Implementation details (e.g. "the internal cache has 200 entries").

## Coverage

- We require **≥ 95% statements, ≥ 90% branches, ≥ 90% functions**.
- The CI workflow runs `npm test` and fails if coverage drops.
- New code should come with new tests *that exercise the behaviour*,
  not tests that exist solely to bump the percentage.

## Test file template

```ts
/**
 * @file Tests for the `<feature>` behaviour of atemporal.
 */
import atemporal from '../../index';

describe('atemporal: <feature>', () => {
  it('does the expected thing for the canonical case', () => {
    // Arrange
    const input = '…';
    // Act
    const result = atemporal(input).format('YYYY-MM-DD');
    // Assert
    expect(result).toBe('2024-01-15');
  });

  it('rejects invalid input with the expected error code', () => {
    const r = atemporal.validate('garbage');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('ATEMPORAL_INVALID_DATE');
  });
});
```

## Running

```bash
npm test                       # full suite
npm test -- --watch            # watch mode
npm test -- path/to/file       # single file
npm run test:ci                # CI mode (no perf tests)
```
