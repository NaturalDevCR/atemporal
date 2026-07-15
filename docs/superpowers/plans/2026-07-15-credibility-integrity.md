# Credibility and Release-Artifact Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Atemporal's public claims truthful and enforceable by fixing the two contract defects, documenting scoped compatibility, and validating the exact npm tarball through contract, integration, size, and release gates.

**Architecture:** Official plugins carry explicit symbol metadata that the factory reads after `extend()`, so direct and lazy installation share one authoritative state. A single packed tarball flows from build through every fixture, size report, benchmark, and release publication. PR CI runs the small contractual matrix, while scheduled and release workflows rerun extended bundler/SSR and performance validation on a freshly packed artifact.

**Tech Stack:** TypeScript 5.4.5 and 7.0.2 compatibility checks, Jest 30 with ts-jest, tsup 8, Node 18/20/22, npm pack, esbuild canonical bundle metafiles, Vite 8, Webpack 5, Next.js 16, GitHub Actions, VitePress.

## Global Constraints

- Do not introduce `atemporal.date()`, `atemporal.instant()`, `atemporal.zoned()`, or any other new Temporal mode in this change.
- Preserve the public `Plugin` function signature and allow third-party plugins to extend Atemporal normally.
- `getLoadedPlugins()` lists only official plugins; official identity comes from explicit metadata, never `Function.name`, filenames, or import paths.
- Keep core CJS budgets at 20 KB raw and 5 KB gzip, and ESM budgets at 15 KB raw and 5 KB gzip.
- Enforce global coverage: statements 95%, lines 95%, branches 90%, functions 90%; `src/index.ts` is covered.
- Every fixture installs exactly one shared `.tgz` from `npm pack`; no fixture may import `src/`, create a tarball, or use `npm link`. Contract fixtures run in disposable copies with `--package-lock=false` and report their effective resolved polyfill version.
- Contract fixtures are blocking on every PR. Extended fixtures and performance run weekly and again on release; release publishes the same tarball it validates.
- The canonical application-size fixture is independent of Vite, Webpack, and Next.js; it pins exact polyfill and bundler versions. `canonicalCoreBundle.total` and `canonicalRelativeTimeBundle.total` are separate blocking limits; module attribution is diagnostic.
- Once created, persist the tarball, reports, bundler metadata, and benchmark output with `if: always()` even when a later gate fails.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/typeGuards.ts` | Symbol-backed official-plugin metadata APIs. |
| `src/types.ts` | Public `OfficialPluginName` type. |
| `src/index.ts` | Register official plugin metadata after direct extension and use one state map for lazy loading. |
| `src/plugins/*.ts` | Mark each of the eight bundled plugins with stable official metadata. |
| `src/__tests__/official-plugin-tracking.test.ts` | Isolated regression tests for direct and lazy plugin state. |
| `src/__tests__/TemporalWrapper.consolidated.test.ts` | Regression for `error === null` on the optimized construction path. |
| `jest.config.ts` | Global coverage contract including public logic. |
| `README.md`, `docs/migration/dayjs.md`, `docs/migration/dayjs-compatibility.md` | Accurate positioning, size/coverage wording, and versioned compatibility matrix. |
| `scripts/create-package-artifact.cjs` | Pack once, verify package contents, calculate SHA-512, and write artifact metadata. |
| `scripts/run-fixtures.cjs` | Copy each selected fixture to a disposable workspace, clean-install the shared tarball, record resolved versions, and execute its scripts. |
| `integration/contract/*` | Native ESM/CJS and three TypeScript resolution contract projects. |
| `integration/extended/{vite,webpack,nextjs}` | Production bundler and Next SSR projects. |
| `integration/canonical-bundle/*` | esbuild-only core and plugin bundle inputs. |
| `scripts/measure-release-artifact.cjs` | Deterministic four core/tarball/two canonical-bundle measurements and versioned JSON/Markdown reports. |
| `size-budgets.json` | Versioned, reviewed canonical-bundle ceilings and change rationale. |
| `benchmarks/bench.ts`, `scripts/perf-gate.js` | Warmed multi-sample medians and per-path regression evaluation. |
| `.github/workflows/ci.yml`, `.github/workflows/integration.yml`, `.github/workflows/release.yml` | PR, weekly, and same-tarball release orchestration. |

## Task 1: Fix valid-wrapper error contract with a regression test

**Files:**
- Modify: `src/TemporalWrapper.ts:179-190`
- Modify: `src/__tests__/TemporalWrapper.consolidated.test.ts`

**Interfaces:**
- Consumes: `TemporalWrapper.unix(seconds): TemporalWrapper`.
- Produces: every valid `TemporalWrapper` has `get error(): string | null` returning `null`.

- [ ] **Step 1: Add the failing regression test**

Add this test to the existing wrapper suite, next to other `unix()` tests:

```ts
it('returns null error for a valid instance created through unix()', () => {
  const result = TemporalWrapper.unix(1_752_096_000);

  expect(result.isValid()).toBe(true);
  expect(result.error).toBeNull();
});
```

- [ ] **Step 2: Run the test and confirm the contract failure**

Run: `npx jest src/__tests__/TemporalWrapper.consolidated.test.ts --runInBand`

Expected: FAIL because the valid optimized path returns `undefined`, not `null`.

- [ ] **Step 3: Initialize the valid fast path explicitly**

In `TemporalWrapper._fromZonedDateTime`, assign the missing field in the successful `try` branch:

```ts
wrapper._datetime = dateTime;
wrapper._isValid = true;
wrapper._error = null;
wrapper._isTemporalWrapper = true;
```

- [ ] **Step 4: Verify the regression and wrapper suite**

Run: `npx jest src/__tests__/TemporalWrapper.consolidated.test.ts --runInBand`

Expected: PASS with the new test and no wrapper-suite failures.

- [ ] **Step 5: Commit the focused correction**

```bash
git add src/TemporalWrapper.ts src/__tests__/TemporalWrapper.consolidated.test.ts
git commit -m "fix: preserve null error on valid wrapper fast path"
```

## Task 2: Track official plugins through explicit metadata

**Files:**
- Modify: `src/typeGuards.ts`
- Modify: `src/types.ts:353-361`
- Modify: `src/index.ts:247-377`
- Modify: `src/plugins/relativeTime.ts`, `src/plugins/customParseFormat.ts`, `src/plugins/advancedFormat.ts`, `src/plugins/durationHumanizer.ts`, `src/plugins/weekDay.ts`, `src/plugins/dateRangeOverlap.ts`, `src/plugins/businessDays.ts`, `src/plugins/timeSlots.ts`
- Create: `src/__tests__/official-plugin-tracking.test.ts`

**Interfaces:**
- Consumes: `markAsPlugin(plugin, { name, official: true })` and `Plugin`.
- Produces: `OfficialPluginName`, `getOfficialPluginMetadata(plugin)`, and consistent `isPluginLoaded(name)` / `getLoadedPlugins()` state.

- [ ] **Step 1: Add isolated failing public-behaviour tests**

Create `src/__tests__/official-plugin-tracking.test.ts` with a fresh module registry for each assertion so plugin state cannot leak between tests:

```ts
describe('official plugin tracking', () => {
  it('lists a direct official extension by its explicit canonical name', () => {
    jest.isolateModules(() => {
      const atemporal = require('../index').default;
      const relativeTime = require('../plugins/relativeTime').default;

      atemporal.extend(relativeTime);

      expect(atemporal.isPluginLoaded('relativeTime')).toBe(true);
      expect(atemporal.getLoadedPlugins()).toEqual(['relativeTime']);
    });
  });

  it('does not list a third-party extension as an official plugin', () => {
    jest.isolateModules(() => {
      const atemporal = require('../index').default;
      const thirdParty = () => undefined;

      atemporal.extend(thirdParty);

      expect(atemporal.getLoadedPlugins()).toEqual([]);
    });
  });

  it('gives lazy and direct loading the same official state', async () => {
    await jest.isolateModulesAsync(async () => {
      const atemporal = (await import('../index')).default;
      await atemporal.lazyLoad('relativeTime');

      expect(atemporal.isPluginLoaded('relativeTime')).toBe(true);
      expect(atemporal.getLoadedPlugins()).toEqual(['relativeTime']);
    });
  });
});
```

- [ ] **Step 2: Run the new tests and confirm direct extension fails**

Run: `npx jest src/__tests__/official-plugin-tracking.test.ts --runInBand`

Expected: FAIL on the direct-extension assertion because the current map is populated only by `lazyLoad()`.

- [ ] **Step 3: Add a metadata-only official identity contract**

Define the names and metadata in `src/typeGuards.ts`, retaining the current marker behaviour:

```ts
export const OFFICIAL_PLUGIN_METADATA = Symbol('atemporal.officialPlugin');
export type OfficialPluginMetadata = Readonly<{
  name: OfficialPluginName;
  official: true;
}>;

export function markAsPlugin<T extends Plugin>(
  fn: T,
  metadata?: OfficialPluginMetadata,
): T {
  const record = fn as T & Record<symbol, unknown>;
  record[PLUGIN_SENTINEL] = true;
  if (metadata) record[OFFICIAL_PLUGIN_METADATA] = metadata;
  return fn;
}

export function getOfficialPluginMetadata(input: unknown): OfficialPluginMetadata | null {
  if (typeof input !== 'function') return null;
  const metadata = (input as Record<symbol, unknown>)[OFFICIAL_PLUGIN_METADATA];
  return metadata && typeof metadata === 'object' && (metadata as OfficialPluginMetadata).official === true
    ? metadata as OfficialPluginMetadata
    : null;
}
```

Define and export the exact name union in `src/types.ts`:

```ts
export type OfficialPluginName =
  | 'relativeTime' | 'customParseFormat' | 'advancedFormat' | 'durationHumanizer'
  | 'weekDay' | 'dateRangeOverlap' | 'businessDays' | 'timeSlots';
```

- [ ] **Step 4: Mark every built-in plugin at its export boundary**

For each plugin file import `markAsPlugin` from `../typeGuards` and replace the default export with the exact official metadata. For example, `src/plugins/relativeTime.ts` ends with:

```ts
export default markAsPlugin(relativeTimePlugin, {
  name: 'relativeTime',
  official: true,
});
```

Use these exact names for the remaining modules: `customParseFormat`, `advancedFormat`, `durationHumanizer`, `weekDay`, `dateRangeOverlap`, `businessDays`, and `timeSlots`.

- [ ] **Step 5: Make extension the single registration point**

In `src/index.ts`, make `loadedPlugins` a `Map<OfficialPluginName, Plugin>` before assigning `atemporal.extend`. After successful plugin invocation and `appliedPlugins.add(plugin)`, register only explicit official metadata:

```ts
const metadata = getOfficialPluginMetadata(plugin);
if (metadata) loadedPlugins.set(metadata.name, plugin);
```

Remove the later `loadedPlugins.set(pluginName, plugin)` in `lazyLoad()`. After `atemporal.extend(plugin, options)`, assert the dynamically imported plugin's metadata matches the requested official name and throw `Error("Invalid metadata for official plugin '<name>'")` if it does not. Type `AVAILABLE_PLUGINS` as `readonly OfficialPluginName[]`; expose `getAvailablePlugins(): OfficialPluginName[]` and keep the existing string input for `isPluginLoaded`.

- [ ] **Step 6: Verify red-green behaviour and type safety**

Run:

```bash
npx jest src/__tests__/official-plugin-tracking.test.ts --runInBand
npx tsc --noEmit
```

Expected: all three tracking tests pass and TypeScript reports no errors.

- [ ] **Step 7: Commit plugin-state behaviour**

```bash
git add src/typeGuards.ts src/types.ts src/index.ts src/plugins src/__tests__/official-plugin-tracking.test.ts
git commit -m "fix: track directly extended official plugins"
```

## Task 3: Enforce the documented coverage contract

**Files:**
- Modify: `jest.config.ts`
- Modify: `src/__tests__/public-exports.test.ts`

**Interfaces:**
- Consumes: Jest V8 coverage collection.
- Produces: global coverage thresholds that include `src/index.ts` and fail locally or in CI below the stated contract.

- [ ] **Step 1: Add a failing public-entrypoint behaviour test**

Extend `src/__tests__/public-exports.test.ts` to exercise an exported static helper from `src/index.ts` rather than testing only re-exported classes:

```ts
it('exports unix and validates its result through the public factory', () => {
  const result = atemporal.unix(1_752_096_000);

  expect(result.isValid()).toBe(true);
  expect(result.error).toBeNull();
});
```

- [ ] **Step 2: Enable the thresholds and include index logic**

Remove `!src/index.ts` from `collectCoverageFrom`, retain exclusions only for `src/types.ts` and examples, and add:

```ts
coverageThreshold: {
  global: {
    statements: 95,
    lines: 95,
    branches: 90,
    functions: 90,
  },
},
```

- [ ] **Step 3: Run the suite to establish the genuine baseline**

Run: `npm run test:ci -- --runInBand`

Expected: either PASS above all four thresholds or a concrete coverage report that identifies untested public branches. Do not lower any threshold.

- [ ] **Step 4: Cover only observable missing public behaviour**

If the command in Step 3 identifies uncovered `src/index.ts` branches, add focused public API assertions to `src/__tests__/public-exports.test.ts` or a new named public API test. Re-run the command until the published thresholds pass; do not add tests that merely call functions without assertions.

- [ ] **Step 5: Commit enforceable coverage**

```bash
git add jest.config.ts src/__tests__/public-exports.test.ts src/__tests__
git commit -m "test: enforce public coverage thresholds"
```

## Task 4: Correct public documentation and publish a versioned compatibility matrix

**Files:**
- Modify: `README.md`
- Modify: `docs/migration/dayjs.md`
- Modify: `docs/migration/index.md`
- Create: `docs/migration/dayjs-compatibility.md`
- Modify: `docs/.vitepress/config.mts`
- Regenerate: `docs/public/llms.txt` using `node scripts/generate-llms-txt.js`

**Interfaces:**
- Consumes: Day.js 1.11.21 as the reviewed comparison version.
- Produces: accurate migration documentation and a navigable five-category matrix.

- [ ] **Step 1: Add documentation assertions before changing copy**

Create a lightweight Jest test `src/__tests__/documentation-claims.test.ts` that reads the three source documents and rejects known false claims:

```ts
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

it('does not claim that Day.js mutates or that atemporal.unix is missing', () => {
  const migration = read('docs/migration/dayjs.md');
  expect(migration).not.toMatch(/Day\.js's `\.add\(\)` mutates/);
  expect(migration).not.toMatch(/does not currently ship a `unix/);
});
```

- [ ] **Step 2: Run the documentation assertion and confirm it fails**

Run: `npx jest src/__tests__/documentation-claims.test.ts --runInBand`

Expected: FAIL because both stale Day.js migration claims are present.

- [ ] **Step 3: Replace inaccurate comparative claims**

Make these exact semantic edits:

```md
<!-- README comparison row -->
| Immutable by default | Yes | Yes | Yes | Yes |

<!-- Day.js guide prose -->
Both Day.js and atemporal are immutable: `.add()` returns a new instance.
Use the returned value in either library.

`atemporal.unix(seconds)` is available and creates an instance from Unix seconds.
```

Replace the current replacement-language with: “A modern, Temporal-powered date-time library with a familiar Day.js-inspired API.” Explain that the principal representation is `Temporal.ZonedDateTime`, so users should not infer full Temporal-model exposure or full Day.js compatibility. Replace the single `~15 KB` comparison with links to the generated size report and wording that the polyfill is a direct runtime dependency whose application-bundle cost is measured separately.

- [ ] **Step 4: Add the complete compatibility matrix document**

Create `docs/migration/dayjs-compatibility.md` with a header stating “Reviewed against Day.js 1.11.21” and the five category definitions from the design. Include at least these reviewed rows with explicit categories: construction, `unix`, immutable `add`/`subtract`, formatting tokens, comparisons, timezone plugin versus first-class timezone, duration, locales, relative time, arbitrary custom plugins, and raw `Date` interop. Link each “semantic differences” row to its explanation in `dayjs.md`.

- [ ] **Step 5: Surface the matrix and coverage scope**

Add the matrix to the migration sidebar after “From Day.js”. In the README testing-quality section, state all four Jest thresholds and that public factory logic is included; say Codecov tracks trends and does not enforce the thresholds. Add “Compatibility guaranteed” and “Compatibility additionally validated” wording that matches the fixture split.

- [ ] **Step 6: Regenerate and verify documentation**

Run:

```bash
node scripts/generate-llms-txt.js
npx jest src/__tests__/documentation-claims.test.ts --runInBand
npm run docs:build
```

Expected: generated `docs/public/llms.txt` contains the corrected source content, the assertion passes, and VitePress builds successfully.

- [ ] **Step 7: Commit documentation truthfulness**

```bash
git add README.md docs/migration docs/.vitepress/config.mts docs/public/llms.txt src/__tests__/documentation-claims.test.ts
git commit -m "docs: correct Day.js compatibility claims"
```

## Task 5: Pack and verify one publishable artifact

**Files:**
- Create: `scripts/create-package-artifact.cjs`
- Create: `scripts/__tests__/create-package-artifact.test.cjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: built `dist/`, `package.json.exports`, and `npm pack --json`.
- Produces: `artifacts/atemporal-<version>.tgz` plus `artifacts/package-artifact.json` containing `filename`, `path`, `sha512`, `size`, `unpackedSize`, and packed file paths.

- [ ] **Step 1: Write failing artifact-manifest tests**

Create a temporary package fixture in the test and call exported `verifyPackedFiles` with a deliberate missing export file. Assert that the failure names the absent path. Add a passing case with the required files:

```js
expect(() => verifyPackedFiles(['package/dist/index.mjs'], packageJson)).toThrow(
  'Missing packed file: package/dist/index.js',
);
```

- [ ] **Step 2: Run the new test and confirm the missing helper failure**

Run: `npx jest scripts/__tests__/create-package-artifact.test.cjs --runInBand`

Expected: FAIL because `verifyPackedFiles` is not exported yet.

- [ ] **Step 3: Implement deterministic packing and content verification**

Implement `create-package-artifact.cjs` as CommonJS with exported helpers and a CLI entrypoint. It must:

```js
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

function sha512(file) {
  return createHash('sha512').update(fs.readFileSync(file)).digest('base64');
}
```

Clean `artifacts/`, run `npm pack --json --pack-destination artifacts`, parse the one JSON record, and require `package/README.md`, `package/LICENSE`, `package/package.json`, root CJS/ESM/declaration files, and every `exports` target rewritten under `package/`. Write a deterministic metadata JSON file with no current-time field. Add npm scripts:

```json
"pack:artifact": "node scripts/create-package-artifact.cjs",
"fixtures:contract": "node scripts/run-fixtures.cjs contract",
"fixtures:extended": "node scripts/run-fixtures.cjs extended"
```

Ignore `/artifacts/`.

- [ ] **Step 4: Verify the helper and a real packed package**

Run:

```bash
npx jest scripts/__tests__/create-package-artifact.test.cjs --runInBand
npm run build
npm run pack:artifact
node -e "const r=require('./artifacts/package-artifact.json'); if (!r.sha512 || !r.path.endsWith('.tgz')) process.exit(1)"
```

Expected: helper tests pass, exactly one tarball exists, and metadata contains its integrity and package-file list.

- [ ] **Step 5: Commit the artifact producer**

```bash
git add scripts/create-package-artifact.cjs scripts/__tests__/create-package-artifact.test.cjs package.json package-lock.json .gitignore
git commit -m "build: verify one packed release artifact"
```

## Task 6: Add the blocking tarball contract fixtures

**Files:**
- Create: `scripts/run-fixtures.cjs`
- Create: `integration/contract/node-esm/{package.json,package-lock.json,verify.mjs}`
- Create: `integration/contract/node-cjs/{package.json,package-lock.json,verify.cjs}`
- Create: `integration/contract/typescript-node16/{package.json,package-lock.json,tsconfig.json,src/index.ts}`
- Create: `integration/contract/typescript-nodenext/{package.json,package-lock.json,tsconfig.json,src/index.ts}`
- Create: `integration/contract/typescript-bundler/{package.json,package-lock.json,tsconfig.json,src/index.ts}`

**Interfaces:**
- Consumes: `artifacts/package-artifact.json` and its one `path` value.
- Produces: a non-zero process exit for any installation, native import, declaration, chain, format, or plugin-loading regression.

- [ ] **Step 1: Write the ESM and CJS verification programs before the runner**

`node-esm/verify.mjs` must contain:

```js
import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);
const result = atemporal('2026-07-15T10:00:00Z')
  .timeZone('America/Costa_Rica')
  .add(1, 'day')
  .format('YYYY-MM-DD HH:mm');
if (result !== '2026-07-16 04:00' || !atemporal.isPluginLoaded('relativeTime')) {
  throw new Error(`Unexpected ESM contract result: ${result}`);
}
```

`node-cjs/verify.cjs` must choose the CJS default-export contract explicitly:

```js
const { default: atemporal } = require('atemporal');
const { default: relativeTime } = require('atemporal/plugins/relativeTime');
// Repeat the exact ESM operation and throw on a non-matching result.
```

Each fixture `package.json` has `"private": true` and `"scripts": { "typecheck": "node -e \"process.exit(0)\"", "build": "node -e \"process.exit(0)\"", "test": "node verify.mjs" }` (use `verify.cjs` for CJS).

- [ ] **Step 2: Run the programs before tarball installation**

Run from each Node fixture: `node verify.mjs` or `node verify.cjs`.

Expected: FAIL with `Cannot find package 'atemporal'` before the runner installs the tarball.

- [ ] **Step 3: Implement the shared clean-install runner**

`run-fixtures.cjs` reads the artifact JSON, resolves fixture groups, copies each selected fixture into `tmp/integration-fixtures/<group>/<name>`, and runs only in that disposable copy. It executes exactly `npm ci`, then `npm install --no-save --package-lock=false <absolute tarball>`, then `npm run typecheck`, `npm run build`, and `npm test`. After installation it writes `reports/fixtures/<group>-<name>.json` with the effective `@js-temporal/polyfill` version reported by `npm ls @js-temporal/polyfill --json`. Use `spawnSync(command, args, { cwd, stdio: 'inherit' })` and throw on a non-zero status. Reject a group other than `contract` or `extended`; sort fixture directory names for stable ordering. Because the source fixture is never used as an install directory, its lockfile and every versioned file remain unchanged.

- [ ] **Step 4: Add TypeScript source and mode-specific configs**

Use this exact source in all three TypeScript fixture `src/index.ts` files:

```ts
import atemporal from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);
const result: string = atemporal('2026-07-15T10:00:00Z')
  .timeZone('America/Costa_Rica')
  .add(1, 'day')
  .format('YYYY-MM-DD HH:mm');
if (result !== '2026-07-16 04:00') throw new Error(result);
```

Set `moduleResolution` and `module` to `Node16` in the node16 fixture and `NodeNext` in the nodenext fixture. Give both `outDir: "dist"`, `rootDir: "src"`, and a `test` script that runs their emitted JavaScript with Node. Set bundler mode to `moduleResolution: "Bundler"`, `module: "ESNext"`, `noEmit: true`, and a test script that runs the ESM verification program. Pin TypeScript 5.4.5 in the committed lockfiles; the CI matrix will additionally install exactly 7.0.2 in a copied fixture workspace.

- [ ] **Step 5: Verify the full contract group using one real tarball**

Run:

```bash
npm run build
npm run pack:artifact
npm run fixtures:contract
```

Expected: every fixture reports successful typecheck/build/test after installing the same tarball path recorded in `artifacts/package-artifact.json`.

- [ ] **Step 6: Commit PR-level artifact contracts**

```bash
git add scripts/run-fixtures.cjs integration/contract package.json package-lock.json
git commit -m "test: validate packed artifact contracts"
```

## Task 7: Add extended production fixtures for Vite, Webpack, and Next.js

**Files:**
- Create: `integration/extended/vite/{package.json,package-lock.json,index.html,src/main.ts,vite.config.ts}`
- Create: `integration/extended/webpack/{package.json,package-lock.json,src/index.ts,webpack.config.cjs}`
- Create: `integration/extended/nextjs/{package.json,package-lock.json,app/page.tsx,app/client-date.tsx,app/api/health/route.ts,verify-production.cjs,next.config.mjs}`

**Interfaces:**
- Consumes: the same tarball path used by Task 6.
- Produces: production builds that import the package and a Next production HTTP assertion covering server and client code.

- [ ] **Step 1: Add failing fixture checks that require the package**

In Vite and Webpack entrypoints import `atemporal` and `relativeTime`, extend the plugin, and render `2026-07-16 04:00` into a DOM element. In Next `app/page.tsx`, compute the same formatted value in the server component and render `<p id="server-date">2026-07-16 04:00</p>`; `app/client-date.tsx` is a `'use client'` component that performs the same operation and renders `<p id="client-date">2026-07-16 04:00</p>`.

- [ ] **Step 2: Confirm a fixture cannot build before installation**

Run: `npm run build` in `integration/extended/vite` before the fixture runner installs the tarball.

Expected: FAIL with an unresolved `atemporal` import.

- [ ] **Step 3: Configure production build scripts with locked tools**

Pin Vite 8.0.16, Webpack 5.108.4 plus webpack-cli, and Next 16.2.10 with React 19 in their respective fixture `package.json`/lockfiles. Configure each package with `typecheck`, `build`, and `test` scripts. Vite test reads `dist/assets` and asserts at least one emitted JavaScript asset; Webpack test reads `dist/main.js`; both builds must emit production output with minification enabled.

- [ ] **Step 4: Implement the real Next production check**

`verify-production.cjs` starts `next start -p 3210` with `spawn`, waits for `http://127.0.0.1:3210`, fetches `/`, and requires the response to contain both `id="server-date"` and `2026-07-16 04:00`. In a `finally` block, send `SIGTERM`, await `exit`, and send `SIGKILL` only after a 10-second timeout. The test script runs `node verify-production.cjs` after `next build`.

- [ ] **Step 5: Verify all extended fixtures from the shared tarball**

Run:

```bash
npm run build
npm run pack:artifact
npm run fixtures:extended
```

Expected: Vite and Webpack create production bundles, and Next responds successfully to an HTTP request served by `next start`.

- [ ] **Step 6: Commit extended compatibility evidence**

```bash
git add integration/extended scripts/run-fixtures.cjs package-lock.json
git commit -m "test: add production bundler integration fixtures"
```

## Task 8: Produce deterministic, versioned artifact-size reports and reviewed budgets

**Files:**
- Create: `integration/canonical-bundle/{core-entry.ts,plugin-entry.ts,package.json,package-lock.json}`
- Create: `scripts/measure-release-artifact.cjs`
- Create: `scripts/__tests__/measure-release-artifact.test.cjs`
- Create: `size-budgets.json`
- Modify: `scripts/check-bundle-size.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `artifacts/package-artifact.json`, built dist files, esbuild metafiles, and `size-budgets.json`.
- Produces: `reports/size-report.json`, `reports/size-report.md`, canonical bundle files/metafiles, and non-zero exit on any of four core or two independent canonical-total ceiling overruns.

- [ ] **Step 1: Write failing report-schema and deterministic-gzip tests**

Test that `buildSizeReport()` returns `schemaVersion: 1`, `status`, `commitSha`, UTC timestamp, architecture, base environment, optional tool versions, `executedSuites`, tarball SHA-512, four core measurements (`cjs.raw`, `cjs.gzip`, `esm.raw`, `esm.gzip`), both canonical totals, budgets, results, and baseline deltas. Test that a PR report sets `tools.vite`, `tools.webpack`, and `tools.next` to `null`, rather than inventing values. Test that `gzipSize(Buffer.from('atemporal'))` returns the same number on two invocations using `zlib.gzipSync(buffer, { mtime: 0 })`.

- [ ] **Step 2: Run the test and confirm report helpers are absent**

Run: `npx jest scripts/__tests__/measure-release-artifact.test.cjs --runInBand`

Expected: FAIL because `buildSizeReport` and `gzipSize` are not exported.

- [ ] **Step 3: Define canonical inputs and the reviewed budget file**

`core-entry.ts` imports `atemporal` and emits the same Costa Rica format result. `plugin-entry.ts` additionally imports and extends `relativeTime`. The canonical fixture pins exact `esbuild` and `@js-temporal/polyfill` versions in its package lockfile and uses an `overrides` entry for the polyfill. `size-budgets.json` starts with this exact reviewed structure after recording the first measured values:

```json
{
  "schemaVersion": 1,
  "canonicalBundles": {
    "canonicalCoreBundle": { "limitBytes": 0, "baselineBytes": 0, "rationale": "Initial value reviewed from implementing commit." },
    "canonicalRelativeTimeBundle": { "limitBytes": 0, "baselineBytes": 0, "rationale": "Initial value reviewed from implementing commit." }
  },
  "history": []
}
```

Replace both zeroes with the first real measured values and record the implementing commit in each rationale before committing this task. Set each `limitBytes` to `baselineBytes + max(ceil(baselineBytes * 0.05), 1024)`. Future history entries must include `previousBytes`, `nextBytes`, `absoluteDeltaBytes`, `percentDelta`, `cause`, and `changeReference`; no script may write this file.

- [ ] **Step 4: Implement measurement, attribution, and enforcement**

Build the canonical inputs with the direct esbuild CLI/API in production/minified ESM mode and `metafile: true`; delete `integration/canonical-bundle/dist` before each build. Measure raw bytes and deterministic gzip bytes for both `dist/index.js` and `dist/index.mjs`; copy tarball size and unpacked size from artifact metadata; calculate each canonical total from emitted files. Use esbuild metafile inputs to report diagnostic byte attribution grouped as `atemporal`, `@js-temporal/polyfill`, and `runtime-or-other`. Enforce `canonicalCoreBundle.total` and `canonicalRelativeTimeBundle.total` independently.

The JSON report includes the following concrete top-level shape:

```json
{
  "schemaVersion": 1,
  "commitSha": "40-character Git SHA",
  "generatedAtUtc": "RFC 3339 UTC timestamp",
  "environment": { "os": "runner", "architecture": "x64", "node": "version", "npm": "version" },
  "tools": { "typescript": "version or null", "canonicalBundler": "version", "vite": null, "webpack": null, "next": null, "dayjs": "1.11.21", "temporalPolyfill": "version", "atemporal": "version" },
  "tarball": { "name": "filename", "sha512": "base64 digest", "size": 0, "unpackedSize": 0 },
  "mode": "production",
  "executedSuites": ["core-size", "canonical-core-bundle", "canonical-plugin-bundle"],
  "budgets": [],
  "results": [],
  "status": "pass"
}
```

`check-bundle-size.js` continues enforcing its four core budgets and imports the report result to enforce both reviewed canonical total limits. It must not fail based on diagnostic attribution.

- [ ] **Step 5: Generate the first reviewed report and verify deterministic output**

Run:

```bash
npm run build
npm run pack:artifact
node scripts/measure-release-artifact.cjs
npx jest scripts/__tests__/measure-release-artifact.test.cjs --runInBand
npm run size
```

Expected: JSON and Markdown reports exist, budget results pass, and `size-budgets.json` contains real non-zero reviewed baselines and limits rather than placeholder values.

- [ ] **Step 6: Commit measurement and budget policy**

```bash
git add integration/canonical-bundle scripts/measure-release-artifact.cjs scripts/__tests__/measure-release-artifact.test.cjs scripts/check-bundle-size.js size-budgets.json package.json package-lock.json
git commit -m "build: enforce reviewed application bundle budgets"
```

## Task 9: Make performance results statistically robust

**Files:**
- Modify: `benchmarks/bench.ts`
- Modify: `scripts/perf-gate.js`
- Modify: `benchmarks/baseline.json`
- Create: `scripts/__tests__/perf-gate.test.cjs`

**Interfaces:**
- Consumes: per-path sample arrays and a baseline median for `parse`, `format`, `add`, `diff`, and `validate`.
- Produces: per-hot-path median comparison with a 25% tolerance and recorded min/max/standard deviation.

- [ ] **Step 1: Write a failing median-regression test**

In `scripts/__tests__/perf-gate.test.cjs`, call an exported `evaluateGate()` with a baseline `parse.medianMs` of 100 and current `parse.medianMs` of 126. Assert `parse.status === 'FAIL'` even if all other paths improve. Add a 125 case that passes.

- [ ] **Step 2: Run the test and confirm the evaluator is absent**

Run: `npx jest scripts/__tests__/perf-gate.test.cjs --runInBand`

Expected: FAIL because `evaluateGate` is not exported.

- [ ] **Step 3: Collect warm samples and robust summaries**

In `benchmarks/bench.ts`, run each named operation once as warm-up, then run it seven times. Calculate sorted `samplesMs`, median, min, max, p95, and median absolute deviation. Emit `schemaVersion: 1`, Node version, architecture, OS, GitHub Actions image version, `ops`, timeout policy, timestamp, and per-path summaries. Keep imports from `dist/index.mjs` so the benchmark remains artifact-focused.

- [ ] **Step 4: Evaluate each path independently**

Refactor `perf-gate.js` so `evaluateGate(current, baseline)` computes `current[path].medianMs / baseline[path].medianMs`. Use `ratio > 1.25` as failure; a ratio exactly `1.25` passes. Preserve table output but print median, min, max, p95, median absolute deviation, baseline median, allowed median, ratio, and status. Recreate `benchmarks/baseline.json` from a seven-sample run on `ubuntu-24.04`, `x64`, Node `20.19.0`, 100,000 operations per sample, one warm-up per path, and a 15-minute job timeout. Preserve all of those fields, the image version, schema version, and tolerance metadata.

- [ ] **Step 5: Verify per-path regression and a real benchmark**

Run:

```bash
npx jest scripts/__tests__/perf-gate.test.cjs --runInBand
npm run build
node --expose-gc -r ts-node/register/transpile-only benchmarks/bench.ts 100000 > bench-out.json
node scripts/perf-gate.js bench-out.json benchmarks/baseline.json
```

Expected: synthetic tests pass; the real report contains seven samples and statistics for every hot path; the gate evaluates each path separately.

- [ ] **Step 6: Commit robust performance evidence**

```bash
git add benchmarks/bench.ts benchmarks/baseline.json scripts/perf-gate.js scripts/__tests__/perf-gate.test.cjs
git commit -m "test: gate performance on hot path medians"
```

## Task 10: Orchestrate PR, weekly, and same-tarball release validation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/integration.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `README.md`
- Modify: `docs/guide/contributing.md`

**Interfaces:**
- Consumes: artifact metadata, tarball, reports, fixture runner, and performance gate from prior tasks.
- Produces: one artifact reused within each workflow, PR-blocking contract checks, weekly extended evidence, and release publication from the validated file.

- [ ] **Step 1: Add a failing workflow-structure assertion**

Create `scripts/__tests__/workflow-artifact-flow.test.cjs` that reads YAML as text and asserts `release.yml` has one `npm pack` producer, references `artifacts/package-artifact.json` before publish, and contains `npm publish artifacts/atemporal-`. Assert `ci.yml` invokes `fixtures:contract` and does not invoke `bench:gate` on PR jobs.

- [ ] **Step 2: Run the assertion and confirm the current workflows violate it**

Run: `npx jest scripts/__tests__/workflow-artifact-flow.test.cjs --runInBand`

Expected: FAIL because CI currently runs performance on every PR and release publishes a newly constructed package.

- [ ] **Step 3: Make PR CI produce and consume one artifact**

In `ci.yml`, change the build job to run `npm run build`, `npm run pack:artifact`, and `node scripts/measure-release-artifact.cjs`; upload the complete `artifacts/` directory and reports. Make a `contract-fixtures` job download that one artifact and run `npm run fixtures:contract`; run its TypeScript compatibility matrix for exactly `5.4.5` and `7.0.2`. Keep unit/coverage and core/canonical budget failures blocking. Remove the PR `perf-gate` job and remove it from `ci-success`.

- [ ] **Step 4: Add the weekly extended workflow**

Create `integration.yml` with `on: { schedule: [{ cron: '0 6 * * 1' }], workflow_dispatch: {} }`. It checks out, builds, packs once, runs unit/coverage, contract fixtures, extended fixtures, size report, and the performance gate. Every upload uses `if: always()` and weekly artifacts use `retention-days: 30`. The job fails after uploading if any blocking command failed.

- [ ] **Step 5: Validate and publish the exact release tarball**

In `release.yml`, replace the direct `npm publish --provenance` flow with a release-validation job that builds, packs once, runs all unit, contract, extended, size, and performance commands against that tarball, then uploads evidence with `if: always()`. The publish job downloads the tarball and runs exactly:

```bash
npm publish "$(node -p "require('./artifacts/package-artifact.json').path")" --provenance --access public --tag latest
```

Keep the existing already-published version check before publishing. Do not call `npm run build` or `npm pack` in the publish job. Retain release evidence permanently through the GitHub release attachment mechanism or the highest supported artifact retention period.

- [ ] **Step 6: Document the promise and CI topology**

In README and contributing documentation, add the exact public wording:

```md
Compatibility guaranteed: every pull request continuously tests installation, native imports, TypeScript resolution, core operations, formatting, and official plugin loading from the packed npm artifact.

Compatibility additionally validated: scheduled and release fixtures verify production Vite, Webpack, and Next.js SSR builds.
```

Document the weekly performance gate, all four coverage thresholds, contractual versus diagnostic size numbers, and the rule that a release publishes its validated tarball.

- [ ] **Step 7: Verify workflow contracts and local end-to-end sequence**

Run:

```bash
npx jest scripts/__tests__/workflow-artifact-flow.test.cjs --runInBand
npm run build
npm run pack:artifact
npm run test:ci -- --runInBand
npm run fixtures:contract
npm run fixtures:extended
node scripts/measure-release-artifact.cjs
npm run size
```

Expected: workflow text assertions pass; the local sequence validates one generated tarball across unit, fixture, and size gates. Run the benchmark command from Task 9 separately because it is intentionally not part of the PR sequence.

- [ ] **Step 8: Commit CI and release evidence controls**

```bash
git add .github/workflows/ci.yml .github/workflows/integration.yml .github/workflows/release.yml README.md docs/guide/contributing.md scripts/__tests__/workflow-artifact-flow.test.cjs
git commit -m "ci: validate and publish the tested tarball"
```

## Task 11: Final verification and generated-document consistency

**Files:**
- Modify if needed: generated `docs/public/llms.txt`
- Verify: all files changed by Tasks 1–10

**Interfaces:**
- Consumes: the accepted design, complete implementation, one freshly packed tarball, and all documented budgets.
- Produces: evidence that every acceptance criterion is exercised before requesting review.

- [ ] **Step 1: Regenerate documentation and inspect the diff**

Run:

```bash
node scripts/generate-llms-txt.js
git diff --check
git status --short
```

Expected: no whitespace errors and only intentional generated-document changes.

- [ ] **Step 2: Run the complete local verification set**

Run:

```bash
npx tsc --noEmit
npm run build
npm run pack:artifact
npm run test:ci -- --runInBand
npm run fixtures:contract
npm run fixtures:extended
node scripts/measure-release-artifact.cjs
npm run size
node --expose-gc -r ts-node/register/transpile-only benchmarks/bench.ts 100000 > bench-out.json
node scripts/perf-gate.js bench-out.json benchmarks/baseline.json
npm run docs:build
npm run links:check
```

Expected: all blocking commands exit 0. Inspect `artifacts/package-artifact.json`, `reports/size-report.json`, `reports/size-report.md`, and `bench-out.json` to confirm their schema versions, integrity, environment metadata, and per-path results are populated.

- [ ] **Step 3: Match acceptance criteria to fresh evidence**

Confirm each design criterion against an explicit command or test: wrapper error test; direct/lazy plugin tracking test; coverage summary; documentation assertion and matrix; artifact manifest test; ESM/CJS/TypeScript fixtures; extended Vite/Webpack/Next production tests; size report/budgets; per-path benchmark report; and release workflow structure assertion.

- [ ] **Step 4: Commit the final generated documentation if it changed**

```bash
git add docs/public/llms.txt
git commit -m "docs: refresh generated documentation"
```

Only create this commit when regeneration changed the tracked file; otherwise leave the working tree unchanged.
