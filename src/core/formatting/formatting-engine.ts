/** Optional formatter analysis and tuning; the package imports the runtime directly. */
import { FormattingEngine as RuntimeFormattingEngine } from './formatting-runtime';
import { FormattingCache } from './formatting-cache';
import { TokenCompiler } from './token-compiler';
import type { FormattingMetrics } from './formatting-types';

function analyze(metrics: FormattingMetrics) {
  const fastPathRatio = metrics.totalFormats > 0 ? metrics.fastPathHits / metrics.totalFormats : 0;
  const cacheEfficiency = metrics.totalFormats > 0 ? metrics.cacheHits / metrics.totalFormats : 0;
  const recommendations: string[] = [];
  if (metrics.compilationStats.cacheHitRatio < 0.8) {
    recommendations.push('Consider pre-compiling frequently used format patterns');
  }
  if (fastPathRatio < 0.3) {
    recommendations.push('Consider using more common format patterns for better fast-path performance');
  }
  if (metrics.averageFormatTime > 1) {
    recommendations.push('Average format time is high - consider enabling caching');
  }
  return {
    ...metrics,
    efficiency: {
      fastPathRatio,
      cacheEfficiency,
      overallEfficiency: metrics.totalFormats > 0
        ? (metrics.fastPathHits + metrics.cacheHits) / metrics.totalFormats : 0,
    },
    recommendations,
  };
}

// Preserve one constructor and its static state when internal tooling is loaded.
// A subclass would fork counters after reset() and disconnect public diagnostics.
export const FormattingEngine = Object.assign(RuntimeFormattingEngine, {
  getPerformanceAnalysis(this: typeof RuntimeFormattingEngine) {
    return analyze(this.getMetrics());
  },
  getDetailedCacheStats(this: typeof RuntimeFormattingEngine): string {
    const analysis = analyze(this.getMetrics());
    return [
      'Detailed Formatting Cache Statistics:',
      `Fast Path Efficiency: ${(analysis.efficiency.fastPathRatio * 100).toFixed(2)}%`,
      `Cache Efficiency: ${(analysis.efficiency.cacheEfficiency * 100).toFixed(2)}%`,
      `Overall Efficiency: ${(analysis.efficiency.overallEfficiency * 100).toFixed(2)}%`,
      '',
      'Performance Recommendations:',
      ...analysis.recommendations.map(rec => `- ${rec}`),
    ].join('\n');
  },
  optimizeCache(): void {
    FormattingCache.optimize();
    TokenCompiler.optimizeCache();
  },
  setMaxCacheSize(size: number): void {
    FormattingCache.setMaxSize(Math.floor(size * 0.7));
    TokenCompiler.setMaxCacheSize(Math.floor(size * 0.3));
  },
  setDynamicSizing(enabled: boolean): void {
    FormattingCache.setDynamicSizing(enabled);
    TokenCompiler.setDynamicSizing(enabled);
  },
  isDynamicSizingEnabled(): boolean {
    return FormattingCache.isDynamicSizingEnabled() && TokenCompiler.isDynamicSizingEnabled();
  },
});
