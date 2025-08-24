/**
 * @file Core formatting module with token pre-compilation and object pooling
 */

export { TokenCompiler } from './token-compiler';
export { FormatTokenPool } from './token-pool';
export { FormattingEngine } from './formatting-engine';
export { FormattingCache } from './formatting-cache';
export { createTokenReplacements, legacyFormat, getTokenRegex, clearLegacyFormattingCache } from './legacy-formatter';
export type {
  FormatToken,
  CompiledFormat,
  FormattingOptions,
  TokenType,
  FormattingContext
} from './formatting-types';