import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import atemporal, { Atemporal } from 'atemporal';
import relativeTime from 'atemporal/plugins/relativeTime';

atemporal.extend(relativeTime);
const result = atemporal('2026-07-15T10:00:00Z')
  .timeZone('America/Costa_Rica')
  .add(1, 'day')
  .format('YYYY-MM-DD HH:mm');
if (result !== '2026-07-16 04:00' || !atemporal.isPluginLoaded('relativeTime')) {
  throw new Error(`Unexpected ESM contract result: ${result}`);
}
if (atemporal.instant('2026-07-15T10:00:00Z').epochMilliseconds <= 0) throw new Error('instant failed');
if (atemporal.date('2026-07-15').day !== 15) throw new Error('date failed');
if (atemporal.plainDateTime('2026-07-15T10:00:00').hour !== 10) throw new Error('plainDateTime failed');

const require = createRequire(import.meta.url);
const { default: commonjs, Atemporal: CommonJsAtemporal } = require('atemporal');
const source = '2026-07-15T10:00:00.123456789-06:00[America/Costa_Rica]';
const fromImport = atemporal(atemporal.zonedDateTime(source));
const fromRequire = commonjs(commonjs.zonedDateTime(source));
assert.ok(fromRequire instanceof Atemporal && fromImport instanceof CommonJsAtemporal);
assert.ok(atemporal.isAtemporal(fromRequire) && commonjs.isAtemporal(fromImport));
assert.equal(atemporal(fromRequire).raw.toString(), source);
assert.equal(commonjs.from(fromImport).raw.toString(), source);
assert.equal(atemporal.parse(fromRequire).raw.toString(), source);
assert.equal(fromImport.diff(fromRequire, 'day'), 0);
assert.equal(commonjs(fromImport, 'UTC').raw.epochNanoseconds, fromImport.raw.epochNanoseconds);

commonjs.extend(relativeTime);
assert.equal(commonjs.isPluginLoaded('relativeTime'), true);
atemporal.extend(require('atemporal/plugins/advancedFormat').default);
assert.equal(atemporal.isPluginLoaded('advancedFormat'), true);
await atemporal.lazyLoad('customParseFormat');
assert.equal(atemporal.isPluginLoaded('customParseFormat'), true);
await commonjs.lazyLoad('weekDay');
assert.equal(commonjs.isPluginLoaded('weekDay'), true);
