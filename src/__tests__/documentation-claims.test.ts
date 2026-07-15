import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

it('does not claim that Day.js mutates or that atemporal.unix is missing', () => {
  const migration = read('docs/migration/dayjs.md');
  expect(migration).not.toMatch(/Day\.js's `\.add\(\)` mutates/);
  expect(migration).not.toMatch(/does not currently ship a `unix/);
});
