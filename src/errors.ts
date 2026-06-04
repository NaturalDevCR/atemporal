/**
 * @file Defines custom error types for the atemporal library.
 *
 * Every error in atemporal:
 * - Extends `AtemporalError` (which extends the native `Error`).
 * - Exposes a stable `code` string of the form `ATEMPORAL_*` for machine
 *   handling (i18n, dashboards, alerting). The `code` is the source of
 *   truth for matching — do not pattern-match on `name` or `message`.
 * - Has a human-readable `message` that is stable across patch versions.
 *
 * @example Programmatic matching
 * ```ts
 * import { atemporal, InvalidDateError } from 'atemporal';
 *
 * try {
 *   atemporal('not a date');
 * } catch (err) {
 *   if (err instanceof InvalidDateError && err.code === 'ATEMPORAL_INVALID_DATE') {
 *     // Safe to show the user a localized error.
 *   }
 * }
 *
 * @example Logging with structured fields
 * ```ts
 * logger.error({
 *   atemporalCode: err.code,
 *   atemporalName: err.name,
 *   msg: err.message,
 * }, 'atemporal error');
 * ```
 */

/**
 * Catalog of all error codes emitted by atemporal. Always use these
 * constants when checking or logging errors; never inline string literals.
 */
export const ATEMPORAL_ERROR_CODES = Object.freeze({
  // Generic / input
  INVALID_INPUT: 'ATEMPORAL_INVALID_INPUT',
  INVALID_DATE: 'ATEMPORAL_INVALID_DATE',
  PARSE_FAILED: 'ATEMPORAL_PARSE_FAILED',

  // Format
  INVALID_FORMAT: 'ATEMPORAL_INVALID_FORMAT',
  FORMAT_MISMATCH: 'ATEMPORAL_FORMAT_MISMATCH',
  INVALID_DATE_COMPONENTS: 'ATEMPORAL_INVALID_DATE_COMPONENTS',
  INVALID_AMPM: 'ATEMPORAL_INVALID_AMPM',

  // Time zone / locale
  INVALID_TIMEZONE: 'ATEMPORAL_INVALID_TIMEZONE',
  INVALID_LOCALE: 'ATEMPORAL_INVALID_LOCALE',

  // Range
  INVALID_DATE_RANGE: 'ATEMPORAL_INVALID_DATE_RANGE',
  OVERLAP_DETECTION_FAILED: 'ATEMPORAL_OVERLAP_DETECTION_FAILED',

  // Instance / API misuse
  INVALID_INSTANCE: 'ATEMPORAL_INVALID_INSTANCE',
  ARGUMENT_OUT_OF_RANGE: 'ATEMPORAL_ARGUMENT_OUT_OF_RANGE',

  // Plugin
  PLUGIN_LOAD_FAILED: 'ATEMPORAL_PLUGIN_LOAD_FAILED',
  PLUGIN_INVALID: 'ATEMPORAL_PLUGIN_INVALID',
} as const);

export type AtemporalErrorCode =
  (typeof ATEMPORAL_ERROR_CODES)[keyof typeof ATEMPORAL_ERROR_CODES];

/**
 * Base error class for all atemporal-specific errors. Always catch this
 * type (or one of its subclasses) rather than the generic `Error`.
 */
export class AtemporalError extends Error {
  /**
   * Stable error code from `ATEMPORAL_ERROR_CODES`. Useful for i18n,
   * dashboards, and machine matching.
   */
  public readonly code: AtemporalErrorCode;

  constructor(message: string, code: AtemporalErrorCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    // Restore prototype chain for `instanceof` after transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an invalid IANA time zone identifier is used.
 */
export class InvalidTimeZoneError extends AtemporalError {
  constructor(message: string, public readonly timezone?: string) {
    super(message, ATEMPORAL_ERROR_CODES.INVALID_TIMEZONE);
  }
}

/**
 * Thrown when an operation is attempted on an invalid atemporal instance.
 */
export class InvalidAtemporalInstanceError extends AtemporalError {
  constructor(message: string) {
    super(message, ATEMPORAL_ERROR_CODES.INVALID_INSTANCE);
  }
}

/**
 * Thrown when an input cannot be parsed into a valid date.
 */
export class InvalidDateError extends AtemporalError {
  constructor(message: string, public readonly input?: unknown) {
    super(message, ATEMPORAL_ERROR_CODES.INVALID_DATE);
  }
}

/**
 * Thrown when a format string contains invalid or unsupported tokens.
 */
export class InvalidFormatError extends AtemporalError {
  constructor(
    message: string,
    public readonly formatString: string,
    public readonly invalidTokens?: string[]
  ) {
    super(message, ATEMPORAL_ERROR_CODES.INVALID_FORMAT);
  }
}

/**
 * Thrown when a date string doesn't match the provided format.
 */
export class FormatMismatchError extends AtemporalError {
  constructor(
    message: string,
    public readonly dateString: string,
    public readonly formatString: string,
    public readonly expectedPattern?: string
  ) {
    super(message, ATEMPORAL_ERROR_CODES.FORMAT_MISMATCH);
  }
}

/**
 * Thrown when parsed date components result in an invalid date.
 */
export class InvalidDateComponentsError extends AtemporalError {
  constructor(
    message: string,
    public readonly components: { [key: string]: any },
    public readonly reason?: string
  ) {
    super(message, ATEMPORAL_ERROR_CODES.INVALID_DATE_COMPONENTS);
  }
}

/**
 * Thrown when AM/PM parsing fails or is inconsistent.
 */
export class InvalidAmPmError extends AtemporalError {
  constructor(
    message: string,
    public readonly hour12: number,
    public readonly ampm: string
  ) {
    super(message, ATEMPORAL_ERROR_CODES.INVALID_AMPM);
  }
}
