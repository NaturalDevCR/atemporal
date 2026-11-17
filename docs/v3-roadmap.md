# v3 development roadmap

## Branch and release policy

- `main` stays on stable 2.x while `codex/v3.0.0` integrates reviewed v3 work.
- Each improvement gets a focused `codex/*` branch and PR targeting integration.
- CI runs on both lines; publishing and hosted docs deployment stay on `main`.
- Keep the stable package/manifest version during development. The final release
  PR sets both to 3.0.0 and finalizes the changelog and supported-version table.
- Review the complete integration diff against `main` before merging the final
  release PR; the existing tarball validation/trusted publishing flow then releases it.

## Planned PRs

1. **Conditional Temporal loading and independent types.** Default ESM loads
   fallback only when needed; CommonJS stays synchronous; compatibility/native
   entries and plugin families are explicit. Include the v3 migration guide.
2. **Reproducible core attribution and bundle budgets.** Report initial/total
   payloads and parser, formatting, cache, plugin, and core attribution. Compare
   the same representative applications with a pinned bundler.
3. **Lean synchronous parsing runtime.** Separate normal parsing from asynchronous
   coordination, optimization reports, and benchmarking while preserving accepted
   inputs, timezones/calendars, strict errors, caches, and public diagnostics.
4. **Formatting and cache modularity.** Separate optional optimization machinery
   from the normal formatter; consolidate duplication only with measured gains.
5. **Plugin boundaries and release.** Review initial plugin dependencies, document
   deliberate API changes, validate size/performance evidence, and prepare v3.0.0.

The existing Temporal work is the first PR. Later improvements must include a
before/after measurement and preserve the semantic contracts they touch. Refine
this sequence from measurements instead of assuming a target bundle size.

## Validation gates

- Type checking, semantic tests, and existing coverage thresholds.
- Native/fallback execution across supported Node versions, including concurrent
  imports, plugin order, and implementation identity.
- Packed artifact contracts with supported TypeScript resolvers/versions.
- Vite, Webpack, Next.js, and ES2020/IIFE compatibility where applicable.
- Initial and total bytes reported separately; moving fallback bytes into a
  different chunk must never be reported as removing them from the total build.
- Performance gates retain the reviewed baseline instead of replacing it to
  hide a regression.
