# pnpm-primary CI and trusted npm publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make pnpm the root and CI package manager, preserve npm-consumer tarball contracts, publish through npm OIDC, and resolve dependency PRs only after their own gates pass.

**Architecture:** Corepack activates pinned pnpm 11.13.1 for repository installs, scripts, and CI caches. npm remains scoped to registry operations and npm-consumer fixtures. A Node 24 OIDC publish job releases only the tarball validated by the release workflow.

**Tech Stack:** pnpm 11.13.1, Corepack, Node 18/20/22/24, npm CLI 11, GitHub Actions OIDC, Jest 30.

## Global Constraints

- Root development uses `pnpm install --frozen-lockfile`, `"packageManager": "pnpm@11.13.1"`, and `pnpm-lock.yaml`.
- Root `package-lock.json` is removed. npm lockfiles inside contract fixtures remain because they intentionally validate npm consumers.
- `npm pack`, `npm view`, and `npm publish` are allowed only as npm-registry operations.
- Publishing uses `release.yml`, GitHub environment `npm`, Node 24, and `id-token: write`; no `NPM_TOKEN` or `NODE_AUTH_TOKEN` fallback exists.
- Merge a Dependabot update only after it is current with main and passes its checks; do not batch major changes.
- Do not merge release PR #23 until its unjustified 2.0.0 version is corrected.

---

### Task 1: Pin pnpm and generate the root lockfile

**Files:**
- Create: `pnpm-lock.yaml`, `scripts/__tests__/package-manager-contract.test.cjs`
- Modify: `package.json`, `.gitignore`
- Delete: `package-lock.json`

**Interfaces:** Produces the pinned root package-manager policy used by every workflow.

- [ ] **Step 1: Write the failing root package-manager test**

```js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');

test('root development is pinned to pnpm', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  expect(manifest.packageManager).toBe('pnpm@11.13.1');
  expect(fs.existsSync(path.join(root, 'pnpm-lock.yaml'))).toBe(true);
  expect(fs.existsSync(path.join(root, 'package-lock.json'))).toBe(false);
});
```

- [ ] **Step 2: Run the test before implementation**

Run: `npx jest scripts/__tests__/package-manager-contract.test.cjs --runInBand`

Expected: FAIL because npm is currently the root manager.

- [ ] **Step 3: Add the exact manifest property and lockfile**

Add `"packageManager": "pnpm@11.13.1"` next to the package version, then run `corepack enable`, `corepack prepare pnpm@11.13.1 --activate`, and `pnpm install --lockfile-only`. Remove only root `package-lock.json` and add `.pnpm-store/` to `.gitignore` if required.

- [ ] **Step 4: Verify and commit**

Run: `pnpm install --frozen-lockfile && pnpm exec jest scripts/__tests__/package-manager-contract.test.cjs --runInBand`

Expected: PASS without changing `pnpm-lock.yaml`.

Commit: `git add package.json pnpm-lock.yaml .gitignore scripts/__tests__/package-manager-contract.test.cjs && git rm package-lock.json && git commit -m "build: make pnpm the root package manager"`

### Task 2: Convert repository CI and canonical bundle installation to pnpm

**Files:**
- Modify: `.github/workflows/ci.yml`, `.github/workflows/integration.yml`, `.github/workflows/hosted-baseline-capture.yml`, `.github/workflows/mutation.yml`, `.github/workflows/deploy-docs.yml`
- Modify: `integration/canonical-bundle/package.json`, `scripts/measure-release-artifact.cjs`
- Create: `integration/canonical-bundle/pnpm-lock.yaml`
- Delete: `integration/canonical-bundle/package-lock.json`
- Modify: `scripts/__tests__/workflow-artifact-flow.test.cjs`, `scripts/__tests__/measure-release-artifact.test.cjs`

**Interfaces:** Consumes Task 1’s pnpm policy and preserves the exact tarball/size-report interfaces.

- [ ] **Step 1: Add failing workflow and installer assertions**

