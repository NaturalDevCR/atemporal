import { TemporalWrapper } from '../TemporalWrapper';
import { TemporalUtils } from '../TemporalUtils';
import { DiffCache } from './caching/diff-cache';
import { FormattingEngine } from './formatting/formatting-engine';
import { getTemporalInfo } from './temporal-detection';
import type { AtemporalDiagnostics } from '../types';

function snapshot(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

/** Returns a serializable, detached view of runtime state. */
export function getDiagnostics(): AtemporalDiagnostics {
  return {
    temporal: { ...getTemporalInfo() },
    caches: {
      parsing: snapshot(TemporalUtils.getParsingMetrics()),
      formatting: snapshot(TemporalWrapper.getFormattingMetrics()),
      diff: snapshot(DiffCache.getStats()),
    },
  };
}

/** Clears internal cache entries while leaving user defaults and extension state intact. */
export function clearCaches(): void {
  TemporalUtils.clearParsingCache();
  FormattingEngine.clearCache();
  DiffCache.clear();
}

/** Clears cache entries and performance counters without changing configured defaults. */
export function resetDiagnostics(): void {
  TemporalUtils.clearParsingCache();
  TemporalUtils.resetParsingMetrics();
  FormattingEngine.reset();
  DiffCache.clear();
}

/** Initializes formatting caches and optionally compiles application format patterns. */
export function prewarm(options: { formatPatterns?: string[] } = {}): void {
  TemporalWrapper.prewarmFormattingSystem();
  const now = TemporalWrapper.from(undefined);
  for (const pattern of options.formatPatterns ?? []) {
    now.format(pattern);
  }
}
