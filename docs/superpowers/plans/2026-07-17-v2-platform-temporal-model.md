# Atemporal v2 Platform and Temporal Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release v2.0 with Node 22+ support and explicit raw Temporal constructors while retaining the wrapper facade as a deprecated migration path.

**Architecture:** Add narrowly typed constructor modules that convert only their own value category and return native/polyfill-selected Temporal values from the central Temporal API. Keep `TemporalWrapper` and the callable factory operational but deprecated; never make raw constructors silently construct a different temporal category.

**Tech Stack:** TypeScript, `@js-temporal/polyfill`, Jest 30, tsup, pnpm 11.13.1, GitHub Actions on ubuntu-24.04.

## Global Constraints

- Set `engines.node` to `>=22`; CI support remains exactly Node 22, 24, and 26.
- Return raw `Temporal.Instant`, `Temporal.PlainDate`, `Temporal.PlainDateTime`, and `Temporal.ZonedDateTime` from explicit constructors.
- `instant` never guesses a timezone; `date` never creates a time or zone; `plainDateTime` never creates a zone.
- `zonedDateTime` uses strict DST policy with `disambiguation: "reject"` by default.
- Keep `atemporal(input, timeZone?)` available, functional, and marked deprecated through v2.
- Publish only the tarball that passed build, artifact contracts, extended integration, size, benchmark, security, and documentation gates.

---

### Task 1: Enforce the Node 22 platform floor

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/guide/getting-started.md`
- Modify: `docs/migration/index.md`
- Test: `scripts/__tests__/package-manager-contract.test.cjs`
- Test: `integration/node-esm/package.json`
- Test: `integration/node-cjs/package.json`

- [ ] **Step 1: Add the platform-contract assertion.**

```js
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
expect(manifest.engines.node).toBe(">=22");
expect(workflow).toContain("node-version: [22.x, 24.x, 26.x]");
```

- [ ] **Step 2: Run the test to verify failure.**

Run: `pnpm exec jest scripts/__tests__/package-manager-contract.test.cjs --runInBand`

Expected: failure because the manifest still says `>=18`.

- [ ] **Step 3: Change metadata and migration copy.**

Set `package.json` to `{ "engines": { "node": ">=22" } }`. Document this as
a v2 breaking platform change, list supported Node lines, and state that browser
support continues through runtime detection and bundled integration fixtures.

- [ ] **Step 4: Verify package and fixture manifests.**

Run: `pnpm exec jest scripts/__tests__/package-manager-contract.test.cjs --runInBand && pnpm run build && pnpm run pack:artifact && pnpm run fixtures:contract`

Expected: all checks pass using the packed tarball.

- [ ] **Step 5: Commit platform floor.**

```bash
git add package.json README.md docs/guide/getting-started.md docs/migration/index.md scripts/__tests__/package-manager-contract.test.cjs integration
git commit -m "feat!: require Node 22 or newer"
```

### Task 2: Define input categories and constructor types

**Files:**
- Create: `src/types/temporal-inputs.ts`
- Modify: `src/types.ts`
- Modify: `src/types/index.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/contracts/temporal-constructors.contract.test.ts`

**Interfaces:**
- Produces `InstantInput`, `PlainDateInput`, `PlainDateTimeInput`, `ZonedDateTimeInput`, and `ZonedDateTimeOptions`.
- Produces `atemporal.instant`, `atemporal.date`, `atemporal.plainDateTime`, and `atemporal.zonedDateTime` declarations.

- [ ] **Step 1: Write compile-time category tests.**

```ts
import atemporal, { type InstantInput, type PlainDateInput } from "atemporal";
import { Temporal } from "@js-temporal/polyfill";

const instantInput: InstantInput = "2026-07-15T10:00:00Z";
const dateInput: PlainDateInput = { year: 2026, month: 7, day: 15 };

