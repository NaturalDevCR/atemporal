# ADR 0007: Supply chain hardening

**Status:** Accepted
**Date:** 2026-06-03
**Authors:** @NaturalDevCR/devx-team, @NaturalDevCR/security-team

## Context

Until now, atemporal's CI was structurally sound for **functional** quality
(3042 tests, strict TypeScript, bundle smoke, threat model, ADRs) but had
several gaps that any enterprise security review will flag:

1. **No automated secret scanning.** Committed secrets would only be caught
   after push, if at all.
2. **Soft `npm audit`.** The `audit` job ran with `continue-on-error: true`,
   so high-severity CVEs in dependencies did not block merges.
3. **No SBOM / no provenance.** Downstream consumers (regulated industries,
   supply-chain audits) had no machine-readable inventory of the build and
   no SLSA attestation for the published tarball.
4. **No mutation testing.** 3042 tests with green coverage is a *coverage*
   signal, not a *strength* signal. A test suite that survives 60% of
   mutants is much weaker than one that survives 85%, even at 100% line
   coverage.
5. **No performance gate.** The reproducible benchmark existed, but it was
   manually invoked. A 3× regression on `add()` would merge silently.
6. **Manual `standard-version` releases.** Versioning was a local CLI step,
   error-prone, and never produced provenance.
7. **No license compliance gate.** A consumer pull-request that transitively
   pulls in a GPL/AGPL dependency would not be caught.
8. **No doc link check.** VitePress builds would silently produce pages
   with broken cross-links and 404 references.

## Decision

We are promoting all eight of the above gaps from "recommendation" to
**enforced CI invariants**, and we are doing so with the smallest set of
mature, GitHub-native tools that satisfy each requirement:

| Gap | Tool | Where |
| --- | --- | --- |
| Secret scanning | `gitleaks/gitleaks-action@v3` | `.github/workflows/ci.yml` (`gitleaks` job) |
| Dependency audit | `pnpm audit --audit-level=high` + `google/osv-scanner-action@v2.3.8` | `.github/workflows/ci.yml` (`audit` job) |
| SBOM | `pnpm sbom` (SPDX + CycloneDX) | `.github/workflows/release.yml` |
| Provenance | npm trusted publishing (OIDC) | `.github/workflows/release.yml` |
| Mutation testing | `@stryker-mutator/*` | `.github/workflows/mutation.yml` (push dry-run + nightly/on-demand advisory) |
| Performance gate | `scripts/perf-gate.js` vs `benchmarks/baseline.json` | Weekly integration validation and release validation |
| Auto versioning | `googleapis/release-please-action@v5` | `.github/workflows/release.yml` |
| License compliance | `scripts/check-licenses.js` | `.github/workflows/ci.yml` (`license-check` job) |
| Doc link check | `lycheeverse/lychee-action@v2` | `.github/workflows/ci.yml` (`doc-links` job) |
| Auto dependency updates | `.github/dependabot.yml` (Dependabot) | GitHub-native |
| Coverage trend | `codecov/codecov-action@v6` | `.github/workflows/ci.yml` (`coverage` job) |

### Why these specific tools

- **gitleaks over GitHub native secret scanning.** Gitleaks is a strict
  superset of GitHub's secret scanner, has zero false-positive tooling
  we'd have to manage, and integrates with SARIF for the Security tab.
- **`pnpm audit --audit-level=high` + OSV-Scanner.** pnpm reads the committed
  root lockfile; OSV-Scanner is registry-agnostic and surfaces
  GHSA-advisories not yet in npm's mirror. Both are kept; one is the
  primary gate, the other is the cross-check.
- **SPDX + CycloneDX.** SPDX is the de-facto SBOM standard for the Node.js
  ecosystem; CycloneDX is what most enterprise SCA tools consume. We emit
  both with `pnpm sbom` and attach both files to the GitHub Release.
- **Stryker for mutation.** Stryker integrates with Jest, supports
  TypeScript projects, and is actively maintained. We do not run the
  full mutation suite on every PR or push (too slow for a blocking CI
  path). Pushes to `main` run `--dryRunOnly` to catch configuration and
  test-discovery regressions. Nightly/on-demand runs attempt the full
  suite as an advisory signal, upload reports when available, and keep
  `thresholds: { high: 80, low: 70, break: 60 }` for score visibility.
- **`release-please` over `standard-version`.** `standard-version` requires
  a human to run the CLI and push tags. `release-please` turns the whole
  release flow into a PR review — version bump, CHANGELOG diff, and
  semantic analysis are all visible in the PR before any tag is created.
  It also pairs naturally with npm trusted publishing, which validates the
  GitHub Actions OIDC identity and records provenance without a long-lived
  npm token.
- **Dependabot over Renovate.** Dependabot is GitHub-native, requires no
  PAT or self-hosted runner, and groups related updates so we get one PR
  for `@js-temporal/polyfill` updates, not five. Renovate would buy us
  nothing we don't already get for free here.
