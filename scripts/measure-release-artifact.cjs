'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');

const projectRoot = path.resolve(__dirname, '..');
const canonicalFixture = path.join(projectRoot, 'integration', 'canonical-bundle');
const reportsDirectory = path.join(projectRoot, 'reports');

function gzipSize(buffer) {
  return zlib.gzipSync(buffer, { mtime: 0 }).length;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function packageVersion(packageName) {
  try {
    const entry = require.resolve(packageName);
    let directory = path.dirname(entry);
    while (directory !== path.dirname(directory)) {
      const packageJson = path.join(directory, 'package.json');
      if (fs.existsSync(packageJson)) return readJson(packageJson).version || null;
      directory = path.dirname(directory);
    }
    return null;
  } catch {
    return null;
  }
}

function commandOutput(command, args) {
  const result = childProcess.spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function parseLimit(limit) {
  const match = String(limit).trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|bytes?)?$/i);
  if (!match) throw new Error(`Unparseable limit: ${limit}`);
  const units = (match[2] || 'b').toLowerCase();
  const multiplier = units.startsWith('k') ? 1024 : units.startsWith('m') ? 1024 * 1024 : 1;
  return Number(match[1]) * multiplier;
}

function measureFile(file) {
  const buffer = fs.readFileSync(file);
  return { raw: buffer.length, gzip: gzipSize(buffer) };
}

function measureCoreBundles() {
  return {
    cjs: measureFile(path.join(projectRoot, 'dist', 'index.js')),
    esm: measureFile(path.join(projectRoot, 'dist', 'index.mjs')),
  };
}

function coreBudgetResults(core) {
  const configuration = readJson(path.join(projectRoot, '.size-limit.json'));
  return configuration.map((entry) => {
    const format = entry.path.endsWith('.mjs') ? 'esm' : 'cjs';
    const actualBytes = entry.gzip ? core[format].gzip : core[format].raw;
    const limitBytes = parseLimit(entry.limit);
    return {
      name: entry.name,
      actualBytes,
      limitBytes,
      baselineBytes: null,
      baselineDeltaBytes: null,
      percentDelta: null,
      status: actualBytes <= limitBytes ? 'pass' : 'fail',
    };
  });
}

function classifyInput(input) {
  const normalized = input.split(path.sep).join('/');
  if (normalized.includes('/node_modules/@js-temporal/polyfill/')) return '@js-temporal/polyfill';
  if (normalized.startsWith(`${projectRoot.split(path.sep).join('/')}/dist/`) || normalized.includes('/node_modules/atemporal/')) {
    return 'atemporal';
  }
  return 'runtime-or-other';
}

function bundleAttribution(metafile) {
  const attribution = { atemporal: 0, '@js-temporal/polyfill': 0, 'runtime-or-other': 0 };
  for (const output of Object.values(metafile.outputs)) {
    for (const [input, details] of Object.entries(output.inputs || {})) {
      attribution[classifyInput(path.resolve(canonicalFixture, input))] += details.bytesInOutput || 0;
    }
  }
  return attribution;
}

function resolvedFixturePackageInput(metafile, packageName) {
  const normalizedPackageName = packageName.split(path.sep).join('/');
  const marker = `node_modules/${normalizedPackageName}/`;
  const input = Object.keys(metafile.inputs).find((candidate) => candidate.split(path.sep).join('/').includes(marker));
  if (!input) throw new Error(`Canonical metafile did not resolve ${packageName}`);

  const normalizedInput = input.split(path.sep).join('/');
  const packageRoot = path.join(canonicalFixture, normalizedInput.slice(0, normalizedInput.indexOf(marker) + marker.length - 1));
  return {
    path: path.join(canonicalFixture, normalizedInput),
    version: readJson(path.join(packageRoot, 'package.json')).version,
  };
}

