/** Optional cache analysis; the formatter imports the shared runtime cache directly. */
import { FormattingCache as RuntimeFormattingCache } from './formatting-cache-runtime';
import { CacheKeys } from '../caching/cache-keys';
import type { Temporal } from '../../types/temporal';

type Stats = ReturnType<typeof RuntimeFormattingCache.getStats>;

function validate(stats: Stats) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (stats.hitRatio < 0.5 && stats.hits + stats.misses > 100) {
    warnings.push('Low cache hit ratio detected - consider reviewing cache strategy');
  }
  if (stats.size === stats.maxSize) {
    warnings.push('Cache is at maximum capacity - consider increasing size');
  }
  return { isValid: errors.length === 0, errors, warnings };
}

function efficiency(stats: Stats) {
  const recommendations: string[] = [];
  if (stats.hitRatio < 0.6) recommendations.push('Consider preloading cache with common format patterns');
  if (stats.size / stats.maxSize > 0.9) recommendations.push('Cache is nearly full - consider increasing max size');
  if (stats.hitRatio > 0.9 && stats.size / stats.maxSize < 0.5) {
    recommendations.push('Cache is very efficient but underutilized - could reduce max size');
  }
  const totalRequests = stats.hits + stats.misses;
  if (totalRequests < 10) recommendations.push('Insufficient data for meaningful analysis');
  return {
    hitRatio: stats.hitRatio,
    utilization: stats.maxSize > 0 ? stats.size / stats.maxSize : 0,
    efficiency: totalRequests > 0 ? stats.hits / totalRequests : 0,
    memoryEfficiency: (stats.size * 500) / (stats.maxSize * 500),
    recommendations,
  };
}

// Decorate the same constructor so optional tooling observes the runtime's cache.
export const FormattingCache = Object.assign(RuntimeFormattingCache, {
  getDetailedStats(this: typeof RuntimeFormattingCache) {
    const stats = this.getStats();
    return {
      ...stats,
      memoryUsage: this.getCacheMetrics().size * 500,
      averageEntryAge: 0,
      cacheMetrics: this.getCacheMetrics(),
      performance: { hitsPerSecond: 0, missesPerSecond: 0 },
    };
  },
  optimize(): void {
    // ResizableLRUCache handles eviction; retained for internal tooling compatibility.
  },
  validateCache(this: typeof RuntimeFormattingCache) {
    return validate(this.getStats());
  },
  preload(date: Temporal.ZonedDateTime, patterns: string[]): void {
    // Preserve the legacy helper's key validation; real prewarming is atemporal.prewarm().
    for (const pattern of patterns) CacheKeys.customFormat(pattern, 'en-US', { timeZone: date.timeZoneId });
  },
  getEfficiencyMetrics(this: typeof RuntimeFormattingCache) {
    return efficiency(this.getStats());
  },
  createSnapshot(this: typeof RuntimeFormattingCache) {
    const timestamp = Date.now();
    const stats = this.getStats();
    return { timestamp, stats, efficiency: efficiency(stats), validation: validate(stats) };
  },
});
