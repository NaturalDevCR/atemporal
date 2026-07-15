/**
 * Enforces the four distribution-file limits and two independently reviewed
 * canonical application-bundle limits. Attribution is diagnostic only.
 */
'use strict';

const { measureReleaseArtifact } = require('./measure-release-artifact.cjs');

function enforceReport(report, output = process) {
  output.stdout.write('  Bundle                                      actual      limit       status\n');
  output.stdout.write('  ------------------------------------------  ----------  ----------  ------\n');
  for (const result of report.results) {
    const status = result.status === 'pass' ? '✓' : '✘';
    output.stdout.write(`  ${result.name.padEnd(42)}  ${String(result.actualBytes).padStart(10)}  ${String(result.limitBytes).padStart(10)}  ${status}\n`);
  }
  if (report.status !== 'pass') {
    output.stderr.write('\nBundle size budget exceeded. Either shrink the bundle or update a reviewed budget deliberately.\n');
    return 1;
  }
  return 0;
}

function main() {
  return enforceReport(measureReleaseArtifact());
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { enforceReport, main };
