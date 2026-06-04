/**
 * @file Tests for Sprint 1.2: standardized error codes (`ATEMPORAL_*`).
 */
import {
  AtemporalError,
  InvalidDateError,
  InvalidTimeZoneError,
  InvalidAtemporalInstanceError,
  InvalidFormatError,
  FormatMismatchError,
  InvalidDateComponentsError,
  InvalidAmPmError,
  ATEMPORAL_ERROR_CODES,
} from '../errors';
import atemporal from '../index';

describe('ATEMPORAL_ERROR_CODES (Sprint 1.2)', () => {
  it('exposes the catalog as a frozen object', () => {
    expect(typeof ATEMPORAL_ERROR_CODES).toBe('object');
    expect(() => {
      (ATEMPORAL_ERROR_CODES as any).NEW = 'X';
    }).toThrow();
  });

  it('all codes follow the ATEMPORAL_* naming convention', () => {
    for (const value of Object.values(ATEMPORAL_ERROR_CODES)) {
      expect(value).toMatch(/^ATEMPORAL_[A-Z_]+$/);
    }
  });
});

describe('Each error has a stable `code` field (Sprint 1.2)', () => {
  it('InvalidDateError → ATEMPORAL_INVALID_DATE', () => {
    const e = new InvalidDateError('x');
    expect(e.code).toBe('ATEMPORAL_INVALID_DATE');
    expect(e).toBeInstanceOf(AtemporalError);
    expect(e).toBeInstanceOf(Error);
  });

  it('InvalidTimeZoneError → ATEMPORAL_INVALID_TIMEZONE', () => {
    const e = new InvalidTimeZoneError('x', 'Mars/Olympus');
    expect(e.code).toBe('ATEMPORAL_INVALID_TIMEZONE');
    expect(e.timezone).toBe('Mars/Olympus');
  });

  it('InvalidAtemporalInstanceError → ATEMPORAL_INVALID_INSTANCE', () => {
    const e = new InvalidAtemporalInstanceError('x');
    expect(e.code).toBe('ATEMPORAL_INVALID_INSTANCE');
  });

  it('InvalidFormatError → ATEMPORAL_INVALID_FORMAT', () => {
    const e = new InvalidFormatError('x', 'YYYY', ['QQ']);
    expect(e.code).toBe('ATEMPORAL_INVALID_FORMAT');
    expect(e.invalidTokens).toEqual(['QQ']);
  });

  it('FormatMismatchError → ATEMPORAL_FORMAT_MISMATCH', () => {
    const e = new FormatMismatchError('x', 'foo', 'YYYY');
    expect(e.code).toBe('ATEMPORAL_FORMAT_MISMATCH');
  });

  it('InvalidDateComponentsError → ATEMPORAL_INVALID_DATE_COMPONENTS', () => {
    const e = new InvalidDateComponentsError('x', { year: 2024, month: 13 });
    expect(e.code).toBe('ATEMPORAL_INVALID_DATE_COMPONENTS');
  });

  it('InvalidAmPmError → ATEMPORAL_INVALID_AMPM', () => {
    const e = new InvalidAmPmError('x', 15, 'pm');
    expect(e.code).toBe('ATEMPORAL_INVALID_AMPM');
  });
});

describe('Errors thrown by the factory expose the right code (Sprint 1.2)', () => {
  it('atemporal.validate(invalid) → ok=false with ATEMPORAL_INVALID_DATE', () => {
    const r = atemporal.validate('not a date');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('ATEMPORAL_INVALID_DATE');
  });

  it('InvalidTimeZoneError thrown by setDefaultTimeZone has the right code', () => {
    try {
      atemporal.setDefaultTimeZone('Mars/Olympus');
      fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidTimeZoneError);
      expect((e as AtemporalError).code).toBe('ATEMPORAL_INVALID_TIMEZONE');
    }
  });
});
