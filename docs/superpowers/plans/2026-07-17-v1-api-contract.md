# Atemporal v1 API Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver strict parsing, stable diagnostics, and third-party extension inspection while preserving the existing v1 factory and official-plugin behaviour.

**Architecture:** Keep the existing wrapper factory as the compatibility path. Add a thin public adapter in `src/index.ts` that maps small public option types to the existing parsing and cache engines; do not export those engines. Store extension metadata on functions with symbols, and keep official plugin discovery separate from all applied extensions.

**Tech Stack:** TypeScript, Jest 30, ts-jest, `@js-temporal/polyfill`, pnpm 11.13.1.

## Global Constraints

- Preserve `atemporal(input, timeZone?)`, `atemporal.try`, `extend`, `lazyLoad`, and `getLoadedPlugins()` behaviour exactly.
- `getLoadedPlugins()` remains official-plugin-only; never infer an ID from `Function.name`.
- `atemporal.parse()` is strict and throws `InvalidDateError`; `atemporal.tryParse()` returns `null` for every invalid user input.
- Default strict DST `disambiguation` and calendar `overflow` are both `"reject"`.
- Public diagnostics return snapshots, never engine or cache instances.
- Node 22, 24, and 26 packed-artifact contracts must remain green.
- No public documentation may import `atemporal/src/...`.

---

### Task 1: Establish public types and error semantics

**Files:**
- Modify: `src/types.ts`
- Modify: `src/errors.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/contracts/public-api.contract.test.ts`

**Interfaces:**
- Produces `AtemporalDisambiguation`, `AtemporalOverflow`, `ParseOptions`, `AppliedExtension`, and `AtemporalDiagnostics`.
- Produces `atemporal.parse`, `atemporal.tryParse`, `atemporal.getDiagnostics`, `atemporal.resetDiagnostics`, `atemporal.clearCaches`, `atemporal.prewarm`, and `atemporal.getAppliedExtensions` declarations on `AtemporalFactory`.

- [ ] **Step 1: Create the public API contract test.**

```ts
import atemporal, { type ParseOptions } from "atemporal";

test("strict public API exposes stable option values", () => {
  const options: ParseOptions = {
    timeZone: "America/New_York",
    disambiguation: "reject",
    overflow: "reject",
    preserveOriginalTimeZone: true,
  };

  const strictParse: (input: string, config?: ParseOptions) => unknown = atemporal.parse;
  const safeParse: (input: string, config?: ParseOptions) => unknown = atemporal.tryParse;

  expect(options.disambiguation).toBe("reject");
  expect(typeof strictParse).toBe("function");
  expect(typeof safeParse).toBe("function");
});
```

- [ ] **Step 2: Run the contract test to verify failure.**

Run: `pnpm exec jest src/__tests__/contracts/public-api.contract.test.ts --runInBand`

Expected: TypeScript compile failure because `ParseOptions`, `parse`, and `tryParse` do not exist.

- [ ] **Step 3: Add the complete public type declarations.**

Add the following exports to `src/types.ts` and all matching members to `AtemporalFactory`:

```ts
export type AtemporalDisambiguation = "compatible" | "earlier" | "later" | "reject";
export type AtemporalOverflow = "constrain" | "reject";

export interface ParseOptions {
  timeZone?: string;
  disambiguation?: AtemporalDisambiguation;
  overflow?: AtemporalOverflow;
  preserveOriginalTimeZone?: boolean;
}

export interface AppliedExtension {
  id: string | null;
  kind: "official" | "third-party";
}

export interface AtemporalDiagnostics {
  temporal: {
    isNative: boolean;
    environment: "browser" | "node" | "unknown";
    version: "native" | "polyfill";
  };
  caches: {
    parsing: Record<string, unknown>;
    formatting: Record<string, unknown>;
    diff: Record<string, unknown>;
  };
}
```

Add `parse`, `tryParse`, diagnostics, cache, prewarm, and extension method signatures to the existing `AtemporalFactory` interface. Re-export all new public types from `src/index.ts`. Do not add a new error class: use the existing `InvalidDateError` and export it through the existing error barrel.

- [ ] **Step 4: Run type and unit verification.**

Run: `pnpm exec jest src/__tests__/contracts/public-api.contract.test.ts --runInBand && pnpm run build`

