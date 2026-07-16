const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const workflow = (name) => fs.readFileSync(path.join(root, '.github', 'workflows', name), 'utf8');

function matches(text, expression) {
  return text.match(expression) || [];
}

describe('release artifact workflow contracts', () => {
  test('release validates and publishes its single packed artifact', () => {
    const release = workflow('release.yml');

    expect(matches(release, /npm run pack:artifact/g)).toHaveLength(1);
    expect(release).toContain("require('./artifacts/package-artifact.json').path");
    expect(release).toContain('npm publish "$(node -p');
    expect(release.indexOf("require('./artifacts/package-artifact.json').path")).toBeLessThan(
      release.indexOf('npm publish "$(node -p'),
    );
  });

  test('pull requests gate packed-artifact contracts but defer performance gating', () => {
    const ci = workflow('ci.yml');

    expect(ci).toContain('contract-fixtures:');
    expect(ci).toContain('npm run fixtures:contract');
    expect(ci).toContain('FIXTURE_TYPESCRIPT_VERSION: ${{ matrix.typescript-version }}');
    expect(ci).not.toContain('npm install --prefix "${fixture}"');
    expect(ci).not.toContain('bench:gate');
    expect(ci).not.toContain('perf-gate:');
  });

  test('scheduled validation retains benchmark evidence without creating a baseline', () => {
    const integration = workflow('integration.yml');

    expect(integration).toContain("cron: '0 6 * * 1'");
    expect(integration).toContain('npm run bench:gate');
    expect(integration).toContain('reviewed-performance-baseline');
    expect(integration).not.toMatch(/(?:cp|mv|tee)\s+.*benchmarks\/baseline\.json/);
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
});
