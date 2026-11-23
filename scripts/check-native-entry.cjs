'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { gzipSync } = require('node:zlib');
const { buildSync } = require('esbuild');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const plugins = Object.keys(pkg.exports)
  .filter((name) => name.startsWith('./native/plugins/'))
  .map((name) => name.slice('./native/plugins/'.length));

function runChild(source) {
  const result = spawnSync(process.execPath, ['-e', source], { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function measure(entry, plugin) {
  const result = buildSync({
    absWorkingDir: root,
    stdin: {
      contents: `import atemporal from '${entry}';
        ${plugin ? `import relativeTime from '${entry}/plugins/relativeTime'; atemporal.extend(relativeTime);` : ''}
        export const result = atemporal('2024-07-15T12:00:00Z', 'America/Costa_Rica')
          ${plugin ? '.fromNow()' : ".format('YYYY-MM-DD HH:mm')"};`,
      resolveDir: root,
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    metafile: true,
    write: false,
    logLevel: 'silent',
  });
  const bytes = result.outputFiles[0].contents;
  const dependencies = Object.keys(result.metafile.inputs);
  const hasPolyfill = dependencies.some((input) => /@js-temporal\/polyfill|\bjsbi\b/.test(input));
  assert.equal(hasPolyfill, entry === 'atemporal/compat', `${entry}: unexpected implementation dependencies`);
  return { raw: bytes.length, gzip: gzipSync(bytes).length };
}

function checkDeclarations(directory) {
  for (const file of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, file.name);
    if (file.isDirectory()) checkDeclarations(target);
    else if (/\.d\.(?:ts|mts)$/.test(file.name)) {
      const source = ts.createSourceFile(target, fs.readFileSync(target, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node) => {
        const specifier = ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined;
        if (specifier && ts.isStringLiteral(specifier)) {
          assert.notEqual(specifier.text, '@js-temporal/polyfill',
            `Published declaration depends on polyfill types: ${target}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  }
}

function checkIsolatedTypes() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'atemporal-native-types-'));
  try {
    // Deliberately copy only Atemporal: no installed polyfill or @types packages.
    const packageRoot = path.join(temporary, 'node_modules/atemporal');
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.cpSync(path.join(root, 'dist'), path.join(packageRoot, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify(pkg));
    for (const [module, moduleResolution] of [
      [ts.ModuleKind.ESNext, ts.ModuleResolutionKind.Bundler],
      [ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16],
      [ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext],
    ]) {
      for (const suffix of ['mts', 'cts']) {
        if (moduleResolution === ts.ModuleResolutionKind.Bundler && suffix === 'cts') continue;
        const source = path.join(temporary, `consumer.${suffix}`);
        fs.writeFileSync(source, ['atemporal', 'atemporal/native', 'atemporal/compat'].map((entry, index) => `
          import atemporal${index}, { type AtemporalFactory as Factory${index} } from '${entry}';
          ${plugins.map((name) => `import ${name}${index} from '${entry}/plugins/${name}';`).join('\n')}
          ${entry === 'atemporal/compat' ? `
            import { businessDaysPlugin, timeSlotsPlugin, dateRangeOverlapPlugin,
              checkDateRangeOverlap, InvalidDateRangeError, OverlapDetectionError } from '${entry}';
            const legacyPlugins: [typeof businessDays${index}, typeof timeSlots${index}, typeof dateRangeOverlap${index}]
              = [businessDaysPlugin, timeSlotsPlugin, dateRangeOverlapPlugin];
            const result = checkDateRangeOverlap({ start: '2026-07-15', end: '2026-07-16' },
              { start: '2026-07-15', end: '2026-07-17' });
            const overlap: boolean = result.overlaps;
          ` : `
            import * as rootNamespace${index} from '${entry}';
            ${['dateRangeOverlapPlugin', 'businessDaysPlugin', 'timeSlotsPlugin', 'checkDateRangeOverlap',
              'InvalidDateRangeError', 'OverlapDetectionError'].map((name) => `
              // @ts-expect-error v3 plugins must be imported from explicit subpaths.
              rootNamespace${index}.${name};
            `).join('\n')}
          `}
          const factory${index}: Factory${index} = atemporal${index};
          ${plugins.map((name) => `factory${index}.extend(${name}${index});`).join('\n')}
          const instant${index}: bigint = factory${index}.instant('2026-07-15T10:00:00Z').epochNanoseconds;
          const relative${index}: string = factory${index}('2026-07-15').fromNow();
          const humanized${index}: string = factory${index}.humanize({ hours: 2 });
          // @ts-expect-error A plain date cannot be used as an instant.
          factory${index}.instant({ year: 2026, month: 7, day: 15 });
        `).join('\n'));
        const program = ts.createProgram([source], {
          module, moduleResolution,
          target: ts.ScriptTarget.ES2022,
          types: [],
          strict: true,
          skipLibCheck: false,
          noEmit: true,
        });
        const errors = ts.getPreEmitDiagnostics(program);
        assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
          getCurrentDirectory: () => temporary,
          getNewLine: () => '\n',
          getCanonicalFileName: (file) => file,
        }));
      }
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function checkNativeEntry() {
  checkDeclarations(path.join(root, 'dist'));
  checkIsolatedTypes();
  for (const format of ['require', 'import']) {
    // A missing or incomplete global must produce an actionable error in both formats.
    for (const global of ['undefined', '{}']) {
      runChild(`
        globalThis.Temporal = ${global};
        (async () => {
          for (const entry of ${JSON.stringify(['atemporal/native', ...plugins.map((name) => `atemporal/native/plugins/${name}`)])}) {
            try {
              ${format === 'require' ? 'require(entry)' : 'await import(entry)'};
              throw new Error('Native entry unexpectedly loaded: ' + entry);
            } catch (error) {
              if (!error.message.includes('atemporal/native requires globalThis.Temporal')) throw error;
            }
          }
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `);
    }

    if (globalThis.Temporal) {
      runChild(`
        const assert = require('node:assert/strict');
        const Module = require('node:module');
        const originalResolve = Module._resolveFilename;
        Module._resolveFilename = function(request, ...args) {
          if (request.includes('@js-temporal/polyfill') || request === 'jsbi') {
            throw new Error('Native entry attempted to load ' + request);
          }
          return originalResolve.call(this, request, ...args);
        };
        (async () => {
          const imported = ${format === 'require' ? "require('atemporal/native')" : "await import('atemporal/native')"};
          const atemporal = imported.default || imported;
          assert.equal(atemporal.getTemporalInfo().isNative, true);
          const instant = atemporal.instant('2026-07-15T10:00:00.123456789Z');
          assert.ok(instant instanceof globalThis.Temporal.Instant);
          assert.equal(instant.toString(), '2026-07-15T10:00:00.123456789Z');
          assert.equal(atemporal('2026-07-15T10:00:00Z').timeZone('America/Costa_Rica')
            .add(1, 'day').format('YYYY-MM-DD HH:mm'), '2026-07-16 04:00');
          assert.ok(atemporal.parse('2026-07-15T10:00:00Z').raw instanceof globalThis.Temporal.ZonedDateTime);
          assert.equal(atemporal.date('2026-07-15').calendarId, 'iso8601');
          assert.equal(atemporal.plainDateTime('2026-07-15T10:00:00').hour, 10);
          assert.throws(() => atemporal.zonedDateTime('2026-11-01T01:30:00', { timeZone: 'America/New_York' }));
          assert.equal(atemporal.zonedDateTime('2026-11-01T01:30:00', {
            timeZone: 'America/New_York', disambiguation: 'later',
          }).offset, '-05:00');
          await atemporal.lazyLoad('relativeTime');
          for (const name of ${JSON.stringify(plugins)}) {
            const entry = 'atemporal/native/plugins/' + name;
            const plugin = ${format === 'require' ? 'require(entry)' : 'await import(entry)'};
            atemporal.extend(plugin.default || plugin);
          }
          atemporal.setDefaultLocale('en');
          const date = atemporal('2026-07-15T10:00:00Z');
          assert.equal(typeof date.fromNow(), 'string');
          assert.notEqual(date.fromNow(), 'Invalid Date');
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `);
    }
  }

  const measurements = {};
  for (const [name, plugin] of [['core', false], ['relativeTime', true]]) {
    const fallback = measure('atemporal/compat', plugin);
    const native = measure('atemporal/native', plugin);
    assert.ok(native.raw < fallback.raw, `${name}: native bundle must be smaller`);
    assert.ok(native.gzip < fallback.gzip, `${name}: native gzip must be smaller`);
    measurements[name] = { fallback, native };
  }
  const report = {
    node: process.version,
    esbuild: require('esbuild').version,
    nativeRuntimeChecked: Boolean(globalThis.Temporal),
    measurements,
  };
  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reports/native-entry.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}

checkNativeEntry();
