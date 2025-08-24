/**
 * @file Temporal detection utility for checking native Temporal API availability
 * This module provides functionality to detect if the native Temporal API is available
 * in the current environment and conditionally use it instead of the polyfill.
 */

// Static import of the Temporal polyfill to avoid dynamic require() issues with bundlers
import { Temporal as PolyfillTemporal } from '@js-temporal/polyfill';

/**
 * Interface for the Temporal API that can be either native or polyfilled
 */
export interface TemporalAPI {
  Temporal: typeof import('@js-temporal/polyfill').Temporal;
  isNative: boolean;
}

/**
 * Checks if the native Temporal API is available in the current environment
 * @returns {boolean} True if native Temporal is available, false otherwise
 */
export function isNativeTemporalAvailable(): boolean {
  try {
    // Get the global object in a cross-platform way
    const globalObj = (function() {
      if (typeof globalThis !== 'undefined') return globalThis;
      if (typeof window !== 'undefined') return window;
      if (typeof global !== 'undefined') return global;
      if (typeof self !== 'undefined') return self;
      throw new Error('Unable to locate global object');
    })();
    
    // Check if Temporal exists in the global scope
    if ('Temporal' in globalObj) {
      const temporal = (globalObj as any).Temporal;
      
      // Verify that it has the expected structure and key methods
      return (
        temporal &&
        typeof temporal === 'object' &&
        typeof temporal.Now === 'object' &&
        typeof temporal.PlainDate === 'function' &&
        typeof temporal.PlainDateTime === 'function' &&
        typeof temporal.ZonedDateTime === 'function' &&
        typeof temporal.Instant === 'function' &&
        typeof temporal.Duration === 'function' &&
        typeof temporal.PlainTime === 'function' &&
        typeof temporal.PlainYearMonth === 'function' &&
        typeof temporal.PlainMonthDay === 'function' &&
        typeof temporal.TimeZone === 'function' &&
        typeof temporal.Calendar === 'function'
      );
    }
    return false;
  } catch (error) {
    // If any error occurs during detection, assume native Temporal is not available
    return false;
  }
}

/**
 * Gets the appropriate Temporal API (native or polyfilled)
 * @returns {TemporalAPI} Object containing the Temporal API and whether it's native
 */
export function getTemporalAPI(): TemporalAPI {
  const isNative = isNativeTemporalAvailable();
  
  if (isNative) {
    // Get the global object in a cross-platform way
    const globalObj = (function() {
      if (typeof globalThis !== 'undefined') return globalThis;
      if (typeof window !== 'undefined') return window;
      if (typeof global !== 'undefined') return global;
      if (typeof self !== 'undefined') return self;
      throw new Error('Unable to locate global object');
    })();
    
    // Use native Temporal API
    const nativeTemporal = (globalObj as any).Temporal;
    return {
      Temporal: nativeTemporal,
      isNative: true
    };
  } else {
    // Fall back to polyfill (using static import)
    return {
      Temporal: PolyfillTemporal,
      isNative: false
    };
  }
}

/**
 * Initializes the Temporal API for the library
 * This function should be called once at the beginning of the library initialization
 * @returns {TemporalAPI} The initialized Temporal API
 */
export function initializeTemporal(): TemporalAPI {
  const temporalAPI = getTemporalAPI();
  
  // Log which Temporal implementation is being used (only in development)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.info(
      `Atemporal: Using ${temporalAPI.isNative ? 'native' : 'polyfilled'} Temporal API`
    );
  }
  
  return temporalAPI;
}

/**
 * Cached Temporal API instance to avoid repeated detection
 */
let cachedTemporalAPI: TemporalAPI | null = null;

/**
 * Gets the cached Temporal API or initializes it if not already cached
 * @returns {TemporalAPI} The Temporal API instance
 */
export function getCachedTemporalAPI(): TemporalAPI {
  if (!cachedTemporalAPI) {
    cachedTemporalAPI = initializeTemporal();
  }
  return cachedTemporalAPI;
}

/**
 * Resets the cached Temporal API (useful for testing)
 * @internal
 */
export function resetTemporalAPICache(): void {
  cachedTemporalAPI = null;
}

/**
 * Type guard to check if we're running in a browser environment
 * @returns {boolean} True if running in browser, false otherwise
 */
export function isBrowserEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof navigator !== 'undefined'
  );
}

/**
 * Type guard to check if we're running in a Node.js environment
 * @returns {boolean} True if running in Node.js, false otherwise
 */
export function isNodeEnvironment(): boolean {
  try {
    return (
      typeof process !== 'undefined' &&
      process.versions !== null &&
      process.versions !== undefined &&
      typeof process.versions.node === 'string'
    );
  } catch (error) {
    // If any error occurs during detection, assume we're not in Node.js
    return false;
  }
}

/**
 * Gets information about the current Temporal implementation
 * @returns {object} Information about the Temporal implementation
 */
export function getTemporalInfo(): {
  isNative: boolean;
  environment: 'unknown' | 'browser' | 'node';
  version: 'native' | 'polyfill';
} {
  const api = getCachedTemporalAPI();
  return {
    isNative: api.isNative,
    environment: isBrowserEnvironment() ? 'browser' : isNodeEnvironment() ? 'node' : 'unknown',
    version: api.isNative ? 'native' : 'polyfill'
  };
}