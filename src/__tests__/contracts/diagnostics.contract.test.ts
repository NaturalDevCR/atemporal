import atemporal from '../../index';

describe('public diagnostics contract', () => {
  afterEach(() => {
    atemporal.resetDiagnostics();
    atemporal.setDefaultTimeZone('UTC');
    atemporal.setDefaultLocale('en-US');
  });

  test('returns snapshots and resets metrics without changing defaults', () => {
    atemporal.setDefaultTimeZone('America/Costa_Rica');
    atemporal('2026-07-15T10:00:00', 'America/Costa_Rica').format('YYYY-MM-DD');

    const first = atemporal.getDiagnostics();
    first.caches.parsing.mutated = true;

    expect(atemporal.getDiagnostics().caches.parsing.mutated).toBeUndefined();

    atemporal.resetDiagnostics();

    expect(atemporal.getDefaultLocale()).toBe('en-US');
    expect(atemporal().timeZoneId).toBe('America/Costa_Rica');
  });

  test('clears caches and prewarms only through public snapshot APIs', () => {
    atemporal.clearCaches();
    atemporal.prewarm({ formatPatterns: ['YYYY-MM-DD'] });

    expect(atemporal.getDiagnostics()).toMatchObject({
      temporal: {
        environment: expect.any(String),
      },
      caches: {
        parsing: expect.any(Object),
        formatting: expect.any(Object),
        diff: expect.any(Object),
      },
    });
  });
});