expect(atemporal.instant(instantInput)).toBeInstanceOf(Temporal.Instant);
expect(atemporal.date(dateInput)).toBeInstanceOf(Temporal.PlainDate);
// @ts-expect-error A plain date has no instant or timezone.
atemporal.instant(dateInput);
```

- [ ] **Step 2: Run the constructor contract to verify failure.**

Run: `pnpm exec jest src/__tests__/contracts/temporal-constructors.contract.test.ts --runInBand`

Expected: compile errors because the constructor names and input types do not exist.

- [ ] **Step 3: Add exact separated input unions.**

Define the unions so `InstantInput` includes `Temporal.Instant`, `Date`, finite
epoch milliseconds, and ISO strings requiring `Z` or an explicit offset;
`PlainDateInput` includes `Temporal.PlainDate`, ISO date-only strings, and
`{ year, month, day }`; `PlainDateTimeInput` includes `Temporal.PlainDateTime`,
local ISO date-time strings, and date-time fields; `ZonedDateTimeInput` includes
`Temporal.ZonedDateTime` and ISO strings with bracketed IANA zone. Define
`ZonedDateTimeOptions` as the v1.5 strict parse option subset with required
`timeZone` only when the input lacks one.

- [ ] **Step 4: Run type and build verification.**

Run: `pnpm exec jest src/__tests__/contracts/temporal-constructors.contract.test.ts --runInBand && pnpm run build`

Expected: correct categories compile and `@ts-expect-error` assertions are consumed.

- [ ] **Step 5: Commit constructor types.**

```bash
git add src/types/temporal-inputs.ts src/types.ts src/types/index.ts src/index.ts src/__tests__/contracts/temporal-constructors.contract.test.ts
git commit -m "feat: define explicit Temporal constructor types"
```

### Task 3: Implement raw Temporal constructors

**Files:**
- Create: `src/constructors/instant.ts`
- Create: `src/constructors/date.ts`
- Create: `src/constructors/plain-date-time.ts`
- Create: `src/constructors/zoned-date-time.ts`
- Create: `src/constructors/index.ts`
- Modify: `src/index.ts`
- Test: `src/__tests__/contracts/temporal-constructors.contract.test.ts`

**Interfaces:**
- Consumes the central `Temporal` export from `src/core/temporal-api.ts`.
- Produces the four raw Temporal constructor functions.

- [ ] **Step 1: Add runtime category and DST tests.**

```ts
test("constructors preserve their temporal category", () => {
  expect(atemporal.instant("2026-07-15T10:00:00Z").toString()).toBe("2026-07-15T10:00:00Z");
  expect(atemporal.date("2026-07-15").toString()).toBe("2026-07-15");
  expect(atemporal.plainDateTime("2026-07-15T10:00:00").toString()).toBe("2026-07-15T10:00:00");
});

