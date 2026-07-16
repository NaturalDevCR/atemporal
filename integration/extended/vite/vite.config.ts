import { defineConfig } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function bundlerDiagnostics() {
  return {
    name: 'atemporal-bundler-diagnostics',
    generateBundle(_outputOptions: unknown, bundle: Record<string, unknown>) {
      try {
        const directory = resolve(
          process.env.ATEMPORAL_DIAGNOSTICS_DIR ?? 'reports/bundler-diagnostics',
        );
        mkdirSync(directory, { recursive: true });
        writeFileSync(
          resolve(directory, 'vite-rollup.json'),
          `${JSON.stringify({ bundler: 'vite-rollup', files: Object.keys(bundle).sort() }, null, 2)}\n`,
        );
      } catch (error) {
        this.warn(`Could not write informational Vite/Rollup diagnostics: ${String(error)}`);
      }
    },
  };
}

export default defineConfig({
  build: {
    minify: 'esbuild',
    rollupOptions: {
      plugins: [bundlerDiagnostics()],
    },
  },
});
