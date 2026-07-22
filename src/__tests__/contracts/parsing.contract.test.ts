import atemporal, { InvalidDateError } from '../../index';

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
});
