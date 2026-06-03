/**
 * @file Reproducible benchmark for the parse / format hot paths.
 *
 * Usage:
 *   npm run build                                  # required: builds dist/
 *   node --expose-gc benchmarks/bench.ts           # default: 100 000 ops
 *   node --expose-gc benchmarks/bench.ts 1000000   # 1 000 000 ops
 *
 * The output is plain text; CI parses it and compares against
 * the committed baseline in `benchmarks/baseline.json` via
 * `scripts/perf-gate.js`.
 *
 * Imports from `dist/` (not `src/`) so the benchmark measures the
 * actual artifact that ships to consumers.
 */
import atemporal from '../dist/index.mjs';

const OPS = Number(process.argv[2] || 100_000);

const isoStrings = [
  '2024-01-15T12:34:56.789Z',
  '2024-12-31T23:59:59.999Z',
  '1999-09-09T09:09:09.999Z',
  '2038-01-19T03:14:07.999Z',
];

function benchParse(): number {
  const t0 = performance.now();
  for (let i = 0; i < OPS; i++) {
    atemporal(isoStrings[i % isoStrings.length]);
  }
  return performance.now() - t0;
}

function benchFormat(): number {
  const wrapped = atemporal('2024-01-15T12:34:56.789Z');
  const t0 = performance.now();
  for (let i = 0; i < OPS; i++) {
    wrapped.format(atemporal.presets.ISO);
  }
  return performance.now() - t0;
}

function benchAdd(): number {
  const wrapped = atemporal('2024-01-15T12:34:56.789Z');
  const t0 = performance.now();
  for (let i = 0; i < OPS; i++) {
    wrapped.add(1, 'day');
  }
  return performance.now() - t0;
}

function benchDiff(): number {
  const a = atemporal('2024-01-15T12:34:56.789Z');
  const b = atemporal('2024-06-15T12:34:56.789Z');
  const t0 = performance.now();
  for (let i = 0; i < OPS; i++) {
    a.diff(b, 'day');
  }
  return performance.now() - t0;
}

function benchValidate(): number {
  const t0 = performance.now();
  for (let i = 0; i < OPS; i++) {
    atemporal.validate(isoStrings[i % isoStrings.length]);
  }
  return performance.now() - t0;
}

const results = {
  parse: benchParse(),
  format: benchFormat(),
  add: benchAdd(),
  diff: benchDiff(),
  validate: benchValidate(),
  ops: OPS,
  timestamp: new Date().toISOString(),
};

console.log(JSON.stringify(results, null, 2));
