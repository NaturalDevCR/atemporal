'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('contributor guidance is pnpm-first and tokenless', () => {
  const text = read('CONTRIBUTING.md');

  expect(text).toContain('pnpm install --frozen-lockfile');
  expect(text).toContain('pnpm run test');
  expect(text).toContain('trusted publishing');
  expect(text).not.toContain('NPM_TOKEN');
});

test('repository templates and security ADR describe the pnpm/OIDC workflow', () => {
  const template = read('.github/PULL_REQUEST_TEMPLATE.md');
  const adr = read('docs/adr/0007-supply-chain-hardening.md');

  expect(template).toContain('pnpm run build');
  expect(adr).toContain('pnpm audit --audit-level=high');
  expect(adr).toContain('pnpm sbom');
  expect(adr).toContain('npm trusted publishing');
});