For each listed workflow, assert the source contains `corepack enable`, `cache: pnpm`, and `pnpm install --frozen-lockfile`, and does not match `^\s*- run: npm ci`.

Add this canonical-installer assertion:

```js
expect(source).toContain("['install', '--frozen-lockfile', '--ignore-scripts']");
expect(source).not.toContain("['ci', '--ignore-scripts']");
```

- [ ] **Step 2: Run focused tests before implementation**

Run: `pnpm exec jest scripts/__tests__/workflow-artifact-flow.test.cjs scripts/__tests__/measure-release-artifact.test.cjs --runInBand`

Expected: FAIL because root jobs still use npm installation.

- [ ] **Step 3: Update every repository setup block**

Use this exact YAML pattern after checkout in every job that installs root dependencies:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION_DEFAULT }}
    cache: pnpm
- run: corepack enable
- run: pnpm install --frozen-lockfile
```

Replace root `npm run` with `pnpm run`, `npx` with `pnpm exec`, and `npm audit` with `pnpm audit`. Keep `npm pack` inside its artifact script and keep npm installation inside contract fixtures.

Generate the canonical fixture pnpm lock. Change `ensureCanonicalDependencies()` to spawn `pnpm install --frozen-lockfile --ignore-scripts` in `integration/canonical-bundle`.

- [ ] **Step 4: Verify and commit**

Run: `pnpm exec jest scripts/__tests__/workflow-artifact-flow.test.cjs scripts/__tests__/measure-release-artifact.test.cjs --runInBand && pnpm run build && pnpm run pack:artifact && pnpm run size`

Expected: PASS and all six size rows pass.

Commit: `git add .github/workflows integration/canonical-bundle scripts/measure-release-artifact.cjs scripts/__tests__ && git commit -m "ci: use pnpm for repository validation"`

### Task 3: Remove token publishing and use npm OIDC for the exact artifact

**Files:**
- Modify: `.github/workflows/release.yml`, `scripts/__tests__/workflow-artifact-flow.test.cjs`

**Interfaces:** Consumes the npm trusted publisher configured for `NaturalDevCR/atemporal`, `release.yml`, and environment `npm`.

- [ ] **Step 1: Add a failing OIDC publish-job test**

```js
expect(publish).toContain("node-version: '24'");
expect(publish).toContain('environment: npm');
expect(release).toContain('id-token: write');
expect(publish).not.toContain('NODE_AUTH_TOKEN');
expect(publish).not.toContain('NPM_TOKEN');
expect(publish).toContain('npm publish "$(node -p "require(\'./artifacts/package-artifact.json\').path")" --access public --tag latest');
```

- [ ] **Step 2: Confirm the test fails**

Run: `pnpm exec jest scripts/__tests__/workflow-artifact-flow.test.cjs --runInBand`

Expected: FAIL because the current job uses Node 20 and a token fallback.

- [ ] **Step 3: Implement tokenless publication**

Use Corepack/pnpm commands in `release-validation`, retaining Node 20.19.0 for the approved performance baseline. In `publish-npm`, configure Node 24 and the npm registry URL. Delete the whole `NODE_AUTH_TOKEN` environment block and its empty-token check. Retain artifact download, metadata validation, published-version guard, workflow `id-token: write`, and environment `npm`. Publish exactly:

```bash
npm publish "$(node -p "require('./artifacts/package-artifact.json').path")" --access public --tag latest
```

- [ ] **Step 4: Verify and commit**

Run: `node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/release.yml','utf8'))" && pnpm exec jest scripts/__tests__/workflow-artifact-flow.test.cjs --runInBand`

Expected: PASS; no token reference remains in the publish job.

Commit: `git add .github/workflows/release.yml scripts/__tests__/workflow-artifact-flow.test.cjs && git commit -m "fix: publish validated releases through npm oidc"`

### Task 4: Make documentation pnpm-first and verify every contract