Expected: one passing public-surface suite and a successful tsup build. Runtime
parsing behaviour is introduced and tested in Task 2.

- [ ] **Step 5: Commit the public surface.**

```bash
git add src/types.ts src/errors.ts src/index.ts src/__tests__/contracts/public-api.contract.test.ts
git commit -m "feat: declare strict parsing and diagnostics API"
```

### Task 2: Implement strict parsing and explicit DST policy

**Files:**
- Create: `src/core/parsing/public-parse.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/contracts/parsing.contract.test.ts`
- Test: `src/__tests__/contracts/public-api.contract.test.ts`

**Interfaces:**
- Consumes `DateInput`, `ParseOptions`, `InvalidDateError`, `TemporalUtils`, and `TemporalWrapper`.
- Produces `parseStrict(input, options): TemporalWrapper` and `tryParseStrict(input, options): TemporalWrapper | null`.

- [ ] **Step 1: Write strict DST and overflow tests.**

```ts
import atemporal, { InvalidDateError } from "atemporal";

const zone = "America/New_York";

test("rejects a spring-forward gap by default", () => {
  expect(() => atemporal.parse("2026-03-08T02:30:00", { timeZone: zone }))
    .toThrow(InvalidDateError);
});

test("requires an explicit policy for a fall-back overlap", () => {
  expect(() => atemporal.parse("2026-11-01T01:30:00", { timeZone: zone }))
    .toThrow(InvalidDateError);
  expect(atemporal.parse("2026-11-01T01:30:00", {
    timeZone: zone,
    disambiguation: "earlier",
  }).format("Z")).toBe("-04:00");
});

test("rejects invalid calendar components and tryParse never throws", () => {
  expect(() => atemporal.parse({ year: 2026, month: 2, day: 29 }, {
    timeZone: zone,
  })).toThrow(InvalidDateError);
  expect(atemporal.tryParse({ year: 2026, month: 2, day: 29 }, {
    timeZone: zone,
  })).toBeNull();
});
```

- [ ] **Step 2: Run the parsing contract to verify failure.**

Run: `pnpm exec jest src/__tests__/contracts/parsing.contract.test.ts --runInBand`

Expected: failure because strict options are ignored or the methods are absent.

- [ ] **Step 3: Implement the public parsing adapter.**

Create `src/core/parsing/public-parse.ts` with these rules:

```ts
export function parseStrict(input: DateInput, options: ParseOptions = {}): TemporalWrapper {
  const normalized = {
    timeZone: options.timeZone ?? TemporalUtils.defaultTimeZone,
    disambiguation: options.disambiguation ?? "reject",
    overflow: options.overflow ?? "reject",
    preserveOriginalTimeZone: options.preserveOriginalTimeZone ?? true,
    strict: true,
    validateInput: true,
    throwOnInvalid: true,
  } as const;
  // Delegate through the existing ParseEngine/TemporalUtils path, translating
  // all invalid user input to InvalidDateError and preserving typed RangeError
  // only when required by the existing public error contract.
}

export function tryParseStrict(input: DateInput, options: ParseOptions = {}): TemporalWrapper | null {
  try { return parseStrict(input, options); } catch { return null; }
}
```

Pass the normalized values to the existing parser and Temporal conversion calls;
do not duplicate parsing strategies. Wire `atemporal.parse` and
`atemporal.tryParse` to these functions in `src/index.ts`. Preserve an input's
existing zone unless `preserveOriginalTimeZone` is `false`.

- [ ] **Step 4: Run all parsing contracts.**

Run: `pnpm exec jest src/__tests__/contracts/parsing.contract.test.ts src/__tests__/atemporal.invalid.tests.ts src/__tests__/core/parsing/parse-engine.test.ts --runInBand`

Expected: all suites pass; the existing callable factory tests remain unchanged.

- [ ] **Step 5: Commit strict parsing.**

```bash
git add src/core/parsing/public-parse.ts src/index.ts src/__tests__/contracts/parsing.contract.test.ts src/__tests__/contracts/public-api.contract.test.ts
git commit -m "feat: add strict parsing with DST policy"
```

### Task 3: Publish cache-safe diagnostics

**Files:**
- Create: `src/core/diagnostics.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/contracts/diagnostics.contract.test.ts`

