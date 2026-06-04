/**
 * @file Bundle size budget check.
 *
 * Reads `.size-limit.json` and asserts that every entry's file
 * is at or below its `limit`. We do *not* bundle dependencies
 * (the way `@size-limit/preset-small-lib` does) because atemporal
 * has `@js-temporal/polyfill` as an optional peer and the polyfill
 * is auto-loaded; bundling it would inflate the number to 150+ kB
 * and obscure the real cost of the package.
 *
 * Instead, we measure the raw minified file size (the file the
 * bundler ships) plus its gzipped size, which is what end-users
 * actually download.
 *
 * Exit 0 on success, 1 on budget overrun.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const CONFIG = path.join(__dirname, '..', '.size-limit.json');

function parseLimit(limit) {
  const m = String(limit).trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|bytes?)?$/i);
  if (!m) {
    throw new Error(`Unparseable limit: ${limit}`);
  }
  const n = parseFloat(m[1]);
  const unit = (m[2] || 'b').toLowerCase();
  const mult = unit.startsWith('k') ? 1024 : unit.startsWith('m') ? 1024 * 1024 : 1;
  return n * mult;
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function measure(filePath, { gzip = false } = {}) {
  const buf = fs.readFileSync(filePath);
  if (!gzip) {
    return { raw: buf.length, gz: zlib.gzipSync(buf).length };
  }
  return { raw: buf.length, gz: zlib.gzipSync(buf).length };
}

function main() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  if (!Array.isArray(cfg)) {
    process.stderr.write('.size-limit.json must be a top-level array.\n');
    process.exit(2);
  }

  let failed = false;
  const rows = [];

  for (const entry of cfg) {
    const { name, path: relPath, limit } = entry;
    if (!name || !relPath || !limit) continue;

    const absPath = path.resolve(path.dirname(CONFIG), relPath);
    if (!fs.existsSync(absPath)) {
      process.stderr.write(`  ✘ [MISSING] ${name}: ${relPath} not built\n`);
      failed = true;
      continue;
    }

    const limitBytes = parseLimit(limit);
    const m = measure(absPath);
    const pick = entry.gzip ? m.gz : m.raw;
    const ok = pick <= limitBytes;
    if (!ok) failed = true;
    rows.push({
      name,
      raw: m.raw,
      gz: m.gz,
      pick,
      limit: limitBytes,
      mode: entry.gzip ? 'gzip' : 'raw',
      ok,
    });
  }

  process.stdout.write(
    '  Bundle                          mode   actual      limit       status\n',
  );
  process.stdout.write(
    '  ------------------------------  -----  ----------  ----------  ------\n',
  );
  for (const r of rows) {
    const status = r.ok ? '✓' : '✘';
    const name = r.name.length > 30 ? r.name.slice(0, 29) + '…' : r.name.padEnd(30);
    process.stdout.write(
      `  ${name}  ${r.mode.padEnd(5)}  ${fmt(r.pick).padStart(10)}  ${fmt(r.limit).padStart(10)}  ${status}\n`,
    );
  }

  if (failed) {
    process.stderr.write(
      '\nBundle size budget exceeded. Either shrink the bundle or update the limit deliberately.\n',
    );
    process.exit(1);
  }
  process.stdout.write('\n✓ All bundle size budgets met.\n');
}

main();
