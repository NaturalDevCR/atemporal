import atemporal, { InvalidDateError } from '../../index';
import { Temporal } from '../../core/temporal-api';

const zone = 'America/New_York';

describe('compatibility parsing cache', () => {
  test('distinguishes date fields and subsecond epoch milliseconds', () => {
    expect(atemporal({ year: 2026, month: 7, day: 15 }, 'UTC').day).toBe(15);
    expect(atemporal({ year: 2026, month: 7, day: 16 }, 'UTC').day).toBe(16);

    expect(atemporal(new Date(1), 'UTC').raw.epochMilliseconds).toBe(1);
    expect(atemporal(new Date(999), 'UTC').raw.epochMilliseconds).toBe(999);
  });

  test('does not cache an object whose date fields can change on read', () => {
    let day = 15;
    const input = { year: 2026, month: 7, get day() { return day; } };
    expect(atemporal(input, 'UTC').day).toBe(15);
    day = 16;
    expect(atemporal(input, 'UTC').day).toBe(16);
  });
});

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

  test.each(['T', 't', ' '])('preserves local time with separator %j', (separator) => {
    expect(atemporal.parse(`2026-07-15${separator}12:30:00`, { timeZone: zone }).hour).toBe(12);
    expect(atemporal.tryParse(`2026-03-08${separator}02:30:00`, { timeZone: zone })).toBeNull();
  });

  test('applies the strict overflow and DST policies to date arrays', () => {
    expect(atemporal.tryParse([2026, 2, 29], { timeZone: zone })).toBeNull();
    expect(atemporal.parse([2026, 2, 29], { timeZone: zone, overflow: 'constrain' }).day).toBe(28);
    expect(atemporal.tryParse([2026, 3, 8, 2, 30], { timeZone: zone })).toBeNull();
    expect(atemporal.parse([2026, 11, 1, 1, 30], {
      timeZone: zone, disambiguation: 'later',
    }).raw.offset).toBe('-05:00');
  });

  test('retains calendar annotations and exact instants', () => {
    const plain = Temporal.PlainDateTime.from('2026-07-15T12:30:00[u-ca=hebrew]');
    const expected = plain.toZonedDateTime(zone);
    expect(atemporal.parse(plain, { timeZone: zone }).raw.equals(expected)).toBe(true);
    expect(atemporal.parse('2026-07-15T12:30:00[u-ca=hebrew]', { timeZone: zone }).raw.equals(expected))
      .toBe(true);
    expect(atemporal.parse('2026-07-15T12:30:00[America/New_York][u-ca=hebrew]').raw.equals(expected))
      .toBe(true);
    expect(atemporal.parse('2026-07-15T12:30:00-04[u-ca=hebrew]').raw.equals(expected.withTimeZone('-04:00')))
      .toBe(true);

    const secondOffset = '2026-07-15T12:30:00-04:00:30';
    expect(atemporal.parse(secondOffset).raw.epochNanoseconds).toBe(Temporal.Instant.from(secondOffset).epochNanoseconds);
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
