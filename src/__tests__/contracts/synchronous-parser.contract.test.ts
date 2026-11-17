import atemporal from '../../index';
import { Temporal } from '../../core/temporal-api';
import { ParseCoordinator } from '../../core/parsing/parse-coordinator';
import type { DateInput } from '../../types';
import type { TemporalInput } from '../../types/enhanced-types';

describe('synchronous parsing runtime contract', () => {
  afterEach(() => {
    atemporal.resetDiagnostics();
    atemporal.setDefaultTimeZone('UTC');
  });

  const epoch = Date.parse('2026-07-15T10:00:00Z');
  const cases: Array<[string, DateInput & TemporalInput, string]> = [
    ['ISO milliseconds', '2026-07-15T10:00:00.123Z', '2026-07-15T10:00:00.123[UTC]'],
    ['Temporal nanoseconds', Temporal.ZonedDateTime.from('2026-07-15T10:00:00.123456789[UTC]'), '2026-07-15T10:00:00.123456789[UTC]'],
    ['JavaScript Date', new Date(epoch), '2026-07-15T10:00:00[UTC]'],
    ['epoch milliseconds', epoch, '2026-07-15T10:00:00[UTC]'],
    ['Firebase nanoseconds', { seconds: epoch / 1000, nanoseconds: 123456789, toDate: () => new Date(epoch) }, '2026-07-15T10:00:00.123456789[UTC]'],
    ['annotated calendar', Temporal.ZonedDateTime.from('2026-07-15T10:00:00[UTC][u-ca=hebrew]'), '2026-07-15T10:00:00[UTC][u-ca=hebrew]'],
    ['DST offset', Temporal.ZonedDateTime.from('2026-11-01T01:30:00-04:00[America/New_York]'), '2026-11-01T01:30:00-04:00[America/New_York]'],
  ];

  test.each(cases)('preserves %s across the factory and standalone coordinator', (_name, input, expected) => {
    const standalone = new ParseCoordinator({ enableDetailedMetrics: false });
    const expectedValue = Temporal.ZonedDateTime.from(expected);
    const options = { timeZone: expectedValue.timeZoneId };
    const result = standalone.getParseEngine().parse(input, options);

    expect(result.success).toBe(true);
    expect(result.data?.toString()).toBe(expectedValue.toString());
    expect(atemporal(input, expectedValue.timeZoneId).raw.toString()).toBe(expectedValue.toString());
  });

  test.each([
    '2026-07-15T10:00:00.123456789Z',
    '2026-07-15T10:00:00[UTC][u-ca=hebrew]',
    '2026-11-01T01:30:00-04:00[America/New_York]',
  ])('strict parsing preserves precision, calendar, and zone for %s', (input) => {
    const expected = input.endsWith('Z') ? Temporal.Instant.from(input).toZonedDateTimeISO('UTC')
      : Temporal.ZonedDateTime.from(input);
    expect(atemporal.parse(input).raw.toString()).toBe(expected.toString());
  });

  test('construction and public diagnostics share cache counters and resets', () => {
    atemporal.resetDiagnostics();
    atemporal.setDefaultTimeZone('America/Costa_Rica');
    const input = '2026-07-15T10:00:00Z';

    atemporal(input);
    atemporal(input);
    const cached = atemporal.getDiagnostics().caches.parsing;
    expect(cached.totalParses).toBe(2);
    expect(cached.cachedParses).toBe(1);

    atemporal.clearCaches();
    atemporal(input);
    const cleared = atemporal.getDiagnostics().caches.parsing;
    expect(cleared.totalParses).toBe(3);
    expect(cleared.cachedParses).toBe(1);

    atemporal.resetDiagnostics();
    expect(atemporal.getDiagnostics().caches.parsing).toMatchObject({ totalParses: 0, cachedParses: 0 });
    expect(atemporal().timeZoneId).toBe('America/Costa_Rica');
  });
});