- **Codecov over SonarCloud (for now).** Codecov's signal (coverage diff
  per PR + historical trend) is what the team currently consumes.
  SonarCloud would add code smell / duplication analysis, which is out
  of scope for the supply-chain hardening pass and is therefore deferred
  to a future ADR.
- **lychee over `markdown-link-check`.** lychee runs faster, supports
  the `--offline` mode we need (no network calls in CI), and is
  actively maintained. `markdown-link-check` is unmaintained since 2023.
- **Custom `perf-gate.js` over `bench-jest` / `vitest bench`.** Our
  benchmark is intentionally framework-agnostic (Node `performance.now`
  only) so it can compare to a *committed baseline* across CI runners
  and Node versions without skewing the metric.

### Tolerance and gates

- **Audit:** fails on `high` or `critical`. `moderate` and `low` are
  reported but do not block. This matches the policy in
  `SECURITY.md` ("Run `npm audit` in CI").
- **Performance gate:** 25% regression on any gated hot path fails weekly
  integration validation and release validation. It is deliberately not a PR
  CI gate. The tolerance is a property of the gate, not the baseline.
  To change it, edit `scripts/perf-gate.js` (deliberate, reviewed).
- **License gate:** any forbidden license (GPL family, AGPL, SSPL,
  BUSL, Elastic, Commons-Clause) fails the build. Unknown licenses
  fail for production deps and warn for dev deps (toggle via
  `CHECK_DEV_LICENSES=true`).
- **Mutation score:** threshold 60% (break). Scores below this are
  surfaced in the artifact and the weekly summary but do not block
  PRs — the historical signal is what matters.

## Consequences

### Easier

- Downstream consumers can `npm install atemporal` and immediately run
  `npm sbom` against the published tarball to see exactly what shipped.
- Security review questionnaires ("do you have secret scanning?" "do you
  sign your releases?" "do you gate on CVE severity?") can be answered
  with a link to `.github/workflows/` and the `SECURITY.md` provenance
  section.
- Releases are boring and PR-shaped; the only manual step is "merge the
  Release PR".
- Performance regressions are caught by weekly integration validation and
  release validation, rather than discovered in a release retrospective.

### Harder

- **Scheduled and release validation minutes go up.** The extended fixture,
  size, and performance gates run weekly and again before release. PR CI
  remains focused on the smaller contractual matrix.
- **`release-please` requires Conventional Commits discipline.** Commits
  like `wip` or `fix stuff` will be classified as `chore: fix stuff`
  and will not trigger a release. The team is briefed; the
  `CONTRIBUTING.md` workflow already requires Conventional Commits.
- **Stryker reports are large and slow to generate.** Full reports are
  uploaded as artifacts with a 30-day retention when the nightly/advisory
  run completes; they are NOT committed to the repo. Push CI uses a
  Stryker dry-run only.
- **Dependabot needs a labels workflow.** The `dependencies`,
  `automated`, `ci` labels must exist (they already do, see
  `.github/ISSUE_TEMPLATE/config.yml` — verified, no action needed).
- **`pnpm audit` may flag transitive dev deps.** We pass
  `--ignore-scripts` to the install in the audit job to avoid
  postinstall side effects from flagged packages, but the audit
  itself is run against the full lockfile. False positives in dev
  tooling must be addressed by either upgrading or pinning away.

## Alternatives considered

1. **Renovate instead of Dependabot.** Rejected: requires a PAT,
   no GitHub-native grouping, and the team already knows Dependabot's
   PR model. Future migration is a config-file swap, not a process
   change.
2. **SonarCloud for code quality + coverage.** Deferred. SonarCloud
   overlaps with Codecov on coverage and adds value on smell / dup
   detection. We are not paying for that signal yet; a follow-up ADR
   will revisit when the team has bandwidth to act on Sonar findings.
3. **Custom mutation test harness.** Rejected. Stryker already
   covers TS + Jest, with a maintained set of mutators. Writing our
   own would be 10× the work and we'd reinvent the score model.
4. **Sigstore `cosign` keyless signing of the tarball.** Considered.
   `npm publish --provenance` already does this for npm-side
   verification, and the SLSA build-level attestation is the
   enterprise-recognized equivalent. `cosign` is the right tool if
   we later publish to an internal registry.
5. **`bench-jest` / Vitest's `bench()` API.** Rejected. They tie the
   benchmark to a test runner, which makes it harder to compare
   against a fixed baseline. Node's `performance.now` is the smallest
   possible surface area.

## References

- `SECURITY.md` — Threat model + signed releases
- `docs/adr/0004-error-codes.md` — Why we treat the error code list as
  a public contract (mirrors how we treat the SBOM as a public contract)
- `docs/adr/0006-no-opentelemetry-dep.md` — The "smallest possible
  surface" argument extends to our supply chain tooling
- <https://docs.npmjs.com/generating-provenance-statements>
- <https://github.com/googleapis/release-please>
- <https://github.com/stryker-mutator/stryker-js>
- <https://github.com/gitleaks/gitleaks>
- <https://github.com/lycheeverse/lychee>

---

Last updated: 2026-06-03
