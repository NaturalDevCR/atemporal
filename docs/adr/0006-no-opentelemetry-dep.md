# ADR 0006: No direct OpenTelemetry dependency

**Status:** Accepted
**Date:** 2026-06-03
**Authors:** atemporal maintainers

## Context

OpenTelemetry has become the de-facto standard for tracing and
metrics in modern applications. A library that wants to support
observability "out of the box" can either:

1. Take a hard dependency on `@opentelemetry/api` and call its
   `trace.getTracer()` directly.
2. Define a minimal tracer interface and let consumers plug in
   any compatible tracer (OTel, StatsD, custom).

## Decision

atemporal does **not** take a hard dependency on
`@opentelemetry/api`. Instead, it exposes a minimal
`TelemetryTracer` interface (3 optional callbacks:
`spanStarted`, `spanEnded`, `event`) and a `setTelemetryTracer()`
function to install one.

If a consumer wants OTel, they write the adapter themselves:

```ts
import { trace } from '@opentelemetry/api';
import { setTelemetryTracer } from 'atemporal';

setTelemetryTracer({
  spanStarted: (name, attrs) => {
    const span = trace.getTracer('atemporal').startSpan(name, { attributes: attrs });
    span.end();  // or store it for later ending
  },
  // ...
});
```

## Consequences

**Easier:**
- atemporal's bundle stays small. OTel is a 100+ KB dependency
  in the worst case; we don't pay for it.
- Consumers who use a different tracer (StatsD, Datadog) can plug
  in without dragging in OTel.
- atemporal has no peer-dep conflicts with consumers' OTel
  versions.

**Harder:**
- Consumers who want OTel must write the adapter. The adapter is
  ~10 lines, but it is a step.
- We must write our own minimal tracer interface. If the OTel
  community standardizes a "lib tracer" pattern, we should adopt
  it.

**Given up:**
- The ability to say "we support OTel out of the box" in the
  README. We say "we have a one-line adapter" instead.

## Alternatives considered

1. **Hard dependency on `@opentelemetry/api`.** Rejected: it
   doubles the bundle size, creates a peer-dep conflict surface,
   and most consumers don't need it.
2. **Soft dependency via `try { require('@opentelemetry/api') }`.**
   Rejected: this would still resolve and pull the package if it
   happens to be installed, even if the consumer didn't want it.
3. **Ship our own `atemporal/otel-adapter` package.** Rejected:
   this is what consumers would write themselves, and shipping
   it would re-introduce the OTel dependency as a devDep of the
   library.

## References

- [OpenTelemetry JavaScript API](https://opentelemetry.io/docs/languages/js/)
- [Telemetry integration recipe](../cookbook/logging.md)
- Internal: `src/core/telemetry.ts`
