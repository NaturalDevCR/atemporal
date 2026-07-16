const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const workflow = (name) => fs.readFileSync(path.join(root, '.github', 'workflows', name), 'utf8');
const script = (name) => fs.readFileSync(path.join(root, 'scripts', name), 'utf8');
const fixture = (...segments) => fs.readFileSync(path.join(root, 'integration', ...segments), 'utf8');

function matches(text, expression) {
  return text.match(expression) || [];
}

function jobBlock(workflowText, jobName) {
  const start = workflowText.indexOf(`  ${jobName}:`);

  if (start === -1) {
    throw new Error(`Missing ${jobName} job`);
  }

  const remaining = workflowText.slice(start + 1);
  const nextJobOffset = remaining.search(/\n {2}\S/);
  const nextJob = nextJobOffset === -1 ? -1 : start + 1 + nextJobOffset;

  return workflowText.slice(start, nextJob === -1 ? undefined : nextJob);
}

describe('release artifact workflow contracts', () => {
  test('repository workflows install root dependencies through pnpm', () => {
    for (const name of ['ci.yml', 'integration.yml', 'hosted-baseline-capture.yml', 'mutation.yml', 'deploy-docs.yml']) {
      const source = workflow(name);

      expect(source).toContain('corepack enable');
      expect(source).toContain('cache: pnpm');
      expect(source).toContain('pnpm install --frozen-lockfile');
      expect(source).not.toMatch(/^\s*- run: npm ci/m);
    }
  });

  test('pnpm is installed before setup-node initializes a pnpm cache', () => {
    const workflows = fs.readdirSync(path.join(root, '.github', 'workflows'))
      .filter((name) => name.endsWith('.yml'))
      .map(workflow)
      .join('\n');

    const cacheUses = matches(workflows, /cache: pnpm/g);

    expect(cacheUses.length).toBeGreaterThan(0);
    expect(matches(workflows, /pnpm\/action-setup@v4[\s\S]{0,350}?cache: pnpm/g)).toHaveLength(cacheUses.length);
  });

  test('repository workflows use the reviewed GitHub Actions major versions', () => {
    const workflows = fs.readdirSync(path.join(root, '.github', 'workflows'))
      .filter((name) => name.endsWith('.yml'))
      .map(workflow)
      .join('\n');

    for (const action of [
      'actions/checkout@v6',
      'actions/setup-node@v6',
      'pnpm/action-setup@v4',
      'actions/upload-artifact@v7',
      'actions/download-artifact@v8',
      'codecov/codecov-action@v6',
      'gitleaks/gitleaks-action@v3',
      'actions/github-script@v9',
      'googleapis/release-please-action@v5',
      'softprops/action-gh-release@v3',
    ]) {
      expect(workflows).toContain(action);
    }
  });

  test('mutation smoke check passes Stryker flags directly through pnpm', () => {
    const mutation = workflow('mutation.yml');

    expect(mutation).toContain('pnpm run test:mutation --dryRunOnly');
    expect(mutation).not.toContain('pnpm run test:mutation -- --dryRunOnly');
  });

  test('Jest flags pass directly through pnpm scripts', () => {
    const workflows = ['ci.yml', 'integration.yml', 'release.yml'].map(workflow).join('\n');

    expect(workflows).not.toContain('pnpm run test:ci -- --');
  });

  test('release validates and publishes its single packed artifact', () => {
    const release = workflow('release.yml');

    expect(matches(release, /pnpm run pack:artifact/g)).toHaveLength(1);
    expect(release).toContain("require('./artifacts/package-artifact.json').path");
    expect(release).toContain('npm publish "$(node -p');
    expect(release.indexOf("require('./artifacts/package-artifact.json').path")).toBeLessThan(
      release.indexOf('npm publish "$(node -p'),
    );
  });

  test('publish job only publishes the metadata-selected local tarball', () => {
    const publish = jobBlock(workflow('release.yml'), 'publish-npm');

    expect(publish).not.toMatch(/pnpm run build|npm pack/);
    expect(publish).toContain(
      'npm publish "$(node -p "require(\'./artifacts/package-artifact.json\').path")" --access public --tag latest',
    );
    expect(matches(publish, /npm publish /g)).toHaveLength(1);
    expect(publish).toContain("node-version: '24.12.0'");
    expect(publish).not.toContain('NODE_AUTH_TOKEN');
    expect(publish).not.toContain('--provenance');
  });

  test('release validation and SBOM generation install through pnpm', () => {
    const release = workflow('release.yml');

    for (const name of ['release-validation', 'attach-sbom']) {
      const job = jobBlock(release, name);
      expect(job).toContain('cache: pnpm');
      expect(job).toContain('corepack enable');
      expect(job).toContain('pnpm install --frozen-lockfile');
      expect(job).not.toMatch(/^\s*- run: npm ci/m);
    }
  });

  test('package metadata emits an npm-valid local artifact path', () => {
    const producer = script('create-package-artifact.cjs');

    expect(producer).toContain("path: `./${path.relative(projectRoot, tarballPath)}`");
  });

  test('pull requests gate packed-artifact contracts but defer performance gating', () => {
    const ci = workflow('ci.yml');

    expect(ci).toContain('contract-fixtures:');
    expect(ci).toContain('pnpm run fixtures:contract');
    expect(ci).toContain('FIXTURE_TYPESCRIPT_VERSION: ${{ matrix.typescript-version }}');
    expect(ci).not.toContain('npm install --prefix "${fixture}"');
    expect(ci).not.toContain('bench:gate');
    expect(ci).not.toContain('perf-gate:');
  });

  test('PR build evidence retains canonical metafiles even after a later failure', () => {
    const build = jobBlock(workflow('ci.yml'), 'build');

    expect(build).toContain('integration/canonical-bundle/dist/*.meta.json');
    expect(build).toMatch(/Upload size reports[\s\S]*?if: always\(\)/);
  });

  test('scheduled validation retains benchmark evidence without creating a baseline', () => {
    const integration = workflow('integration.yml');

    expect(integration).toContain("cron: '0 6 * * 1'");
    expect(integration).toContain('pnpm run bench:gate');
    expect(integration).toContain('reviewed-performance-baseline');
    expect(integration).not.toMatch(/(?:cp|mv|tee)\s+.*benchmarks\/baseline\.json/);
    expect(integration).toMatch(/set -o pipefail|>\s*bench-out\.json/);
    expect(workflow('release.yml')).toMatch(/set -o pipefail|>\s*bench-out\.json/);
  });

  test('manual hosted baseline capture is pinned and cannot commit a baseline', () => {
    const capture = workflow('hosted-baseline-capture.yml');

    expect(capture).toContain('workflow_dispatch:');
    expect(capture).toContain('runs-on: ubuntu-24.04');
    expect(capture).toContain("node-version: '20.19.0'");
    expect(capture).toContain('timeout-minutes: 15');
    expect(capture).toContain('artifacts/proposed-performance-baseline.json');
    expect(capture).toContain('proposed-hosted-performance-baseline');
    expect(capture).not.toMatch(/(?:git\s+(?:add|commit|push)|benchmarks\/baseline\.json)/);
  });

  test('weekly and release evidence retain canonical and extended-bundler diagnostics', () => {
    for (const name of ['integration.yml', 'release.yml']) {
      const contents = workflow(name);

      expect(contents).toContain('integration/canonical-bundle/dist/*.meta.json');
      expect(contents).toContain('reports/bundler-diagnostics/');
      expect(contents).toContain('if: always()');
    }

    expect(fixture('extended', 'vite', 'vite.config.ts')).toContain('ATEMPORAL_DIAGNOSTICS_DIR');
    expect(fixture('extended', 'webpack', 'webpack.config.cjs')).toContain('ATEMPORAL_DIAGNOSTICS_DIR');
    expect(script('run-fixtures.cjs')).toContain("'reports', 'bundler-diagnostics'");
  });

  test('supply-chain ADR describes performance validation as weekly and release-only', () => {
    const adr = fs.readFileSync(path.join(root, 'docs', 'adr', '0007-supply-chain-hardening.md'), 'utf8');

    expect(adr).toMatch(/weekly\s+integration validation and release validation/);
    expect(adr).not.toContain('Performance regressions are caught at PR time');
  });
});
