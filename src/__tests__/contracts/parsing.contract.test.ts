import atemporal, { InvalidDateError } from '../../index';
import { Temporal } from '../../core/temporal-api';

const zone = 'America/New_York';

describe('strict parsing contract', () => {
  test('rejects a spring-forward gap by default', () => {
    expect(() => atemporal.parse('2026-03-08T02:30:00', { timeZone: zone }))
      .toThrow(InvalidDateError);
  });

  test('requires an explicit policy for a fall-back overlap', () => {
    expect(() => atemporal.parse('2026-11-01T01:30:00', { timeZone: zone }))
      .toThrow(InvalidDateError);

    expect(atemporal.parse('2026-11-01T01:30:00', {
      timeZone: zone,
      disambiguation: 'earlier',
    }).format('Z')).toBe('-04:00');
  });

  test('rejects invalid calendar components and tryParse never throws', () => {
    const invalid = { year: 2026, month: 2, day: 29 };

    expect(() => atemporal.parse(invalid, { timeZone: zone }))
      .toThrow(InvalidDateError);
    expect(atemporal.tryParse(invalid, { timeZone: zone })).toBeNull();
  });

  test('strictly handles zoned, offset, wrapper, plain and timestamp categories', () => {
    expect(atemporal.parse('2026-07-15T10:00:00-05:00').format('Z')).toBe('-05:00');
    expect(atemporal.parse('2026-07-15T10:00:00-05:00', {
      timeZone: 'UTC',
      preserveOriginalTimeZone: false,
    }).format('Z')).toBe('+00:00');
    expect(atemporal.parse('2026-07-15T10:00:00[America/Costa_Rica]').timeZoneId)
      .toBe('America/Costa_Rica');

    const zoned = Temporal.ZonedDateTime.from('2026-07-15T10:00:00+00:00[UTC]');
    const plain = Temporal.PlainDateTime.from('2026-07-15T10:00:00');
    expect(atemporal.parse(zoned).timeZoneId).toBe('UTC');
    expect(atemporal.parse(plain, { timeZone: 'America/Costa_Rica' }).timeZoneId)
      .toBe('America/Costa_Rica');
    expect(atemporal.parse(0).format('YYYY')).toBe('1970');
    expect(() => atemporal.parse(null)).toThrow(InvalidDateError);
    expect(() => atemporal.parse(atemporal('not-a-date'))).toThrow(InvalidDateError);
  });
});
