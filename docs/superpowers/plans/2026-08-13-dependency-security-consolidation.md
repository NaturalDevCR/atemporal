# Dependency Security Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the seven open Dependabot updates and patch all known dependency alerts in the repository manifests.

**Architecture:** Keep the existing `codex/fix-ci` branch as the integration baseline. Update the pnpm workspace graph and independent npm fixture graphs separately, then validate both local dependency audits and the repository's build/test/integration contracts before publishing one PR.

**Tech Stack:** pnpm 11.13.1, npm lockfiles, TypeScript, Jest, Next.js/Vite/Webpack fixtures, GitHub Actions, Dependabot, OSV Scanner.

## Global Constraints

- Patched `js-yaml` must be at least `3.15.1`.
- `next` remains `16.2.11`; `fast-uri` remains `3.1.5`.
- `postcss` uses `8.5.26` wherever the repository's existing override policy applies.
- Apply `ts-jest@29.4.12`, `@types/node@26.1.2`, and `vue@3.5.41`.
- Apply `pnpm/action-setup@v6.0.10` and `google/osv-scanner-action@v2.5.0`.
- Do not change runtime source code or disable/suppress security scanning.
- Do not merge the consolidated PR into `main` automatically.

---

### Task 1: Record the implementation plan

**Files:**
- Create: `docs/superpowers/plans/2026-08-13-dependency-security-consolidation.md`

- [ ] **Step 1: Review the plan for complete file coverage**

Confirm that Tasks 2–5 cover the root workspace, all independent fixture lockfiles, workflows, Dependabot configuration, and remote publication checks.

- [ ] **Step 2: Commit the plan**

```bash
git add docs/superpowers/plans/2026-08-13-dependency-security-consolidation.md
git commit -m "docs(security): plan dependency updates"
```

### Task 2: Update the root dependency graph

**Files:**
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Current root dependency graph and security overrides.
- Produces: A frozen-installable workspace graph with patched transitive dependencies.

- [ ] **Step 1: Update direct dependency floors**

Set `ts-jest` to `^29.4.12`, `@types/node` to `^26.1.2`, and `vue` to `^3.5.41` in `package.json`.

- [ ] **Step 2: Update security overrides**

Set the workspace overrides for `js-yaml` to `3.15.1`, `postcss` to `8.5.26`, and retain the existing patched `fast-uri` override.

- [ ] **Step 3: Regenerate the pnpm lockfile**

Run:

```bash
pnpm install --lockfile-only
```

Expected: `pnpm-lock.yaml` records `js-yaml@3.15.1`, `postcss@8.5.26`, the requested direct dependency versions, and no stale vulnerable package entries.

- [ ] **Step 4: Verify the graph before continuing**

Run:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm why js-yaml
pnpm why postcss
pnpm audit --audit-level=high
```

Expected: frozen install succeeds, `js-yaml` resolves to `3.15.1`, `postcss` resolves to `8.5.26`, and high-severity pnpm audit exits 0.

### Task 3: Update independent integration fixtures

**Files:**
- Modify: `integration/extended/nextjs/package.json`
- Modify: `integration/extended/nextjs/package-lock.json`
- Modify: `integration/extended/vite/package.json`
- Modify: `integration/extended/vite/package-lock.json`
- Modify: `integration/extended/webpack/package.json`
- Modify: `integration/extended/webpack/package-lock.json`

**Interfaces:**
- Consumes: Each fixture's existing npm dependency graph.
- Produces: Independently reproducible fixture lockfiles with patched Next.js, PostCSS, Nanoid, and fast-uri versions.

- [ ] **Step 1: Align fixture manifest versions and overrides**

Keep Next.js at `16.2.11`; set fixture PostCSS overrides to `8.5.26`; keep Webpack's `fast-uri` override at `3.1.5`.

- [ ] **Step 2: Regenerate each npm lockfile**

Run from each fixture directory:

```bash
npm install --package-lock-only --ignore-scripts
```

Expected: the three package-lock files are internally consistent and contain the requested patched versions.

- [ ] **Step 3: Audit each fixture**

Run:

```bash
npm audit --package-lock-only --audit-level=high
```

from `integration/extended/nextjs`, `integration/extended/vite`, and `integration/extended/webpack`.

Expected: each command exits 0 with no high-severity advisory.

### Task 4: Update CI and Dependabot metadata

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy-docs.yml`
- Modify: `.github/workflows/hosted-baseline-capture.yml`
- Modify: `.github/workflows/integration.yml`
- Modify: `.github/workflows/mutation.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/dependabot.yml`

**Interfaces:**
- Consumes: Existing workflow jobs and Dependabot update groups.
- Produces: Current action versions and valid Dependabot labels.

- [ ] **Step 1: Apply action updates**

Replace every `pnpm/action-setup@v6.0.9` with `pnpm/action-setup@v6.0.10` and every `google/osv-scanner-action/osv-scanner-action@v2.3.8` with `@v2.5.0`.

- [ ] **Step 2: Remove invalid Dependabot labels**

Remove `automated` and `ci` from `.github/dependabot.yml`; retain `dependencies` on both update blocks.

- [ ] **Step 3: Validate workflow/config syntax and references**

Run:

```bash
rg -n 'pnpm/action-setup@v6\.0\.9|osv-scanner-action@v2\.3\.8|"automated"|"ci"' .github || true
git diff --check
```

Expected: no stale action or invalid label matches, and no whitespace errors.

### Task 5: Run full verification and publish one PR

**Files:**
- Verify: all files changed by Tasks 2–4.

**Interfaces:**
- Consumes: Consolidated dependency and workflow changes.
- Produces: A clean, verified branch and one GitHub pull request.

- [ ] **Step 1: Run repository verification**

Run the repository's typecheck, build, CI test suite, artifact contracts, and extended fixtures:

```bash
pnpm exec tsc --noEmit
pnpm run build
pnpm run test:ci
pnpm run pack:artifact
pnpm run fixtures:contract
pnpm run fixtures:extended
```

Expected: every command exits 0.

- [ ] **Step 2: Run complete dependency scans**

Run:

```bash
pnpm audit --audit-level=low
pnpm exec osv-scanner scan source -r . --config=osv-scanner.toml
```

Expected: no advisories remain in the root graph; if the local OSV binary is unavailable, use the repository's GitHub Action after publication and report that local limitation explicitly.

- [ ] **Step 3: Inspect the final diff and status**

Run:

```bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
```

Expected: only security/dependency documentation, manifests, lockfiles, workflows, and Dependabot metadata are changed; no unrelated files are modified.

- [ ] **Step 4: Commit the implementation**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml integration/extended .github
git commit -m "fix(security): consolidate dependency updates"
```

- [ ] **Step 5: Push and open the consolidated PR**

Push `codex/fix-ci` and open a non-draft PR to `main` with a body that lists the patched advisories, the superseded Dependabot PRs, and all local verification commands. Do not merge it.

- [ ] **Step 6: Wait for remote checks before closing superseded PRs**

Inspect the new PR checks. After all required checks pass, close PRs `42` through `48` with a note that the consolidated PR supersedes them. If any required check fails, keep the old PRs open and diagnose the failure before changing remote state.
