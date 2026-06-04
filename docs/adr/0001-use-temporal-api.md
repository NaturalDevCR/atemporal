# ADR 0001: Use the TC39 Temporal API as the underlying engine

**Status:** Accepted
**Date:** 2024-09-15
**Authors:** atemporal maintainers

## Context

Before this project, the JavaScript ecosystem had a fragmented date
library landscape. The native `Date` object is mutable and full of
landmines (zero-indexed months, automatic coercion of out-of-range
values). Third-party libraries (moment, Day.js, Luxon, date-fns)
work around these issues but each has its own opinions on API
ergonomics and bundle size.

In 2024, the TC39 Temporal proposal reached Stage 3 (and shortly
after, Stage 4). It standardizes a rich set of date/time types
(`PlainDate`, `PlainDateTime`, `ZonedDateTime`, `Instant`, `Duration`)
that address the `Date` object's pain points. Browsers are starting
to ship it natively (Chrome 144+, Firefox 139+), and a polyfill
exists for older environments.

## Decision

atemporal is built **on top of** the TC39 Temporal API, not as a
replacement for it. The library:

1. Always goes through a single `getCachedTemporalAPI()` re-export
   (see `src/core/temporal-api.ts`) so the consumer's process never
   mixes native and polyfill implementations.
2. Auto-detects native Temporal at module-load time and uses it when
   available, falling back to the polyfill otherwise.
3. Wraps the raw `Temporal.*` values in a `TemporalWrapper` class
   that provides fluent chaining, ergonomic format strings, and
   the plugin system.

## Consequences

**Easier:**
- The library's parser and formatter never reimplement DST or
  IANA semantics — Temporal handles them correctly.
- Consumers can drop down to raw `Temporal` at any time without
  leaving the library.
- The library's bundle size is dominated by the polyfill, not by
  custom date math.

**Harder:**
- We depend on a proposal that, while Stage 4, still has a long
  browser tail. We must support the polyfill path indefinitely.
- Performance for the polyfill path is significantly worse than
  the native path; we must keep optimizing.
- Any change to the spec (e.g. the recent removal of
  `Temporal.TimeZone` and `Calendar`) ripples through our code.

**Given up:**
- The freedom to redesign the date API. We are constrained by
  the spec's type model.
- Smaller bundle size in the polyfill path. (Mitigated by tree-shaking.)

## Alternatives considered

1. **Reimplement date math on top of `Date`.** This is what moment
   and Day.js do. It is fast, but it is *also* how the
   `Date` landmines get perpetuated. Rejected: the whole point of
   the project is to leave the `Date` API behind.

2. **Use the polyfill only, ignore the native API.** This would
   simplify the code at the cost of performance. Rejected: native
   Temporal is the future, and the user's process should use it
   when available.

3. **Wrap a third-party library (Luxon, Day.js) instead.** This
   would have given us a head start, but it would have tied us to
   the wrapper library's API opinions. Rejected: we want to be a
   *thin* layer on top of the standard, not another abstraction.

## References

- [TC39 Temporal proposal](https://tc39.es/proposal-temporal/)
- [Polyfill repo](https://github.com/tc39/proposal-temporal/tree/main/polyfill)
- [Tutorials and explainers](https://tc39.es/proposal-temporal/docs/)
- Internal: `src/core/temporal-detection.ts`
