/**
 * @file Legacy parsing strategies - DEPRECATED
 * These implementations are kept for compatibility but should not be used.
 * Use the proper strategy implementations in the strategies/ folder instead.
 */

// Legacy implementations commented out to avoid conflicts with proper ParseStrategy interface
// The proper strategy implementations are in src/core/parsing/strategies/

/*
 * DEPRECATED: Legacy strategy implementations
 * These have been replaced by proper ParseStrategy implementations
 * in the strategies/ folder that follow the correct interface.
 */

/*
 * DEPRECATED: StringStrategy - use StringParseStrategy from strategies/string-strategy.ts
 */

/*
 * DEPRECATED: All legacy strategy implementations
 * Use the proper strategy implementations from strategies/ folder:
 * - DateParseStrategy from strategies/date-strategy.ts
 * - NumberParseStrategy from strategies/number-strategy.ts
 * - TemporalWrapperStrategy from strategies/temporal-wrapper-strategy.ts
 * - ArrayLikeStrategy from strategies/array-like-strategy.ts
 * - FirebaseTimestampStrategy from strategies/firebase-strategy.ts
 * - FallbackStrategy from strategies/fallback-strategy.ts
 */