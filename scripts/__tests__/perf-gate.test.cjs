'use strict';

const { evaluateGate } = require('../perf-gate.js');

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
