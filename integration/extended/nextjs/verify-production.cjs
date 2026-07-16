const { spawn } = require('node:child_process');
const path = require('node:path');

const port = 3210;
const baseUrl = `http://127.0.0.1:${port}`;
const startupTimeoutMs = 30_000;
const shutdownTimeoutMs = 10_000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startServer() {
  const nextCli = require.resolve('next/dist/bin/next');
  const child = spawn(process.execPath, [nextCli, 'start', '-p', String(port)], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });

  return { child, output: () => output };
}

async function waitForServer(child, output) {
  const deadline = Date.now() + startupTimeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited before it became ready:\n${output()}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The server has not started listening yet.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for next start:\n${output()}`);
}

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => child.once('exit', resolve));
}

async function stopServer(child) {
  if (child.exitCode !== null) return;

  child.kill('SIGTERM');
  const exited = await Promise.race([
    waitForExit(child).then(() => true),
    delay(shutdownTimeoutMs).then(() => false),
  ]);
  if (!exited && child.exitCode === null) {
    child.kill('SIGKILL');
    await waitForExit(child);
  }
}

async function verifyProduction() {
  const { child, output } = startServer();
  try {
    await waitForServer(child, output);
    const response = await fetch(`${baseUrl}/`);
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Expected HTTP 200 from /, received ${response.status}:\n${body}`);
    }

    for (const id of ['server-date', 'client-date']) {
      if (!body.includes(`id=\"${id}\"`) || !body.includes('2026-07-16 04:00')) {
        throw new Error(`Expected ${id} and the formatted date in production HTML:\n${body}`);
      }
    }
    console.log('Verified server and client dates through next start HTTP response.');
  } finally {
    await stopServer(child);
  }
}

verifyProduction().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
