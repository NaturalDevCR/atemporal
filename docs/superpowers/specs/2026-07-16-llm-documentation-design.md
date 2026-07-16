# LLM Documentation Accuracy Design

## Goal

Make the hosted `llms.txt` a reliable consumer guide for coding agents: concise
at the top, accurate about the published package, and mechanically protected
against generated-file drift.

## Scope

- Correct inaccurate installation, lazy-loading, plugin-tracking, and native
  Temporal statements in their source documentation.
- Put the consumer-critical contract in the `llms.txt` TL;DR: pnpm-first and
  npm installation, ESM and CommonJS imports, explicit time zones,
  `Temporal.ZonedDateTime`/Day.js compatibility boundaries, official plugin
  lifecycle, and native/polyfill detection.
- Keep the complete generated reference, but correct its method signatures and
  plugin semantics.
- Add a test that fails when `docs/public/llms.txt` is not the exact output of
  `scripts/generate-llms-txt.js`.

## Non-goals

- Do not invent APIs, promise full Day.js compatibility, or copy the entire
  TypeScript declaration surface into the TL;DR.
- Do not make browser-version claims unless the project validates them.
- Do not replace the deterministic generator with an AST extractor in this
  change; the index remains curated, with accuracy verified by tests and
  reviewed source updates.

## Information Architecture

The generated file keeps three layers:

1. **Agent contract:** short, prescriptive rules and minimal ESM/CJS examples.
2. **Method and plugin index:** signatures and stable official-plugin semantics
   for fast lookup.
3. **Full source documentation:** concatenated human guides, API pages,
   migration material, security guidance, and ADRs.

The agent contract will direct readers to `getTemporalInfo()` rather than
assuming native Temporal availability, and to the Day.js compatibility matrix
rather than implying broad API equivalence.

## Source of Truth and Drift Control

`scripts/generate-llms-txt.js` remains the sole writer of
`docs/public/llms.txt`. A Jest contract test will execute the generator in a
temporary copy of the repository and compare its emitted file byte-for-byte to
the committed public asset. This avoids mutating the developer checkout and
makes a stale generated file a blocking failure.

## Verification

- The documentation contract test detects a deliberately stale generated file
  in its temporary copy.
- The test passes against the committed source and generated asset.
- `pnpm run docs:build` succeeds from clean source.
- Relevant API and documentation contract tests remain green.
