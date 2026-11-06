'use strict';

const temporal = globalThis.Temporal;

if (!temporal) {
  process.stdout.write('Native Temporal is unavailable; native runtime smoke check skipped.\n');
  process.exit(0);
}

const imported = require('../dist/index.js');
const atemporal = imported.default || imported;
const { Temporal: polyfill } = require('@js-temporal/polyfill');

if (atemporal.getTemporalInfo().isNative !== true) {
  throw new Error('Atemporal did not select Node native Temporal');
}

const input = temporal.ZonedDateTime.from('2026-07-15T10:00:00+00:00[UTC]');
const result = atemporal(input)
  .timeZone('America/Costa_Rica')
  .add(1, 'day')
  .format('YYYY-MM-DD HH:mm');

if (result !== '2026-07-16 04:00') {
  throw new Error(`Unexpected native Temporal result: ${result}`);
}

const instantInput = polyfill.Instant.from('2026-07-15T10:00:00.123456789Z');
const instant = atemporal.instant(instantInput);
if (!(instant instanceof temporal.Instant) || instant.epochNanoseconds !== instantInput.epochNanoseconds) {
  throw new Error('Atemporal did not preserve the polyfill instant when converting to native Temporal');
}

const zonedInput = polyfill.ZonedDateTime.from('2026-07-15T10:00:00[America/Costa_Rica][u-ca=hebrew]');
const parsed = atemporal.parse(zonedInput).raw;
if (!(parsed instanceof temporal.ZonedDateTime) || parsed.toString() !== zonedInput.toString()) {
  throw new Error('Atemporal did not preserve the polyfill zoned date-time when parsing with native Temporal');
}

process.stdout.write('Native Temporal production-artifact smoke check passed.\n');
