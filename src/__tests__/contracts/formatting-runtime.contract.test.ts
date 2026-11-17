import atemporal, { Atemporal } from '../../index';
import { FormattingEngine } from '../../core/formatting/formatting-engine';
import { FormattingCache } from '../../core/formatting/formatting-cache';
import { TokenCompiler } from '../../core/formatting/token-compiler';

describe('formatting runtime boundaries', () => {
  beforeEach(() => {
    atemporal.resetDiagnostics();
    atemporal.setDefaultLocale('en-US');
  });

  afterEach(() => {
    TokenCompiler.unregisterTokenReplacer('year');
    FormattingCache.setMaxSize(1000);
    TokenCompiler.setMaxCacheSize(500);
    atemporal.resetDiagnostics();
  });

  test('prewarms compiled formats without allocating a token pool', () => {
    atemporal.prewarm({ formatPatterns: ['YYYY-MM-DD HH:mm:ss.SSS Z'] });
    const earlier = atemporal.parse('2024-11-03T01:30:00-04:00[America/New_York]');
    const later = atemporal.parse('2024-11-03T01:30:00-05:00[America/New_York]');
    const pattern = 'YYYY-MM-DD HH:mm:ss.SSS Z';

    expect(earlier.format(pattern)).toBe('2024-11-03 01:30:00.000 -04:00');
    expect(later.format(pattern)).toBe('2024-11-03 01:30:00.000 -05:00');
    expect(earlier.format(pattern)).toBe('2024-11-03 01:30:00.000 -04:00');
    expect(earlier.format('[Date:] YYYY-MM-DD [at] HH:mm')).toBe('Date: 2024-11-03 at 01:30');
    expect(earlier.format('MMMM', 'es-CR')).toBe('noviembre');

    const metrics = Atemporal.getFormattingMetrics();
    expect(metrics.compilationStats.totalCompilations).toBeGreaterThan(0);
    expect(metrics.tokenPoolStats).toEqual({ totalTokens: 0, activeTokens: 0, pooledTokens: 0, hitRatio: 0, memoryUsage: 0 });
    metrics.tokenPoolStats.totalTokens = 99;
    expect(Atemporal.getFormattingMetrics().tokenPoolStats.totalTokens).toBe(0);
    expect(Atemporal.getFormattingPerformanceReport()).toContain('Cache Hit Ratio:');
  });

  test('optional analysis observes public formats and resets their shared counters', () => {
    const value = atemporal.parse('2026-07-15T10:00:00Z');
    const pattern = 'YYYY-MM-DD HH:mm';
    value.format(pattern);
    value.format(pattern);

    expect(FormattingEngine.getPerformanceAnalysis()).toMatchObject({ totalFormats: 2, cacheHits: 1 });
    expect(FormattingCache.getDetailedStats()).toMatchObject({ size: 1, hits: 1, sets: 1 });
    FormattingEngine.reset();
    expect(atemporal.getDiagnostics().caches.formatting).toMatchObject({ totalFormats: 0, cacheHits: 0 });

    value.format(pattern);
    expect(FormattingEngine.getPerformanceAnalysis().totalFormats).toBe(1);
    expect(FormattingCache.getDetailedStats().sets).toBe(1);
  });

  test('cache tuning applies to public formatting and keeps eviction bounded', () => {
    FormattingCache.setMaxSize(1);
    const value = atemporal.parse('2026-07-15T10:00:00Z');
    expect(value.format('YYYY-MM-DD HH:mm')).toBe('2026-07-15 10:00');
    expect(value.format('YYYY/MM/DD HH:mm')).toBe('2026/07/15 10:00');
    expect(value.format('YYYY-MM-DD HH:mm')).toBe('2026-07-15 10:00');
    expect(FormattingCache.getDetailedStats()).toMatchObject({ size: 1, hits: 0, misses: 3 });
    expect(Atemporal.getFormattingMetrics().cacheHits).toBe(0);
  });

  test('custom token replacements work with both legacy pooling option values', () => {
    TokenCompiler.registerTokenReplacer('year', (_token, context) => `year:${context.date.year}`);
    const value = atemporal.parse('2026-07-15T10:00:00Z');
    expect(value.format('YYYY [custom]')).toBe('year:2026 custom');
    expect(FormattingEngine.format(value.raw, 'YYYY [custom]', { poolTokens: true })).toBe('year:2026 custom');
    expect(FormattingEngine.format(value.raw, 'YYYY [custom]', { poolTokens: false })).toBe('year:2026 custom');
  });
});
