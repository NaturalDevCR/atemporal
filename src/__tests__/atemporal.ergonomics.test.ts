/**
 * @file Tests for the Sprint 1.1 ergonomic static helpers:
 * - atemporal.try
 * - atemporal.iso
 * - atemporal.validate
 * - atemporal.presets
 */
import atemporal from '../index';

describe('atemporal.try (Sprint 1.1)', () => {
  it('returns a TemporalWrapper for a valid ISO string', () => {
    const r = atemporal.try('2024-01-15');
    expect(r).not.toBeNull();
    expect(r!.isValid()).toBe(true);
    expect(r!.year).toBe(2024);
  });

  it('returns a TemporalWrapper for a Date', () => {
    const d = new Date(Date.UTC(2024, 5, 3));
    const r = atemporal.try(d);
    expect(r).not.toBeNull();
    expect(r!.year).toBe(2024);
  });

  it('returns null for an invalid string', () => {
    expect(atemporal.try('not a date')).toBeNull();
  });

  it('returns null for null/undefined without throwing', () => {
    expect(atemporal.try(null)).toBeNull();
    expect(atemporal.try(undefined)).toBeNull();
    expect(atemporal.try(null as any)).toBeNull();
  });

  it('does not throw on garbage input', () => {
    expect(() => atemporal.try({} as any)).not.toThrow();
    expect(() => atemporal.try(Symbol('x') as any)).not.toThrow();
  });

  it('respects explicit time zone', () => {
    const r = atemporal.try('2024-01-15T12:00:00', 'America/New_York');
    expect(r).not.toBeNull();
    expect(r!.timeZone('UTC').format(atemporal.presets.ISO_DATE)).toBe('2024-01-15');
  });
});

describe('atemporal.iso (Sprint 1.1)', () => {
  it('formats a valid string into ISO 8601', () => {
    expect(atemporal.iso('2024-01-15')).toMatch(/^2024-01-15/);
  });

  it('returns null for invalid input', () => {
    expect(atemporal.iso('not a date')).toBeNull();
    expect(atemporal.iso(null)).toBeNull();
    expect(atemporal.iso(undefined)).toBeNull();
  });

  it('returns null on error, never throws', () => {
    expect(() => atemporal.iso({} as any)).not.toThrow();
  });

  it('respects explicit time zone', () => {
    const r = atemporal.iso('2024-01-15T12:00:00', 'America/New_York');
    expect(r).not.toBeNull();
    // The exact offset depends on DST, but the time must be preserved.
    expect(r).toMatch(/2024-01-15T/);
  });
});

describe('atemporal.validate (Sprint 1.1)', () => {
  it('returns ok=true for valid input', () => {
    const r = atemporal.validate('2024-01-15');
    expect(r.ok).toBe(true);
    expect(r.iso).toMatch(/^2024-01-15/);
    expect(r.confidence).toBe(1);
  });

  it('returns ok=false with a code for invalid input', () => {
    const r = atemporal.validate('garbage');
    expect(r.ok).toBe(false);
    expect(r.code).toBeDefined();
    expect(r.reason).toBeDefined();
  });

  it('returns ok=false for null', () => {
    const r = atemporal.validate(null);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('ATEMPORAL_INVALID_INPUT');
  });

  it('returns ok=false for undefined', () => {
    const r = atemporal.validate(undefined);
    expect(r.ok).toBe(false);
  });

  it('handles Date and timestamp', () => {
    const r = atemporal.validate(0);
    expect(r.ok).toBe(true);
    expect(r.iso).toMatch(/^1970-01-01/);
  });
});

describe('atemporal.presets (Sprint 1.1)', () => {
  it('exposes the built-in format strings', () => {
    expect(atemporal.presets.ISO).toBeDefined();
    expect(atemporal.presets.RFC2822).toBeDefined();
    expect(atemporal.presets.SQL_DATETIME).toBeDefined();
  });

  it('list() returns the preset names', () => {
    const names = atemporal.presets.list();
    expect(names).toContain('ISO');
    expect(names).toContain('RFC2822');
    expect(names).toContain('ISO_DATE');
  });

  it('get(name) returns the format string', () => {
    expect(atemporal.presets.get('ISO_DATE')).toBe('YYYY-MM-DD');
  });

  it('get(name) throws for unknown presets', () => {
    expect(() => atemporal.presets.get('NOT_A_PRESET')).toThrow();
  });

  it('presets are immutable', () => {
    expect(() => {
      (atemporal.presets as any).NEW = 'YYYY';
    }).toThrow();
  });
});

describe('integration: atemporal.try + presets', () => {
  it('formats a date with the ISO preset', () => {
    const wrapped = atemporal.try('2024-01-15');
    expect(wrapped).not.toBeNull();
    expect(wrapped!.format(atemporal.presets.ISO_DATE)).toBe('2024-01-15');
  });

  it('formats a date with the RFC2822 preset', () => {
    const wrapped = atemporal.try('2024-01-15T12:00:00Z');
    expect(wrapped).not.toBeNull();
    expect(wrapped!.format(atemporal.presets.RFC2822)).toMatch(/2024/);
  });
});
