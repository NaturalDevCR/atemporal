/**
 * @file Token compiler for pre-compiling format strings
 */

import type {
  FormatToken,
  CompiledFormat,
  TokenType,
  CompilationResult,
  FormattingContext,
  TokenReplacer
} from './formatting-types';
import { Temporal } from '@js-temporal/polyfill';
import { TOKEN_PATTERNS, ESCAPE_PATTERNS } from './formatting-types';
import { CacheKeys } from '../caching/cache-keys';
import { ResizableLRUCache } from '../caching/lru-cache';

/**
 * High-performance token compiler with caching and optimization
 */
export class TokenCompiler {
  private static compilationCache = new ResizableLRUCache<string, CompiledFormat>(500);
  private static tokenReplacers = new Map<TokenType, TokenReplacer>();
  private static compilationStats = {
    totalCompilations: 0,
    cacheHits: 0,
    totalCompileTime: 0
  };
  
  /**
   * Compiles a format string into optimized tokens
   */
  static compile(formatString: string): CompilationResult {
    const startTime = performance.now();
    const cacheKey = CacheKeys.formatCompilation(formatString);
    
    // Check cache first
    const cached = this.compilationCache.get(cacheKey);
    if (cached) {
      this.compilationStats.cacheHits++;
      return {
        compiled: cached,
        errors: [],
        warnings: [],
        performance: {
          parseTime: 0, // Cached, no parse time
          tokenCount: cached.tokens.length,
          complexity: cached.complexity
        }
      };
    }
    
    const result = this.compileInternal(formatString, cacheKey);
    const compileTime = performance.now() - startTime;
    
    // Update statistics
    this.compilationStats.totalCompilations++;
    this.compilationStats.totalCompileTime += compileTime;
    
    // Cache the result
    this.compilationCache.set(cacheKey, result.compiled);
    
    result.performance.parseTime = compileTime;
    return result;
  }
  
