'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('license gate reads the pnpm-installed production dependency closure', () => {
  const result = spawnSync(process.execPath, ['scripts/check-licenses.js'], {
    cwd: path.resolve(__dirname, '..', '..'),
    encoding: 'utf8',
  });

  expect(result.status).toBe(0);
  expect(result.stdout).toContain('License compliance: PASS');
  expect(result.stderr).toBe('');
});
