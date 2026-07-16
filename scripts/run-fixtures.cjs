const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

function readPolyfillVersion(cwd) {
  const result = spawnSync(
    npmCommand,
    ['ls', '@js-temporal/polyfill', '--json'],
    { cwd, encoding: 'utf8' },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`npm ls @js-temporal/polyfill --json failed in ${cwd}`);
  }

  const installed = JSON.parse(result.stdout);
  const version = installed.dependencies?.['@js-temporal/polyfill']?.version;
  if (typeof version !== 'string') {
    throw new Error(`npm ls did not report @js-temporal/polyfill in ${cwd}`);
  }
  return version;
}

function readArtifactPath() {
  const artifactPath = path.join(projectRoot, 'artifacts', 'package-artifact.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  if (!artifact || typeof artifact.path !== 'string') {
    throw new Error(`Artifact metadata must contain one string path: ${artifactPath}`);
  }

  const tarballPath = path.resolve(projectRoot, artifact.path);
  if (!fs.existsSync(tarballPath)) {
    throw new Error(`Package tarball does not exist: ${tarballPath}`);
  }
  return tarballPath;
}

function fixtureNames(group) {
  const fixtureRoot = path.join(projectRoot, 'integration', group);
  return fs.readdirSync(fixtureRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function fixtureTypeScriptVersion() {
  const version = process.env.FIXTURE_TYPESCRIPT_VERSION;
  if (!version) return null;
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('FIXTURE_TYPESCRIPT_VERSION must be an exact TypeScript version.');
  }
  return version;
}

function runFixtures(group) {
  if (!['contract', 'extended'].includes(group)) {
    throw new Error(`Unsupported fixture group: ${group}`);
  }

  const tarballPath = readArtifactPath();
  const sourceRoot = path.join(projectRoot, 'integration', group);
  const disposableGroupRoot = path.join(
    projectRoot,
    'tmp',
    'integration-fixtures',
    group,
  );
  const reportRoot = path.join(projectRoot, 'reports', 'fixtures');
  const typeScriptVersion = fixtureTypeScriptVersion();

  fs.rmSync(disposableGroupRoot, { recursive: true, force: true });
  fs.mkdirSync(disposableGroupRoot, { recursive: true });
  fs.mkdirSync(reportRoot, { recursive: true });

  for (const name of fixtureNames(group)) {
    const source = path.join(sourceRoot, name);
    const fixture = path.join(disposableGroupRoot, name);
    fs.cpSync(source, fixture, {
      recursive: true,
      filter: (entry) => !['node_modules', 'dist'].includes(path.basename(entry)),
    });

    if (group === 'contract' && name.startsWith('typescript-') && typeScriptVersion) {
      // The copied fixture owns this generated lockfile. Never rewrite a committed fixture lock.
      run(
        npmCommand,
        ['install', '--save-dev', '--package-lock-only', '--ignore-scripts', `typescript@${typeScriptVersion}`],
        fixture,
      );
    }
    run(npmCommand, ['ci'], fixture);
    run(
      npmCommand,
      ['install', '--no-save', '--package-lock=false', tarballPath],
      fixture,
    );

    const polyfillVersion = readPolyfillVersion(fixture);
    fs.writeFileSync(
      path.join(reportRoot, `${group}-${name}.json`),
      `${JSON.stringify({ group, name, polyfillVersion }, null, 2)}\n`,
    );

    run(npmCommand, ['run', 'typecheck'], fixture);
    run(npmCommand, ['run', 'build'], fixture);
    run(npmCommand, ['test'], fixture);
  }
}

if (require.main === module) {
  try {
    runFixtures(process.argv[2]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  fixtureNames,
  fixtureTypeScriptVersion,
  readArtifactPath,
  readPolyfillVersion,
  runFixtures,
};
