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

test('LLM guide states the consumer integration contract', () => {
  const guide = fs.readFileSync(sourceOutput, 'utf8');

  expect(guide).toContain('pnpm add atemporal');
  expect(guide).toContain("const { default: atemporal } = require('atemporal');");
  expect(guide).toContain('await atemporal.lazyLoad("relativeTime")');
  expect(guide).not.toContain('await atemporal.lazyLoad({...})');
  expect(guide).toContain('only official plugins');
  expect(guide).toContain('does not promise full Day.js compatibility');
  expect(guide).toContain('Temporal.ZonedDateTime');
  expect(guide).toContain('getTemporalInfo()');
  expect(guide).toContain('direct runtime dependency');
  expect(guide).toContain('does not by itself remove it from an application bundle');
  expect(guide).toContain('Do not assume `globalThis.Temporal` exists.');
  expect(guide).toContain('**Compatibility contract:**');
  expect(guide).toContain('Node 22, 24, and 26');
});
