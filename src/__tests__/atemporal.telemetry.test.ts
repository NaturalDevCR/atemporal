/**
 * @file Tests for the optional telemetry integration.
 */
import atemporal from '../index';
import {
  setTelemetryTracer,
  getTelemetryTracer,
  withSpan,
  type TelemetryTracer,
  type TelemetrySpan,
} from '../core/telemetry';

describe('atemporal: telemetry (Sprint 2.5)', () => {
  afterEach(() => {
    setTelemetryTracer(null);
  });

  it('has no tracer by default', () => {
    setTelemetryTracer(null);
    expect(getTelemetryTracer()).toBeNull();
  });

  it('can install a custom tracer', () => {
    const t: TelemetryTracer = { event: jest.fn() };
    setTelemetryTracer(t);
    expect(getTelemetryTracer()).toBe(t);
  });

  it('telemetry does not affect normal operation when no tracer is set', () => {
    setTelemetryTracer(null);
    expect(() => atemporal('2024-01-15').format(atemporal.presets.ISO)).not.toThrow();
  });

  it('a custom tracer can observe parse calls via the withSpan helper', async () => {
    const events: string[] = [];
    setTelemetryTracer({
      spanStarted: (name) => events.push(`start:${name}`),
      spanEnded: (span: TelemetrySpan) => events.push(`end:${span.name}:${span.durationMs}`),
    });

    await withSpan('atemporal.parse', { input: '2024-01-15' }, () => {
      return atemporal('2024-01-15');
    });

    expect(events).toContain('start:atemporal.parse');
    expect(events.some((e) => e.startsWith('end:atemporal.parse'))).toBe(true);
  });
});
