import type { Temporal } from '../types/temporal';

let cachedTemporal: typeof Temporal | undefined;

/** CommonJS and source tests keep synchronous initialization, loading on demand. */
export function getFallbackTemporal(): typeof Temporal {
  if (!cachedTemporal) {
    const { Temporal: polyfill }: typeof import('@js-temporal/polyfill') = require('@js-temporal/polyfill');
    cachedTemporal = polyfill;
  }
  return cachedTemporal;
}
