import atemporal from '../../index';

test('formatting is immutable and locale-sensitive', () => {
  const value = atemporal('2026-07-15T10:00:00Z', 'UTC');

  expect(value.format('YYYY-MM-DD')).toBe('2026-07-15');
  expect(value.format('MMMM', 'es-CR')).not.toBe('');
  expect(value.format('YYYY-MM-DD')).toBe('2026-07-15');
});