test("zonedDateTime rejects an ambiguous local value unless told otherwise", () => {
  expect(() => atemporal.zonedDateTime("2026-11-01T01:30:00", {
    timeZone: "America/New_York",
  })).toThrow();
  expect(atemporal.zonedDateTime("2026-11-01T01:30:00", {
    timeZone: "America/New_York", disambiguation: "later",
  }).offset).toBe("-05:00");
});
```

- [ ] **Step 2: Run the runtime contracts to verify failure.**

Run: `pnpm exec jest src/__tests__/contracts/temporal-constructors.contract.test.ts --runInBand`

Expected: runtime failures because no constructor functions are attached.

- [ ] **Step 3: Implement one category per module.**

Use only `Temporal` from `src/core/temporal-api.ts`. `instant.ts` calls
`Temporal.Instant.from` for offset-bearing ISO strings, `fromEpochMilliseconds`
for finite numbers, and `fromEpochMilliseconds(date.getTime())` for `Date`.
`date.ts` calls `Temporal.PlainDate.from`; `plain-date-time.ts` calls
`Temporal.PlainDateTime.from`; `zoned-date-time.ts` calls
`Temporal.ZonedDateTime.from` with explicit `{ disambiguation, overflow }`.
Validate category-specific input before conversion and throw `InvalidDateError`
with the constructor name in the message. Attach the four functions in
`src/index.ts` and export their input types.

- [ ] **Step 4: Run constructors plus native/polyfill integration tests.**

Run: `pnpm exec jest src/__tests__/contracts/temporal-constructors.contract.test.ts src/__tests__/integration/temporal-detection-integration.test.ts --runInBand`

Expected: constructors return the central selected Temporal implementation.

- [ ] **Step 5: Commit raw constructors.**

```bash
git add src/constructors src/index.ts src/__tests__/contracts/temporal-constructors.contract.test.ts
git commit -m "feat: add explicit raw Temporal constructors"
```

### Task 4: Deprecate the wrapper facade without removing it

**Files:**
- Modify: `src/types.ts`
- Modify: `src/index.ts`
- Modify: `docs/api/creating-instances.md`
- Modify: `docs/migration/temporal.md`
- Create: `docs/migration/v2.md`
- Test: `src/__tests__/contracts/v1-facade.contract.test.ts`

- [ ] **Step 1: Write compatibility-facade tests.**

```ts
test("v1 callable facade remains available in v2", () => {
  const wrapper = atemporal("2026-07-15T10:00:00Z", "UTC");
  expect(wrapper.isValid()).toBe(true);
  expect(wrapper.format("YYYY-MM-DD")).toBe("2026-07-15");
});
```

- [ ] **Step 2: Run the compatibility test before annotations.**

Run: `pnpm exec jest src/__tests__/contracts/v1-facade.contract.test.ts --runInBand`

Expected: pass before and after the deprecation annotation; this protects against accidental removal.

- [ ] **Step 3: Add only JSDoc deprecation.**

Place `/** @deprecated Use atemporal.instant(), date(), plainDateTime(), or
zonedDateTime() for new code. The wrapper facade remains until v3. */` on the
call signature and `from`. Do not emit runtime warnings and do not change
existing return values.

- [ ] **Step 4: Write v2 migration mapping.**

Create a table mapping log/webhook timestamps to `instant`, birthdays/invoice
dates to `date`, business-hour templates to `plainDateTime`, and scheduled
events to `zonedDateTime`. Include one before/after TypeScript example for each.

- [ ] **Step 5: Verify docs, facade, and type resolution.**

Run: `pnpm run docs:build && git restore --worktree docs/.vitepress/dist && pnpm exec jest src/__tests__/contracts/v1-facade.contract.test.ts --runInBand && pnpm run build && pnpm run fixtures:contract`

Expected: docs build, facade contract, package build, and consumer type fixtures pass.

- [ ] **Step 6: Commit facade migration.**

```bash
git add src/types.ts src/index.ts docs/api/creating-instances.md docs/migration/temporal.md docs/migration/v2.md src/__tests__/contracts/v1-facade.contract.test.ts
git commit -m "docs: add v2 temporal model migration"
```

### Task 5: Validate the v2 release candidate and publish the validated tarball

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `integration/node-esm/src/index.ts`
- Modify: `integration/node-cjs/index.cjs`
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Add raw-constructor consumer fixture assertions.**

```ts
import atemporal from "atemporal";

if (atemporal.instant("2026-07-15T10:00:00Z").epochMilliseconds <= 0) throw new Error("instant failed");
if (atemporal.date("2026-07-15").day !== 15) throw new Error("date failed");
if (atemporal.plainDateTime("2026-07-15T10:00:00").hour !== 10) throw new Error("plainDateTime failed");
```

- [ ] **Step 2: Verify the new constructor fixture against the release artifact.**

Run: `pnpm run build && pnpm run pack:artifact && pnpm run fixtures:contract`

Expected: success after the Task 3 implementation is included in the tarball;
the Task 3 contract tests already provide the required red test before that
implementation exists.

- [ ] **Step 3: Create `2.0.0-rc.1` with complete migration notes.**

Set the prerelease version through the repository release workflow/versioning
tool. Add a changelog section that names the Node floor, new constructors,
deprecated wrapper facade, default strict DST policy, and exact v1 migration
links. Do not publish from a rebuilt directory after validation.

- [ ] **Step 4: Run every release gate on one tarball.**

Run: `pnpm run build && pnpm run pack:artifact && pnpm run test:ci --runInBand && pnpm run fixtures:contract && pnpm run fixtures:extended && pnpm run size:report && pnpm run bench:gate && pnpm run supply-chain && pnpm run docs:build`

Expected: every command succeeds; preserve the tarball, size reports, benchmark
reports, and SBOM even if a later gate fails.

- [ ] **Step 5: Commit and open the release-candidate PR.**

```bash
git add package.json CHANGELOG.md integration .github/workflows/release.yml docs src
git commit -m "chore: prepare v2.0.0-rc.1"
git push -u origin codex/v2-temporal-model
gh pr create --base main --head codex/v2-temporal-model --title "feat!: introduce explicit Temporal value constructors"
```

- [ ] **Step 6: Publish only after merged CI is green.**

Trigger the trusted-publisher release workflow. Confirm it publishes the exact
artifact hash created in Step 4, then install `atemporal@2.0.0-rc.1` into clean
Node ESM and CommonJS directories and rerun the fixture programs.
