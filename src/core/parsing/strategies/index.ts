/**
 * @file Parsing strategies index - exports all parsing strategies
 */

// Strategy implementations
export { TemporalWrapperStrategy } from './temporal-wrapper-strategy';
export { TemporalZonedStrategy } from './temporal-zoned-strategy';
export { TemporalInstantStrategy } from './temporal-instant-strategy';
export { TemporalPlainDateTimeStrategy } from './temporal-plain-datetime-strategy';
export { TemporalPlainDateStrategy } from './temporal-plain-date-strategy';
export { DateParseStrategy } from './date-strategy';
export { FirebaseTimestampStrategy } from './firebase-strategy';
export { NumberParseStrategy } from './number-strategy';
export { StringParseStrategy } from './string-strategy';
export { TemporalLikeStrategy } from './temporal-like-strategy';
export { ArrayLikeStrategy } from './array-like-strategy';
export { FallbackStrategy } from './fallback-strategy';

// Default strategy creation
import { StringParseStrategy } from './string-strategy';
import { NumberParseStrategy } from './number-strategy';
import { DateParseStrategy } from './date-strategy';
import { TemporalWrapperStrategy } from './temporal-wrapper-strategy';
import { TemporalZonedStrategy } from './temporal-zoned-strategy';
import { TemporalInstantStrategy } from './temporal-instant-strategy';
import { TemporalPlainDateTimeStrategy } from './temporal-plain-datetime-strategy';
import { TemporalPlainDateStrategy } from './temporal-plain-date-strategy';
import { FirebaseTimestampStrategy } from './firebase-strategy';
import { ArrayLikeStrategy } from './array-like-strategy';
import { TemporalLikeStrategy } from './temporal-like-strategy';
import { FallbackStrategy } from './fallback-strategy';

import type { ParseStrategy, ParseStrategyType } from '../parsing-types';

/**
 * Registry of all available parsing strategies
 */
export const STRATEGY_REGISTRY = new Map<ParseStrategyType, () => ParseStrategy>([
  ['string', () => new StringParseStrategy()],
  ['number', () => new NumberParseStrategy()],
  ['date', () => new DateParseStrategy()],
  ['temporal-wrapper', () => new TemporalWrapperStrategy()],
  ['temporal-zoned', () => new TemporalZonedStrategy()],
  ['temporal-instant', () => new TemporalInstantStrategy()],
  ['temporal-plain-datetime', () => new TemporalPlainDateTimeStrategy()],
  ['temporal-plain-date', () => new TemporalPlainDateStrategy()],
  ['firebase-timestamp', () => new FirebaseTimestampStrategy()],
  ['array-like', () => new ArrayLikeStrategy()],
  ['temporal-like', () => new TemporalLikeStrategy()],
  ['fallback', () => new FallbackStrategy()]
]);

/**
 * Get all available strategy types
 */
export function getAvailableStrategyTypes(): ParseStrategyType[] {
  return Array.from(STRATEGY_REGISTRY.keys());
}

/**
 * Create a strategy instance by type
 */
export function createStrategy(type: ParseStrategyType): ParseStrategy {
  if (type == null) {
    throw new Error('Strategy type cannot be null or undefined');
  }
  
  const factory = STRATEGY_REGISTRY.get(type);
  if (!factory) {
    throw new Error(`Unknown strategy type: ${type}`);
  }
  return factory();
}

/**
 * Create all default strategies sorted by priority
 */
export function createDefaultStrategies(): ParseStrategy[] {
  const strategies = Array.from(STRATEGY_REGISTRY.values()).map(factory => factory());
  
  // Sort by priority (highest first)
  return strategies.sort((a, b) => b.priority - a.priority);
}

/**
 * Get strategy information
 */
export function getStrategyInfo(type: ParseStrategyType): { type: ParseStrategyType; priority: number; description: string } | null {
  if (type == null) {
    throw new Error('Strategy type cannot be null or undefined');
  }
  
  try {
    const strategy = createStrategy(type);
    return {
      type: strategy.type,
      priority: strategy.priority,
      description: strategy.description
    };
  } catch {
    return null;
  }
}

/**
 * Get all strategy information sorted by priority
 */
export function getAllStrategyInfo(): Array<{ type: ParseStrategyType; priority: number; description: string }> {
  return getAvailableStrategyTypes()
    .map(type => getStrategyInfo(type))
    .filter((info): info is NonNullable<typeof info> => info !== null)
    .sort((a, b) => b.priority - a.priority);
}