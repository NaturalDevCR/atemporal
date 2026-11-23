'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const { gzipSync } = require('node:zlib');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'atemporal-loading-'));
const pkg = require('../package.json');
const plugins = Object.keys(pkg.exports).filter((key) => key.startsWith('./plugins/'))
  .map((key) => key.slice('./plugins/'.length));

function runChild(source, environment) {
  const trace = path.join(temporary, 'loads.txt');
  fs.writeFileSync(trace, '');
  const result = spawnSync(process.execPath, ['--no-warnings', '--loader', pathToFileURL(path.join(temporary, 'loader.mjs')).href,
    '-e', source], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...environment, ATEMPORAL_LOAD_TRACE: trace },
    timeout: 30000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const loads = fs.readFileSync(trace, 'utf8').trim().split('\n').filter(Boolean);
  return loads;
}

function checkRuntime() {
  fs.writeFileSync(path.join(temporary, 'loader.mjs'), `
    import { appendFileSync } from 'node:fs';
    export async function resolve(specifier, context, nextResolve) {
      if (specifier === '@js-temporal/polyfill') {
        appendFileSync(process.env.ATEMPORAL_LOAD_TRACE, 'esm\\n');
        if (process.env.ATEMPORAL_BLOCK_POLYFILL === '1') throw new Error('Unexpected ESM polyfill load');
      }
      return nextResolve(specifier, context);
    }
    export async function load(url, context, nextLoad) {
      if (JSON.parse(process.env.ATEMPORAL_CHUNK_URLS || '[]').includes(url)) {
        appendFileSync(process.env.ATEMPORAL_LOAD_TRACE, 'browser\\n');
        if (process.env.ATEMPORAL_BLOCK_POLYFILL === '1') throw new Error('Unexpected browser fallback chunk');
      }
      return nextLoad(url, context);
    }
  `);
  const cases = [];
  for (const format of ['require', 'import']) {
    for (const mode of ['missing', 'incomplete', 'throwing', ...(globalThis.Temporal ? ['native'] : [])]) {
      const native = mode === 'native';
      const loads = runChild(`
        const assert = require('node:assert/strict');
        const fs = require('node:fs');
        const Module = require('node:module');
        const originalLoad = Module._load;
        Module._load = function(request, ...args) {
          if (request === '@js-temporal/polyfill') {
            fs.appendFileSync(process.env.ATEMPORAL_LOAD_TRACE, 'cjs\\n');
            if (process.env.ATEMPORAL_BLOCK_POLYFILL === '1') throw new Error('Unexpected CJS polyfill load');
          }
          return originalLoad.call(this, request, ...args);
        };
        ${mode === 'missing' ? 'delete globalThis.Temporal;' : ''}
        ${mode === 'incomplete' ? 'globalThis.Temporal = { Now: {} };' : ''}
        ${mode === 'throwing' ? `Object.defineProperty(globalThis, 'Temporal', { configurable: true, get() { throw new Error('Denied global'); } });` : ''}
        (async () => {
          // Plugins imported first must initialize the same runtime as the factory.
          const pluginEntry = 'atemporal/plugins/relativeTime';
          ${format === 'require'
            ? "const plugin = require(pluginEntry); const imported = require('atemporal');"
            : "const [plugin, imported] = await Promise.all([import(pluginEntry), import('atemporal'), import('atemporal')]);"}
          const atemporal = imported.default || imported;
          atemporal.extend(plugin.default || plugin);
          assert.equal(atemporal.getTemporalInfo().isNative, ${native});
          const instant = atemporal.instant('2026-07-15T10:00:00.123456789Z');
          assert.equal(instant.toString(), '2026-07-15T10:00:00.123456789Z');
          ${native ? 'assert.ok(instant instanceof globalThis.Temporal.Instant);' : ''}
          assert.equal(atemporal('2026-07-15T10:00:00Z').timeZone('America/Costa_Rica')
            .add(1, 'day').format('YYYY-MM-DD HH:mm'), '2026-07-16 04:00');
          assert.equal(atemporal.parse('2026-07-15T10:00:00Z').raw.toInstant().toString(), '2026-07-15T10:00:00Z');
          await atemporal.lazyLoad('durationHumanizer');
          assert.equal(typeof atemporal.humanize({ hours: 2 }), 'string');
          for (const name of ${JSON.stringify(plugins)}) {
            const entry = 'atemporal/plugins/' + name;
            const plugin = ${format === 'require' ? 'require(entry)' : 'await import(entry)'};
            atemporal.extend(plugin.default || plugin);
          }
          assert.equal(atemporal.getLoadedPlugins().length, ${plugins.length});
          assert.notEqual(atemporal('2026-07-15').fromNow(), 'Invalid Date');
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `, { ATEMPORAL_BLOCK_POLYFILL: native ? '1' : '0' });
      assert.equal(loads.length, native ? 0 : 1, `${format}/${mode}: ${loads}`);
      cases.push({ format, mode, polyfillLoads: loads.length });
    }
    const failedLoads = runChild(`
      delete globalThis.Temporal;
      const Module = require('node:module');
      const originalLoad = Module._load;
      Module._load = function(request, ...args) {
        if (request === '@js-temporal/polyfill') throw new Error('Unavailable fallback');
        return originalLoad.call(this, request, ...args);
      };
      (async () => {
        try {
          ${format === 'require' ? "require('atemporal')" : "await import('atemporal')"};
          throw new Error('Fallback failure was swallowed');
        } catch (error) {
          if (!/Unavailable fallback|Unexpected ESM polyfill load/.test(error.message)) throw error;
        }
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `, { ATEMPORAL_BLOCK_POLYFILL: '1' });
    assert.equal(failedLoads.length, format === 'import' ? 1 : 0);
    cases.push({ format, mode: 'fallback-failure', rejected: true });
  }
  return cases;
}

