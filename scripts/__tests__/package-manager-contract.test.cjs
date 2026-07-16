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
