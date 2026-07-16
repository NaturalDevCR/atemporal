# LLM Documentation Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the generated LLM guide accurate for consumers and fail CI when its committed asset is stale.

**Architecture:** The curated generator remains the only writer of `docs/public/llms.txt`. Source guides hold long-form consumer facts; the generator owns the agent contract and method index. A Jest contract runs the generator in a temporary copy and compares output byte-for-byte.

**Tech Stack:** Node.js CommonJS generator, Jest 30, VitePress, pnpm 11.13.1.

## Global Constraints

- Describe only shipped public APIs.
- Prefer `pnpm add atemporal`, retaining npm and CommonJS consumer guidance.
- Call `@js-temporal/polyfill` a direct runtime dependency, not a bundled replacement.
- `lazyLoad` accepts official plugin names; `getLoadedPlugins()` reports official plugins only.
- Do not claim native Temporal for unvalidated runtimes.

---

### Task 1: Guard the generated asset

**Files:**

- Create: `scripts/__tests__/llms-documentation-contract.test.cjs`

- [ ] **Step 1: Write the failing test**

Create a temporary directory. Copy `docs/` and `scripts/generate-llms-txt.js` into it, overwrite its `docs/public/llms.txt` with a stale marker, run the copied generator with `spawnSync(process.execPath, ...)`, and assert that the marker disappears. Then compare the temporary generated result byte-for-byte with the repository asset.

- [ ] **Step 2: Verify RED**

Run `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`.

Expected: FAIL because the contract file does not exist.

- [ ] **Step 3: Implement the isolated contract**

Use `fs.mkdtempSync`, `fs.cpSync`, `spawnSync`, and `fs.rmSync` in `try/finally`. Assert the generator process exits with status 0. Do not write to the real checkout.

- [ ] **Step 4: Verify GREEN and commit**

Run `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`.

Expected: PASS; the test proves regeneration and current checked-in output.

Commit with `test: guard generated LLM documentation`.

### Task 2: Correct consumer guidance

**Files:**

- Modify: `scripts/generate-llms-txt.js`
- Modify: `docs/guide/getting-started.md`
- Modify: `docs/guide/core-concepts.md`
- Modify: `docs/plugins/index.md`
- Modify: `docs/api/index.md`
- Modify: `docs/guide/temporal-detection.md`
- Regenerate: `docs/public/llms.txt`
- Modify: `scripts/__tests__/llms-documentation-contract.test.cjs`

- [ ] **Step 1: Extend the contract with focused assertions**

Assert the generated guide contains `pnpm add atemporal`, the CommonJS default import, `lazyLoad("relativeTime")`, official-only loaded-plugin wording, and the Day.js/`Temporal.ZonedDateTime` compatibility boundary.

- [ ] **Step 2: Verify RED**

Run `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`.

Expected: FAIL on obsolete lazy-load wording and missing consumer contract.

- [ ] **Step 3: Apply minimal source corrections**

Add pnpm-first installation plus npm and CJS import snippets. Replace `lazyLoad({...})` with a named official plugin. State the official-only tracking rule, direct polyfill dependency, explicit time-zone rule, `Temporal.ZonedDateTime` representation, and limited Day.js compatibility. Correct factory signatures in the index. Use `getTemporalInfo()` rather than unverified native-version claims; state that Node 26 is the native path currently covered by CI.

- [ ] **Step 4: Regenerate and verify GREEN**

Run `node scripts/generate-llms-txt.js` and `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`.

Expected: regenerated asset and all focused assertions pass.

- [ ] **Step 5: Commit**

Commit the source docs, generator, generated asset, and contract test with `docs: harden LLM integration guidance`.

### Task 3: Run consumer-facing verification

**Files:**

- Verify: `README.md`, `docs/.vitepress/config.mts`, `package.json`, `docs/public/llms.txt`

- [ ] **Step 1: Build and test**

Run `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs scripts/__tests__/pnpm-documentation.test.cjs --runInBand` and `pnpm run docs:build`.

Expected: all checks pass. Restore only VitePress build-output artifacts if the build touches tracked `docs/.vitepress/dist` files.

- [ ] **Step 2: Verify clean diff**

Run `git diff --check` and `git status --short`.

Expected: no unintended generated build output or whitespace errors.
