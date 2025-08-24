// Set consistent timezone for tests
process.env.TZ = 'UTC';

// Ensure Temporal polyfill is loaded
import '@js-temporal/polyfill';

// Import classes that need state reset
import { InputParser } from './src/core/parsing/input-parser';
import { IntlCache } from './src/core/caching/intl-cache';
import { DiffCache } from './src/core/caching/diff-cache';
import { TemporalUtils } from './src/TemporalUtils';

// Global test setup to reset shared state before each test
beforeEach(() => {
  // Reset all static state to ensure test isolation
  InputParser.resetStrategies();
  IntlCache.resetAll();
  DiffCache.reset();
  TemporalUtils.resetParseCoordinator();
});