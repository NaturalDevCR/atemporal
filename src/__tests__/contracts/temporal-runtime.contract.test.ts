import atemporal from '../../index';

test('runtime diagnostics name a supported implementation', () => {
  const info = atemporal.getTemporalInfo();

  expect(['native', 'polyfill']).toContain(info.version);
  expect(typeof info.isNative).toBe('boolean');
  expect(['browser', 'node', 'unknown']).toContain(info.environment);
});
