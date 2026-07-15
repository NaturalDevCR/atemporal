# Task 4 report: Day.js documentation integrity

## Scope

Correct public Day.js migration claims, add the versioned Day.js 1.11.21
compatibility matrix, make it discoverable, and regenerate the LLM-facing
documentation. No tarball, fixture, measurement, or workflow implementation
was started.

## RED

Added `src/__tests__/documentation-claims.test.ts` before changing the stale
copy. Running:

```bash
npx jest src/__tests__/documentation-claims.test.ts --runInBand
```

failed as intended (one failed suite and one failed test). Jest reported that
`docs/migration/dayjs.md` matched the false claim that Day.js `.add()` mutates;
the same source also contained the rejected missing-`atemporal.unix` claim.

## GREEN

Replaced those claims with the supported behavior: both libraries are
immutable and `atemporal.unix(seconds)` creates an instance from Unix seconds.
The same focused Jest command then passed with one suite and one test passing.

## Documentation and generated output

- Added `docs/migration/dayjs-compatibility.md`, reviewed against Day.js
  1.11.21, with all five defined categories and explicit rows for construction,
  Unix seconds, immutable add/subtract, formatting, comparisons, time zones,
  duration, locales, relative time, custom plugins, and raw `Date` interop.
- Linked each semantic-difference row to the relevant Day.js migration
  explanation and added the matrix immediately after “From Day.js” in the
  migration sidebar.
- Scoped README and migration claims to the `Temporal.ZonedDateTime` wrapper
  model, documented the four global Jest thresholds and public factory coverage,
  distinguished Codecov's informational role, and added the required
  compatibility-scope wording.
- Replaced the stale single-size figure with generated-size-report links and
  wording that separates core, tarball, and application-bundle measurements;
  `@js-temporal/polyfill` is described as a direct runtime dependency.
- Updated `scripts/generate-llms-txt.js` so its generated TL;DR no longer
  reintroduced the stale size claim and so `llms.txt` includes the new matrix.

`node scripts/generate-llms-txt.js` generated `docs/public/llms.txt` with
5,599 lines (188.7 KB). Content checks confirmed that it contains the corrected
immutability and Unix-copy, the revised size statement, and the compatibility
matrix.

## Verification

```bash
node scripts/generate-llms-txt.js
npx jest src/__tests__/documentation-claims.test.ts --runInBand
npm run docs:build
```

All commands exited 0. The focused test reported one passing suite and one
passing test. VitePress completed its build in 2.07 seconds. It emitted
existing Rolldown plugin-assignment warnings and a `transformWithEsbuild`
deprecation warning, but the build completed successfully. Generated
`docs/.vitepress/dist` output was restored after verification because it is not
part of the Task 4 commit scope.

## Changed files

- `README.md`
- `docs/migration/dayjs.md`
- `docs/migration/index.md`
- `docs/migration/dayjs-compatibility.md`
- `docs/.vitepress/config.mts`
- `scripts/generate-llms-txt.js`
- `docs/public/llms.txt`
- `src/__tests__/documentation-claims.test.ts`
- `.superpowers/sdd/task-4-report.md`

## Self-review

- Confirmed no scoped documentation or generator source retains the rejected
  mutation, missing-`unix`, single-size, or false Day.js-immutability claims.
- Confirmed the matrix has all five definitions, all required reviewed areas,
  and links from semantic-difference rows to `dayjs.md` anchors.
- Ran `git diff --check` successfully before staging.

## Concerns

- The generated size-report links intentionally target the versioned report
  introduced by the later size-report task; the link will resolve once that
  report is added.
- The required “Compatibility guaranteed” and “Compatibility additionally
  validated” wording describes the fixture split specified for the broader
  plan; fixture implementation itself remains out of Task 4 scope.

## Commit

Included in commit `docs: correct Day.js compatibility claims`.
