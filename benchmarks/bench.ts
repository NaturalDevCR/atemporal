/**
 * @file Reproducible benchmark for artifact hot paths.
 *
 * Run after `npm run build`:
 *   node --expose-gc -r ts-node/register/transpile-only benchmarks/bench.ts 100000
 */
import os from 'node:os';
import atemporal from '../dist/index.mjs';

const OPS = Number(process.argv[2] || 100_000);
const WARMUP_RUNS = 1;
const SAMPLES_PER_PATH = 7;
const JOB_TIMEOUT_MINUTES = 15;
const TOLERANCE = 1.25;

if (!Number.isInteger(OPS) || OPS <= 0) {
  throw new Error('Operations per sample must be a positive integer.');
}

const isoStrings = [
  '2024-01-15T12:34:56.789Z',
  '2024-12-31T23:59:59.999Z',
  '1999-09-09T09:09:09.999Z',
  '2038-01-19T03:14:07.999Z',
];

type Benchmark = () => number;

type Summary = {
  samplesMs: number[];
  medianMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  medianAbsoluteDeviationMs: number;
};

function median(sortedValues: number[]): number {
  return sortedValues[Math.floor(sortedValues.length / 2)];
}

function summarize(samples: number[]): Summary {
  const samplesMs = [...samples].sort((left, right) => left - right);
  const medianMs = median(samplesMs);
  const deviations = samplesMs
    .map((sample) => Math.abs(sample - medianMs))
    .sort((left, right) => left - right);

  return {
    samplesMs,
    medianMs,
    minMs: samplesMs[0],
    maxMs: samplesMs[samplesMs.length - 1],
    p95Ms: samplesMs[Math.ceil(samplesMs.length * 0.95) - 1],
    medianAbsoluteDeviationMs: median(deviations),
  };
}

function runBenchmark(benchmark: Benchmark): Summary {
  for (let run = 0; run < WARMUP_RUNS; run += 1) benchmark();

  const samples: number[] = [];
  for (let run = 0; run < SAMPLES_PER_PATH; run += 1) {
    global.gc?.();
    samples.push(benchmark());
  }
  return summarize(samples);
}

function benchParse(): number {
  const t0 = performance.now();
  for (let i = 0; i < OPS; i += 1) atemporal(isoStrings[i % isoStrings.length]);
  return performance.now() - t0;
}

function benchFormat(): number {
  const wrapped = atemporal('2024-01-15T12:34:56.789Z');
  const t0 = performance.now();
  for (let i = 0; i < OPS; i += 1) wrapped.format(atemporal.presets.ISO);
  return performance.now() - t0;
}

function benchAdd(): number {
  const wrapped = atemporal('2024-01-15T12:34:56.789Z');
  const t0 = performance.now();
  for (let i = 0; i < OPS; i += 1) wrapped.add(1, 'day');
  return performance.now() - t0;
}

function benchDiff(): number {
  const a = atemporal('2024-01-15T12:34:56.789Z');
  const b = atemporal('2024-06-15T12:34:56.789Z');
  const t0 = performance.now();
  for (let i = 0; i < OPS; i += 1) a.diff(b, 'day');
  return performance.now() - t0;
}

function benchValidate(): number {
  const t0 = performance.now();
  for (let i = 0; i < OPS; i += 1) atemporal.validate(isoStrings[i % isoStrings.length]);
  return performance.now() - t0;
}

const results = {
  schemaVersion: 1,
  nodeVersion: process.version,
  architecture: process.arch,
  os: `${os.platform()} ${os.release()}`,
  githubActionsImageVersion: process.env.ImageVersion || null,
  ops: OPS,
  warmupRuns: WARMUP_RUNS,
  samplesPerPath: SAMPLES_PER_PATH,
  timeoutPolicy: { jobTimeoutMinutes: JOB_TIMEOUT_MINUTES },
  tolerance: TOLERANCE,
  timestamp: new Date().toISOString(),
  parse: runBenchmark(benchParse),
  format: runBenchmark(benchFormat),
  add: runBenchmark(benchAdd),
  diff: runBenchmark(benchDiff),
  validate: runBenchmark(benchValidate),
};

console.log(JSON.stringify(results, null, 2));
