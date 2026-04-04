/**
 * @file Central Temporal API re-export.
 *
 * Always use this module instead of importing directly from '@js-temporal/polyfill'
 * for runtime operations (instanceof checks, creating instances, calling static methods).
 *
 * getCachedTemporalAPI() returns native Temporal when the browser supports it
 * (Chrome 144+, Firefox 139+), falling back to the polyfill otherwise.
 * Using this central export guarantees every module uses the same implementation,
 * preventing cross-implementation mismatches (e.g. polyfill.ZonedDateTime.since()
 * receiving a native ZonedDateTime and throwing "Must specify time zone").
 *
 * For TypeScript type annotations only, use:
 *   import type { Temporal } from '@js-temporal/polyfill';
 */

import { getCachedTemporalAPI } from './temporal-detection';
import { Temporal as PolyfillTemporal } from '@js-temporal/polyfill';

// Export the runtime Temporal (native when available, polyfill otherwise).
// Cast to `typeof PolyfillTemporal` so TypeScript can use `Temporal.ZonedDateTime`
// as a type namespace in function signatures and declaration files — the
// native and polyfill APIs are structurally compatible.
export const Temporal = getCachedTemporalAPI().Temporal as typeof PolyfillTemporal;
