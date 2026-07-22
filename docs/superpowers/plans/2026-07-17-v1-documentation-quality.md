# Atemporal v1 Documentation and Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a compact operational LLM guide, a complete generated reference, and a behaviour-first test suite without lowering quality gates.

**Architecture:** `docs/` remains canonical. One generator emits two static assets from explicit source lists; tests regenerate them in a temporary directory. Contract suites replace coverage-oriented file names only after their public behaviour is preserved.

**Tech Stack:** Node.js, TypeScript, Jest 30, VitePress, pnpm 11.13.1.

## Global Constraints

- `docs/public/llms.txt` is generated and no larger than 16 KiB.
- `docs/public/llms-full.txt` is generated from documented public sources only.
- Both assets must be byte-identical to isolated generator output.
- Keep Jest global thresholds at statements 95, lines 95, branches 90, functions 90.
- Do not remove fuzz, property, performance, mutation, artifact, integration, or security suites.
- No consumer-facing doc may import from `atemporal/src/`.

---

### Task 1: Split concise and full LLM outputs

**Files:**
- Modify: `scripts/generate-llms-txt.js`
- Create: `docs/public/llms-full.txt`
- Modify: `scripts/__tests__/llms-documentation-contract.test.cjs`

**Interfaces:**
- Produces `docs/public/llms.txt` as concise operational text and `docs/public/llms-full.txt` as the curated complete reference.

- [ ] **Step 1: Extend the generator contract test.**

```js
const concise = fs.readFileSync(path.join(sourceDocs, "public", "llms.txt"), "utf8");
const full = fs.readFileSync(path.join(sourceDocs, "public", "llms-full.txt"), "utf8");
expect(Buffer.byteLength(concise)).toBeLessThanOrEqual(16 * 1024);
expect(concise).toContain("## Choose the public API");
expect(full).toContain("# Atemporal — complete LLM reference");
expect(full).toContain("Day.js compatibility matrix");
```

- [ ] **Step 2: Run the test to verify failure.**

Run: `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`

Expected: failure because `llms-full.txt` is absent and the concise guide exceeds its new design.

- [ ] **Step 3: Implement explicit dual-output generation.**

Refactor the generator into `buildConciseGuide()` and `buildFullGuide()`. The
concise builder contains fixed operational sections and links; it never appends
the source document bodies. The full builder uses the existing ordered `SECTIONS`
array after removing ADRs, security threat detail, plan/spec directories,
templates, reports, and generated outputs. Write both paths with a trailing
newline and log both line count and byte size.

- [ ] **Step 4: Regenerate and verify.**

Run: `node scripts/generate-llms-txt.js && pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`

Expected: the test passes and the concise asset is at most 16 KiB.

- [ ] **Step 5: Commit dual LLM generation.**

```bash
git add scripts/generate-llms-txt.js scripts/__tests__/llms-documentation-contract.test.cjs docs/public/llms.txt docs/public/llms-full.txt
git commit -m "docs: split concise and full LLM guides"
```

### Task 2: Add the API selection table and public navigation

**Files:**
- Create: `docs/guide/choosing-an-api.md`
- Modify: `docs/.vitepress/config.mts`
- Modify: `docs/guide/index.md`
- Modify: `scripts/generate-llms-txt.js`
- Test: `scripts/__tests__/llms-documentation-contract.test.cjs`

**Interfaces:**
- Consumes v1.5 `parse`, `tryParse`, diagnostics, and plugin APIs.
- Produces a table with `case`, `public API`, `timezone rule`, and `failure result` columns.

- [ ] **Step 1: Write table assertions.**

```js
for (const value of [
  "Event instant", "Local civil date-time", "Date-only value",
  "Trusted boundary parsing", "Compatibility parsing", "Plugin extension",
]) expect(concise).toContain(value);
expect(concise).toContain("atemporal.parse");
expect(concise).toContain("atemporal(input)");
```

- [ ] **Step 2: Run the generator test to verify failure.**

Run: `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`

Expected: missing API selection values.

- [ ] **Step 3: Write the decision guide.**