function checkPluginBoundaries() {
  const cases = [];
  for (const entry of ['atemporal', 'atemporal/native', 'atemporal/compat']) {
    for (const format of ['require', 'import']) {
      runChild(`
        const assert = require('node:assert/strict');
        // Seed native-only tests on Node versions without native Temporal.
        globalThis.Temporal ||= require('@js-temporal/polyfill').Temporal;
        (async () => {
          const load = ${format === 'require' ? 'async (entry) => require(entry)' : '(entry) => import(entry)'};
          const root = await load('${entry}');
          const factory = root.default;
          const overlap = await load('${entry}/plugins/dateRangeOverlap');
          const business = await load('${entry}/plugins/businessDays');
          const slots = await load('${entry}/plugins/timeSlots');
          const legacy = {
            dateRangeOverlapPlugin: overlap.default, businessDaysPlugin: business.default,
            timeSlotsPlugin: slots.default, checkDateRangeOverlap: overlap.checkDateRangeOverlap,
            InvalidDateRangeError: overlap.InvalidDateRangeError, OverlapDetectionError: overlap.OverlapDetectionError,
          };
          for (const [name, value] of Object.entries(legacy)) {
            assert.equal(Object.hasOwn(root, name), ${entry === 'atemporal/compat'});
            ${entry === 'atemporal/compat' ? 'assert.equal(root[name], value);' : ''}
          }
          assert.deepEqual(factory.getLoadedPlugins(), []);
          const range = { start: '2026-07-15', end: '2026-07-16' };
          assert.equal(overlap.checkDateRangeOverlap(range, range).overlaps, true);
          assert.throws(() => overlap.checkDateRangeOverlap(null, range), overlap.InvalidDateRangeError);
          factory.extend(overlap.default);
          factory.extend(business.default);
          factory.extend(slots.default);
          assert.equal(factory.checkDateRangeOverlap, overlap.checkDateRangeOverlap);
          assert.equal(factory('2026-07-17').addBusinessDays(1).format('YYYY-MM-DD'), '2026-07-20');
          await factory.lazyLoadMultiple(${JSON.stringify(plugins)});
          assert.equal(factory.getLoadedPlugins().length, ${plugins.length});
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `);
      cases.push({ entry, format, legacyRootExports: entry === 'atemporal/compat', plugins: plugins.length });
    }
  }
  return cases;
}

