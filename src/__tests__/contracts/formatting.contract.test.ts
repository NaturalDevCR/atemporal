import atemporal from '../../index';

test('formatting is immutable and locale-sensitive', () => {
  const value = atemporal('2026-07-15T10:00:00Z', 'UTC');

  expect(value.format('YYYY-MM-DD')).toBe('2026-07-15');
  expect(value.format('MMMM', 'es-CR')).not.toBe('');
  expect(value.format('YYYY-MM-DD')).toBe('2026-07-15');
});

test('formatting distinguishes the two offsets of a repeated local hour', () => {
  const earlier = atemporal.parse('2024-11-03T01:30:00-04:00[America/New_York]');
  const later = atemporal.parse('2024-11-03T01:30:00-05:00[America/New_York]');

  expect(earlier.format('Z')).toBe('-04:00');
  expect(later.format('Z')).toBe('-05:00');
  expect(earlier.format('Z')).toBe('-04:00');
});
