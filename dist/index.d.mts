import { A as AtemporalFactory } from './TemporalWrapper-Cj9Ommz5.mjs';
export { T as Atemporal, D as DateInput, P as Plugin, S as SettableUnit, a as TimeUnit } from './TemporalWrapper-Cj9Ommz5.mjs';
import '@js-temporal/polyfill';

/**
 * @file This is the main entry point for the 'atemporal' library.
 * It sets up the main factory function, attaches static utility methods,
 * and handles the plugin system, making it the central hub for all functionality.
 */

declare const atemporal: AtemporalFactory;

export { atemporal as default };
