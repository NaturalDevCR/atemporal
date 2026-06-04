# ADR 0005: Multiple parallel parse strategies

**Status:** Accepted
**Date:** 2024-11-10
**Authors:** atemporal maintainers

## Context

Real-world input to a date library comes in many shapes: ISO
strings, RFC 2822 strings, `Date` objects, plain JS objects
(`{ year, month, day }`), Firebase Timestamps, arrays
`[year, month, day, ...]`, native `Temporal.*` values, etc.

A naive parser would try to detect the type with a long `if/else`
chain. A more principled design is to have **one strategy per
input type**, and run them in parallel, taking the first match.

## Decision

atemporal's parser is a `ParseCoordinator` that owns **12
strategies**, one per input type:

1. `string-strategy` — strings
2. `number-strategy` — numbers (epoch ms)
3. `date-strategy` — `Date` objects
4. `temporal-instant-strategy` — `Temporal.Instant`
5. `temporal-plain-date-strategy` — `Temporal.PlainDate`
6. `temporal-plain-datetime-strategy` — `Temporal.PlainDateTime`
7. `temporal-plain-time-strategy` — `Temporal.PlainTime`
8. `temporal-zoned-strategy` — `Temporal.ZonedDateTime`
9. `temporal-wrapper-strategy` — `TemporalWrapper` instances
10. `firebase-strategy` — Firebase `Timestamp`-shaped objects
11. `array-like-strategy` — arrays of numbers
12. `fallback-strategy` — last-resort object strategy

Each strategy exposes:
- `canParse(input): boolean` — fast type check.
- `parse(input, context): ParseResult` — actual conversion.

The coordinator calls `canParse` on each strategy in order and
returns the first one that matches. If none match, it throws
`InvalidDateError` with code `ATEMPORAL_INVALID_DATE`.

## Consequences

**Easier:**
- Adding a new input type (e.g. a custom serialization) is a
  one-strategy PR. The coordinator does not need to change.
- Each strategy can be tested in isolation. We have a dedicated
  test suite per strategy.
- Performance is predictable: the `canParse` check is O(1) for
  the common cases.

**Harder:**
- Strategy order matters. If `object-strategy` ran first, it
  would always shadow the more specific strategies.
- The string strategy is the only one that can fail *after*
  `canParse` returns true (because ISO 8601 is permissive). The
  coordinator must catch the failure and continue to the next
  strategy.

**Given up:**
- A single, unified type detection function. The cost of the
  strategy dispatch is amortized away by caching, but it is real.

## Alternatives considered

1. **One big `switch (typeof input)` chain.** Rejected: the
   input space is not fully described by `typeof`. We need
   `instanceof Temporal.Instant`, "looks like Firebase Timestamp",
   etc.
2. **Just convert everything to `Temporal.Instant` first, then
   specialize.** Rejected: not every input can be losslessly
   converted (e.g. `PlainDate` has no time component).
3. **Use the visitor pattern.** Rejected: too much ceremony for
   the value. Function-based strategies are simpler.

## References

- Internal: `src/core/parsing/parse-coordinator.ts`
- Internal: `src/core/parsing/strategies/`
- Tests: `src/__tests__/core/parsing/parse-coordinator.test.ts`
