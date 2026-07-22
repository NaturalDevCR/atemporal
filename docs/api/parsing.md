# Strict parsing

The callable factory, `atemporal(input, timeZone?)`, keeps the compatibility-oriented parsing behaviour used by earlier releases. Use `atemporal.parse(input, options)` at a validation boundary when invalid or ambiguous user input must fail explicitly.

```ts
import atemporal, { InvalidDateError } from "atemporal";

try {
  const appointment = atemporal.parse("2026-07-15T10:00:00", {
    timeZone: "America/Costa_Rica",
  });
  console.log(appointment.format("YYYY-MM-DD HH:mm"));
} catch (error) {
  if (error instanceof InvalidDateError) {
    // Return a validation error to the caller.
  }
}
```

## `atemporal.parse(input, options)`

Returns a `TemporalWrapper` or throws `InvalidDateError`. It rejects invalid calendar components and, by default, rejects daylight-saving gaps and overlaps rather than guessing.

```ts
atemporal.parse("2026-03-08T02:30:00", {
  timeZone: "America/New_York",
  disambiguation: "reject",
}); // throws: this local time is in the spring-forward gap

atemporal.parse("2026-11-01T01:30:00", {
  timeZone: "America/New_York",
  disambiguation: "earlier",
}).format("Z"); // "-04:00"
```

`ParseOptions`:

| Option | Default | Meaning |
| --- | --- | --- |
| `timeZone` | configured default (initially `UTC`) | IANA zone for local date/time input. |
| `disambiguation` | `"reject"` | `"compatible"`, `"earlier"`, `"later"`, or `"reject"` for a DST gap/overlap. |
| `overflow` | `"reject"` | `"constrain"` or `"reject"` for out-of-range calendar fields. |
| `preserveOriginalTimeZone` | `true` | Preserve a zone or offset already carried by the input. Set `false` to convert it to `timeZone`. |

## `atemporal.tryParse(input, options)`

Use this variant when malformed input is expected: it returns `null` for every invalid input and never throws.

```ts
const parsed = atemporal.tryParse(payload.startsAt, {
  timeZone: "America/Costa_Rica",
  disambiguation: "reject",
});

if (parsed === null) return { error: "Invalid startsAt" };
```

Do not use `tryParse` to silently accept DST ambiguity. Choose `"earlier"`, `"later"`, or `"compatible"` only when that policy is part of your domain rule.

