import type { Temporal } from '../types/temporal';

/** The native distribution never imports or installs a fallback at runtime. */
export function getFallbackTemporal(): typeof Temporal {
  throw new Error(
    'atemporal/native requires globalThis.Temporal. Use "atemporal" for automatic polyfill fallback.',
  );
}
