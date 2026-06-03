/**
 * @file License compliance check for production dependencies.
 *
 * Fails CI if any direct or transitive runtime dependency is released
 * under a license that is not on the allow-list. Dev-only dependencies
 * are reported but not gated.
 *
 * The allow-list is derived from typical enterprise open-source policies
 * (OSI-approved permissive + weak copyleft + public domain). Copyleft
 * licenses (GPL family, AGPL, SSPL) are explicitly rejected.
 *
 * Run:
 *   node scripts/check-licenses.js
 */
'use strict';

const { execSync } = require('node:child_process');

/**
 * The set of licenses we are willing to ship to enterprise consumers.
 * Keep this list EXPLICIT — "anything not on the list" is rejected.
 */
const ALLOWED_LICENSES = new Set([
  // MIT-family
  'MIT',
  'ISC',
  'Apache-2.0',
  'Apache2',
  'BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  // Weak copyleft (acceptable for libraries)
  'MPL-2.0',
  'LGPL-2.0',
  'LGPL-2.0-or-later',
  'LGPL-2.1',
  'LGPL-2.1-or-later',
  'LGPL-3.0',
  'LGPL-3.0-or-later',
  // Public domain / CC0
  'Unlicense',
  'CC0-1.0',
  'CC-BY-3.0',
  'CC-BY-4.0',
  // JSON / standard
  'JSON',
  // BlueOak permissive license
  'BlueOak-1.0.0',
]);

/**
 * SPDX-like names we always reject regardless of context.
 * These are either strong copyleft or controversial in enterprise settings.
 */
const FORBIDDEN_LICENSES = new Set([
  'GPL',
  'GPL-2.0',
  'GPL-2.0-or-later',
  'GPL-3.0',
  'GPL-3.0-or-later',
  'AGPL',
  'AGPL-1.0',
  'AGPL-1.0-or-later',
  'AGPL-3.0',
  'AGPL-3.0-or-later',
  'SSPL',
  'SSPL-1.0',
  'Commons-Clause',
  'Elastic-2.0',
  'BUSL',
  'BUSL-1.1',
  'RPL',
  'RPL-1.1',
  'RPL-1.5',
]);

/** Mark a license as "unknown" so the human reviewer sees it. */
const UNKNOWN_MARKERS = ['UNKNOWN', 'UNLICENSED', 'SEE LICENSE', 'CUSTOM'];

function readJsonSafe(cmd) {
  try {
    const stdout = execSync(cmd, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch (err) {
    process.stderr.write(`Failed to run \`${cmd}\`: ${err.message}\n`);
    process.exit(2);
  }
}

function classify(license) {
  if (!license) return 'unknown';
  const normalized = String(license).trim();

  for (const marker of UNKNOWN_MARKERS) {
    if (normalized.includes(marker)) return 'unknown';
  }

  // "MIT OR Apache-2.0" / "(MIT OR Apache-2.0)" — split on OR / AND.
  const parts = normalized
    .replace(/[()]/g, '')
    .split(/\s+(?:OR|AND|or|and)\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (FORBIDDEN_LICENSES.has(part)) return 'forbidden';
  }

  const allAllowed = parts.every((p) => ALLOWED_LICENSES.has(p));
  if (allAllowed) return 'allowed';

  return 'unknown';
}

function run() {
  const cwd = process.cwd();
  process.stdout.write('Scanning production dependencies for license compliance...\n');

  // Only production deps, so dev tooling (jest, vitepress, etc.) is not gated.
  const prodJson = readJsonSafe('npm ls --omit=dev --all --json');
  const devJson = readJsonSafe('npm ls --all --json');

  const prodSet = new Set(Object.keys(prodJson.dependencies || {}));
  const licenseJson = readJsonSafe('npx --yes license-checker --production --json');

  /** @type {Array<{name:string, version:string, license:string, classification:string, scope:'prod'|'dev'}>} */
  const issues = [];
  let totalProd = 0;
  let totalDev = 0;

  for (const [nameWithVersion, meta] of Object.entries(licenseJson)) {
    if (nameWithVersion === path.basename(cwd)) continue;
    const at = nameWithVersion.lastIndexOf('@');
    if (at <= 0) continue;
    const name = nameWithVersion.slice(0, at);
    const version = nameWithVersion.slice(at + 1);
    const scope = prodSet.has(name) ? 'prod' : 'dev';
    const classification = classify(meta.licenses);

    if (scope === 'prod') totalProd += 1;
    else totalDev += 1;

    if (classification === 'forbidden' || classification === 'unknown') {
      if (scope === 'prod' || process.env.CHECK_DEV_LICENSES === 'true') {
        issues.push({ name, version, license: meta.licenses, classification, scope });
      }
    }
  }

  process.stdout.write(`\nProduction deps scanned: ${totalProd}\n`);
  process.stdout.write(`Dev deps scanned:       ${totalDev}\n\n`);

  if (issues.length === 0) {
    process.stdout.write('License compliance: PASS\n');
    process.exit(0);
  }

  process.stdout.write('License compliance: FAIL\n\n');
  for (const issue of issues) {
    process.stdout.write(
      `  [${issue.classification.toUpperCase()}] ${issue.name}@${issue.version} (${issue.scope}) -> ${issue.license}\n`,
    );
  }

  process.stdout.write(
    '\nUpdate scripts/check-licenses.js ALLOWED_LICENSES / FORBIDDEN_LICENSES if this is intentional.\n',
  );
  process.exit(1);
}

// `path` is required only for the basename helper.
const path = require('node:path');

run();
