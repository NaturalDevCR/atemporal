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
});