function ensureCanonicalDependencies() {
  const esbuildPackage = path.join(canonicalFixture, 'node_modules', 'esbuild', 'package.json');
  if (fs.existsSync(esbuildPackage)) return;
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = childProcess.spawnSync(npm, ['ci', '--ignore-scripts'], {
    cwd: canonicalFixture,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Unable to install canonical fixture dependencies: ${result.stderr || result.stdout}`);
  }
}

function buildCanonicalBundle(name, entryPoint) {
  const esbuild = require(path.join(canonicalFixture, 'node_modules', 'esbuild'));
  const distDirectory = path.join(canonicalFixture, 'dist');
  const outfile = path.join(distDirectory, `${name}.mjs`);
  const result = esbuild.buildSync({
    absWorkingDir: canonicalFixture,
    bundle: true,
    entryPoints: [entryPoint],
    format: 'esm',
    logLevel: 'silent',
    metafile: true,
    minify: true,
    outfile,
    platform: 'browser',
    preserveSymlinks: true,
    alias: {
      '@js-temporal/polyfill': path.join(canonicalFixture, 'node_modules', '@js-temporal', 'polyfill', 'dist', 'index.esm.js'),
    },
    sourcemap: false,
    target: ['es2020'],
  });
  const emittedFiles = Object.keys(result.metafile.outputs)
    .map((file) => path.resolve(canonicalFixture, file))
    .filter((file) => fs.existsSync(file));
  const total = emittedFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  fs.writeFileSync(`${outfile}.meta.json`, `${JSON.stringify(result.metafile, null, 2)}\n`);
  return {
    total,
    files: emittedFiles.map((file) => path.relative(projectRoot, file)),
    attribution: bundleAttribution(result.metafile),
    resolvedInputs: {
      temporalPolyfill: resolvedFixturePackageInput(result.metafile, '@js-temporal/polyfill'),
    },
  };
}

function buildCanonicalBundles() {
  const distDirectory = path.join(canonicalFixture, 'dist');
  ensureCanonicalDependencies();
  fs.rmSync(distDirectory, { recursive: true, force: true });
  fs.mkdirSync(distDirectory, { recursive: true });
  return {
    canonicalCoreBundle: buildCanonicalBundle('core', path.join(canonicalFixture, 'core-entry.ts')),
    canonicalRelativeTimeBundle: buildCanonicalBundle('relative-time', path.join(canonicalFixture, 'plugin-entry.ts')),
  };
}

function canonicalBudgetResults(canonicalBundles, budgets) {
  return Object.entries(budgets.canonicalBundles).map(([name, budget]) => {
    const actualBytes = canonicalBundles[name].total;
    const baselineDeltaBytes = actualBytes - budget.baselineBytes;
    return {
      name,
      actualBytes,
      limitBytes: budget.limitBytes,
      baselineBytes: budget.baselineBytes,
      baselineDeltaBytes,
      percentDelta: budget.baselineBytes === 0 ? null : (baselineDeltaBytes / budget.baselineBytes) * 100,
      status: actualBytes <= budget.limitBytes ? 'pass' : 'fail',
    };
  });
}

function canonicalTemporalPolyfillVersion(canonicalBundles) {
  const versions = new Set(Object.values(canonicalBundles).map((bundle) => bundle.resolvedInputs.temporalPolyfill.version));
  if (versions.size !== 1) throw new Error(`Canonical bundles resolved different Temporal polyfill versions: ${[...versions].join(', ')}`);
  return versions.values().next().value;
}

function buildSizeReport(input) {
  const canonicalResults = canonicalBudgetResults(input.canonicalBundles, { canonicalBundles: input.budgets });
  const results = [...input.coreResults, ...canonicalResults];
  return {
    schemaVersion: 1,
    commitSha: input.commitSha,
    generatedAtUtc: input.generatedAtUtc,
    environment: input.environment,
    tools: {
      typescript: input.tools.typescript || null,
      canonicalBundler: input.tools.canonicalBundler,
      vite: null,
      webpack: null,
      next: null,
      dayjs: input.tools.dayjs,
      temporalPolyfill: input.tools.temporalPolyfill,
      atemporal: input.tools.atemporal,
    },
    tarball: input.tarball,
    mode: 'production',
    executedSuites: ['core-size', 'canonical-core-bundle', 'canonical-plugin-bundle'],
    measurements: {
      core: input.core,
      canonicalBundles: input.canonicalBundles,
    },
    budgets: Object.entries(input.budgets).map(([name, budget]) => ({ name, ...budget })),
    results,
    status: results.every((result) => result.status === 'pass') ? 'pass' : 'fail',
  };
}

function markdownReport(report) {
  const lines = [
    '# Release artifact size report',
    '',
    `- Status: **${report.status}**`,
    `- Commit: \`${report.commitSha}\``,
    `- Generated: ${report.generatedAtUtc}`,
    `- Executed suites: ${report.executedSuites.join(', ')}`,
    '',
    '| Budget | Actual | Limit | Baseline delta | Status |',
    '| --- | ---: | ---: | ---: | --- |',
  ];
  for (const result of report.results) {
    lines.push(`| ${result.name} | ${result.actualBytes} | ${result.limitBytes} | ${result.baselineDeltaBytes ?? 'n/a'} | ${result.status} |`);
  }
  return `${lines.join('\n')}\n`;
}

function writeReports(report) {
  fs.mkdirSync(reportsDirectory, { recursive: true });
  fs.writeFileSync(path.join(reportsDirectory, 'size-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(reportsDirectory, 'size-report.md'), markdownReport(report));
}

function measureReleaseArtifact({ write = true } = {}) {
  const artifact = readJson(path.join(projectRoot, 'artifacts', 'package-artifact.json'));
  const packageJson = readJson(path.join(projectRoot, 'package.json'));
  const core = measureCoreBundles();
  const canonicalBundles = buildCanonicalBundles();
  const budgets = readJson(path.join(projectRoot, 'size-budgets.json'));
  const report = buildSizeReport({
    commitSha: commandOutput('git', ['rev-parse', 'HEAD']) || '0'.repeat(40),
    generatedAtUtc: new Date().toISOString(),
    environment: {
      os: `${os.platform()} ${os.release()}`,
      architecture: process.arch,
      node: process.version,
      npm: commandOutput(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version']) || 'unknown',
    },
    tools: {
      typescript: packageVersion('typescript'),
      canonicalBundler: readJson(path.join(canonicalFixture, 'node_modules', 'esbuild', 'package.json')).version,
      dayjs: '1.11.21',
      temporalPolyfill: canonicalTemporalPolyfillVersion(canonicalBundles),
      atemporal: packageJson.version,
    },
    tarball: { name: artifact.filename, sha512: artifact.sha512, size: artifact.size, unpackedSize: artifact.unpackedSize },
    core,
    canonicalBundles,
    budgets: budgets.canonicalBundles,
    coreResults: coreBudgetResults(core),
  });
  if (write) writeReports(report);
  return report;
}

if (require.main === module) {
  try {
    const report = measureReleaseArtifact();
    process.stdout.write(`Release artifact size report: ${report.status}\n`);
    if (report.status !== 'pass') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildSizeReport,
  buildCanonicalBundles,
  gzipSize,
  measureReleaseArtifact,
};