**Interfaces:**
- Consumes `TemporalUtils`, `TemporalWrapper`, `DiffCache`, `GlobalCacheCoordinator`, and `getTemporalInfo`.
- Produces `getDiagnostics`, `resetDiagnostics`, `clearCaches`, and `prewarm` functions returning `AtemporalDiagnostics`.

- [ ] **Step 1: Write diagnostics snapshot tests.**

```ts
import atemporal from "atemporal";

test("diagnostics are snapshots and cache reset does not change defaults", () => {
  atemporal.setDefaultTimeZone("America/Costa_Rica");
  atemporal("2026-07-15T10:00:00", "America/Costa_Rica").format("YYYY-MM-DD");
  const first = atemporal.getDiagnostics();
  first.caches.parsing.mutated = true;
  expect(atemporal.getDiagnostics().caches.parsing.mutated).toBeUndefined();

  atemporal.resetDiagnostics();
  expect(atemporal.getDefaultLocale()).toBe("en-US");
  expect(atemporal().timeZone()).toBe("America/Costa_Rica");
});
```

- [ ] **Step 2: Run the diagnostics contract to verify failure.**

Run: `pnpm exec jest src/__tests__/contracts/diagnostics.contract.test.ts --runInBand`

Expected: compile failure because diagnostics methods do not exist.

- [ ] **Step 3: Implement snapshot-only diagnostics.**

Create `src/core/diagnostics.ts`. Clone only serializable metric values from
`TemporalUtils.getParsingMetrics()`, `TemporalWrapper.getFormattingMetrics()`,
and `DiffCache.getStats()`. Implement `clearCaches` with the existing cache
coordinator. Implement `resetDiagnostics` by clearing caches plus parser and
format metrics. Implement `prewarm({ formatPatterns = [] })` by calling the
existing formatting prewarm path and formatting one current wrapper per supplied
pattern. Attach these functions to the factory in `src/index.ts`.

- [ ] **Step 4: Verify diagnostics and existing cache behaviour.**

Run: `pnpm exec jest src/__tests__/contracts/diagnostics.contract.test.ts src/__tests__/core/caching/cache-coordinator.test.ts src/__tests__/core/formatting/formatting-cache.test.ts --runInBand`

Expected: all suites pass and no test imports a new public cache singleton.

- [ ] **Step 5: Commit diagnostics.**

```bash
git add src/core/diagnostics.ts src/index.ts src/__tests__/contracts/diagnostics.contract.test.ts
git commit -m "feat: expose snapshot diagnostics API"
```

### Task 4: Add explicit third-party extension metadata and inspection

**Files:**
- Modify: `src/typeGuards.ts`
- Modify: `src/types.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/official-plugin-tracking.test.ts`
- Test: `src/__tests__/contracts/plugins.contract.test.ts`

**Interfaces:**
- Produces `ExtensionMetadata`, `getExtensionMetadata`, and `getAppliedExtensions()`.
- Keeps `OfficialPluginMetadata` and `getOfficialPluginMetadata()` unchanged for official plugins.

- [ ] **Step 1: Write extension inspection tests.**

```ts
import atemporal, { markAsPlugin, type Plugin } from "atemporal";

test("tracks official, named third-party, and anonymous extensions separately", () => {
  const named = markAsPlugin(((Wrapper) => { Wrapper.prototype.named = () => true; }) as Plugin, {
    id: "acme.named",
    official: false,
  });
  const anonymous = ((Wrapper: any) => { Wrapper.prototype.anonymous = () => true; }) as Plugin;

  atemporal.extend(named);
  atemporal.extend(anonymous);

  expect(atemporal.getAppliedExtensions()).toEqual(expect.arrayContaining([
    { id: "acme.named", kind: "third-party" },
    { id: null, kind: "third-party" },
  ]));
  expect(atemporal.getLoadedPlugins()).not.toContain("acme.named");
});
```

- [ ] **Step 2: Run plugin contracts to verify failure.**

Run: `pnpm exec jest src/__tests__/contracts/plugins.contract.test.ts src/__tests__/official-plugin-tracking.test.ts --runInBand`

Expected: type failure because third-party metadata and `getAppliedExtensions` do not exist.

- [ ] **Step 3: Extend symbol metadata without changing official identity.**

