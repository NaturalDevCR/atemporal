# ADR 0002: Plugin system via `atemporal.extend()` and `lazyLoad()`

**Status:** Accepted
**Date:** 2024-10-02
**Authors:** atemporal maintainers

## Context

Date/time libraries are notorious for accumulating "do everything"
APIs that bloat the bundle. moment.js famously had 70 KB of
locale data. Day.js solved this with a plugin system: only load
what you need.

We want to keep atemporal's core small (under 20 KB gzipped, target)
while still supporting features like relative time, business days,
date range overlap, etc. A plugin system is the right shape.

## Decision

atemporal ships with a **plugin system** with two load modes:

1. **Static (`atemporal.extend(plugin, options?)`)** — synchronously
   installs the plugin and patches the `TemporalWrapper` prototype
   with the plugin's methods.
2. **Dynamic (`atemporal.lazyLoad(name)`)** — returns a `Promise`
   that resolves after installation (`Promise<void>`). Used for code splitting
   and to keep the main bundle small.

A plugin is a function `(wrapperClass, atemporalFactory, options?) => void`.
It may add prototype methods or factory helpers. `extend()` does not use a
return value as a cleanup hook.

Each official plugin is exported as a separate subpath
(`atemporal/plugins/relativeTime`) so consumers can import only
what they use. Webpack, Rollup, and tsup can tree-shake unused
plugins from the main bundle.

### v3 import boundary

Keep the factory and plugins in the same entry family: `atemporal`,
`atemporal/compat`, or `atemporal/native`. Default/native roots no longer
re-export the three previously bundled plugins or overlap helpers/errors;
compat preserves those legacy named exports. The default ESM graph requires
ES2022/top-level await; see [Migrating to v3](../migration/v3.md).

The original core-size target above is a design goal. Current reproducible
measurements are in [the v3 release review](../reports/v3-release-review.md).

## Consequences

**Easier:**
- Consumers can opt into only the features they need. The core
  bundle stays small.
- Plugin authors have a clear, minimal contract.
- We can ship experimental features as plugins without bumping
  the major version.

**Harder:**
- Two loading modes to document (`extend` vs `lazyLoad`).
- Plugin method names must be chosen carefully to avoid collisions.
- Tree-shaking depends on the consumer's bundler being configured
  correctly; we cannot *force* it.

**Given up:**
- The ability to call any plugin method without first installing
  it. This is a feature, not a bug.

## Alternatives considered

1. **No plugin system; ship everything.** Rejected: we care about
   bundle size, and we want to evolve features independently.
2. **Only static plugins; no `lazyLoad`.** Rejected: dynamic loading
   is essential for code splitting in large apps.
3. **Class-based plugins (`new MyPlugin(options)`) instead of
   function-based.** Rejected: more boilerplate for plugin authors
   for no real win.

## References

- [Plugin authoring guide](../plugins/)
- Internal: `src/index.ts` (factory), `src/plugins/`
- ADR 0004 (plugin naming conventions)
