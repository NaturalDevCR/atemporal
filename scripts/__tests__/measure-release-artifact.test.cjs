'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  buildCanonicalBundles,
  buildSizeReport,
  gzipSize,
} = require('../measure-release-artifact.cjs');
const { enforceReport } = require('../check-bundle-size.js');

const projectRoot = path.resolve(__dirname, '..', '..');
const budgetFile = path.join(projectRoot, 'size-budgets.json');

describe('release artifact measurement report', () => {
  test('records canonical budget history deltas from their previous and next byte values', () => {
    const { history } = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));

    for (const entry of history) {
      expect(entry.absoluteDeltaBytes).toBe(entry.nextBytes - entry.previousBytes);
      expect(entry.percentDelta).toBe(((entry.nextBytes - entry.previousBytes) / entry.previousBytes) * 100);
    }
  });

  test('creates the versioned PR report schema without claiming unexecuted bundlers ran', () => {
    const report = buildSizeReport({
      commitSha: 'a'.repeat(40),
      generatedAtUtc: '2026-07-15T00:00:00.000Z',
      environment: { os: 'test-runner', architecture: 'x64', node: 'v24.0.0', npm: '11.0.0' },
      tools: {
        typescript: '5.9.3',
        canonicalBundler: '0.25.12',
        dayjs: '1.11.21',
        temporalPolyfill: '0.5.1',
        atemporal: '1.4.2',
      },
      tarball: { name: 'atemporal-1.4.2.tgz', sha512: 'digest', size: 123, unpackedSize: 456 },
      core: {
        cjs: { raw: 100, gzip: 50 },
        esm: { raw: 90, gzip: 45 },
      },
      canonicalBundles: {
        canonicalCoreBundle: { total: 200, attribution: { atemporal: 120, '@js-temporal/polyfill': 70, 'runtime-or-other': 10 } },
        canonicalRelativeTimeBundle: { total: 250, attribution: { atemporal: 140, '@js-temporal/polyfill': 90, 'runtime-or-other': 20 } },
      },
      budgets: {
        canonicalCoreBundle: { limitBytes: 1024, baselineBytes: 200, rationale: 'reviewed' },
        canonicalRelativeTimeBundle: { limitBytes: 1024, baselineBytes: 250, rationale: 'reviewed' },
      },
      coreResults: [
        { name: 'atemporal (CJS, raw)', actualBytes: 100, limitBytes: 200, status: 'pass' },
        { name: 'atemporal (ESM, raw)', actualBytes: 90, limitBytes: 200, status: 'pass' },
        { name: 'atemporal (CJS, gzip)', actualBytes: 50, limitBytes: 200, status: 'pass' },
        { name: 'atemporal (ESM, gzip)', actualBytes: 45, limitBytes: 200, status: 'pass' },
      ],
    });

    expect(report).toMatchObject({
      schemaVersion: 1,
      status: 'pass',
      commitSha: 'a'.repeat(40),
      generatedAtUtc: '2026-07-15T00:00:00.000Z',
      environment: { os: 'test-runner', architecture: 'x64', node: 'v24.0.0', npm: '11.0.0' },
      tools: {
        vite: null,
        webpack: null,
        next: null,
        canonicalBundler: '0.25.12',
      },
      tarball: { name: 'atemporal-1.4.2.tgz', sha512: 'digest', size: 123, unpackedSize: 456 },
      mode: 'production',
      executedSuites: ['core-size', 'canonical-core-bundle', 'canonical-plugin-bundle'],
    });
    expect(report.measurements.core).toEqual({
      cjs: { raw: 100, gzip: 50 },
      esm: { raw: 90, gzip: 45 },
    });
    expect(report.measurements.canonicalBundles.canonicalCoreBundle.total).toBe(200);
    expect(report.measurements.canonicalBundles.canonicalRelativeTimeBundle.total).toBe(250);
    expect(report.budgets).toHaveLength(2);
    expect(report.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'atemporal (CJS, raw)', actualBytes: 100, status: 'pass' }),
      expect.objectContaining({ name: 'atemporal (ESM, raw)', actualBytes: 90, status: 'pass' }),
      expect.objectContaining({ name: 'atemporal (CJS, gzip)', actualBytes: 50, status: 'pass' }),
      expect.objectContaining({ name: 'atemporal (ESM, gzip)', actualBytes: 45, status: 'pass' }),
      expect.objectContaining({ name: 'canonicalCoreBundle', actualBytes: 200, limitBytes: 1024, baselineDeltaBytes: 0, status: 'pass' }),
      expect.objectContaining({ name: 'canonicalRelativeTimeBundle', actualBytes: 250, limitBytes: 1024, baselineDeltaBytes: 0, status: 'pass' }),
    ]));
  });

  test('uses deterministic gzip output', () => {
    const bytes = Buffer.from('atemporal');
    expect(gzipSize(bytes)).toBe(gzipSize(bytes));
  });

  test('installs canonical bundle dependencies with its pinned pnpm lockfile', () => {
    const source = fs.readFileSync(path.join(projectRoot, 'scripts', 'measure-release-artifact.cjs'), 'utf8');

    expect(source).toContain("['--ignore-workspace', 'install', '--frozen-lockfile', '--ignore-scripts']");
    expect(source).not.toContain("['ci', '--ignore-scripts']");
  });

  test('builds through the fixture-pinned Temporal polyfill and reports its resolved version without rewriting budgets', () => {
    const before = fs.readFileSync(budgetFile, 'utf8');
    const bundles = buildCanonicalBundles();
    const core = bundles.canonicalCoreBundle;
    const metafile = JSON.parse(fs.readFileSync(`${path.join(projectRoot, core.files[0])}.meta.json`, 'utf8'));
    const polyfillInputs = Object.keys(metafile.inputs).filter((input) => input.includes('@js-temporal/polyfill/'));

    expect(core.resolvedInputs.temporalPolyfill).toEqual(expect.objectContaining({
      path: expect.stringContaining('integration/canonical-bundle/node_modules/@js-temporal/polyfill/'),
      version: '0.5.1',
    }));
    expect(polyfillInputs).toEqual(['node_modules/@js-temporal/polyfill/dist/index.esm.js']);
    expect(fs.readFileSync(budgetFile, 'utf8')).toBe(before);
  });

  test('marks a canonical overrun as failed and returns a nonzero enforcement status', () => {
    const report = buildSizeReport({
      commitSha: 'b'.repeat(40),
      generatedAtUtc: '2026-07-15T00:00:00.000Z',
      environment: { os: 'test-runner', architecture: 'x64', node: 'v24.0.0', npm: '11.0.0' },
      tools: { canonicalBundler: '0.25.12', dayjs: '1.11.21', temporalPolyfill: '0.5.1', atemporal: '1.4.2' },
      tarball: { name: 'atemporal-1.4.2.tgz', sha512: 'digest', size: 123, unpackedSize: 456 },
      core: { cjs: { raw: 100, gzip: 50 }, esm: { raw: 90, gzip: 45 } },
      canonicalBundles: {
        canonicalCoreBundle: { total: 201, attribution: {} },
        canonicalRelativeTimeBundle: { total: 250, attribution: {} },
      },
      budgets: {
        canonicalCoreBundle: { limitBytes: 200, baselineBytes: 200, rationale: 'reviewed' },
        canonicalRelativeTimeBundle: { limitBytes: 250, baselineBytes: 250, rationale: 'reviewed' },
      },
      coreResults: [],
    });
    const output = { stdout: { write: jest.fn() }, stderr: { write: jest.fn() } };

    expect(report.status).toBe('fail');
    expect(report.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'canonicalCoreBundle', status: 'fail' }),
    ]));
    expect(enforceReport(report, output)).toBe(1);
    expect(output.stderr.write).toHaveBeenCalledWith(expect.stringContaining('Bundle size budget exceeded'));
  });
});
