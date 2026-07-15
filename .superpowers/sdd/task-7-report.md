# Task 7 report: production bundler integration fixtures

## RED

The production-output checks were added before their fixture implementations.
Running the three fixture test scripts then failed as intended:

- Vite: `Expected a JavaScript production asset in dist/assets`.
- Webpack: `Expected the minified production bundle at dist/main.js`.
- Next.js: `MODULE_NOT_FOUND` for the not-yet-created
  `verify-production.cjs`.

After adding the Vite entrypoint, installing only its locked Vite toolchain,
and before the runner installed the packed package, this command failed as
required:

```sh
npm run build --prefix integration/extended/vite
```

Vite reported `[vite]: Rolldown failed to resolve import "atemporal"` from
`src/main.ts`. This proves the fixture is a real consumer of the package rather
than a source-tree alias.

## GREEN

Added source fixtures for Vite, Webpack, and Next.js, each importing
`atemporal` and `atemporal/plugins/relativeTime`, extending the plugin, and
formatting the Costa Rica result `2026-07-16 04:00`.

- Vite 8.0.16 is locked and builds a minified `dist/assets/*.js` asset.
- Webpack 5.108.4 with webpack-cli 7.2.1 is locked, uses `mode: 'production'`
  with `optimization.minimize: true`, and emits `dist/main.js`.
- Next.js 16.2.10 with React 19.2.4 is locked. Its server component renders
  `#server-date`; its client component independently renders `#client-date`.
  The production verifier uses `spawn` to execute `next start -p 3210`, waits
  on `/api/health`, fetches `/`, asserts both date element ids and the expected
  formatted value, then sends `SIGTERM` in `finally`, waits up to ten seconds,
  and uses `SIGKILL` only if that graceful exit times out.

## Full shared-tarball verification

The following completed with exit code 0:

```sh
npm run build && npm run pack:artifact && npm run fixtures:extended
```

The existing disposable runner copied every fixture, ran `npm ci`, installed
the one absolute tarball path recorded by `artifacts/package-artifact.json`,
then ran `typecheck`, `build`, and `test` in each copy. It generated reports
for all three fixtures:

- `reports/fixtures/extended-nextjs.json`
- `reports/fixtures/extended-vite.json`
- `reports/fixtures/extended-webpack.json`

Each reported the effective `@js-temporal/polyfill` version as `0.5.1`.
Vite's build emitted minified JavaScript assets, Webpack emitted its production
bundle, and Next's optimized build completed before its `next start` HTTP test.
The final verifier also prints `Verified server and client dates through next
start HTTP response.` on the successful lifecycle path.

## Changed files

- `integration/extended/vite/*`
- `integration/extended/webpack/*`
- `integration/extended/nextjs/*`

No changes to the shared fixture runner or root package lockfile were needed:
Task 6 already supplied the required tarball-consuming disposable runner and
the root `fixtures:extended` script.

## Concerns

Next emitted its informational workspace-root warning during the disposable
fixture build because the repository has multiple lockfiles. The build and HTTP
lifecycle test still completed successfully; no toolchain incompatibility was
observed.

Webpack completed successfully but warned that an unrelated lazy `./plugins`
import inside `atemporal`'s built index is not exported by the package. The
fixture imports and extends `relativeTime` directly, so the exercised
production path bundled and ran successfully. Webpack also emitted its normal
recommended asset-size warnings because the Temporal polyfill is included in
the production bundle. Neither warning was suppressed or treated as a passing
assertion by this fixture task.