Create a Markdown table with exactly these rows: event instant, scheduled event,
local civil date-time, date-only value, trusted boundary parsing, compatibility
parsing, formatting, duration, range, official plugin, and third-party extension.
For each row give only a public API, zone requirement, and error result. Add the
guide to the VitePress Guide sidebar and include its body in the full guide;
copy its short table into the concise guide.

- [ ] **Step 4: Build the site and check links.**

Run: `pnpm run docs:build && git restore --worktree docs/.vitepress/dist`

Expected: VitePress succeeds and both `/atemporal/llms.txt` and
`/atemporal/llms-full.txt` remain static assets.

- [ ] **Step 5: Commit navigation and decision guide.**

```bash
git add docs/guide/choosing-an-api.md docs/guide/index.md docs/.vitepress/config.mts scripts/generate-llms-txt.js scripts/__tests__/llms-documentation-contract.test.cjs docs/public/llms.txt docs/public/llms-full.txt
git commit -m "docs: add API selection guide for agents"
```

### Task 3: Remove unsupported deep imports from consumer docs

**Files:**
- Modify: `docs/guide/performance.md`
- Modify: `docs/api/index.md`
- Test: `scripts/__tests__/llms-documentation-contract.test.cjs`

- [ ] **Step 1: Write a recursive documentation policy test.**

```js
for (const file of markdownFilesUnder(path.join(projectRoot, "docs"))) {
  if (!file.includes(`${path.sep}superpowers${path.sep}`)) {
    expect(fs.readFileSync(file, "utf8")).not.toMatch(/atemporal\/src\//);
  }
}
```

- [ ] **Step 2: Run the policy test to verify failure.**

Run: `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`

Expected: failure naming `docs/guide/performance.md`.

- [ ] **Step 3: Replace every internal example.**

Rewrite performance examples with `atemporal.getDiagnostics()`,
`atemporal.prewarm()`, `atemporal.clearCaches()`, and
`atemporal.resetDiagnostics()`. State that cache tuning and parser strategy
internals are intentionally not public API. Link to the public parsing guide,
not source files.

- [ ] **Step 4: Verify policy and rendered docs.**

Run: `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand && pnpm run docs:build && git restore --worktree docs/.vitepress/dist`

Expected: policy and VitePress both pass.

- [ ] **Step 5: Commit supported documentation.**

```bash
git add docs/guide/performance.md docs/api/index.md scripts/__tests__/llms-documentation-contract.test.cjs docs/public/llms.txt docs/public/llms-full.txt
git commit -m "docs: remove internal imports from consumer guidance"
```

### Task 4: Consolidate parsing and invalid-input contracts

**Files:**
- Create: `src/__tests__/contracts/parsing.contract.test.ts`
- Create: `src/__tests__/contracts/invalid-input.contract.test.ts`
- Modify: existing `src/__tests__/coverage-*.test.ts` and `src/__tests__/core/parsing/*coverage*.test.ts` only after migration.

**Interfaces:**
- Produces contract suites covering ISO parse, timestamp parse, object/array policy, invalid wrapper compatibility, strict parse error, and `tryParse` null result.

- [ ] **Step 1: Inventory each old assertion before moving it.**

Run: `rg -l 'describe\(|test\(|it\(' src/__tests__/coverage-*.test.ts src/__tests__/core/parsing/*coverage*.test.ts > /tmp/atemporal-parsing-coverage-tests.txt`

Expected: a review list; do not delete files in this step.

- [ ] **Step 2: Write behaviour contracts.**

```ts
test.each([
  ["2026-07-15T10:00:00Z", true],
  [Date.UTC(2026, 6, 15), true],
  ["not-a-date", false],
])("compatibility factory validity for %p is %p", (input, valid) => {
  expect(atemporal(input as never).isValid()).toBe(valid);
});
```

Add separate explicit assertions for object/array/Firebase input supported by the
published `DateInput` type. Do not assert line numbers, coverage percentages,
or private strategy names.

- [ ] **Step 3: Run new contracts first.**

Run: `pnpm exec jest src/__tests__/contracts/parsing.contract.test.ts src/__tests__/contracts/invalid-input.contract.test.ts --runInBand`

