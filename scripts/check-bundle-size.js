/**
 * Enforces the four distribution-file limits and two independently reviewed
 * canonical application-bundle limits. Attribution is diagnostic only.
 */
'use strict';

const { measureReleaseArtifact } = require('./measure-release-artifact.cjs');

function main() {
  const report = measureReleaseArtifact();
  process.stdout.write('  Bundle                                      actual      limit       status\n');
  process.stdout.write('  ------------------------------------------  ----------  ----------  ------\n');
  for (const result of report.results) {
    const status = result.status === 'pass' ? '✓' : '✘';
    process.stdout.write(`  ${result.name.padEnd(42)}  ${String(result.actualBytes).padStart(10)}  ${String(result.limitBytes).padStart(10)}  ${status}\n`);
  }
  if (report.status !== 'pass') {
    process.stderr.write('\nBundle size budget exceeded. Either shrink the bundle or update a reviewed budget deliberately.\n');
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
