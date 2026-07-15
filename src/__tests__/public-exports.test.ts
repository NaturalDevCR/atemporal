import atemporal, {
  ATEMPORAL_ERROR_CODES,
  AtemporalError,
  FormatMismatchError,
  InvalidAmPmError,
  InvalidAtemporalInstanceError,
  InvalidDateComponentsError,
  InvalidDateError,
  InvalidFormatError,
  InvalidTimeZoneError,
} from '../index';

describe('public entrypoint exports', () => {
  it('exports the documented error base class and catalog', () => {
    const error = new InvalidDateError('Invalid date');

    expect(error).toBeInstanceOf(AtemporalError);
    expect(error.code).toBe(ATEMPORAL_ERROR_CODES.INVALID_DATE);
    expect(ATEMPORAL_ERROR_CODES.INVALID_FORMAT).toBe('ATEMPORAL_INVALID_FORMAT');
  });

  it('exports custom parse/format errors used by plugin consumers', () => {
    expect(new InvalidFormatError('Bad format', 'YYYY-QQ')).toBeInstanceOf(AtemporalError);
    expect(new FormatMismatchError('No match', '2026/01/01', 'YYYY-MM-DD')).toBeInstanceOf(AtemporalError);
  });

  it('exports the remaining documented validation errors', () => {
    expect(new InvalidAmPmError('Invalid meridiem')).toBeInstanceOf(AtemporalError);
    expect(new InvalidAtemporalInstanceError('Invalid instance')).toBeInstanceOf(AtemporalError);
    expect(new InvalidDateComponentsError('Invalid components')).toBeInstanceOf(AtemporalError);
    expect(new InvalidTimeZoneError('Invalid time zone')).toBeInstanceOf(AtemporalError);
  });

  it('keeps the default export callable', () => {
    expect(atemporal('2026-06-03T00:00:00Z').isValid()).toBe(true);
  });

  it('exports unix and validates its result through the public factory', () => {
    const result = atemporal.unix(1_752_096_000);

    expect(result.isValid()).toBe(true);
    expect(result.error).toBeNull();
  });
});
