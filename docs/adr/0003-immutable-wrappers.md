# ADR 0003: Always return new instances (immutability)

**Status:** Accepted
**Date:** 2024-10-20
**Authors:** atemporal maintainers

## Context

JavaScript's `Date` is mutable:

```js
const d = new Date('2024-01-15');
d.setMonth(1);  // mutates `d` in place
console.log(d);  // '2024-02-15'
```

This makes `Date` unsafe to use in functional or reactive code
(React, Redux, RxJS). Libraries like moment.js (pre-2.29) inherited
this problem; later versions made most methods return new instances
but kept the option of mutation in some helpers.

The TC39 Temporal API resolved this at the spec level: every
`Temporal.*` type is immutable. `dt.add({ days: 1 })` returns a new
`Temporal.ZonedDateTime`; the original is unchanged.

## Decision

atemporal's `TemporalWrapper` is **always immutable**. Every
method that "modifies" the wrapped value returns a new wrapper:

```ts
const a = atemporal('2024-01-15');
const b = a.add(1, 'day');
console.log(a.format('YYYY-MM-DD'));  // '2024-01-15'
console.log(b.format('YYYY-MM-DD'));  // '2024-01-16'
```

There is no `set()` (in the mutable sense). The `set()` method we
do expose is a pure function that returns a new wrapper:

```ts
const a = atemporal('2024-01-15');
const b = a.set({ hour: 9 });
// `a` is unchanged, `b` is a new wrapper
```

This holds for **all** official plugins too: `addBusinessDays()`,
`nextBusinessDay()`, etc. all return new wrappers.

## Consequences

**Easier:**
- atemporal is safe to use in React, Redux, and any system that
  relies on referential equality.
- Pure functions are easier to test, cache, and memoize.
- Concurrent access (worker threads, async pipelines) is safe by
  default.

**Harder:**
- Naive porting of code from `Date` to atemporal can produce
  surprises. Users who mutate `Date` and then log it must now
  capture the return value of `.add()`.
- Memory allocation per operation is higher. (Mitigated by the
  internal caches; the wrapped value is reused when possible.)

**Given up:**
- The ability to chain mutations cheaply. A loop that calls
  `d.add(1, 'day')` 1000 times allocates 1000 wrappers. Use
  `d.add(1000, 'day')` instead.

## Alternatives considered

1. **Mutable wrappers by default, with a `.immutable()` opt-in.**
   Rejected: this is the moment.js mistake. The two-mode API is
   confusing and error-prone.
2. **Frozen objects (`Object.freeze`) instead of returning new
   instances.** Rejected: freezing the wrapper is fine, but
   `dt.add()` must return a *new* frozen object — that's the
   whole point. The two are not in tension.
3. **Immutability only for "major" operations (`.add`,
   `.subtract`), not for "minor" ones (`.set`).** Rejected:
   splitting the API by importance is confusing.

## References

- [TC39 Temporal immutability guarantee](https://tc39.es/proposal-temporal/#sec-immutable-records)
- Internal: `src/TemporalWrapper.ts`
- [Migration from moment.js](../migration/moment.md) (call out
  this difference)
