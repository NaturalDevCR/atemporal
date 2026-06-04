/**
 * @file Smoke test for the built CJS/ESM bundles.
 *
 * This script is run by CI after `npm run build` to confirm that:
 * - the CJS bundle can be `require`d and exposes the public API,
 * - the ESM bundle can be `import`ed and exposes the public API,
 * - the DTS bundle has the expected public types.
 *
 * It exits with code 0 on success, non-zero on failure.
 *
 * Note on file extensions: tsup emits CJS as `.js` and ESM as `.mjs`
 * when the package does not declare `"type": "module"` in package.json
 * (which is the case for atemporal). The previous version of this
 * script looked for `.cjs` and was therefore permanently failing.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(__dirname, '..', 'dist');

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

const checks: Check[] = [];

// 1. CJS bundle exists and is non-empty.
const cjsPath = resolve(DIST, 'index.js');
if (existsSync(cjsPath)) {
  const size = statSync(cjsPath).size;
  checks.push({
    name: 'CJS bundle exists',
    ok: size > 1024,
    detail: `${cjsPath} (${(size / 1024).toFixed(1)} KB)`,
  });
} else {
  checks.push({ name: 'CJS bundle exists', ok: false, detail: cjsPath });
}

// 2. ESM bundle exists and is non-empty.
const esmPath = resolve(DIST, 'index.mjs');
if (existsSync(esmPath)) {
  const size = statSync(esmPath).size;
  checks.push({
    name: 'ESM bundle exists',
    ok: size > 1024,
    detail: `${esmPath} (${(size / 1024).toFixed(1)} KB)`,
  });
} else {
  checks.push({ name: 'ESM bundle exists', ok: false, detail: esmPath });
}

// 3. DTS bundle exists and is non-empty.
const dtsPath = resolve(DIST, 'index.d.ts');
if (existsSync(dtsPath)) {
  const size = statSync(dtsPath).size;
  const text = readFileSync(dtsPath, 'utf8');
  checks.push({
    name: 'DTS bundle exists',
    ok: size > 256,
    detail: `${dtsPath} (${(size / 1024).toFixed(1)} KB)`,
  });
  // 4. DTS exposes the public API.
  const required = ['AtemporalFactory', 'TemporalWrapper', 'presets'];
  for (const token of required) {
    checks.push({
      name: `DTS exposes \`${token}\``,
      ok: text.includes(token),
      detail: token,
    });
  }
} else {
  checks.push({ name: 'DTS bundle exists', ok: false, detail: dtsPath });
}

// 5. Each plugin subpath bundle exists.
const plugins = [
  'plugins/relativeTime',
  'plugins/customParseFormat',
  'plugins/advancedFormat',
  'plugins/weekDay',
  'plugins/durationHumanizer',
  'plugins/dateRangeOverlap',
  'plugins/businessDays',
  'plugins/timeSlots',
];
for (const p of plugins) {
  const cjs = resolve(DIST, `${p}.js`);
  const esm = resolve(DIST, `${p}.mjs`);
  const dts = resolve(DIST, `${p}.d.ts`);
  const ok = existsSync(cjs) && existsSync(esm) && existsSync(dts);
  checks.push({
    name: `Plugin subpath \`${p}\` exists`,
    ok,
    detail: ok ? 'CJS+ESM+DTS' : 'missing one or more',
  });
}

// 6. Load the CJS bundle and assert the public API works.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(cjsPath);
  const atemporal = mod.default ?? mod;
  const d = atemporal('2024-01-15');
  const ok =
    typeof atemporal === 'function' &&
    typeof d.isValid === 'function' &&
    d.isValid() === true;
  checks.push({
    name: 'CJS bundle runtime smoke test',
    ok,
    detail: `atemporal('2024-01-15').isValid() === ${d.isValid()}`,
  });
} catch (err) {
  checks.push({
    name: 'CJS bundle runtime smoke test',
    ok: false,
    detail: (err as Error).message,
  });
}

let allOk = true;
for (const c of checks) {
  const icon = c.ok ? '✅' : '❌';
  console.log(`${icon} ${c.name}: ${c.detail}`);
  if (!c.ok) allOk = false;
}

if (!allOk) {
  console.error('\n❌ bundle smoke test FAILED');
  process.exit(1);
}
console.log('\n✅ bundle smoke test passed');

