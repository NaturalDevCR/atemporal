# ADR 0004: Stable `ATEMPORAL_*` error codes

**Status:** Accepted
**Date:** 2026-06-03
**Authors:** atemporal maintainers

## Context

Before this ADR, atemporal's errors exposed only a `name` and a
`message`. Consumers who wanted to translate error messages to
their own i18n catalog, or to alert on specific failure modes,
had to pattern-match on the human-readable `message` — which is
not stable across patch releases.

## Decision

Every atemporal error extends `AtemporalError` and exposes a
`code: AtemporalErrorCode` field with a value from the
`ATEMPORAL_ERROR_CODES` catalog. The codes are:

- Stable across patch and minor releases.
- Documented in `src/errors.ts`.
- The **only** supported way to identify an error class for
  machine handling. (`name` is for humans, `instanceof` is for
  runtime, `code` is for logic.)

When adding a new error class, add its code to the catalog and
document it. Removing a code is a breaking change.

## Consequences

**Easier:**
- Consumers can match `err.code === 'ATEMPORAL_INVALID_DATE'` and
  act on it without worrying about message wording.
- Logging pipelines can index on `code` to build dashboards.
- Sentry, Datadog, and other structured-logging tools get
  predictable fields.

**Harder:**
- Adding a new error category requires a code. We cannot ship a
  new error class without a code, even for a private internal
  error.
- The catalog grows over time. We must be disciplined about
  retiring unused codes.

**Given up:**
- The ability to change the "category" of an existing error
  without bumping the major version. (This is the trade-off for
  stability.)

## Alternatives considered

1. **Keep pattern-matching on `name`.** Rejected: `name` is for
   humans, not for tools, and a library should not require its
   users to grep against an English error name.
2. **Use a numeric `errno` (like Node.js).** Rejected: numbers
   are not self-documenting. Codes that read like `ATEMPORAL_*`
   are easier to grep for in logs.
3. **Per-error JSON-schema for the error fields.** Rejected: too
   heavyweight. Codes are enough.

## References

- [Sprint 1.2 implementation](https://github.com/NaturalDevCR/atemporal/pull/...)
- [Structured logging recipe](../cookbook/logging.md)
- Internal: `src/errors.ts`
