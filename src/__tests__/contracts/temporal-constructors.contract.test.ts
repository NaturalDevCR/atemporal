import atemporal, { type InstantInput, type PlainDateInput } from '../../index';
import { Temporal } from '../../core/temporal-api';

describe('explicit Temporal constructors', () => {
  test('preserve their temporal category', () => {
    const instantInput: InstantInput = '2026-07-15T10:00:00Z';
    const dateInput: PlainDateInput = { year: 2026, month: 7, day: 15 };

    expect(atemporal.instant(instantInput)).toBeInstanceOf(Temporal.Instant);
    expect(atemporal.date(dateInput)).toBeInstanceOf(Temporal.PlainDate);
    expect(atemporal.plainDateTime('2026-07-15T10:00:00')).toBeInstanceOf(Temporal.PlainDateTime);
    if (false) {
      // @ts-expect-error A plain date has no instant or timezone.
      atemporal.instant(dateInput);
    }
  });

  test('zonedDateTime rejects ambiguous local input unless given a policy', () => {
    expect(() => atemporal.zonedDateTime('2026-11-01T01:30:00', {
      timeZone: 'America/New_York',
    })).toThrow();
    expect(atemporal.zonedDateTime('2026-11-01T01:30:00', {
      timeZone: 'America/New_York', disambiguation: 'later',
    }).offset).toBe('-05:00');
  });

  test('preserves instants with hour-only and sub-minute offsets', () => {
    expect(atemporal.instant('2026-07-15T10:00:00+06[u-ca=iso8601]').toString())
      .toBe('2026-07-15T04:00:00Z');
    expect(atemporal.zonedDateTime('2026-07-15T10:00:00+06:30:25.1').toInstant().toString())
      .toBe('2026-07-15T03:29:34.9Z');
    const converted = atemporal.zonedDateTime('2026-07-15T10:00:00+06[u-ca=hebrew]', { timeZone: 'UTC' });
    expect(converted.toString()).toBe('2026-07-15T04:00:00+00:00[UTC][u-ca=hebrew]');
    expect(atemporal.zonedDateTime('2026-07-15T10:00:00+06').timeZoneId).toBe('+06:00');
    expect(() => atemporal.instant('2026-07-15T10:00:00')).toThrow();
  });

  test('accepts millisecond inputs and keeps the instant when changing an annotated zone', () => {
    const instant = Temporal.Instant.fromEpochMilliseconds(999);
    expect(atemporal.instant(instant)).toBe(instant);
    expect(atemporal.instant(new Date(999)).equals(instant)).toBe(true);
    expect(atemporal.instant(999).equals(instant)).toBe(true);
    expect(() => atemporal.instant(Infinity)).toThrow();

    const local = '2026-07-15T10:00:00-06:00[America/Costa_Rica]';
    expect(atemporal.zonedDateTime(local, { timeZone: 'UTC' }).toInstant().toString())
      .toBe('2026-07-15T16:00:00Z');
    expect(() => atemporal.zonedDateTime('2026-07-15T10:00:00')).toThrow();
  });

  test('preserves calendar annotations and local fields when attaching a timezone', () => {
    const local = Temporal.PlainDateTime.from('2026-07-15T10:00:00[u-ca=hebrew]');
    const zoned = atemporal.zonedDateTime(local, { timeZone: 'UTC' });
    expect(zoned.toPlainDateTime().equals(local)).toBe(true);
    expect(zoned.calendarId).toBe('hebrew');
    expect(atemporal.zonedDateTime('2026-07-15T10:00:00[u-ca=hebrew]', { timeZone: 'UTC' }).equals(zoned)).toBe(true);
    expect(atemporal.zonedDateTime('2026-07-15T10:00:00[UTC][u-ca=hebrew]').equals(zoned)).toBe(true);
  });
});
