'use strict';

const { buildSizeReport, gzipSize } = require('../measure-release-artifact.cjs');

describe('release artifact measurement report', () => {
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
      coreResults: [{ name: 'atemporal (CJS, raw)', actualBytes: 100, limitBytes: 200, status: 'pass' }],
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
      expect.objectContaining({ name: 'canonicalCoreBundle', actualBytes: 200, limitBytes: 1024, baselineDeltaBytes: 0, status: 'pass' }),
      expect.objectContaining({ name: 'canonicalRelativeTimeBundle', actualBytes: 250, limitBytes: 1024, baselineDeltaBytes: 0, status: 'pass' }),
    ]));
  });

  test('uses deterministic gzip output', () => {
    const bytes = Buffer.from('atemporal');
    expect(gzipSize(bytes)).toBe(gzipSize(bytes));
  });
});
