const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { verifyPackedFiles } = require('../create-package-artifact.cjs');

describe('verifyPackedFiles', () => {
  let fixtureDirectory;
  let packageJson;

  beforeEach(() => {
    fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'atemporal-package-'));
    packageJson = {
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          import: './dist/index.mjs',
          require: './dist/index.js',
          types: './dist/index.d.ts',
        },
      },
    };
    fs.writeFileSync(
      path.join(fixtureDirectory, 'package.json'),
      `${JSON.stringify(packageJson, null, 2)}\n`,
    );
  });

  afterEach(() => {
    fs.rmSync(fixtureDirectory, { recursive: true, force: true });
  });

  it('names a missing root CommonJS export file', () => {
    expect(() => verifyPackedFiles(['package/dist/index.mjs'], packageJson)).toThrow(
      'Missing packed file: package/dist/index.js',
    );
  });

  it('accepts the required package files and export targets', () => {
    const packedFiles = [
      'package/LICENSE',
      'package/README.md',
      'package/package.json',
      'package/dist/index.d.ts',
      'package/dist/index.js',
      'package/dist/index.mjs',
    ];

    expect(() => verifyPackedFiles(packedFiles, packageJson)).not.toThrow();
  });
});
