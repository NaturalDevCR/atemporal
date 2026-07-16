/**
 * @file License compliance check for production dependencies.
 *
 * Fails CI if any direct or transitive runtime dependency is released
 * under a license that is not on the allow-list. The check walks the installed
 * production dependency closure, so it works with pnpm's isolated layout.
 *
 * The allow-list is derived from typical enterprise open-source policies
 * (OSI-approved permissive + weak copyleft + public domain). Copyleft
 * licenses (GPL family, AGPL, SSPL) are explicitly rejected.
 *
 * Why not use license-checker? Its transitive dep read-installed@4
 * calls `glob(pattern, opts, cb)` (callback API) which `glob@10`
 * removed. To keep our supply chain small we walk each installed
 * package.json directly. Faster, zero transitive deps, easier to audit.
 *
 * Run:
 *   node scripts/check-licenses.js
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();

const ALLOWED_LICENSES = new Set([
  'MIT', 'MIT-X11', 'MIT-0',
  'ISC',
  'Apache-2.0', 'Apache2', 'Apache-1.1', 'Apache-1.0',
  'BSD', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD-4-Clause', '0BSD',
  'MPL-2.0', 'MPL-1.1',
  'LGPL-2.0', 'LGPL-2.0-or-later', 'LGPL-2.1', 'LGPL-2.1-or-later',
  'LGPL-3.0', 'LGPL-3.0-or-later',
  'EPL-1.0', 'EPL-2.0',
  'CDDL-1.0', 'CDDL-1.1',
  'Unlicense', 'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0',
  'JSON',
  'BlueOak-1.0.0',
  'Python-2.0', 'PSF-2.0',
  'Zlib', 'zlib-acknowledgement',
  'curl', 'WTFPL',
  'OFL-1.1',
  'Artistic-2.0',
  'PostgreSQL',
  'Ruby',
  'TCL',
  'NCSA',
]);

const FORBIDDEN_LICENSES = new Set([
  'GPL', 'GPL-1.0', 'GPL-1.0+', 'GPL-2.0', 'GPL-2.0+', 'GPL-2.0-or-later',
  'GPL-3.0', 'GPL-3.0+', 'GPL-3.0-or-later',
  'AGPL', 'AGPL-1.0', 'AGPL-1.0+', 'AGPL-3.0', 'AGPL-3.0+', 'AGPL-3.0-or-later',
  'SSPL', 'SSPL-1.0',
  'Commons-Clause',
  'Elastic-2.0',
  'BUSL', 'BUSL-1.0', 'BUSL-1.1',
  'RPL', 'RPL-1.1', 'RPL-1.5',
  'OSL', 'OSL-1.0', 'OSL-2.0', 'OSL-3.0',
  'QPL', 'QPL-1.0',
  'NPL', 'NPL-1.0', 'NPL-1.1',
  'CPL', 'CPL-1.0',
]);

const UNKNOWN_MARKERS = ['UNKNOWN', 'UNLICENSED', 'SEE LICENSE IN', 'SEE LICENSE', 'CUSTOM', 'UNDEFINED', 'PROPRIETARY'];

function classify(license) {
  if (!license || license === 'undefined') return 'unknown';
  const normalized = String(license).trim();
  for (const marker of UNKNOWN_MARKERS) {
    if (normalized.toUpperCase().includes(marker)) return 'unknown';
  }
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

function getProjectName() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    return pkg.name;
  } catch {
    return null;
  }
}

function readProdDeps() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const set = new Set();
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const name of Object.keys(pkg[field] || {})) {
      set.add(name);
    }
  }
  return set;
}

function readRuntimeDependencyClosure() {
  const queue = [...readProdDeps()].map((name) => ({ name, from: ROOT }));
  const packages = new Map();

  while (queue.length > 0) {
    const { name, from } = queue.pop();
    let packageJsonPath;

    try {
      const entryPath = require.resolve(name, { paths: [from] });
      let packageDir = path.dirname(entryPath);

      while (packageDir !== path.dirname(packageDir)) {
        const candidate = path.join(packageDir, 'package.json');
        if (fs.existsSync(candidate)) {
          packageJsonPath = candidate;
          break;
        }
        packageDir = path.dirname(packageDir);
      }

      if (!packageJsonPath) {
        throw new Error(`Could not locate package metadata for ${name}`);
      }
    } catch {
      throw new Error(`Could not resolve installed runtime dependency ${name} from ${from}`);
    }

    if (packages.has(packageJsonPath)) continue;

    const meta = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packages.set(packageJsonPath, {
      license: meta.license || meta.licenses || null,
      name: meta.name || name,
      version: meta.version || '?',
    });

    const packageDir = path.dirname(packageJsonPath);
    for (const dependencyName of Object.keys({
      ...(meta.dependencies || {}),
      ...(meta.optionalDependencies || {}),
    })) {
      queue.push({ name: dependencyName, from: packageDir });
    }
  }

  return packages;
}

function main() {
  const projectName = getProjectName();
  let allInstalled;

  process.stdout.write('Scanning licenses of production dependencies (direct + transitive)...\n');
  try {
    allInstalled = readRuntimeDependencyClosure();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }

  if (allInstalled.size === 0) {
    process.stderr.write('Could not resolve any installed production dependencies. Run pnpm install first.\n');
    process.exit(2);
  }

  const issues = [];
  let totalProd = 0;

  for (const { name, version, license } of allInstalled.values()) {
    if (name === projectName) continue;
    const classification = classify(license);
    totalProd += 1;
    if (classification === 'forbidden' || classification === 'unknown') {
      issues.push({ name, version, license, classification, scope: 'prod' });
    }
  }

  process.stdout.write('\nProduction deps scanned: ' + totalProd + '\n');
  process.stdout.write('\n');

  if (issues.length === 0) {
    process.stdout.write('License compliance: PASS\n');
    process.exit(0);
  }

  process.stdout.write('License compliance: FAIL\n\n');
  for (const issue of issues) {
    process.stdout.write(
      '  [' + issue.classification.toUpperCase() + '] ' +
      issue.name + '@' + issue.version + ' (' + issue.scope + ') -> ' + issue.license + '\n',
    );
  }
  process.stdout.write(
    '\nUpdate scripts/check-licenses.js ALLOWED_LICENSES / FORBIDDEN_LICENSES if this is intentional.\n',
  );
  process.exit(1);
}

main();
