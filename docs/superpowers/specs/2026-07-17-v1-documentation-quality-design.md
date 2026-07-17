# v1 Documentation and Quality Design

## Goal

Make consumer and agent documentation concise, navigable, and mechanically
accurate while reducing test-suite maintenance cost without lowering behavioural
assurance.

## Scope

This is a backward-compatible v1.6 release. It does not add runtime features
other than documentation for the v1.5 public API, and it does not change
coverage thresholds, release gates, package exports, or supported environments.

## LLM documentation layout

Generate two files from the canonical Markdown documentation:

```text
docs/public/llms.txt       concise operational guide, maximum 16 KiB
docs/public/llms-full.txt  complete generated reference
```

`llms.txt` contains only: installation and imports, public API selection,
timezone/DST rules, plugin policy, error policy, compatibility contract, and
links to the detailed sections in `llms-full.txt` and the public site. It must
not duplicate full API prose. `llms-full.txt` contains the ordered concatenation
of approved user documentation, excluding internal plans, ADR templates,
generated VitePress output, and reports that are not part of the public API.

Add a generated "choose the API" table covering: event instant, local civil
date-time, date-only input, trusted boundary parsing, compatibility parsing,
formatting, durations, ranges, and plugin extension. Each row states the API,
whether a timezone is required, and its error result.

The docs build and a dedicated contract test must regenerate both files in an
isolated directory and byte-compare them to committed assets. The test also
enforces the concise file size and bans deep `atemporal/src/` imports from
consumer-facing documentation.

## Documentation ownership

`docs/` is the source of truth. `docs/public/llms*.txt` are generated assets.
The generator has one explicit ordered source list so a source addition cannot
silently alter either guide. VitePress exposes both files at the site root.

The public performance guide uses only documented factory APIs. Migration docs
link to the Day.js compatibility matrix and explicitly direct users to the
strict parsing policy for untrusted input and DST-sensitive workflows.

## Test-suite restructuring

Inventory tests whose filename or assertion purpose is coverage-only. Move each
unique behaviour into a named contract suite grouped by public concern:

```text
src/__tests__/contracts/parsing.contract.test.ts
src/__tests__/contracts/formatting.contract.test.ts
src/__tests__/contracts/plugins.contract.test.ts
src/__tests__/contracts/invalid-input.contract.test.ts
src/__tests__/contracts/temporal-runtime.contract.test.ts
```

Delete an old coverage-focused test only after every behaviour it exercises is
represented by an assertion with an observable public outcome. Keep property,
fuzz, performance, mutation, package-artifact, integration, and security tests
as distinct suites. Preserve the existing global Jest thresholds and Stryker
gate.

## Non-goals

- Creating separate React, Vue, Svelte, or Angular integration guides.
- Teaching undocumented internals to agents.
- Reducing coverage solely to make refactoring easier.
- Rewriting all tests or source architecture in one release.
