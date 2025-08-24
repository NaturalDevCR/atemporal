/**
 * @file High-performance formatting engine with token compilation and pooling
 */

import type { Temporal } from '@js-temporal/polyfill';
import type {
  FormattingOptions,
  FormattingContext,
  CompiledFormat,
  FormatToken,
  FormattingMetrics
} from './formatting-types';
import { TokenCompiler } from './token-compiler';
import { FormatTokenPool } from './token-pool';
import { FormattingCache } from './formatting-cache';
import { CacheKeys } from '../caching/cache-keys';

/**
 * High-performance formatting engine
 */
export class FormattingEngine {
  private static isInitialized = false;
  private static metrics = {
    totalFormats: 0,
    fastPathHits: 0,
    cacheHits: 0,
    totalFormatTime: 0
  };
  
  /**
   * Initializes the formatting engine
   */
  static initialize(): void {
    if (this.isInitialized) return;
    
    // Pre-compile common patterns
    TokenCompiler.precompileCommonPatterns();
    
    // Pre-warm token pool
    FormatTokenPool.prewarmPool();
    
    // Register default token replacers
    this.registerDefaultTokenReplacers();
    
    this.isInitialized = true;
  }
  
  /**
   * Formats a date using the specified format string
   */
  static format(
    date: Temporal.ZonedDateTime,
    formatString: string,
    options: FormattingOptions = {}
  ): string {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const startTime = performance.now();
    this.metrics.totalFormats++;
    
    try {
      // Fast path for simple formats
      const fastResult = this.tryFastPath(date, formatString, options);
      if (fastResult !== null) {
        this.metrics.fastPathHits++;
        return fastResult;
      }
      
      // Check formatting cache
      if (options.useCache !== false) {
        const cacheKey = CacheKeys.customFormat(formatString, options.locale || 'en-US', { timeZone: options.timeZone });
        const cached = FormattingCache.get(cacheKey, date);
        if (cached !== null) {
          this.metrics.cacheHits++;
          return cached;
        }
      }
      
      // Full formatting path
      const result = this.formatWithCompilation(date, formatString, options);
      
      // Cache the result
      if (options.useCache !== false) {
        const cacheKey = CacheKeys.customFormat(formatString, options.locale || 'en-US', { timeZone: options.timeZone });
        FormattingCache.set(cacheKey, date, result);
      }
      
      return result;
    } finally {
      this.metrics.totalFormatTime += performance.now() - startTime;
    }
  }
  
