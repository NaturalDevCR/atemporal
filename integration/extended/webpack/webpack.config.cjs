const path = require('node:path');
const fs = require('node:fs');

class InformationalWebpackStatsPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('InformationalWebpackStatsPlugin', (stats) => {
      try {
        const directory = path.resolve(
          process.env.ATEMPORAL_DIAGNOSTICS_DIR || 'reports/bundler-diagnostics',
        );
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(
          path.join(directory, 'webpack-stats.json'),
          `${JSON.stringify(stats.toJson({ all: false, assets: true, chunks: true, modules: true }), null, 2)}\n`,
        );
      } catch (error) {
        console.warn(`Could not write informational Webpack diagnostics: ${String(error)}`);
      }
    });
  }
}

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  optimization: {
    minimize: true,
  },
  plugins: [new InformationalWebpackStatsPlugin()],
};
