/**
 * @file Performance regression gate for warmed hot-path medians.
 *
 * Usage:
 *   node scripts/perf-gate.js <current-bench.json> <baseline.json>
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** A median exactly 25% slower than baseline remains acceptable. */
const TOLERANCE = 1.25;
const GATED = ['parse', 'format', 'add', 'diff', 'validate'];

function readJsonOrDie(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${absolutePath}: ${error.message}`);
  }
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Evaluate every hot path independently against its baseline median.
 *
 * @param {Record<string, unknown>} current fresh benchmark report
 * @param {Record<string, unknown>} baseline reviewed benchmark report
 * @returns {Record<string, {status: 'PASS' | 'FAIL' | 'SKIP', medianMs: number | null, minMs: number | null, maxMs: number | null, p95Ms: number | null, medianAbsoluteDeviationMs: number | null, baselineMedianMs: number | null, allowedMedianMs: number | null, ratio: number | null}>}
 */
function evaluateGate(current, baseline) {
  const tolerance = typeof baseline.tolerance === 'number' ? baseline.tolerance : TOLERANCE;
  const rows = {};

  for (const hotPath of GATED) {
    const currentSummary = current[hotPath] || {};
    const baselineSummary = baseline[hotPath] || {};
    const medianMs = numberOrNull(currentSummary.medianMs);
    const baselineMedianMs = numberOrNull(baselineSummary.medianMs);
    const ratio = medianMs === null || baselineMedianMs === null || baselineMedianMs <= 0
      ? null
      : medianMs / baselineMedianMs;

    rows[hotPath] = {
      status: ratio === null ? 'SKIP' : ratio > tolerance ? 'FAIL' : 'PASS',
      medianMs,
      minMs: numberOrNull(currentSummary.minMs),
      maxMs: numberOrNull(currentSummary.maxMs),
      p95Ms: numberOrNull(currentSummary.p95Ms),
      medianAbsoluteDeviationMs: numberOrNull(currentSummary.medianAbsoluteDeviationMs),
      baselineMedianMs,
      allowedMedianMs: baselineMedianMs === null ? null : baselineMedianMs * tolerance,
      ratio,
    };
  }

  return rows;
}

function formatMs(value) {
  return value === null ? '-' : value.toFixed(2);
}

function formatRatio(value) {
  return value === null ? '-' : `${(value * 100).toFixed(1)}%`;
}

function printReport(rows, baseline) {
  const tolerance = typeof baseline.tolerance === 'number' ? baseline.tolerance : TOLERANCE;
  process.stdout.write(
    `Performance gate (tolerance: ${(tolerance * 100).toFixed(0)}% of baseline median)\n`,
  );
  process.stdout.write(`Baseline schema: ${baseline.schemaVersion || 'unknown'}\n\n`);
  process.stdout.write(
    '  hot path         median      min      max      p95      MAD   baseline   allowed    ratio  status\n',
  );
  process.stdout.write(
    '  ---------------  --------  -------  -------  -------  -------  --------  --------  -------  ------\n',
  );
  for (const [hotPath, row] of Object.entries(rows)) {
    process.stdout.write(
      `  ${hotPath.padEnd(15)}  ${formatMs(row.medianMs).padStart(8)}  ${formatMs(row.minMs).padStart(7)}  ${formatMs(row.maxMs).padStart(7)}  ${formatMs(row.p95Ms).padStart(7)}  ${formatMs(row.medianAbsoluteDeviationMs).padStart(7)}  ${formatMs(row.baselineMedianMs).padStart(8)}  ${formatMs(row.allowedMedianMs).padStart(8)}  ${formatRatio(row.ratio).padStart(7)}  ${row.status}\n`,
    );
  }
}

function main() {
  const [, , currentPath, baselinePath] = process.argv;
  if (!currentPath || !baselinePath) {
    process.stderr.write('Usage: node scripts/perf-gate.js <current.json> <baseline.json>\n');
    return 2;
  }

  try {
    const current = readJsonOrDie(currentPath);
    const baseline = readJsonOrDie(baselinePath);
    const rows = evaluateGate(current, baseline);
    printReport(rows, baseline);

    if (Object.values(rows).some((row) => row.status === 'FAIL')) {
      process.stderr.write(
        'Performance regression detected. Either fix the regression or update benchmarks/baseline.json deliberately.\n',
      );
      return 1;
    }

    process.stdout.write('\nPerformance gate: PASS\n');
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }
}

module.exports = { evaluateGate };

if (require.main === module) {
  process.exitCode = main();
}
