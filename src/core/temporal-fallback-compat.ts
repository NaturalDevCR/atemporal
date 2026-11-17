import { Temporal as PolyfillTemporal } from '@js-temporal/polyfill';
import type { Temporal } from '../types/temporal';

/** Legacy ES2020 distribution: keep initialization synchronous in every bundler. */
export function getFallbackTemporal(): typeof Temporal {
  return PolyfillTemporal;
}
