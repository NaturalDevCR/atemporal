import type { ParseEngineConfig } from './parsing-types';

/** Shared defaults for the synchronous runtime and optional async coordinator. */
export function createRuntimeEngineConfig(detailedMetrics: boolean): ParseEngineConfig {
  return {
    strategies: {
      'temporal-wrapper': { enabled: true, priority: 100, options: {} },
      'temporal-zoned': { enabled: true, priority: 95, options: {} },
      'temporal-instant': { enabled: true, priority: 90, options: {} },
      'temporal-plain-datetime': { enabled: true, priority: 85, options: {} },
      'temporal-plain-date': { enabled: true, priority: 80, options: {} },
      'date': { enabled: true, priority: 70, options: {} },
      'firebase-timestamp': { enabled: true, priority: 65, options: {} },
      'number': { enabled: true, priority: 60, options: {} },
      'string': { enabled: true, priority: 50, options: {} },
      'temporal-like': { enabled: true, priority: 40, options: {} },
      'array-like': { enabled: true, priority: 30, options: {} },
      'fallback': { enabled: true, priority: 1, options: {} }
    },
    defaultOptions: {
      enableFastPath: true,
      enableCaching: true,
      enableOptimization: true,
      maxRetries: 3,
      fallbackStrategy: 'fallback'
    },
    cacheConfig: {
      enabled: true,
      maxSize: detailedMetrics ? 10000 : 1000,
      ttl: 300000
    },
    optimizationConfig: {
      enabled: true,
      adaptiveStrategies: true,
      performanceThresholds: {
        fastPath: 1,
        acceptable: 5,
        slow: 20
      }
    },
    debugConfig: {
      enabled: false,
      logLevel: 'error',
      traceExecution: false
    }
  };
}
