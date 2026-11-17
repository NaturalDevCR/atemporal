# v3 plugin boundaries

The v2 root re-exported three plugin implementations and the overlap helpers.
Because those same modules are dynamic loader targets, the split build retained
plugin code in an initially loaded shared chunk even when the application only
imported the default factory. Purity annotations alone did not remove that edge.

The default and native roots now expose the factory and core utilities. Import
plugins and overlap helpers from their existing explicit plugin subpaths. The
compat root preserves all six legacy named exports and shares their exact
functions, errors, factory, caches, and plugin state with compat subpaths.
`lazyLoad()` and `lazyLoadMultiple()` remain available for all eight plugins.
See [the migration guide](../migration/v3.md#plugins-and-types).

## Reproducible measurements

Before: [integration commit 95503a6](https://github.com/NaturalDevCR/atemporal/commit/95503a688985a2b1928c2c5d4375a48100132d29).
Run `node scripts/measure-core-source.cjs` at that commit and on this change:
identical fixture, hash, ES2020 native provider, and esbuild 0.25.12.

| Measurement | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Initial minified bytes | 132,589 | 126,742 | 5,847 (4.4%) |
| Initial gzip bytes | 33,744 | 31,151 | 2,593 (7.7%) |
| Total minified bytes | 153,280 | 152,914 | 366 (0.2%) |
| Plugins in initial attribution | 5,532 | 0 | 100% |

Most of this improvement defers code to optional plugin chunks rather than
removing it from the complete build. The baseline rejects any plugin source in
the initial graph while allowing dynamic plugin outputs. It retains the parser
and formatter steps in history. Across the three core steps, initial bytes fall
from 149,911 to 126,742 (15.5%), gzip from 38,118 to 31,151 (18.3%), and total
bytes from 170,602 to 152,914 (10.4%). These source measurements exclude Temporal's
fallback; package and application measurements are reported separately.

Runtime checks cover ESM and CommonJS in all three families, standalone overlap
helpers/error identity, explicit plugin installation, lazy loading, and duplicate
installation. Isolated type checks cover removed default/native root exports and
preserved compat exports in Bundler, Node16, and NodeNext consumers.
