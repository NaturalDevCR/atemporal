/**
 * @file Performance regression gate.
 *
 * Compares a fresh `benchmarks/bench.ts` run against the committed
 * `benchmarks/baseline.json` and exits non-zero if any hot path
 * regresses by more than the configured tolerance.
 *
 * Usage:
 *   node scripts/perf-gate.js <current-bench.json> <baseline.json>
 *
 * Exits:
 *   0  on success (no regression)
 *   1  on regression
 *   2  on configuration / parse error
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Allowed regression factor. 1.25 = 25% slower than baseline is OK. */
const TOLERANCE = 1.25;

/**
 * Hot paths the gate cares about. Anything not in this list is reported
 * but does not block CI.
 */
const GATED = ['parse', 'format', 'add', 'diff', 'validate'];

function readJsonOrDie(p) {
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) {
    process.stderr.write(`File not found: ${abs}\n`);
    process.exit(2);
  }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    process.stderr.write(`Invalid JSON in ${abs}: ${err.message}\n`);
    process.exit(2);
  }
}

function main() {
  const [, , currentPath, baselinePath] = process.argv;
  if (!currentPath || !baselinePath) {
    process.stderr.write('Usage: node scripts/perf-gate.js <current.json> <baseline.json>\n');
    process.exit(2);
  }

  const current = readJsonOrDie(currentPath);
  const baseline = readJsonOrDie(baselinePath);

  const baselineMax = baseline.maxAllowedMs || {};
  const tolerance = typeof baseline.tolerance === 'number' ? baseline.tolerance : TOLERANCE;

  process.stdout.write(
    `Performance gate (tolerance: ${(tolerance * 100).toFixed(0)}% of baseline)\n`,
  );
  process.stdout.write(`Baseline version: ${baseline.version || 'unknown'}\n`);
  process.stdout.write(`Current  version: ${current.version || 'unversioned'}\n\n`);

  let failed = false;
  const rows = [];

  for (const key of GATED) {
    const cur = current[key];
    const base = baselineMax[key];
    if (typeof cur !== 'number' || typeof base !== 'number') {
      rows.push({ key, status: 'SKIP', cur, base });
      continue;
    }
    const allowed = base * tolerance;
    const ratio = cur / base;
    const status = cur > allowed ? 'FAIL' : 'PASS';
    if (status === 'FAIL') failed = true;
    rows.push({ key, status, cur, base, allowed, ratio });
  }

  process.stdout.write(
    '  hot path         current (ms)   baseline (ms)   allowed (ms)   ratio   status\n',
  );
  process.stdout.write(
    '  ---------------  -------------  --------------  -------------  ------  ------\n',
  );
  for (const r of rows) {
    if (r.status === 'SKIP') {
      process.stdout.write(`  ${r.key.padEnd(15)}  -              -               -              -       SKIP\n`);
      continue;
    }
    process.stdout.write(
      `  ${r.key.padEnd(15)}  ${String(r.cur.toFixed(1)).padStart(13)}  ${String(r.base.toFixed(1)).padStart(14)}  ${String(r.allowed.toFixed(1)).padStart(13)}  ${(r.ratio * 100).toFixed(0).padStart(4)}%   ${r.status}\n`,
    );
  }

  process.stdout.write('\n');
  if (failed) {
    process.stderr.write(
      'Performance regression detected. Either fix the regression or update benchmarks/baseline.json deliberately.\n',
    );
    process.exit(1);
  }

  process.stdout.write('Performance gate: PASS\n');
  process.exit(0);
}

main();
