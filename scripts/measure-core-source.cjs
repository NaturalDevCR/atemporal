'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const { ensureCanonicalDependencies } = require('./measure-release-artifact.cjs');

const root = path.resolve(__dirname, '..');
const fixture = `import atemporal from './src/index.ts';
export const result = atemporal('2026-07-15T10:00:00Z', 'America/Costa_Rica').format('YYYY-MM-DD HH:mm');`;
const fixtureSha256 = createHash('sha256').update(fixture).digest('hex');

function groupFor(input) {
  if (input.startsWith('src/core/parsing/')) return 'parsing';
  if (input.startsWith('src/core/formatting/')) return 'formatting';
  if (input.startsWith('src/core/caching/')) return 'caching';
  if (input.startsWith('src/plugins/')) return 'plugins';
  return 'facade-and-other';
}

async function measureCoreSource() {
  ensureCanonicalDependencies();
  const esbuild = require(path.join(root, 'integration/canonical-bundle/node_modules/esbuild'));
  const result = await esbuild.build({
    absWorkingDir: root,
    stdin: { contents: fixture, sourcefile: 'core-entry.ts', resolveDir: root },
    outdir: path.join(root, 'reports/core-source-bundle'),
    entryNames: 'entry',
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    metafile: true,
    write: false,
    logLevel: 'silent',
    plugins: [{
      name: 'measure-native-core',
      setup(builder) {
        builder.onResolve({ filter: /^\.\/temporal-fallback$/ }, ({ importer }) => {
          if (importer === path.join(root, 'src/core/temporal-detection.ts')) {
            return { path: path.join(root, 'src/core/temporal-fallback-native.ts') };
          }
        });
      },
    }],
  });
  const outputs = result.metafile.outputs;
  const initial = new Set();
  function visit(file) {
    if (initial.has(file)) return;
    initial.add(file);
    for (const imported of outputs[file].imports) {
      if (!imported.external && imported.kind !== 'dynamic-import') visit(imported.path);
    }
  }
  const entry = Object.keys(outputs).find((file) => outputs[file].entryPoint === 'core-entry.ts');
  assert.ok(entry, 'Missing core measurement entry');
  visit(entry);
  const attribution = new Map();
  let initialBytes = 0, initialGzip = 0, totalBytes = 0;
  for (const file of result.outputFiles) {
    const name = path.relative(root, file.path).split(path.sep).join('/');
    const isInitial = initial.has(name);
    totalBytes += file.contents.length;
    if (isInitial) {
      initialBytes += file.contents.length;
      initialGzip += gzipSync(file.contents).length;
    }
    for (const [input, details] of Object.entries(outputs[name].inputs)) {
      assert.ok(!/@js-temporal\/polyfill|\bjsbi\b/.test(input), 'Core measurement must exclude the fallback');
      const value = attribution.get(input) || { input, initialBytes: 0, totalBytes: 0 };
      value.totalBytes += details.bytesInOutput;
      if (isInitial) value.initialBytes += details.bytesInOutput;
      attribution.set(input, value);
    }
  }
  const inputs = [...attribution.values()].sort((a, b) => b.initialBytes - a.initialBytes || a.input.localeCompare(b.input));
  const groups = {};
  for (const value of inputs) {
    const group = groups[groupFor(value.input)] ||= { initialBytes: 0, totalBytes: 0 };
    group.initialBytes += value.initialBytes;
    group.totalBytes += value.totalBytes;
  }
  return { schemaVersion: 1, bundler: { name: 'esbuild', version: esbuild.version }, fixtureSha256,
    mode: 'native-core-source', target: 'es2020', initialBytes, initialGzip, totalBytes, groups, inputs };
}

function enforceBudget(report) {
  const budget = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/core-size-baseline.json'), 'utf8'));
  assert.equal(report.schemaVersion, budget.schemaVersion);
  assert.equal(report.mode, budget.mode, 'Review the baseline when changing the implementation mode');
  assert.equal(report.target, budget.target, 'Review the baseline when changing the JavaScript target');
  assert.equal(report.bundler.version, budget.bundlerVersion, 'Review the baseline when changing the pinned bundler');
  assert.equal(report.fixtureSha256, budget.fixtureSha256, 'Review the baseline when changing the measurement fixture');
  for (const [measurement, limit] of Object.entries(budget.limits)) {
    assert.ok(report[measurement] <= limit, `${measurement}: ${report[measurement]} exceeds ${limit}`);
  }
  for (const input of budget.excludedModules) {
    assert.ok(!report.inputs.some((value) => value.input === input && value.totalBytes > 0),
      `Optional parser machinery entered the core bundle: ${input}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some((value) => value !== '--check')) throw new Error('Usage: measure-core-source.cjs [--check]');
  measureCoreSource().then((report) => {
    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(path.join(root, 'reports/core-source-size.json'), JSON.stringify(report, null, 2) + '\n');
    if (args.includes('--check')) enforceBudget(report);
    console.log(JSON.stringify({ initialBytes: report.initialBytes, initialGzip: report.initialGzip,
      totalBytes: report.totalBytes, groups: report.groups }, null, 2));
  }).catch((error) => { console.error(error); process.exitCode = 1; });
}

module.exports = { measureCoreSource, enforceBudget };
