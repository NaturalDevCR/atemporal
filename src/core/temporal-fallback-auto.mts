import { isNativeTemporalAvailable } from './temporal-capabilities.js';
import type { Temporal } from '../types/temporal.js';

// ESM importers wait for initialization, so the public date API stays synchronous.
// This is the only asynchronous edge to the polyfill in the default ESM graph.
const fallback: typeof Temporal | undefined = isNativeTemporalAvailable()
  ? undefined
  : (await import('@js-temporal/polyfill')).Temporal;

export function getFallbackTemporal(): typeof Temporal {
  if (!fallback) {
    throw new Error('Temporal became unavailable after initialization. Keep globalThis.Temporal unchanged.');
  }
  return fallback;
}