**Files:**
- Modify: `README.md`, `CONTRIBUTING.md`, `docs/guide/contributing.md`, `docs/adr/0007-supply-chain-hardening.md`, `docs/public/llms.txt`
- Create: `scripts/__tests__/pnpm-documentation.test.cjs`

**Interfaces:** Documents pnpm for maintainers while retaining npm and pnpm installation examples for users.

- [ ] **Step 1: Write a failing documentation contract**

```js
test('contributor guidance is pnpm-first and tokenless', () => {
  const text = fs.readFileSync(path.join(root, 'CONTRIBUTING.md'), 'utf8');
  expect(text).toContain('pnpm install --frozen-lockfile');
  expect(text).toContain('pnpm run test');
  expect(text).toContain('trusted publishing');
  expect(text).not.toContain('NPM_TOKEN');
});
```

- [ ] **Step 2: Confirm the test fails**

Run: `pnpm exec jest scripts/__tests__/pnpm-documentation.test.cjs --runInBand`

Expected: FAIL because npm is currently primary in contributor guidance.

- [ ] **Step 3: Update only maintainer guidance**

Use `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm run test`, and `pnpm run build` for repository setup. Keep both `pnpm add atemporal` and `npm install atemporal` for consumers. State that publishing is trusted OIDC through `release.yml`, environment `npm`, with no token. Regenerate `docs/public/llms.txt` with `node scripts/generate-llms-txt.js`; do not commit VitePress output.

- [ ] **Step 4: Run the full green sequence and commit**

Run: `pnpm install --frozen-lockfile && pnpm run build && pnpm run test:ci -- --runInBand && pnpm run pack:artifact && pnpm run fixtures:contract && pnpm run fixtures:extended && pnpm run size && pnpm exec tsc --noEmit && pnpm exec jest scripts/__tests__/package-manager-contract.test.cjs scripts/__tests__/workflow-artifact-flow.test.cjs scripts/__tests__/pnpm-documentation.test.cjs --runInBand && node scripts/perf-gate.js benchmarks/baseline.json benchmarks/baseline.json && git diff --check`

Expected: every command passes; all six budgets pass.

Commit: `git add README.md CONTRIBUTING.md docs/guide/contributing.md docs/adr/0007-supply-chain-hardening.md docs/public/llms.txt scripts/__tests__/pnpm-documentation.test.cjs && git commit -m "docs: make pnpm and trusted publishing primary"`

### Task 5: Remediate all open Dependabot alerts without weakening fixtures

**Files:**
- Modify: `pnpm-lock.yaml` when the root advisory is resolved.
- Modify: `integration/extended/nextjs/package-lock.json` when the PostCSS advisory is resolved.
- Modify: `package.json` only if an exact `overrides` entry is necessary and supported by the resolved graph.
- Test: `scripts/__tests__/package-manager-contract.test.cjs`, packed artifact contracts, extended fixtures, and `pnpm audit --audit-level=high`.

**Interfaces:** Consumes Dependabot alerts #40 (`@babel/core`, low, development), #42 (`js-yaml`, moderate, development), and #43 (`postcss`, moderate, Next fixture). Produces locks whose advisory paths are resolved while the fixture still uses its intended package manager.

- [ ] **Step 1: Capture the authoritative advisory chains**

Run: `gh api --paginate repos/NaturalDevCR/atemporal/dependabot/alerts --jq '.[] | select(.state == "open") | {number,dependency:.dependency.package.name,manifest_path,scope,severity:.security_advisory.severity,ghsa:.security_advisory.ghsa_id}'`

Expected: exactly three open rows matching alerts #40, #42, and #43, including the manifest path from the screenshot.

- [ ] **Step 2: Prove each vulnerable dependency path before changing it**

Run: `pnpm why @babel/core && pnpm why js-yaml && npm --prefix integration/extended/nextjs ls postcss --all`

Expected: root paths explain `@babel/core` and `js-yaml`; the Next fixture path explains PostCSS. Do not use an override until the parent path is known.

- [ ] **Step 3: Apply the narrowest patched resolution**