Add a new `EXTENSION_METADATA` symbol and `ExtensionMetadata` type with exact
shape `{ id: string; official: false }`. Make `markAsPlugin` accept either
official or third-party metadata. Validate non-empty IDs and reject a
third-party metadata object that claims `official: true`. Track every successful
`extend` call in insertion order, keyed by plugin identity, and return only
`{ id, kind }` snapshots from `getAppliedExtensions`. Do not read `plugin.name`.

- [ ] **Step 4: Verify plugins and published exports.**

Run: `pnpm exec jest src/__tests__/contracts/plugins.contract.test.ts src/__tests__/official-plugin-tracking.test.ts src/__tests__/plugins.consolidated.test.ts src/__tests__/public-exports.test.ts --runInBand`

Expected: all suites pass; official `lazyLoad("relativeTime")` still reports
only `relativeTime` through `getLoadedPlugins()`.

- [ ] **Step 5: Commit extension inspection.**

```bash
git add src/typeGuards.ts src/types.ts src/index.ts src/__tests__/official-plugin-tracking.test.ts src/__tests__/contracts/plugins.contract.test.ts
git commit -m "feat: inspect applied third-party extensions"
```

### Task 5: Document and package the public API

**Files:**
- Create: `docs/api/parsing.md`
- Modify: `docs/api/index.md`
- Modify: `docs/guide/performance.md`
- Modify: `docs/plugins/index.md`
- Modify: `scripts/generate-llms-txt.js`
- Modify: `scripts/__tests__/llms-documentation-contract.test.cjs`
- Test: `integration/node-esm`
- Test: `integration/node-cjs`

**Interfaces:**
- Consumes all public methods completed in Tasks 1–4.
- Produces consumer documentation that uses only package exports.

- [ ] **Step 1: Add a documentation contract that forbids internal imports.**

```js
const consumerDocs = fs.readFileSync(path.join(projectRoot, "docs", "guide", "performance.md"), "utf8");
expect(consumerDocs).not.toMatch(/from\s+["']atemporal\/src\//);
expect(llmGuide).toContain("atemporal.parse(input, options)");
expect(llmGuide).toContain("disambiguation: \"reject\"");
```

- [ ] **Step 2: Run the documentation contract to verify failure.**

Run: `pnpm exec jest scripts/__tests__/llms-documentation-contract.test.cjs --runInBand`

Expected: failure until the public API guide and generator include the new rules.

- [ ] **Step 3: Write public documentation and update the generator.**

Document factory compatibility parsing versus strict `parse`/`tryParse`, a real
New York DST gap and overlap, snapshot diagnostics, cache reset boundaries, and
official versus third-party extension inspection. Replace each source-path
example in `docs/guide/performance.md` with `atemporal.getDiagnostics()`,
`atemporal.resetDiagnostics()`, `atemporal.clearCaches()`, and
`atemporal.prewarm()`. Add `docs/api/parsing.md` to the VitePress sidebar and
the LLM generator source list.

- [ ] **Step 4: Build docs and test the packed package.**

Run: `pnpm run docs:build && git restore --worktree docs/.vitepress/dist && pnpm run build && pnpm run pack:artifact && pnpm run fixtures:contract`

Expected: generated guides are current; the packed tarball passes ESM, CJS, and
TypeScript fixtures.

- [ ] **Step 5: Commit public documentation.**

```bash
git add docs/api/parsing.md docs/api/index.md docs/guide/performance.md docs/plugins/index.md docs/.vitepress/config.mts docs/public/llms.txt scripts/generate-llms-txt.js scripts/__tests__/llms-documentation-contract.test.cjs
git commit -m "docs: explain strict parsing and public diagnostics"
```

### Task 6: Run the v1.5 release gate

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `docs/migration/index.md`

- [ ] **Step 1: Add semver notes before versioning.**

Add a v1.5.0 section stating that all new methods are additive, the callable
factory is unchanged, strict parsing defaults to rejecting DST ambiguity, and
third-party extensions remain excluded from `getLoadedPlugins()`.

- [ ] **Step 2: Run the full local quality gate.**

Run: `pnpm run build && pnpm run test:ci --runInBand && pnpm run fixtures:contract && pnpm run size:report && pnpm run bench:gate`

Expected: build and all tests pass, fixture output is green, size report is
within versioned budget, and every benchmark path is within its baseline limit.

- [ ] **Step 3: Commit release notes.**

```bash
git add CHANGELOG.md package.json docs/migration/index.md
git commit -m "chore: prepare v1.5 strict API release"
```