  /**
   * Attempts fast path formatting for common patterns
   */
  private static tryFastPath(
    date: Temporal.ZonedDateTime,
    formatString: string,
    options: FormattingOptions
  ): string | null {
    // Only use fast path for simple patterns without locale-specific formatting
    if (options.locale && options.locale !== 'en-US') {
      return null;
    }
    
    switch (formatString) {
      case 'YYYY-MM-DD':
        return `${date.year.toString().padStart(4, '0')}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
      
      case 'HH:mm:ss':
        return `${date.hour.toString().padStart(2, '0')}:${date.minute.toString().padStart(2, '0')}:${date.second.toString().padStart(2, '0')}`;
      
      case 'YYYY-MM-DDTHH:mm:ss':
        return `${date.year.toString().padStart(4, '0')}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}T${date.hour.toString().padStart(2, '0')}:${date.minute.toString().padStart(2, '0')}:${date.second.toString().padStart(2, '0')}`;
      
      case 'MM/DD/YYYY':
        return `${date.month.toString().padStart(2, '0')}/${date.day.toString().padStart(2, '0')}/${date.year}`;
      
      case 'DD/MM/YYYY':
        return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
      
      default:
        return null;
    }
  }
  
  /**
   * Formats using full compilation and token processing
   */
  private static formatWithCompilation(
    date: Temporal.ZonedDateTime,
    formatString: string,
    options: FormattingOptions
  ): string {
    // Compile the format string
    const compilation = TokenCompiler.compile(formatString);
    
    if (compilation.errors.length > 0) {
      throw new Error(`Format compilation failed: ${compilation.errors.join(', ')}`);
    }
    
    // Create formatting context
    const context: FormattingContext = {
      date,
      locale: options.locale || 'en-US',
      timeZone: options.timeZone || date.timeZoneId,
      options,
      compiledFormat: compilation.compiled
    };
    
    // Format using tokens
    return this.formatWithTokens(context);
  }
  
  /**
   * Formats using compiled tokens
   */
  private static formatWithTokens(context: FormattingContext): string {
    const { compiledFormat } = context;
    const parts: string[] = [];
    
    // Use token pooling if enabled
    const usePooling = context.options.poolTokens !== false;
    const scope = usePooling ? FormatTokenPool.createScope() : null;
    
    try {
      for (const token of compiledFormat.tokens) {
        const formatted = this.formatToken(token, context);
        parts.push(formatted);
      }
      
      return parts.join('');
    } finally {
      // Clean up pooled tokens
      if (scope) {
        scope.dispose();
      }
    }
  }
  
  /**
   * Formats a single token
   */
  private static formatToken(token: FormatToken, context: FormattingContext): string {
    const { date, locale } = context;
    
    // Use custom formatter if available
    if (token.formatter) {
      return token.formatter(context.date);
    }
    
    // Handle literal tokens
    if (token.type === 'literal') {
      return token.value || token.pattern;
    }
    
    // Format based on token type
    switch (token.type) {
      case 'year':
        return this.formatYear(date, token.pattern);
      
      case 'month':
        return this.formatMonth(date, token.pattern, locale);
      
      case 'day':
        return this.formatDay(date, token.pattern);
      
      case 'hour':
        return this.formatHour(date, token.pattern);
      
      case 'minute':
        return this.formatMinute(date, token.pattern);
      
      case 'second':
        return this.formatSecond(date, token.pattern);
      
      case 'millisecond':
        return this.formatMillisecond(date, token.pattern);
      
      case 'weekday':
        return this.formatWeekday(date, token.pattern, locale);
      
      case 'era':
        return this.formatEra(date, token.pattern);
      
      case 'timezone':
        return this.formatTimeZone(date, token.pattern);
      
      case 'offset':
        return this.formatOffset(date, token.pattern);
      
      default:
        return token.pattern;
    }
  }
  
  /**
   * Formats year tokens
   */
  private static formatYear(date: Temporal.ZonedDateTime, pattern: string): string {
    switch (pattern) {
      case 'YYYY':
        return date.year.toString().padStart(4, '0');
      case 'YY':
        return (date.year % 100).toString().padStart(2, '0');
      default:
        return date.year.toString();
    }
  }
  
  /**
   * Formats month tokens
   */
  private static formatMonth(date: Temporal.ZonedDateTime, pattern: string, locale: string): string {
    switch (pattern) {
      case 'MMMM':
        return date.toLocaleString(locale, { month: 'long' });
      case 'MMM':
        return date.toLocaleString(locale, { month: 'short' });
      case 'MM':
        return date.month.toString().padStart(2, '0');
      case 'M':
        return date.month.toString();
      default:
        return date.month.toString();
    }
  }
  
  /**
   * Formats day tokens
   */
  private static formatDay(date: Temporal.ZonedDateTime, pattern: string): string {
    switch (pattern) {
      case 'DD':
        return date.day.toString().padStart(2, '0');
      case 'D':
        return date.day.toString();
      default:
        return date.day.toString();
    }
  }
  
  /**
   * Formats hour tokens
   */
  private static formatHour(date: Temporal.ZonedDateTime, pattern: string): string {
    switch (pattern) {
      case 'HH':
        return date.hour.toString().padStart(2, '0');
      case 'H':
        return date.hour.toString();
      case 'hh': {
        const hour12 = date.hour === 0 ? 12 : date.hour > 12 ? date.hour - 12 : date.hour;
        return hour12.toString().padStart(2, '0');
      }
      case 'h': {
        const hour12 = date.hour === 0 ? 12 : date.hour > 12 ? date.hour - 12 : date.hour;
        return hour12.toString();
      }
      default:
        return date.hour.toString();
    }
  }
  
  /**
   * Formats minute tokens
   */
  private static formatMinute(date: Temporal.ZonedDateTime, pattern: string): string {
    switch (pattern) {
      case 'mm':
        return date.minute.toString().padStart(2, '0');
      case 'm':
        return date.minute.toString();
      default:
        return date.minute.toString();
    }
  }
  
  /**
   * Formats second tokens
   */
  private static formatSecond(date: Temporal.ZonedDateTime, pattern: string): string {
    switch (pattern) {
      case 'ss':
        return date.second.toString().padStart(2, '0');
      case 's':
        return date.second.toString();
      default:
        return date.second.toString();
    }
  }
  
  /**
   * Formats millisecond tokens
   */
  private static formatMillisecond(date: Temporal.ZonedDateTime, pattern: string): string {
    const ms = date.millisecond;
    switch (pattern) {
      case 'SSS':
        return ms.toString().padStart(3, '0');
      case 'SS':
        return Math.floor(ms / 10).toString().padStart(2, '0');
      case 'S':
        return Math.floor(ms / 100).toString();
      default:
        return ms.toString();
    }
  }
  
  /**
   * Formats weekday tokens
   */
  private static formatWeekday(date: Temporal.ZonedDateTime, pattern: string, locale: string): string {
    switch (pattern) {
      case 'dddd':
        return date.toLocaleString(locale, { weekday: 'long' });
      case 'ddd':
        return date.toLocaleString(locale, { weekday: 'short' });
      case 'dd':
        return date.toLocaleString(locale, { weekday: 'narrow' });
      case 'd':
        return date.dayOfWeek.toString();
      default:
        return date.dayOfWeek.toString();
    }
  }
  
  /**
   * Formats era tokens (AM/PM)
   */
  private static formatEra(date: Temporal.ZonedDateTime, pattern: string): string {
    const isAM = date.hour < 12;
    switch (pattern) {
      case 'A':
        return isAM ? 'AM' : 'PM';
      case 'a':
        return isAM ? 'am' : 'pm';
      default:
        return isAM ? 'AM' : 'PM';
    }
  }
  
  /**
   * Formats timezone tokens
   */
  private static formatTimeZone(date: Temporal.ZonedDateTime, pattern: string): string {
    switch (pattern) {
      case 'z':
        // Full IANA timezone name (e.g., America/New_York)
        return date.timeZoneId;
      case 'zz':
        // Short timezone name (e.g., EST)
        return date.timeZoneId.split('/').pop() || date.timeZoneId;
      default:
        return date.timeZoneId;
    }
  }
  
  /**
   * Formats offset tokens
   */
  private static formatOffset(date: Temporal.ZonedDateTime, pattern: string): string {
    const offsetNs = date.offsetNanoseconds;
    const offsetMs = Math.floor(offsetNs / 1000000);
    const offsetMinutes = Math.floor(offsetMs / 60000);
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    
    switch (pattern) {
      case 'Z':
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      case 'ZZ':
        return `${sign}${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
      default:
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * Registers default token replacers
   */
  private static registerDefaultTokenReplacers(): void {
    // Custom replacers can be registered here for specialized formatting
    // This is a placeholder for future extensibility
  }
  
  /**
   * Gets formatting performance metrics
   */
  static getMetrics(): FormattingMetrics {
    const compilerStats = TokenCompiler.getStats();
    const poolStats = FormatTokenPool.getStats();
    const cacheStats = FormattingCache.getStats();
    
    return {
      totalFormats: this.metrics.totalFormats,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.totalFormats - this.metrics.cacheHits,
      fastPathHits: this.metrics.fastPathHits,
      averageFormatTime: this.metrics.totalFormats > 0
        ? this.metrics.totalFormatTime / this.metrics.totalFormats
        : 0,
      tokenPoolStats: poolStats,
      compilationStats: {
        totalCompilations: compilerStats.compilations,
        averageCompileTime: compilerStats.averageCompileTime,
        cacheHitRatio: compilerStats.cacheHitRatio
      }
    };
  }
  
  /**
   * Resets all metrics and caches
   */
  static reset(): void {
    this.metrics = {
      totalFormats: 0,
      fastPathHits: 0,
      cacheHits: 0,
      totalFormatTime: 0
    };
    
    TokenCompiler.reset();
    FormatTokenPool.clearPools();
    FormattingCache.clear();
    
    this.isInitialized = false;
  }
  
  /**
   * Gets detailed performance analysis
   */
  static getPerformanceAnalysis() {
    const metrics = this.getMetrics();
    
    return {
      ...metrics,
      efficiency: {
        fastPathRatio: this.metrics.totalFormats > 0
          ? this.metrics.fastPathHits / this.metrics.totalFormats
          : 0,
        cacheEfficiency: this.metrics.totalFormats > 0
          ? this.metrics.cacheHits / this.metrics.totalFormats
          : 0,
        overallEfficiency: this.metrics.totalFormats > 0
          ? (this.metrics.fastPathHits + this.metrics.cacheHits) / this.metrics.totalFormats
          : 0
      },
      recommendations: this.generatePerformanceRecommendations()
    };
  }
  
  /**
   * Generates performance recommendations
   */
  private static generatePerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();
    
    if (metrics.compilationStats.cacheHitRatio < 0.8) {
      recommendations.push('Consider pre-compiling frequently used format patterns');
    }
    
    if (metrics.tokenPoolStats.hitRatio < 0.7) {
      recommendations.push('Token pool hit ratio is low - consider pre-warming with common tokens');
    }
    
    const fastPathRatio = this.metrics.totalFormats > 0
      ? this.metrics.fastPathHits / this.metrics.totalFormats
      : 0;
    
    if (fastPathRatio < 0.3) {
      recommendations.push('Consider using more common format patterns for better fast-path performance');
    }
    
    if (metrics.averageFormatTime > 1) {
      recommendations.push('Average format time is high - consider enabling caching');
    }
    
    return recommendations;
  }

  /**
   * Clears all formatting caches
   */
  static clearCache(): void {
    FormattingCache.clear();
    TokenCompiler.clearCache();
  }

  /**
   * Gets cache statistics
   */
  static getCacheStats() {
    const cacheStats = FormattingCache.getStats();
    const compilerStats = TokenCompiler.getStats();
    
    return {
      totalCacheSize: cacheStats.size + compilerStats.cacheSize,
      maxCacheSize: cacheStats.maxSize + compilerStats.cacheMaxSize,
      hitRatio: (cacheStats.hits + compilerStats.cacheHits) / 
                (cacheStats.hits + cacheStats.misses + compilerStats.cacheHits + compilerStats.cacheMisses || 1)
    };
  }

  /**
   * Gets detailed cache statistics
   */
  static getDetailedCacheStats(): string {
    const metrics = this.getMetrics();
    const analysis = this.getPerformanceAnalysis();
    
    return [
      'Detailed Formatting Cache Statistics:',
      `Fast Path Efficiency: ${(analysis.efficiency.fastPathRatio * 100).toFixed(2)}%`,
      `Cache Efficiency: ${(analysis.efficiency.cacheEfficiency * 100).toFixed(2)}%`,
      `Overall Efficiency: ${(analysis.efficiency.overallEfficiency * 100).toFixed(2)}%`,
      '',
      'Performance Recommendations:',
      ...analysis.recommendations.map(rec => `- ${rec}`)
    ].join('\n');
  }

  /**
   * Optimizes cache sizes based on usage patterns
   */
  static optimizeCache(): void {
    FormattingCache.optimize();
    TokenCompiler.optimizeCache();
  }

  /**
   * Sets maximum cache size
   */
  static setMaxCacheSize(size: number): void {
    FormattingCache.setMaxSize(Math.floor(size * 0.7)); // 70% for formatting cache
    TokenCompiler.setMaxCacheSize(Math.floor(size * 0.3)); // 30% for compilation cache
  }

  /**
   * Sets dynamic sizing for caches
   */
  static setDynamicSizing(enabled: boolean): void {
    FormattingCache.setDynamicSizing(enabled);
    TokenCompiler.setDynamicSizing(enabled);
  }

  /**
   * Checks if dynamic sizing is enabled
   */
  static isDynamicSizingEnabled(): boolean {
    return FormattingCache.isDynamicSizingEnabled() && TokenCompiler.isDynamicSizingEnabled();
  }
}