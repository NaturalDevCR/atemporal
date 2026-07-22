import atemporal, { InvalidDateError } from '../../index';

describe('invalid input behaviour contract', () => {
  test.each([
    ['2026-07-15T10:00:00Z', true],
    [Date.UTC(2026, 6, 15), true],
    ['not-a-date', false],
  ])('compatibility factory validity for %p is %p', (input, valid) => {
    expect(atemporal(input as never).isValid()).toBe(valid);
  });

  test('accepts documented object and array input while strict parsing rejects invalid values', () => {
    expect(atemporal({ year: 2026, month: 7, day: 15 }).isValid()).toBe(true);
    expect(atemporal([2026, 7, 15]).isValid()).toBe(true);
    expect(() => atemporal.parse('not-a-date')).toThrow(InvalidDateError);
    expect(atemporal.tryParse('not-a-date')).toBeNull();
  });
});
