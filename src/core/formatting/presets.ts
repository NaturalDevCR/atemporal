/**
 * @file Built-in format string presets for common ISO, RFC, and SQL patterns.
 *
 * These presets are exposed via `atemporal.presets` and can be used as
 * arguments to `atemporal(input).format(preset)`.
 *
 * They are also returned by `atemporal.presets.list()` so that consumers can
 * programmatically iterate or extend them.
 */

/**
 * The canonical preset object. Keys are preset names; values are format
 * strings understood by atemporal's formatting engine (which follows
 * moment.js / Day.js convention).
 *
 * All presets are deterministic, locale-independent ISO/RFC/SQL strings.
 */
export const FORMAT_PRESETS: Readonly<Record<string, string>> = Object.freeze({
  /** ISO 8601 calendar date: `YYYY-MM-DD`. */
  ISO_DATE: 'YYYY-MM-DD',
  /** ISO 8601 wall-clock time: `HH:mm:ss.sss`. */
  ISO_TIME: 'HH:mm:ss.sss',
  /** ISO 8601 date + time, no offset: `YYYY-MM-DDTHH:mm:ss.sss`. */
  ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss.sss',
  /** Full ISO 8601 with timezone offset: `YYYY-MM-DDTHH:mm:ss.sss±HH:MM`. */
  ISO: "YYYY-MM-DDTHH:mm:ss.sssZ",
  /** RFC 2822 (HTTP/email): `Sun, 03 Jun 2026 12:34:56 +0000`. */
  RFC2822: 'ddd, DD MMM YYYY HH:mm:ss ZZ',
  /** SQL DATE: `2026-06-03`. */
  SQL_DATE: 'YYYY-MM-DD',
  /** SQL DATETIME: `2026-06-03 12:34:56.789`. */
  SQL_DATETIME: 'YYYY-MM-DD HH:mm:ss.SSS',
  /** Cookie/expiry style: `Sun, 03-Jun-2026 12:34:56 GMT`. */
  COOKIE: 'ddd, DD-MMM-YYYY HH:mm:ss [GMT]',
  /** Compact local: `2026-06-03 12:34`. */
  COMPACT_LOCAL: 'YYYY-MM-DD HH:mm',
  /** Compact UTC: `2026-06-03T12:34Z`. */
  COMPACT_UTC: "YYYY-MM-DDTHH:mm[Z]",
  /** Unix epoch in seconds: a callable form, see `epochSeconds` helper. */
  EPOCH_SECONDS: 'X',
  /** Unix epoch in milliseconds: a callable form, see `epochMillis` helper. */
  EPOCH_MILLIS: 'x',
});

/**
 * Returns the full list of preset names (in declaration order).
 */
export function listPresets(): string[] {
  return Object.keys(FORMAT_PRESETS);
}

/**
 * Looks up a preset by name, throwing if the name is unknown.
 *
 * @param name - The preset key (e.g. `'ISO'`, `'RFC2822'`).
 */
export function getPreset(name: string): string {
  const value = FORMAT_PRESETS[name];
  if (value === undefined) {
    throw new Error(
      `Unknown format preset '${name}'. Use atemporal.presets.list() to see available presets.`
    );
  }
  return value;
}

/**
 * Validation result shape for `atemporal.validate(input)`.
 *
 * Consumers can use the discriminant (`ok`) to narrow without checking
 * `reason` / `iso` separately.
 */
export interface ValidationResult {
  /** True when the input could be parsed unambiguously. */
  ok: boolean;
  /** ISO 8601 string of the parsed value, or `undefined` if invalid. */
  iso?: string;
  /** Confidence score in [0, 1]; only meaningful when `ok === true`. */
  confidence?: number;
  /** Human-readable reason; only present when `ok === false`. */
  reason?: string;
  /** The error code (`ATEMPORAL_*`) when `ok === false`. */
  code?: string;
}
