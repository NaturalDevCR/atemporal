'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..', '..');
const sourceDocs = path.join(projectRoot, 'docs');
const sourceGenerator = path.join(projectRoot, 'scripts', 'generate-llms-txt.js');
const sourceOutput = path.join(sourceDocs, 'public', 'llms.txt');

test('committed LLM guide is the exact deterministic generator output', () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'atemporal-llms-'));

  try {
    const sandboxDocs = path.join(sandbox, 'docs');
    const sandboxScripts = path.join(sandbox, 'scripts');
    const sandboxGenerator = path.join(sandboxScripts, 'generate-llms-txt.js');
    const sandboxOutput = path.join(sandboxDocs, 'public', 'llms.txt');

    fs.cpSync(sourceDocs, sandboxDocs, { recursive: true });
    fs.mkdirSync(sandboxScripts, { recursive: true });
    fs.copyFileSync(sourceGenerator, sandboxGenerator);
    fs.writeFileSync(sandboxOutput, 'STALE LLM DOCUMENTATION', 'utf8');

    const result = spawnSync(process.execPath, [sandboxGenerator], {
      cwd: sandbox,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(fs.readFileSync(sandboxOutput, 'utf8')).not.toContain('STALE LLM DOCUMENTATION');
    expect(fs.readFileSync(sandboxOutput, 'utf8')).toBe(
      fs.readFileSync(sourceOutput, 'utf8'),
    );
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});