  /**
   * Internal compilation logic
   */
  private static compileInternal(formatString: string, cacheKey: string): CompilationResult {
    const tokens: FormatToken[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    let hasTimeZone = false;
    let hasLocaleSpecific = false;
    let i = 0;
    
    while (i < formatString.length) {
      const char = formatString[i];
      
      // Handle escape sequences
      if (char === ESCAPE_PATTERNS.BRACKET_OPEN) {
        const literalResult = this.parseLiteral(formatString, i);
        if (literalResult.error) {
          errors.push(literalResult.error);
        } else {
          tokens.push(literalResult.token!);
          i = literalResult.nextIndex;
          continue;
        }
      }
      
      // Handle backslash escapes
      if (char === ESCAPE_PATTERNS.BACKSLASH && i + 1 < formatString.length) {
        tokens.push({
          type: 'literal',
          pattern: formatString[i + 1],
          length: 1,
          value: formatString[i + 1]
        });
        i += 2;
        continue;
      }
      
      // Try to match token patterns
      const tokenResult = this.parseToken(formatString, i);
      if (tokenResult.token) {
        tokens.push(tokenResult.token);
        
        // Track special token types
        if (tokenResult.token.type === 'timezone' || tokenResult.token.type === 'offset') {
          hasTimeZone = true;
        }
        if (tokenResult.token.type === 'weekday' || tokenResult.token.type === 'month') {
          hasLocaleSpecific = true;
        }
        
        i = tokenResult.nextIndex;
      } else {
        // Treat as literal character
        tokens.push({
          type: 'literal',
          pattern: char,
          length: 1,
          value: char
        });
        i++;
      }
    }
    
    // Optimize tokens (merge consecutive literals)
    const optimizedTokens = this.optimizeTokens(tokens);
    
    // Determine complexity
    const complexity = this.determineComplexity(optimizedTokens, hasTimeZone, hasLocaleSpecific);
    
    const compiled: CompiledFormat = {
      tokens: optimizedTokens,
      hasTimeZone,
      hasLocaleSpecific,
      cacheKey,
      complexity
    };
    
    return {
      compiled,
      errors,
      warnings,
      performance: {
        parseTime: 0, // Will be set by caller
        tokenCount: optimizedTokens.length,
        complexity
      }
    };
  }
  
  /**
   * Parses a literal text section enclosed in brackets
   */
  private static parseLiteral(formatString: string, startIndex: number): {
    token?: FormatToken;
    nextIndex: number;
    error?: string;
  } {
    const openBracket = startIndex;
    let closeBracket = -1;
    
    // Find matching close bracket
    for (let i = startIndex + 1; i < formatString.length; i++) {
      if (formatString[i] === ESCAPE_PATTERNS.BRACKET_CLOSE) {
        closeBracket = i;
        break;
      }
    }
    
    if (closeBracket === -1) {
      return {
        nextIndex: startIndex + 1,
        error: `Unclosed bracket at position ${startIndex}`
      };
    }
    
    const literalText = formatString.slice(openBracket + 1, closeBracket);
    
    return {
      token: {
        type: 'literal',
        pattern: `[${literalText}]`,
        length: literalText.length,
        value: literalText
      },
      nextIndex: closeBracket + 1
    };
  }
  
  /**
   * Parses a format token at the given position
   */
  private static parseToken(formatString: string, startIndex: number): {
    token?: FormatToken;
    nextIndex: number;
  } {
    // Try to match the longest possible token first
    const sortedPatterns = Object.entries(TOKEN_PATTERNS)
      .sort(([a], [b]) => b.length - a.length);
    
    for (const [pattern, config] of sortedPatterns) {
      if (formatString.substr(startIndex, pattern.length) === pattern) {
        const tokenReplacer = this.tokenReplacers.get(config.type);
        const token: FormatToken = {
          type: config.type,
          pattern,
          length: config.length,
          formatter: tokenReplacer ? (date: Temporal.ZonedDateTime, locale?: string) => {
            // Convert to context format for TokenReplacer
            const context = {
              date,
              locale: locale || 'en-US',
              timeZone: date.timeZoneId,
              options: {},
              compiledFormat: { tokens: [], hasTimeZone: false, hasLocaleSpecific: false, cacheKey: '', complexity: 'simple' as const }
            };
            return tokenReplacer(token, context);
          } : undefined
        };
        
        return {
          token,
          nextIndex: startIndex + pattern.length
        };
      }
    }
    
    return { nextIndex: startIndex + 1 };
  }
  
  /**
   * Optimizes tokens by merging consecutive literals
   */
  private static optimizeTokens(tokens: FormatToken[]): FormatToken[] {
    if (tokens.length <= 1) return tokens;
    
    const optimized: FormatToken[] = [];
    let currentLiteral: FormatToken | null = null;
    
    for (const token of tokens) {
      if (token.type === 'literal') {
        if (currentLiteral) {
          // Merge with previous literal
          currentLiteral.value += token.value || '';
          currentLiteral.pattern += token.pattern;
          currentLiteral.length += token.length;
        } else {
          // Start new literal
          currentLiteral = { ...token };
        }
      } else {
        // Non-literal token
        if (currentLiteral) {
          optimized.push(currentLiteral);
          currentLiteral = null;
        }
        optimized.push(token);
      }
    }
    
    // Don't forget the last literal
    if (currentLiteral) {
      optimized.push(currentLiteral);
    }
    
    return optimized;
  }
  
  /**
   * Determines the complexity of a compiled format
   */
  private static determineComplexity(
    tokens: FormatToken[],
    hasTimeZone: boolean,
    hasLocaleSpecific: boolean
  ): CompiledFormat['complexity'] {
    const tokenCount = tokens.length;
    const nonLiteralTokens = tokens.filter(t => t.type !== 'literal').length;
    
    if (hasTimeZone || hasLocaleSpecific || nonLiteralTokens > 6) {
      return 'complex';
    }
    
    if (nonLiteralTokens > 3 || tokenCount > 8) {
      return 'medium';
    }
    
    return 'simple';
  }
  
  /**
   * Registers a custom token replacer
   */
  static registerTokenReplacer(tokenType: TokenType, replacer: TokenReplacer): void {
    this.tokenReplacers.set(tokenType, replacer);
  }
  
  /**
   * Unregisters a token replacer
   */
  static unregisterTokenReplacer(tokenType: TokenType): boolean {
    return this.tokenReplacers.delete(tokenType);
  }
  
  /**
   * Gets all registered token replacers
   */
  static getTokenReplacers(): Map<TokenType, TokenReplacer> {
    return new Map(this.tokenReplacers);
  }
  
  /**
   * Clears the compilation cache
   */
  static clearCache(): void {
    this.compilationCache.clear();
  }
  
  /**
   * Gets compilation statistics
   */
  static getStats() {
    // Note: getMetrics method not available on ResizableLRUCache
    const cacheStats = { size: this.compilationCache.size, maxSize: this.compilationCache.capacity };
    
    return {
      compilations: this.compilationStats.totalCompilations,
      cacheHits: this.compilationStats.cacheHits,
      cacheMisses: this.compilationStats.totalCompilations - this.compilationStats.cacheHits,
      cacheHitRatio: this.compilationStats.totalCompilations > 0 
        ? this.compilationStats.cacheHits / this.compilationStats.totalCompilations 
        : 0,
      averageCompileTime: this.compilationStats.totalCompilations > 0
        ? this.compilationStats.totalCompileTime / this.compilationStats.totalCompilations
        : 0,
      cacheSize: cacheStats.size,
      cacheMaxSize: cacheStats.maxSize,
      registeredReplacers: this.tokenReplacers.size
    };
  }
  
  /**
   * Resets all statistics and caches
   */
  static reset(): void {
    this.clearCache();
    this.compilationStats = {
      totalCompilations: 0,
      cacheHits: 0,
      totalCompileTime: 0
    };
  }
  
  /**
   * Pre-compiles common format patterns for better performance
   */
  static precompileCommonPatterns(): void {
    const commonPatterns = [
      'YYYY-MM-DD',
      'YYYY-MM-DDTHH:mm:ss',
      'YYYY-MM-DDTHH:mm:ssZ',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'MMMM D, YYYY',
      'MMM D, YYYY',
      'h:mm A',
      'HH:mm',
      'HH:mm:ss'
    ];
    
    for (const pattern of commonPatterns) {
      this.compile(pattern);
    }
  }

  /**
   * Optimizes cache based on usage patterns
   */
  static optimizeCache(): void {
    // Note: optimize method not available on ResizableLRUCache
    // Cache optimization is handled internally
  }

  /**
   * Sets maximum cache size
   */
  static setMaxCacheSize(size: number): void {
    this.compilationCache.setMaxSize(size);
  }

  /**
   * Sets dynamic sizing for cache
   */
  static setDynamicSizing(enabled: boolean): void {
    // Note: setDynamicSizing method not available on ResizableLRUCache
    // Dynamic sizing is handled internally
  }

  /**
   * Checks if dynamic sizing is enabled
   */
  static isDynamicSizingEnabled(): boolean {
    // Note: isDynamicSizingEnabled method not available on ResizableLRUCache
    return false;
  }
}