Expected: passing contracts before old test deletion begins.

- [ ] **Step 4: Remove only duplicated coverage assertions.**

For each assertion in `/tmp/atemporal-parsing-coverage-tests.txt`, retain it if
it tests a unique private failure mode required by the threat model; otherwise
delete it after a matching public contract assertion exists. Keep fuzz tests and
strategy unit tests intact. Rename any remaining coverage-only file to a domain
name.

- [ ] **Step 5: Verify coverage has not regressed.**

Run: `pnpm run test:ci --runInBand`

Expected: 95/95/90/90 global coverage thresholds pass.

- [ ] **Step 6: Commit parsing test consolidation.**

```bash
git add src/__tests__/contracts src/__tests__/coverage-*.test.ts src/__tests__/core/parsing
git commit -m "test: consolidate parsing behaviour contracts"
```

### Task 5: Consolidate formatting, plugin, and temporal-runtime contracts

**Files:**
- Create: `src/__tests__/contracts/formatting.contract.test.ts`
- Create: `src/__tests__/contracts/plugins.contract.test.ts`
- Create: `src/__tests__/contracts/temporal-runtime.contract.test.ts`
- Modify: coverage-named formatting/plugin/runtime tests after equivalent coverage exists.

- [ ] **Step 1: Add public-formatting contracts.**

```ts
test("formatting is immutable and locale-sensitive", () => {
  const value = atemporal("2026-07-15T10:00:00Z", "UTC");
  expect(value.format("YYYY-MM-DD")).toBe("2026-07-15");
  expect(value.locale("es-CR").format("MMMM")).not.toBe("");
  expect(value.format("YYYY-MM-DD")).toBe("2026-07-15");
});
```

- [ ] **Step 2: Add official and third-party plugin contracts.**

```ts
test("official and third-party inspection have separate contracts", async () => {
  await atemporal.lazyLoad("relativeTime");
  expect(atemporal.getLoadedPlugins()).toContain("relativeTime");
  expect(atemporal.getAppliedExtensions()).toEqual(expect.arrayContaining([
    { id: "relativeTime", kind: "official" },
  ]));
});
```

- [ ] **Step 3: Add Temporal implementation contract.**

```ts
test("runtime diagnostics name a supported implementation", () => {
  const info = atemporal.getTemporalInfo();
  expect(["native", "polyfill"]).toContain(info.version);
  expect(typeof info.isNative).toBe("boolean");
});
```

- [ ] **Step 4: Run contracts before deleting duplicated tests.**

Run: `pnpm exec jest src/__tests__/contracts/formatting.contract.test.ts src/__tests__/contracts/plugins.contract.test.ts src/__tests__/contracts/temporal-runtime.contract.test.ts --runInBand`

Expected: all new contracts pass.

- [ ] **Step 5: Migrate only duplicate coverage tests and run the quality gate.**

Run: `pnpm run test:ci --runInBand && pnpm run test:mutation`

Expected: coverage thresholds and configured Stryker mutation threshold pass.

- [ ] **Step 6: Commit remaining consolidation.**

```bash
git add src/__tests__/contracts src/__tests__
git commit -m "test: organize public behaviour contracts"
```

### Task 6: Validate and release v1.6 documentation quality

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/guide/contributing.md`

- [ ] **Step 1: Document generator ownership.**

State in the contribution guide that Markdown sources are edited directly,
`llms.txt` and `llms-full.txt` are regenerated with `node
scripts/generate-llms-txt.js`, and both contract tests must pass before review.

- [ ] **Step 2: Run the complete docs and package gate.**

Run: `pnpm run docs:build && git restore --worktree docs/.vitepress/dist && pnpm run build && pnpm run test:ci --runInBand && pnpm run fixtures:contract`

Expected: docs, package, tests, and packed consumer fixtures pass.

- [ ] **Step 3: Commit release notes.**

```bash
git add CHANGELOG.md docs/guide/contributing.md docs/public/llms.txt docs/public/llms-full.txt
git commit -m "chore: prepare v1.6 documentation quality release"
```
