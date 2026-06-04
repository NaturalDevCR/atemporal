# Architecture Decision Records (ADRs)

This directory contains the **Architecture Decision Records** for
atemporal — the documents that capture *why* the library is shaped
the way it is, not just *what* it does.

## Index

| ADR | Title                                                        | Status   |
| --- | ------------------------------------------------------------ | -------- |
| [0001](0001-use-temporal-api.md)                                | Use the TC39 Temporal API as the underlying engine | Accepted |
| [0002](0002-plugin-system.md)                                   | Plugin system via `atemporal.extend()` and `lazyLoad()` | Accepted |
| [0003](0003-immutable-wrappers.md)                              | Always return new instances (immutability)        | Accepted |
| [0004](0004-error-codes.md)                                     | Stable `ATEMPORAL_*` error codes                   | Accepted |
| [0005](0005-parallel-strategies.md)                             | Multiple parallel parse strategies                  | Accepted |
| [0006](0006-no-opentelemetry-dep.md)                            | No direct OpenTelemetry dependency                  | Accepted |
| [0007](0007-supply-chain-hardening.md)                          | Supply chain hardening (SBOM, provenance, mutation testing, perf gate, license & link gates) | Accepted |

## Format

Each ADR follows the [MADR template](https://adr.github.io/madr/):

1. **Context** — what is the situation? what forces are at play?
2. **Decision** — what did we decide?
3. **Consequences** — what becomes easier, harder, given up?
4. **Alternatives considered** — what other options did we weigh?

## When to write an ADR

Write an ADR whenever:

- You are introducing a new architectural concept (e.g. plugin
  system, telemetry interface, error code scheme).
- You are making a non-obvious tradeoff that future contributors
  will need to understand.
- You are rejecting a popular alternative (e.g. "why not
  Day.js-style moment.format()?").

Do **not** write an ADR for:

- Bug fixes.
- Internal refactors with no API impact.
- Documentation changes.

## How to propose a new ADR

1. Copy [`0000-template.md`](0000-template.md) to
   `NNNN-short-name.md` (next available number).
2. Fill in the four sections. Keep it under 200 lines.
3. Open a PR. The PR is the discussion; the ADR is the proposal.
4. Once merged, the status moves from "Proposed" to "Accepted".

## How to supersede an ADR

When a decision is reversed:

1. Do **not** edit the original ADR. Instead, write a new one that
   references the old (e.g. "Supersedes ADR 0002").
2. Mark the original's status as "Superseded" and add a link to
   the new one.
3. The new ADR inherits the old one's ADR number + 1.

## References

- [MADR template](https://adr.github.io/madr/)
- [GitHub: Why write ADRs](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Michael Nygard's original ADR blog post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
