/**
 * @file Core caching module - optimized cache implementations with structured keys
 * This module replaces JSON.stringify with structured cache keys for better performance
 */

export * from './lru-cache';
export * from './cache-keys';
export * from './intl-cache';
export * from './diff-cache';
export * from './cache-optimizer';
export * from './cache-coordinator';