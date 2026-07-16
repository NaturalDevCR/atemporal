# Contributing

Thank you for your interest in contributing to Atemporal!

## Maintainer setup

Repository development uses the pinned pnpm version through Corepack:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run test
```

Published consumers can continue to use either `npm install atemporal` or
`pnpm add atemporal`. Releases are published by `release.yml` through npm
trusted publishing, never through a stored npm token.

## How to Contribute

- **Report Bugs**: Use GitHub Issues to report bugs.
- **Submit Pull Requests**: Ensure your code follows the existing style and includes tests.
- **Improve Documentation**: We welcome improvements to this documentation.

## Validation and release integrity

Compatibility guaranteed: every pull request continuously tests installation, native imports, TypeScript resolution, core operations, formatting, and official plugin loading from the packed npm artifact.

Compatibility additionally validated: scheduled and release fixtures verify production Vite, Webpack, and Next.js SSR builds.

Pull requests enforce coverage thresholds of 95% statements, 95% lines, 90%
branches, and 90% functions. They also block on the contractual core-distribution
and canonical application-bundle budgets. Packed-tarball and other
application-bundle values in the size report are diagnostic measurements, not
additional release budgets.

The weekly Ubuntu 24.04/x64 Node 24.12.0 validation job runs the performance
gate. When a maintainer needs a new baseline, the manual
`hosted-baseline-capture.yml` workflow creates and uploads a proposed schema
baseline on that same host for human review. No workflow automatically writes
or commits `benchmarks/baseline.json`; missing per-path medians deliberately
make the scheduled and release gates fail until that reviewed baseline is
committed.

Release validation repeats the contract, extended-fixture, size, and performance
gates and retains its evidence for the highest supported artifact retention
period. The publish job downloads and publishes that validated tarball exactly;
it does not build or pack a replacement.

## Code of Conduct

As a contributor, you are expected to follow our [Code of Conduct](./code-of-conduct).
