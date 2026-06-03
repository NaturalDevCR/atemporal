/**
 * @file Optional OpenTelemetry integration for atemporal.
 *
 * atemporal does **not** depend on `@opentelemetry/api` directly to
 * keep the bundle small. Instead, it exposes a tiny tracer interface
 * that any OTel-compatible tracer can satisfy. Consumers wire it up
 * in one line:
 *
 * ```ts
 * import { trace } from '@opentelemetry/api';
 * import { setTelemetryTracer } from 'atemporal';
 * setTelemetryTracer(trace.getTracer('atemporal'));
 * ```
 *
 * If no tracer is set, all calls are no-ops. The library never
 * requires a tracer to be present.
 *
 * @example Custom (non-OTel) tracer
 * ```ts
 * setTelemetryTracer({
 *   spanStarted: (name, attrs) => statsd.increment(`atemporal.${name}`),
 *   spanEnded:   (name, durMs) => statsd.timing(`atemporal.${name}`, durMs),
 *   event:       (name, attrs) => logger.info({ name, ...attrs }),
 * });
 * ```
 */

/** A span tracked by the telemetry interface. */
export interface TelemetrySpan {
  /** Name of the span. */
  readonly name: string;
  /** Wall-clock duration in milliseconds. */
  readonly durationMs: number;
  /** Attributes attached to the span. */
  readonly attributes: Readonly<Record<string, unknown>>;
}

/** Optional callbacks fired at span start / end. */
export interface TelemetryTracer {
  /** Called when a new span starts. */
  spanStarted?(name: string, attributes: Record<string, unknown>): void;
  /** Called when a span ends. */
  spanEnded?(span: TelemetrySpan): void;
  /** Called for free-form events (e.g. warnings, errors). */
  event?(name: string, attributes: Record<string, unknown>): void;
}

let tracer: TelemetryTracer | null = null;

/** Installs (or clears) the global tracer. */
export function setTelemetryTracer(t: TelemetryTracer | null): void {
  tracer = t;
}

/** Returns the current tracer, or `null` if none is installed. */
export function getTelemetryTracer(): TelemetryTracer | null {
  return tracer;
}

/** Tracked span types. Add new ones here to keep the API stable. */
export type SpanName =
  | 'atemporal.parse'
  | 'atemporal.format'
  | 'atemporal.diff'
  | 'atemporal.add'
  | 'atemporal.subtract';

/**
 * Internal: wraps a function call in a telemetry span. If no tracer is
 * installed, the call is forwarded as-is.
 */
export async function withSpan<T>(
  name: SpanName,
  attributes: Record<string, unknown>,
  fn: () => T | Promise<T>
): Promise<T> {
  if (!tracer) {
    return fn();
  }
  const startedAt = Date.now();
  tracer.spanStarted?.(name, attributes);
  try {
    const result = await fn();
    tracer.spanEnded?.({
      name,
      durationMs: Date.now() - startedAt,
      attributes: { ...attributes, status: 'ok' },
    });
    return result;
  } catch (err) {
    tracer.spanEnded?.({
      name,
      durationMs: Date.now() - startedAt,
      attributes: {
        ...attributes,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}
