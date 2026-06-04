# Threat Model

This document is the canonical threat model for atemporal. It
complements the disclosure process described in the
[security policy](https://github.com/NaturalDevCR/atemporal/blob/main/SECURITY.md)
and the security best-practices page in the [cookbook](../cookbook/logging.md).

## Asset inventory

atemporal is a **client-side date/time library**. The "assets" it
protects are:

1. **Caller time and correctness.** A user-visible wrong date
   (off-by-one, wrong timezone) is a silent bug that can corrupt
   audit logs, schedules, and analytics.
2. **Caller process stability.** A `RangeError` thrown out of a
   regex backtracking loop, or a `Maximum call stack` from a
   recursive parser, can take down a Node process.
3. **Caller error-handling surface.** If atemporal throws an error
   that cannot be matched by `instanceof`, the caller cannot
   translate it to a localized message.

## Adversary model

atemporal assumes:

- **Inputs can be malicious.** Strings, numbers, `Date` objects, and
  plain objects come from untrusted sources (HTTP body, URL
  parameter, queue message, third-party webhook).
- **The host environment is benign.** The browser, Node.js, or
  Worker runtime is not compromised. (If it is, atemporal
  cannot help — your process is already owned.)
- **Plugins are trusted.** Plugins are loaded from npm packages the
  consumer has chosen. Plugins run with full access to the
  `TemporalWrapper` class.

atemporal does **not** assume:

- That inputs are valid. The library must produce a defined
  behaviour for any input.
- That the caller's validator has run. atemporal is the *second*
  line of defense.

## In-scope threats

### T1: Regular expression denial of service (ReDoS)

**Description:** an attacker submits a long, structured string that
causes a regex in `customParseFormat` to backtrack catastrophically.

**Mitigation:**
- All format-token regexes are linear in input length.
- We do not use nested quantifiers (`(a+)+`, `(a*)*`).
- The string strategy enforces a default 4 096-character input cap
  (configurable via `setMaxInputLength`).
- The CI fuzz tests run 1 000 random strings per build (see
  `__tests__/atemporal.fuzz.test.ts`).

**Residual risk:** a regression that introduces a new regex without
a code review will not be caught by automated tools. The threat
model is enforced by *the code review checklist*, not by tests.

### T2: Prototype pollution via plain-object input

**Description:** an attacker submits `{ "__proto__": { "polluted": 1 } }`
as if it were a plain date object. The parser might assign
`obj.year = 2024`, accidentally polluting `Object.prototype`.

**Mitigation:**
- The plain-object strategy only ever *reads* known keys
  (`year`, `month`, `day`, `hour`, `minute`, `second`,
  `millisecond`, `timeZone`, `calendar`).
- We never spread (`{...obj}`) or assign to keys we did not
  destructure.
- The fuzz test `does not get confused by prototype pollution attempts`
  explicitly checks for this.

**Residual risk:** none known. Verified by fuzzing.

### T3: Cross-implementation `instanceof` confusion

**Description:** a project loads both `@js-temporal/polyfill` and
the native Temporal API. A value from one fails `instanceof` checks
in the other. The parser would silently return the wrong answer.

**Mitigation:**
- All internal code goes through `getCachedTemporalAPI()` in
  `src/core/temporal-api.ts`, which is initialized once per process.
- The polyfill import is `import * as Temporal from '@js-temporal/polyfill'`
  (a single module); the native API is the global `Temporal` object.
- We never mix the two in a single function.

**Residual risk:** if a consumer manually constructs a value with
the "wrong" implementation, our parser will throw. We have a clear
error message but no automatic recovery.

### T4: Numeric edge cases

**Description:** an attacker submits `Number.MAX_SAFE_INTEGER`,
`Number.MAX_VALUE`, `NaN`, or `Infinity`.

**Mitigation:**
- `Number.isFinite()` and `Number.isInteger()` guards are applied
  at every numeric parse path.
- `NaN` propagates to a `.isValid() === false` result.
- `Infinity` returns an invalid wrapper (no crash).

**Residual risk:** none. The fuzz tests cover these cases.

### T5: Format string injection

**Description:** an attacker submits a user-controlled string as a
*format* (not a date) — e.g. `atemporal(input, fmt).format(fmt)`.
The format contains tokens that could read state or do something
harmful.

**Mitigation:**
- The formatting engine is a *pure* function: it reads
  `.year`, `.month`, etc. and emits tokens. It does not eval, do
  string interpolation, or read user data.
- All user-controlled values must be inserted via `[literal]`
  escapes, which are explicitly safe.

**Residual risk:** none.

### T6: Locale and timezone DOS

**Description:** an attacker submits an IANA timezone string that
the polyfill tries to load, taking seconds or hanging.

**Mitigation:**
- `Intl.DateTimeFormat` is initialized once per timezone+locale
  and cached in `IntlCache`. The second call returns the cached
  `Intl.DateTimeFormat` synchronously.
- A bad IANA name throws `InvalidTimeZoneError` immediately
  (because `Intl.DateTimeFormat` validates it).

**Residual risk:** none known. The CI tests run on
`America/New_York`, `Europe/London`, `Asia/Tokyo`, etc.

### T7: Information disclosure via error messages

**Description:** an error message leaks internal state (file
paths, env vars, secrets).

**Mitigation:**
- User-facing error messages are static and audited.
- `debugLog` never logs raw `Error` objects or stack traces.
- Errors do not include the original input by default (some
  include it; see `InvalidFormatError.formatString`,
  `FormatMismatchError.dateString` — these are intentional but
  bounded).

**Residual risk:** low. We rely on code review to catch new
error messages that include user data.

## Out-of-scope

- Bugs in `@js-temporal/polyfill` itself.
- Denial-of-service through deliberate resource exhaustion
  (e.g. parsing a million strings in a tight loop).
- Vulnerabilities in user code that uses atemporal.
- Side-channel attacks (e.g. timing differences) — atemporal's
  parse times are input-dependent, but the variance is bounded.

## Reporting a new threat

If you find a new attack vector that is not in the list above,
please open a private security advisory as described in
the [security policy](https://github.com/NaturalDevCR/atemporal/blob/main/SECURITY.md#reporting-a-vulnerability).

We aim to update this document every time a new threat class is
discovered or a mitigation lands.

## Change log

- **2026-06-03** — Initial document (Sprint 2.4 of the audit).
