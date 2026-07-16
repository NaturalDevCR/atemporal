const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const projectRoot = path.resolve(__dirname, '..');
const artifactDirectory = path.join(projectRoot, 'artifacts');

function sha512(file) {
  return createHash('sha512').update(fs.readFileSync(file)).digest('base64');
}

function collectExportTargets(exportsField, targets = []) {
  if (typeof exportsField === 'string') {
    targets.push(exportsField);
    return targets;
  }

  if (Array.isArray(exportsField)) {
    for (const exportField of exportsField) {
      collectExportTargets(exportField, targets);
    }
    return targets;
  }

  if (exportsField && typeof exportsField === 'object') {
    for (const exportField of Object.values(exportsField)) {
      collectExportTargets(exportField, targets);
    }
  }

  return targets;
}

function requiredPackedFiles(packageJson) {
  const requiredFiles = [
    'package/dist/index.js',
    'package/dist/index.mjs',
    'package/dist/index.d.ts',
    'package/README.md',
    'package/LICENSE',
    'package/package.json',
  ];

  for (const target of collectExportTargets(packageJson.exports)) {
    if (!target.startsWith('./')) {
      throw new Error(`Export target must be package-relative: ${target}`);
    }
    requiredFiles.push(`package/${target.slice(2)}`);
  }

  return [...new Set(requiredFiles)];
}

function verifyPackedFiles(packedFiles, packageJson) {
  const packedFileSet = new Set(packedFiles);

  for (const requiredFile of requiredPackedFiles(packageJson)) {
    if (!packedFileSet.has(requiredFile)) {
      throw new Error(`Missing packed file: ${requiredFile}`);
    }
  }
}

function cleanArtifacts() {
  fs.rmSync(artifactDirectory, { recursive: true, force: true });
  fs.mkdirSync(artifactDirectory, { recursive: true });
}

function packPackage() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    npmCommand,
    ['pack', '--json', '--pack-destination', artifactDirectory],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`npm pack failed:\n${result.stderr || result.stdout}`);
  }

  let records;
  try {
    records = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`npm pack did not produce JSON: ${error.message}`);
  }

  if (!Array.isArray(records) || records.length !== 1) {
    throw new Error('npm pack must produce exactly one package record');
  }

  return records[0];
}

function createPackageArtifact() {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  cleanArtifacts();
  const packRecord = packPackage();
  const tarballPath = path.join(artifactDirectory, packRecord.filename);
  const packedFiles = packRecord.files
    .map((file) => `package/${file.path}`)
    .sort();

  verifyPackedFiles(packedFiles, packageJson);

  const artifact = {
    filename: packRecord.filename,
    path: `./${path.relative(projectRoot, tarballPath)}`,
    sha512: sha512(tarballPath),
    size: packRecord.size,
    unpackedSize: packRecord.unpackedSize,
    files: packedFiles,
  };
  fs.writeFileSync(
    path.join(artifactDirectory, 'package-artifact.json'),
    `${JSON.stringify(artifact, null, 2)}\n`,
  );

  return artifact;
}

if (require.main === module) {
  try {
    createPackageArtifact();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  collectExportTargets,
  createPackageArtifact,
  requiredPackedFiles,
  sha512,
  verifyPackedFiles,
};
