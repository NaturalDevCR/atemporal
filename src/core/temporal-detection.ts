/**
 * @file Temporal detection utility for checking native Temporal API availability
 * This module provides functionality to detect if the native Temporal API is available
 * in the current environment and conditionally use it instead of the polyfill.
 */

import { getFallbackTemporal } from './temporal-fallback';
import type { Temporal } from '../types/temporal';

/**
 * Interface for the Temporal API that can be either native or polyfilled
 */
export interface TemporalAPI {
  Temporal: typeof Temporal;
  isNative: boolean;
}

import { getGlobalObject, isNativeTemporalAvailable } from './temporal-capabilities';
export { isNativeTemporalAvailable } from './temporal-capabilities';

/**
 * Gets the appropriate Temporal API (native or polyfilled)
 * @returns {TemporalAPI} Object containing the Temporal API and whether it's native
 */
export function getTemporalAPI(): TemporalAPI {
  const isNative = isNativeTemporalAvailable();

  if (isNative) {
    // Get the global object in a cross-platform way
    const globalObj = getGlobalObject();

    // Use native Temporal API
    const nativeTemporal = (globalObj as any).Temporal;
    return {
      Temporal: nativeTemporal,
      isNative: true,
    };
  } else {
    // The default build provides a polyfill; the native build reports a missing runtime.
    return {
      Temporal: getFallbackTemporal(),
      isNative: false,
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
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof navigator !== "undefined"
  );
}

/**
 * Type guard to check if we're running in a Node.js environment
 * @returns {boolean} True if running in Node.js, false otherwise
 */
export function isNodeEnvironment(): boolean {
  try {
    return (
      typeof process !== "undefined" &&
      process.versions !== null &&
      process.versions !== undefined &&
      typeof process.versions.node === "string"
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
  environment: "unknown" | "browser" | "node";
  version: "native" | "polyfill";
} {
  const api = getCachedTemporalAPI();
  return {
    isNative: api.isNative,
    environment: isBrowserEnvironment()
      ? "browser"
      : isNodeEnvironment()
      ? "node"
      : "unknown",
    version: api.isNative ? "native" : "polyfill",
  };
}