Regenerate the root lock with `pnpm update @babel/core js-yaml --latest` only if the parent semver ranges permit the patched versions. Regenerate the Next fixture lock with `npm --prefix integration/extended/nextjs update postcss --package-lock-only --ignore-scripts`. If a parent range blocks the patched version, update that direct parent or add a documented root pnpm override with the exact non-vulnerable version; never edit integrity hashes manually.

- [ ] **Step 4: Verify the security and compatibility result**

Run: `pnpm install --frozen-lockfile && pnpm audit --audit-level=high && npm --prefix integration/extended/nextjs ci --ignore-scripts && npm --prefix integration/extended/nextjs audit --audit-level=high && pnpm run pack:artifact && pnpm run fixtures:contract && pnpm run fixtures:extended`

Expected: no open alert dependency remains in the affected lockfiles and all tarball/Next production contracts pass.

- [ ] **Step 5: Commit alert remediation separately**

Commit: `git add package.json pnpm-lock.yaml integration/extended/nextjs/package-lock.json && git commit -m "fix: resolve open dependency advisories"`

### Task 6: Triage, test, and resolve all open PRs

**Files:**
- Verify: PRs #7, #9, #10, #11, #13, #15, #16, #17, #21, #22, #23
- Modify only when an update demonstrably requires a compatibility fix.

**Interfaces:** Consumes green pnpm CI and produces individually validated dependency merges plus one correct release PR.

- [ ] **Step 1: Record the complete PR inventory and classification**

Run: `gh pr list --state open --limit 100 --json number,title,author,headRefName,url` and `gh pr view <pr> --json title,mergeable,mergeStateStatus,statusCheckRollup,files,url` for each PR.

Classify #7, #9, #13, #16, #17, and #22 as patch/minor candidates; #10 (actions group), #11 (TypeScript 6), #15 (Stryker group), and #21 (fast-check 4) as independent major/group reviews; #23 as a release-please anomaly.

- [ ] **Step 2: Rebase stale candidates and merge green patch/minor changes one at a time**

For a stale Dependabot PR run `gh pr comment <pr> --body '@dependabot rebase'`, then `gh pr checks <pr> --watch --interval 10`. For a green candidate run `gh pr merge <pr> --merge --delete-branch`, then `git pull --ff-only origin main`, `pnpm install --frozen-lockfile`, `pnpm run test:ci -- --runInBand`, `pnpm run fixtures:contract`, and `pnpm run size`.

Expected: stop immediately on a failed check; no batch merge hides a regression.

- [ ] **Step 3: Test every major/grouped dependency in isolation**

For #10, #11, #15, and #21 run `git fetch origin <head-branch>`, `git switch --create codex/dependency-review-<pr> --track origin/<head-branch>`, `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm run test:ci -- --runInBand`, `pnpm run fixtures:contract`, `pnpm run fixtures:extended`, and `pnpm run size`.

Expected: merge only an independently green major update. If a source/configuration change is required, commit it on that PR branch, push it, and rerun checks; otherwise leave it open with a concrete review summary.

- [ ] **Step 4: Correct release-please before publication**

Run: `gh pr view 23 --json title,body,files,commits,url` and `npm view atemporal versions --json`.

Expected: do not merge #23 while it proposes an unjustified 2.0.0. Close or regenerate it only after pnpm/OIDC commits are on main and it proposes the next unpublished semantic version.

- [ ] **Step 5: Publish only a green generated release**

After merging the correct release PR, run `gh run list --workflow release.yml --branch main --limit 1 --json databaseId,status,conclusion,url`, `gh run watch <release-run-id> --exit-status`, and `npm view "atemporal@$(node -p "require('./package.json').version")" version dist.integrity`.

Expected: GitHub validates and OIDC-publishes the exact artifact; npm returns the published version and integrity.

- [ ] **Step 6: Finish on clean main**

Run: `git checkout main && git pull --ff-only origin main && git status -sb`

Expected: `## main...origin/main` with no changes.
