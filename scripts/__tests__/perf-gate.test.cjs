'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { evaluateGate } = require('../perf-gate.js');

const GATED = ['parse', 'format', 'add', 'diff', 'validate'];
const gatePath = path.resolve(__dirname, '..', 'perf-gate.js');

function reportFor(parseMedianMs) {
  return {
    parse: { medianMs: parseMedianMs },
    format: { medianMs: 90 },
    add: { medianMs: 90 },
    diff: { medianMs: 90 },
    validate: { medianMs: 90 },
  };
}

describe('evaluateGate', () => {
  it('fails a path whose median exceeds the 25% tolerance even when every other path improves', () => {
    const baseline = reportFor(100);
    const current = reportFor(126);

    const result = evaluateGate(current, baseline);

    expect(result.parse.status).toBe('FAIL');
    expect(result.format.status).toBe('PASS');
    expect(result.add.status).toBe('PASS');
    expect(result.diff.status).toBe('PASS');
    expect(result.validate.status).toBe('PASS');
  });

  it('allows a path whose median is exactly 25% slower than baseline', () => {
    const result = evaluateGate(reportFor(125), reportFor(100));

    expect(result.parse.status).toBe('PASS');
  });

  it.each(['parse', 'format', 'add', 'diff', 'validate'])(
    'evaluates %s independently when its median regresses',
    (hotPath) => {
      const current = reportFor(90);
      current[hotPath].medianMs = 126;

      const result = evaluateGate(current, reportFor(100));

      expect(result[hotPath].status).toBe('FAIL');
      expect(
        Object.entries(result)
          .filter(([path]) => path !== hotPath)
          .every(([, row]) => row.status === 'PASS'),
      ).toBe(true);
    },
  );
});

test('rejects a legacy maxAllowedMs-only baseline as a configuration error', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-gate-'));
  const currentPath = path.join(directory, 'current.json');
  const baselinePath = path.join(directory, 'baseline.json');

  try {
    fs.writeFileSync(
      currentPath,
      `${JSON.stringify(Object.fromEntries(GATED.map((key) => [key, { medianMs: 100 }])))}\n`,
    );
    fs.writeFileSync(
      baselinePath,
      `${JSON.stringify({ maxAllowedMs: Object.fromEntries(GATED.map((key) => [key, 125])) })}\n`,
    );

    const result = spawnSync(process.execPath, [gatePath, currentPath, baselinePath], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Configuration error');
    expect(result.stderr).toContain('baseline parse.medianMs');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
