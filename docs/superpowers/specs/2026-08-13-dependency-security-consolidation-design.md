# Dependency Security Consolidation Design

## Goal

Consolidate the currently open Dependabot updates into the existing `codex/fix-ci` branch, remove all known dependency vulnerabilities across the repository manifests, and produce one validated pull request without merging it automatically.

## Context and root cause

GitHub reports 25 open Dependabot alerts, but they represent duplicate findings across manifests. The affected package families are `next`, `postcss`, `fast-uri`, `js-yaml`, and `nanoid`. The current branch already contains patched versions for `next`, `postcss`, `fast-uri`, and `nanoid`; local `pnpm audit` identifies `js-yaml@3.15.0` as the remaining high-severity finding, while the default branch still has the older dependency state that generated the open alerts.

Seven open Dependabot PRs also target routine dependency and GitHub Action updates. Their checks fail on dependency auditing because they are based directly on the stale default branch rather than on the existing security/CI fixes.

## Chosen approach

Use the current branch as the integration baseline and apply the union of the seven Dependabot patches plus the remaining security fix. This avoids merging stale PRs independently and makes the lockfile state auditable as one unit.

The consolidated update will:

- Pin `js-yaml` to patched `3.15.1` through the workspace override.
- Keep `next` at `16.2.11`, `fast-uri` at `3.1.5`, and `nanoid` at a patched release.
- Move `postcss` consistently to `8.5.26` where the existing overrides apply.
- Apply the open PR updates for `ts-jest@29.4.12`, `@types/node@26.1.2`, and `vue@3.5.41`.
- Apply `pnpm/action-setup@v6.0.10` and `google/osv-scanner-action@v2.5.0` across workflows.
- Remove nonexistent `automated` and `ci` labels from Dependabot configuration so future PR creation does not emit metadata warnings; preserve the existing `dependencies` label.

## Files and data flow

The root `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` define the primary workspace graph and security overrides. The extended fixtures use independent npm manifests and lockfiles, so their `package.json` and `package-lock.json` files will be updated independently and validated with npm-based checks. The `.github/workflows/*.yml` files consume the action versions from Dependabot PR 47. `.github/dependabot.yml` controls future PR metadata.

No application runtime code is expected to change. The package graph is updated first, lockfiles are regenerated using the repository's pinned package manager, and the resulting graph is verified before any remote GitHub write.

## Verification strategy

Run, in order:

1. Frozen installation for the pnpm workspace and clean lockfile checks.
2. High- and full-severity pnpm audits, plus npm audits for each independent fixture lockfile.
3. OSV scanning using the repository configuration.
4. Typecheck, build, unit/contract tests, package artifact checks, and extended fixture tests.
5. A final diff and GitHub alert/PR review before pushing and opening the consolidated PR.

The consolidated PR will be created after local verification. Existing Dependabot PRs remain open until the new PR's remote checks pass; they can then be closed as superseded. The PR will not be merged automatically.

## Scope boundaries

This work resolves dependency and Dependabot findings visible in the repository manifests. It does not disable security scanning, suppress advisories, merge into `main`, or make unrelated application refactors.
