'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

test('root development is pinned to pnpm', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  expect(manifest.packageManager).toBe('pnpm@11.13.1');
  expect(fs.existsSync(path.join(root, 'pnpm-lock.yaml'))).toBe(true);
  expect(fs.existsSync(path.join(root, 'package-lock.json'))).toBe(false);
});

test('pnpm permits only the reviewed dependency build scripts', () => {
  const workspace = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');

  expect(workspace).toContain('allowBuilds:');
  expect(workspace).toMatch(/esbuild:\s*true/);
  expect(workspace).toMatch(/unrs-resolver:\s*true/);
});

test('Stryker resolves plugins through pnpm', () => {
  const stryker = JSON.parse(fs.readFileSync(path.join(root, 'stryker.config.json'), 'utf8'));

  expect(stryker.packageManager).toBe('pnpm');
  expect(stryker.plugins).toEqual([
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker',
  ]);
});

test('lockfiles contain the patched versions for the open Dependabot advisories', () => {
  const rootLock = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
  const nextLock = JSON.parse(fs.readFileSync(path.join(root, 'integration', 'extended', 'nextjs', 'package-lock.json'), 'utf8'));

  expect(rootLock).not.toContain('js-yaml@3.14.2');
  expect(rootLock).not.toContain("'@babel/core@7.25.9'");

  for (const [location, metadata] of Object.entries(nextLock.packages)) {
    if (location.endsWith('/postcss')) {
      expect(metadata.version).toMatch(/^8\.5\.(1[0-9]|[2-9][0-9])$/);
    }
  }
});
