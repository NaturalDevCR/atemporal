/**
 * @file Type definitions for formatting system
 */

import type { Temporal } from '@js-temporal/polyfill';

/**
 * Token types for format string parsing
 */
export type TokenType = 
  | 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'
  | 'weekday' | 'era' | 'timezone' | 'offset'
  | 'literal' | 'escape';

/**
 * Individual format token
 */
export interface FormatToken {
  type: TokenType;
  pattern: string;
  length: number;
  value?: string;
  formatter?: (date: Temporal.ZonedDateTime, locale?: string) => string;
}

/**
 * Compiled format with pre-processed tokens
 */
export interface CompiledFormat {
  tokens: FormatToken[];
  hasTimeZone: boolean;
  hasLocaleSpecific: boolean;
  cacheKey: string;
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Formatting options
 */
export interface FormattingOptions {
  locale?: string;
  timeZone?: string;
  calendar?: string;
  numberingSystem?: string;
  useCache?: boolean;
  poolTokens?: boolean;
}

/**
 * Context for formatting operations
 */
export interface FormattingContext {
  date: Temporal.ZonedDateTime;
  locale: string;
  timeZone: string;
  options: FormattingOptions;
  compiledFormat: CompiledFormat;
}

/**
 * Token replacement function signature
 */
export type TokenReplacer = (token: FormatToken, context: FormattingContext) => string;

/**
 * Format compilation result
 */
export interface CompilationResult {
  compiled: CompiledFormat;
  errors: string[];
  warnings: string[];
  performance: {
    parseTime: number;
    tokenCount: number;
    complexity: CompiledFormat['complexity'];
  };
}

/**
 * Token pool statistics
 */
export interface TokenPoolStats {
  totalTokens: number;
  activeTokens: number;
  pooledTokens: number;
  hitRatio: number;
  memoryUsage: number;
}

/**
 * Formatting performance metrics
 */
export interface FormattingMetrics {
  totalFormats: number;
  cacheHits: number;
  cacheMisses: number;
  fastPathHits: number;
  averageFormatTime: number;
  tokenPoolStats: TokenPoolStats;
  compilationStats: {
    totalCompilations: number;
    averageCompileTime: number;
    cacheHitRatio: number;
  };
}

/**
 * Pre-defined format patterns
 */
export const COMMON_PATTERNS = {
  ISO_DATE: 'YYYY-MM-DD',
  ISO_TIME: 'HH:mm:ss',
  ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
  ISO_DATETIME_TZ: 'YYYY-MM-DDTHH:mm:ssZ',
  US_DATE: 'MM/DD/YYYY',
  EU_DATE: 'DD/MM/YYYY',
  READABLE: 'MMMM D, YYYY',
  READABLE_TIME: 'MMMM D, YYYY [at] h:mm A',
  SHORT_DATE: 'MMM D, YYYY',
  TIME_12: 'h:mm A',
  TIME_24: 'HH:mm',
  RELATIVE_TIME: '[relative]'
} as const;

/**
 * Token pattern mappings
 */
export const TOKEN_PATTERNS = {
  // Year
  'YYYY': { type: 'year' as const, length: 4 },
  'YY': { type: 'year' as const, length: 2 },
  
  // Month
  'MMMM': { type: 'month' as const, length: 4 }, // January
  'MMM': { type: 'month' as const, length: 3 },  // Jan
  'MM': { type: 'month' as const, length: 2 },   // 01
  'M': { type: 'month' as const, length: 1 },    // 1
  
  // Day
  'DD': { type: 'day' as const, length: 2 },     // 01
  'D': { type: 'day' as const, length: 1 },      // 1
  
  // Hour
  'HH': { type: 'hour' as const, length: 2 },    // 24-hour: 00-23
  'H': { type: 'hour' as const, length: 1 },     // 24-hour: 0-23
  'hh': { type: 'hour' as const, length: 2 },    // 12-hour: 01-12
  'h': { type: 'hour' as const, length: 1 },     // 12-hour: 1-12
  
  // Minute
  'mm': { type: 'minute' as const, length: 2 },  // 00-59
  'm': { type: 'minute' as const, length: 1 },   // 0-59
  
  // Second
  'ss': { type: 'second' as const, length: 2 },  // 00-59
  's': { type: 'second' as const, length: 1 },   // 0-59
  
  // Millisecond
  'SSS': { type: 'millisecond' as const, length: 3 }, // 000-999
  'SS': { type: 'millisecond' as const, length: 2 },  // 00-99
  'S': { type: 'millisecond' as const, length: 1 },   // 0-9
  
  // Weekday
  'dddd': { type: 'weekday' as const, length: 4 }, // Monday
  'ddd': { type: 'weekday' as const, length: 3 },  // Mon
  'dd': { type: 'weekday' as const, length: 2 },   // Mo
  'd': { type: 'weekday' as const, length: 1 },    // 1
  
  // AM/PM
  'A': { type: 'era' as const, length: 1 },       // AM/PM
  'a': { type: 'era' as const, length: 1 },       // am/pm
  
  // Timezone
  'Z': { type: 'offset' as const, length: 1 },    // +05:00
  'ZZ': { type: 'offset' as const, length: 2 },   // +0500
  'z': { type: 'timezone' as const, length: 1 },  // EST
  'zz': { type: 'timezone' as const, length: 2 }, // Eastern Standard Time
} as const;

/**
 * Escape sequences for literal text
 */
export const ESCAPE_PATTERNS = {
  BRACKET_OPEN: '[',
  BRACKET_CLOSE: ']',
  BACKSLASH: '\\'
} as const;