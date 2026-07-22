# v2 Platform and Temporal Model Design

## Goal

Define a major-release contract that supports Node 22 and newer and gives
callers explicit Temporal value models instead of treating every domain value as
a `Temporal.ZonedDateTime`.

## Scope

v2.0 is a coordinated major release. It changes the package platform floor and
adds explicit constructors while retaining the current callable factory as a
deprecated compatibility facade for one v2 release line.

## Platform contract

Set:

```json
{
  "engines": { "node": ">=22" },
  "packageManager": "pnpm@11.13.1"
}
```

CI continues to run the packed artifact contract on Node 22, 24, and 26.
Documentation must state that these are the supported Node lines. Browser,
Vite, Webpack, and Next.js support remains defined by the existing integration
fixtures; no framework runtime becomes a separate compatibility promise.

## Explicit value constructors

Add first-class factory namespaces with exact output types:

```ts
atemporal.instant(input: InstantInput): Temporal.Instant;
atemporal.date(input: PlainDateInput): Temporal.PlainDate;
atemporal.plainDateTime(input: PlainDateTimeInput): Temporal.PlainDateTime;
atemporal.zonedDateTime(input: ZonedDateTimeInput, options?: ZonedDateTimeOptions): Temporal.ZonedDateTime;
```

`instant` accepts only an instant-bearing ISO value, epoch value, `Date`, or
`Temporal.Instant`; it never guesses a timezone. `date` accepts only calendar
date values and never manufactures a time or zone. `plainDateTime` accepts a
local date-time and never attaches a zone. `zonedDateTime` accepts an explicit
zone or an input that already carries one; DST resolution uses the same explicit
options as v1.5 parsing.

The four constructors return raw Temporal values, not wrapper subclasses.
Their input types are separate exported unions; `DateInput` remains the
compatibility wrapper input type and is not widened further.

## Compatibility facade and migration

`atemporal(input, timeZone?)` remains available in v2 but is marked deprecated
in TypeScript and documentation. It continues to return `TemporalWrapper` so
existing applications can migrate incrementally. It is scheduled for removal
only in v3, never during v2.

Publish a migration table that maps each v1 wrapper scenario to one explicit v2
constructor. The guide must call out that a birthday, invoice date, and opening
hours are `date` or `plainDateTime` values; a log timestamp or webhook event is
an `instant`; a scheduled event is a `zonedDateTime`.

## Release safeguards

Use a `2.0.0-rc.1` prerelease. Run the full artifact, extended integration,
size, performance, security, and documentation gates on the RC tarball. Add
one external consumer fixture that compiles a v1 compatibility facade consumer
and one that uses all four v2 constructors. Publish the same validated tarball
only after the release checklist passes.

## Non-goals

- Reimplementing the full Day.js API.
- Replacing the Temporal polyfill with a second date-time engine.
- Making native Temporal a condition for installation.
- Removing the wrapper in v2.