function measureBrowserBundles() {
  fs.writeFileSync(path.join(temporary, 'package.json'), '{"type":"module"}');
  const measurements = {};
  for (const entry of ['atemporal', 'atemporal/compat', 'atemporal/native']) {
    const result = buildSync({
      absWorkingDir: root,
      stdin: {
        contents: `import atemporal from '${entry}'; import relativeTime from '${entry}/plugins/relativeTime';
          atemporal.extend(relativeTime);
          export const result = atemporal('2026-07-15T10:00:00Z', 'America/Costa_Rica').format('YYYY-MM-DD HH:mm');`,
        resolveDir: root,
        sourcefile: 'entry.mjs',
      },
      outdir: path.join(temporary, entry.replace('/', '-')),
      entryNames: 'entry',
      bundle: true,
      splitting: true,
      format: 'esm',
      platform: 'browser',
      target: entry === 'atemporal' ? 'es2022' : 'es2020',
      minify: true,
      metafile: true,
      write: false,
      logLevel: 'silent',
    });
    const outputs = result.metafile.outputs;
    const initial = new Set();
    function visit(file) {
      if (initial.has(file)) return;
      initial.add(file);
      for (const imported of outputs[file].imports) {
        if (imported.kind !== 'dynamic-import' && !imported.external) visit(imported.path);
      }
    }
    const entryOutput = Object.keys(outputs).find((file) => outputs[file].entryPoint === 'entry.mjs');
    assert.ok(entryOutput, `Missing browser entry for ${entry}`);
    visit(entryOutput);
    let initialBytes = 0, initialGzip = 0, totalBytes = 0;
    for (const file of result.outputFiles) {
      const relative = path.relative(root, file.path).split(path.sep).join('/');
      totalBytes += file.contents.length;
      if (initial.has(relative)) {
        initialBytes += file.contents.length;
        initialGzip += gzipSync(file.contents).length;
        assert.ok(!Object.keys(outputs[relative].inputs).some((input) => /@js-temporal\/polyfill|\bjsbi\b/.test(input)) ||
          entry === 'atemporal/compat', `Polyfill in ${entry}'s initial static graph`);
      }
    }
    const polyfillOutputs = Object.keys(outputs).filter((file) =>
      Object.keys(outputs[file].inputs).some((input) => /@js-temporal\/polyfill/.test(input)));
    if (entry === 'atemporal') {
      assert.ok(polyfillOutputs.length > 0, 'Missing fallback chunk');
      assert.ok(polyfillOutputs.every((file) => !initial.has(file)), 'Fallback must be loaded dynamically');
    }
    if (entry === 'atemporal/native') assert.equal(polyfillOutputs.length, 0);
    // Execute the split browser build as ESM as well as inspecting its graph.
    for (const file of result.outputFiles) {
      fs.mkdirSync(path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.contents);
    }
    const runtimeModes = entry === 'atemporal/native'
      ? globalThis.Temporal ? ['native'] : []
      : ['missing', ...(globalThis.Temporal ? ['native'] : [])];
    const executionCases = [];
    for (const mode of runtimeModes) {
      const native = mode === 'native';
      const loads = runChild(`
        ${native ? '' : 'delete globalThis.Temporal;'}
        import(${JSON.stringify(pathToFileURL(path.resolve(root, entryOutput)).href)}).then(({ result }) => {
          require('node:assert/strict').equal(result, '2026-07-15 04:00');
        }).catch(error => { console.error(error); process.exitCode = 1; });
      `, {
        ATEMPORAL_CHUNK_URLS: JSON.stringify(polyfillOutputs.map((file) =>
          pathToFileURL(fs.realpathSync(path.resolve(root, file))).href)),
        ATEMPORAL_BLOCK_POLYFILL: native && entry !== 'atemporal/compat' ? '1' : '0',
      });
      assert.equal(loads.length, entry === 'atemporal/compat' || !native ? 1 : 0,
        `${entry}/${mode}: unexpected browser fallback chunk requests`);
      executionCases.push({ mode, polyfillChunkLoads: loads.length });
    }
    measurements[entry] = { initialBytes, initialGzip, totalBytes, files: result.outputFiles.length, executionCases };
  }
  assert.ok(measurements.atemporal.initialBytes < measurements['atemporal/compat'].initialBytes);
  return measurements;
}

function checkLegacyIife() {
  const result = buildSync({
    absWorkingDir: root,
    stdin: {
      contents: `import atemporal from 'atemporal/compat';
        import relativeTime from 'atemporal/compat/plugins/relativeTime';
        atemporal.extend(relativeTime);
        export const result = atemporal('2026-07-15T10:00:00Z', 'America/Costa_Rica').format('YYYY-MM-DD HH:mm');`,
      resolveDir: root,
    },
    bundle: true,
    format: 'iife',
    globalName: 'atemporalFixture',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    write: false,
    logLevel: 'silent',
  });
  const sandbox = { performance: require('node:perf_hooks').performance, console };
  require('node:vm').runInNewContext(result.outputFiles[0].text, sandbox, { timeout: 10000 });
  assert.equal(sandbox.atemporalFixture.result, '2026-07-15 04:00');
  return { target: 'es2020', format: 'iife', executed: true };
}

try {
  const report = { node: process.version, esbuild: require('esbuild').version,
    runtimeCases: checkRuntime(), pluginCases: checkPluginBoundaries(), browserBundles: measureBrowserBundles(), legacy: checkLegacyIife() };
  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reports/temporal-loading.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
