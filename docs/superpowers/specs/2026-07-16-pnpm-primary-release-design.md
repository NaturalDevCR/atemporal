# pnpm-primary CI and trusted npm publishing design

## Goal

Make pnpm the only development and CI package manager while preserving npm-registry artifact compatibility, then publish only the tarball that passes every release gate.

## Decisions

- The repository will declare a pinned `packageManager` value and commit `pnpm-lock.yaml`; `package-lock.json` is removed from the root.
- Local development and every repository workflow use Corepack plus pnpm with a frozen lockfile. Documentation uses pnpm commands.
- `npm pack` remains the artifact producer and `npm publish` remains the registry command. These are registry operations, not a development dependency-manager choice.
- Contract fixtures continue to install the packed tarball with npm. They intentionally prove that npm consumers can install, resolve types, load plugins, and execute the public API. The fixture runner may run project scripts through pnpm only where doing so does not weaken that npm-consumer assertion.
- The release job publishes only the artifact created and validated by the release-validation job. It runs on a GitHub-hosted runner with an npm version that supports trusted publishing, requests `id-token: write`, and has no write token secret.

## Trusted publishing configuration

The npm package owner configures `atemporal` on npmjs.com with this trusted publisher:

- Provider: GitHub Actions
- Owner: `NaturalDevCR`
- Repository: `atemporal`
- Workflow filename: `release.yml`
- Environment: `npm`
- Allowed action: `npm publish`

The release workflow retains the GitHub `npm` environment for deployment approval. npm OIDC accepts only the configured workflow/environment identity and produces provenance without a long-lived npm token.

## CI and release flow

```text
Corepack + pnpm install --frozen-lockfile
  -> pnpm run build
  -> npm pack once
  -> packed-tarball contracts and integration fixtures
  -> size and performance gates
  -> npm publish the same validated tarball through OIDC
```

The PR workflow retains its contract fixtures and records diagnostics. The scheduled and release workflows retain extended integration and performance gates. Any failed gate prevents publication.

## Validation

- `pnpm install --frozen-lockfile`, build, typecheck, unit coverage, and size checks pass locally and in CI.
- The npm-installed contract fixtures pass against one packed tarball.
- Workflow structure tests assert pnpm installation for repository jobs, a single packed artifact, OIDC permission, and an exact-artifact publish command with no `NPM_TOKEN` requirement.
- A release dry run confirms the package version is unpublished before actual publication; the release workflow performs the real publish only after all validation succeeds.

## Security

Never paste npm access tokens into chat, shell history, repository files, workflow YAML, or logs. Revoke any token exposed outside the intended secret store. Trusted publishing is the required publication path; a local `npm login --auth-type=web` is only for interactive account administration and cannot replace OIDC release provenance.
