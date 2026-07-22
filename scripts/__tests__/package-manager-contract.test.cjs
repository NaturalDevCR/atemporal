'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

test('root development is pinned to pnpm', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  expect(manifest.packageManager).toBe('pnpm@11.13.1');
  expect(manifest.scripts['supply-chain']).toBe('pnpm run licenses:check && pnpm audit --audit-level=high');
  expect(fs.existsSync(path.join(root, 'pnpm-lock.yaml'))).toBe(true);
  expect(fs.existsSync(path.join(root, 'package-lock.json'))).toBe(false);
});

test('workflow pnpm setup stays compatible with the supported Node 22+ matrix', () => {
  const workflowRoot = path.join(root, '.github', 'workflows');
  const workflows = fs.readdirSync(workflowRoot)
    .filter((name) => name.endsWith('.yml'))
    .map((name) => fs.readFileSync(path.join(workflowRoot, name), 'utf8'))
    .join('\n');

  expect(workflows).not.toContain('version: 10.34.5');
  expect((workflows.match(/version: 11\.13\.1/g) || []).length).toBeGreaterThan(0);
  expect(workflows).toContain('node-version: [22.x, 24.x, 26.x]');
});

test('pnpm manifest declares strict test types and audited transitive overrides', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const workspace = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');

  expect(manifest.devDependencies['@jest/globals']).toBe('^30.4.1');
  expect(manifest.devDependencies.esbuild).toBe('^0.28.1');
  expect(manifest.devDependencies['license-checker']).toBeUndefined();
  expect(workspace).toContain('packageExtensions:');
  expect(workspace).toContain('vite@6.4.3:');
  expect(workspace).toContain('esbuild: 0.25.12');
  expect(workspace).toContain('tsup>esbuild: 0.28.1');
  expect(workspace).toContain('qs: 6.15.2');
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

test('Jest scripts enable the Node VM modules required by lazy plugin imports', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  for (const scriptName of ['test', 'test:ci', 'test:performance']) {
    expect(manifest.scripts[scriptName]).toMatch(/^node --experimental-vm-modules \.\/node_modules\/jest\/bin\/jest\.js /);
  }
});

test('lockfiles contain the patched versions for the open Dependabot advisories', () => {
  const rootLock = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
  const workspace = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
  const nextLock = JSON.parse(fs.readFileSync(path.join(root, 'integration', 'extended', 'nextjs', 'package-lock.json'), 'utf8'));

  expect(workspace).toContain("'brace-expansion@^1.1.0': 1.1.16");
  expect(workspace).toContain("'brace-expansion@^2.0.0': 2.1.2");
  expect(workspace).toContain('fast-uri: 3.1.4');
  expect(rootLock).not.toContain('brace-expansion@1.1.15');
  expect(rootLock).not.toContain('brace-expansion@2.1.1');
  expect(rootLock).not.toContain('fast-uri@3.1.3');
  expect(rootLock).not.toContain('js-yaml@3.14.2');
  expect(rootLock).not.toContain("'@babel/core@7.25.9'");

  for (const [location, metadata] of Object.entries(nextLock.packages)) {
    if (location.endsWith('/postcss')) {
      expect(metadata.version).toMatch(/^8\.5\.(1[0-9]|[2-9][0-9])$/);
    }
  }
});
