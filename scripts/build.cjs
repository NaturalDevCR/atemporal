const fs = require('node:fs');
const path = require('node:path');
const { build } = require('tsup');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const entry = [
  "src/index.ts",
  "src/plugins/relativeTime.ts",
  "src/plugins/advancedFormat.ts",
  "src/plugins/customParseFormat.ts",
  "src/plugins/durationHumanizer.ts",
  "src/plugins/weekDay.ts",
  "src/plugins/dateRangeOverlap.ts",
  "src/plugins/businessDays.ts",
  "src/plugins/timeSlots.ts"
];

function emitDeclarations() {
  const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
  const options = {
    ...parsed.options,
    declaration: true,
    emitDeclarationOnly: true,
    declarationMap: false,
    noEmit: false,
  };
  const program = ts.createProgram([...entry, 'src/index-compat.ts'].map((file) => path.join(root, file)), options);
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (file) => file,
      getNewLine: () => '\n',
    }));
  }

  // Preserve the source module boundaries so plugin augmentations target the
  // original class/interfaces. Explicit extensions support Node16/NodeNext too.
  for (const extension of ['.js', '.mjs']) {
    const result = program.emit(undefined, (file, contents) => {
      const relative = path.relative(path.join(root, 'dist'), file)
        .replace(/\.d\.ts$/, extension === '.mjs' ? '.d.mts' : '.d.ts');
      for (const distribution of ['dist', 'dist/native', 'dist/compat']) {
        const output = path.join(root, distribution, relative);
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(output, contents);
      }
    }, undefined, true, {
      afterDeclarations: [(context) => (source) => {
        const visit = (node) => {
          if (ts.isStringLiteral(node) && /^\.{1,2}\//.test(node.text)) {
            const resolved = ts.resolveModuleName(node.text, source.fileName, options, ts.sys).resolvedModule;
            if (!resolved) throw new Error(`Cannot resolve declaration import ${node.text} in ${source.fileName}`);
            let relative = path.relative(path.dirname(source.fileName), resolved.resolvedFileName)
              .split(path.sep).join('/').replace(/(?:\.d)?\.ts$/, extension);
            if (!relative.startsWith('.')) relative = './' + relative;
            return ts.factory.createStringLiteral(relative);
          }
          return ts.visitEachChild(node, visit, context);
        };
        return ts.visitNode(source, visit);
      }],
    });
    if (result.emitSkipped) throw new Error('Temporal declarations were not emitted');
    // Input declaration files are not copied by TypeScript's emitter.
    for (const distribution of ['dist', 'dist/native', 'dist/compat']) {
      fs.copyFileSync(path.join(root, 'src/types/temporal.d.ts'),
        path.join(root, distribution, 'types', extension === '.mjs' ? 'temporal.d.mts' : 'temporal.d.ts'));
    }
  }
}

async function buildPackage() {
  // Clean once before either build so their independent chunks cannot delete each other.
  fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
  const shared = {
    entry,
    format: ['cjs', 'esm'],
    dts: false,
    splitting: true,
    sourcemap: true,
    clean: false,
    config: false,
  };

  const fallbackPlugin = (file) => ({
    name: 'select-temporal-fallback',
    setup(builder) {
      builder.onResolve({ filter: /^\.\/temporal-fallback$/ }, ({ importer }) => {
        if (importer === path.join(root, 'src/core/temporal-detection.ts')) {
          return { path: path.join(root, 'src/core', file) };
        }
      });
    },
  });

  await build({ ...shared, format: ['cjs'], target: 'es2020', outDir: 'dist' });
  await build({
    ...shared, format: ['esm'], target: 'es2022', outDir: 'dist',
    esbuildPlugins: [fallbackPlugin('temporal-fallback-auto.mts')],
  });
  await build({
    ...shared, entry: Object.fromEntries(entry.map((file) => [
      file.replace(/^src\//, '').replace(/\.ts$/, ''),
      file === 'src/index.ts' ? 'src/index-compat.ts' : file,
    ])), target: 'es2020', outDir: 'dist/compat',
    esbuildPlugins: [fallbackPlugin('temporal-fallback-compat.ts')],
  });
  await build({
    ...shared, target: 'es2020', outDir: 'dist/native',
    esbuildPlugins: [fallbackPlugin('temporal-fallback-native.ts')],
  });
  emitDeclarations();
}

buildPackage().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
