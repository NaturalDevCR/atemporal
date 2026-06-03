# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in atemporal, please report it
privately. **Do not** open a public GitHub issue for security bugs.

### How to report

Send an email to **security@atemporal.dev** (or open a
[GitHub Security Advisory](https://github.com/NaturalDevCR/atemporal/security/advisories/new))
with:

1. A description of the vulnerability and its impact.
2. Steps to reproduce (a minimal test case is ideal).
3. The version(s) of atemporal affected.
4. Any known workarounds.

You should receive an acknowledgement within **48 hours**. We aim to:

- Confirm the issue and assign a severity within 5 business days.
- Release a fix for high/critical issues within 30 days.
- Credit you in the release notes (unless you prefer to remain anonymous).

## Threat Model

atemporal is a **client-side date/time library**. Its threat surface is
dominated by the parsing pipeline, which accepts arbitrary user input
(strings, numbers, Date objects, plain objects, Firebase Timestamps).

### In scope

- **ReDoS in format/parse regexes** (e.g. `customParseFormat`).
  - We deliberately keep regexes linear; no nested quantifiers.
  - Inputs are length-capped at the strategy level (default 4096 chars).
- **Prototype-pollution in object parsing** (e.g. `temporal-like` strategy).
  - We only read *known* keys (`year`, `month`, `day`, `hour`, `minute`,
    `second`, `millisecond`, `timeZone`, `calendar`); we never spread or
    assign to `Object.prototype`.
- **Cross-implementation `instanceof` confusion** (native vs polyfill).
  - The library always uses the central `temporal-api` re-export, which
    guarantees one implementation per process. Cross-implementation
    `.since()` failures are mitigated by routing everything through
    `getCachedTemporalAPI()`.
- **Numeric edge cases** (negative epoch, NaN, Infinity, very large BigInt).
  - `Number.isFinite()` and `Number.isInteger()` guards are applied at
    every numeric parse path.
- **Error-message leaks** that could expose internal state.
  - `debugLog` never logs raw `Error` objects or stack traces.
  - User-facing error messages are static and audited.

### Out of scope

- Bugs in the `@js-temporal/polyfill` dependency itself. Please report
  those upstream at <https://github.com/tc39/proposal-temporal/issues>.
- Vulnerabilities in user code that passes already-malicious values
  (e.g. an attacker controlling both key and value of a Firebase
  Timestamp).
- Denial of service through deliberate resource exhaustion (e.g. parsing
  a million strings in a tight loop). This is an *operational* concern.

## Security Best Practices for Consumers

1. **Validate at the boundary.** If the input comes from an untrusted
   client (HTTP body, URL parameter, message queue), validate its *shape*
   with a schema validator (Zod, Valibot, io-ts) **before** passing it
   to `atemporal(input)`. This is a defense-in-depth check; atemporal's
   own validation is the second line.
2. **Use `atemporal.try(input)` in user-facing code paths** to avoid
   throwing on adversarial input. The regular `atemporal(input)` throws
   `InvalidDateError` on bad input.
3. **Set explicit time zones.** Avoid relying on the default
   `setDefaultTimeZone()` for security-sensitive calculations
   (token expiry, audit log timestamps). Always pass the time zone
   explicitly.
4. **Pin atemporal versions** in production. Use exact versions
   (`1.3.7`) or tight ranges (`~1.3.7`) — never caret ranges for
   security-critical workloads.
5. **Audit custom plugins.** Plugins run with full access to the
   `TemporalWrapper` class. Only install plugins from sources you
   trust. Prefer the official 8 plugins maintained in this repository.
6. **Run `npm audit` in CI.** Although atemporal itself has minimal
   dependencies, downstream consumers should still audit their full
   tree.

## Dependencies

atemporal has exactly **one runtime dependency**:

- [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill) (peer, optional)

No transitive runtime dependencies are bundled. The dev dependency tree
includes Jest, TypeScript, tsup, and VitePress — these are not shipped
to consumers.

## Signed Releases

Starting with v1.4.0, release tarballs are published with
[`npm publish --provenance`](https://docs.npmjs.com/generating-provenance-statements),
which provides SLSA build-level provenance attestation verifiable via
[Sigstore](https://www.sigstore.dev/). Every GitHub Release also ships:

- an **SPDX SBOM** generated via `npm sbom`, and
- a **CycloneDX SBOM** generated via `anchore/sbom-action`.

These let consumers answer "what exactly is in this tarball?" without
having to ask us.

## Continuous Security

The CI pipeline enforces the following security invariants on every push
to `main` and every pull request:

| Check | Tool | Severity | Configured at |
| --- | --- | --- | --- |
| Secret scanning | `gitleaks` | Fails on any committed secret | `.github/workflows/ci.yml` |
| Dependency CVEs | `npm audit --audit-level=high` + `osv-scanner` | Fails on high or critical | `.github/workflows/ci.yml` |
| License compliance | `license-checker` + `scripts/check-licenses.js` | Fails on GPL/AGPL/SSPL/BUSL/Elastic or unknown | `.github/workflows/ci.yml` |
| Performance gate | `scripts/perf-gate.js` vs `benchmarks/baseline.json` | Fails on >25% regression on hot paths | `.github/workflows/ci.yml` |
| Doc link integrity | `lychee` (offline) | Fails on any broken internal link | `.github/workflows/ci.yml` |
| Coverage trend | Codecov | Informational; no PR gate | `.github/workflows/ci.yml` |
| Mutation score | Stryker | Informational; nightly trend | `.github/workflows/mutation.yml` |
| Auto dependency updates | Dependabot | Patch + minor PRs grouped | `.github/dependabot.yml` |

The rationale for each tool is documented in
[ADR 0007: Supply chain hardening](docs/adr/0007-supply-chain-hardening.md).

## Acknowledgements

We thank the following researchers for responsible disclosure:

*(none yet — be the first!)*

---

Last updated: 2026-06-03
