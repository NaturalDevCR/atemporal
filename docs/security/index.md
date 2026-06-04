# Security

Atemporal treats date/time correctness, parser stability, and predictable
error handling as part of the public security surface.

## What is covered

- Stable `ATEMPORAL_*` error codes for validation, logging, and i18n.
- Parser hardening for untrusted strings, numbers, objects, and Firebase
  timestamp shapes.
- CI gates for tests, fuzzing, secret scanning, license checks, npm audit,
  OSV-Scanner, docs links, bundle size, and performance regressions.
- Release artifacts published with npm provenance starting in v1.4.0.

## Reporting Vulnerabilities

Please report vulnerabilities privately through the repository's
[security policy](https://github.com/NaturalDevCR/atemporal/blob/main/SECURITY.md).

Do not open a public issue for a suspected vulnerability.

## Reference

- [Threat model](/security/threat-model)
- [Structured logging](/cookbook/logging)
- [ADR 0007: Supply chain hardening](/adr/0007-supply-chain-hardening)
