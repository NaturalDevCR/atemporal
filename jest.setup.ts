// Set consistent timezone for tests
process.env.TZ = 'UTC';

// Ensure Temporal polyfill is loaded
import '@js-temporal/polyfill';