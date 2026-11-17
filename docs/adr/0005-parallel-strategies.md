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
input type**, with type checks, priorities, and shared caching.

## Decision

In v3 the compatibility factory uses a shared synchronous `ParseEngine` with
**12 configured strategies**:

1. `temporal-wrapper` — existing wrappers
2. `temporal-zoned` — `Temporal.ZonedDateTime`
3. `temporal-instant` — `Temporal.Instant`
4. `temporal-plain-datetime` — `Temporal.PlainDateTime`
5. `temporal-plain-date` — `Temporal.PlainDate`
6. `date` — legacy `Date`
7. `firebase-timestamp` — Firebase timestamp shapes
8. `number` — epoch milliseconds
9. `string` — date strings
10. `temporal-like` — Temporal-compatible values
11. `array-like` — numeric date arrays
12. `fallback` — last-resort object conversion

Strategies expose `canHandle(input, context)`, confidence/priority information,
validation, and `parse(input, context)`. The engine selects candidates and runs
the synchronous parsing path, retaining fast paths, cache entries, and metrics.
Failed strategies can be followed by other candidates; the wrapper converts a
final failure into its compatibility invalid-instance result.

The optional `ParseCoordinator` and optimizer remain internal tooling. They
share engine configuration but are excluded from the normal v3 application
graph. The public date path does not launch parallel promises. Strict parsing
and explicit Temporal constructors apply their own boundary policies; use
`parse()`/`tryParse()` for strict wrapper parsing.

## Consequences

**Easier:**
- Adding a new input type (e.g. a custom serialization) is a
  one-strategy PR. The shared dispatcher does not need a new input-type branch.
- Each strategy can be tested in isolation. We have a dedicated
  test suite per strategy.
- Performance is predictable: fast paths and cached results avoid repeated conversion work.

**Harder:**
- Strategy order matters. If `object-strategy` ran first, it
  would always shadow the more specific strategies.
- Accepting a shape with `canHandle` does not guarantee a successful parse.
  The engine must preserve validation errors and fallback behavior.

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

- Internal: `src/core/parsing/parse-engine.ts` and `engine-config.ts`
- Optional tooling: `src/core/parsing/parse-coordinator.ts`
- Internal: `src/core/parsing/strategies/`
- Tests: `src/__tests__/core/parsing/parse-coordinator.test.ts`
