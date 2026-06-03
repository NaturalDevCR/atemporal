/**
 * @file Global "strict mode" for atemporal.
 *
 * Strict mode is a runtime configuration that makes atemporal fail loudly
 * (via console.warn) when the library detects an operation that could lead
 * to subtle timezone or parsing bugs.
 *
 * It is **off** by default to preserve the existing permissive behaviour.
 * Enterprise users are encouraged to enable it in tests and pre-production
 * environments to surface ambiguity early.
 *
 * @example
 * ```ts
 * import { atemporal, setStrictMode, isStrictMode } from 'atemporal';
 *
 * setStrictMode(true);
 * if (isStrictMode()) {
 *   // console.warn will fire for ambiguous operations.
 * }
 * ```
 */

/** All strict-mode flags. */
export interface StrictModeFlags {
  /**
   * Warn when `atemporal(input)` is called and `input` is a `Date` object
   * that carries the host system's local timezone information. The wrapper
   * will still produce a value, but the implicit timezone can be wrong on
   * the server.
   */
  warnOnDateObjectInput: boolean;

  /**
   * Warn when parsing a string that does not carry timezone information
   * (e.g. `'2024-01-15'`). The wrapper assumes the configured default
   * timezone, which can be surprising in cross-region scenarios.
   */
  warnOnNaiveStringInput: boolean;

  /**
   * Warn when `.format()` is called with a format string that mixes
   * 12-hour and 24-hour tokens ambiguously.
   */
  warnOnAmbiguousFormatTokens: boolean;

  /**
   * Warn when a method returns an invalid `TemporalWrapper` (e.g. calling
   * `.add('banana' as any)`). Defaults to `true` because the cost of
   * the warning is much lower than the cost of a silent NaN downstream.
   */
  warnOnInvalidResult: boolean;
}

const DEFAULT_FLAGS: StrictModeFlags = Object.freeze({
  warnOnDateObjectInput: false,
  warnOnNaiveStringInput: false,
  warnOnAmbiguousFormatTokens: false,
  warnOnInvalidResult: true,
});

let enabled = false;
let flags: StrictModeFlags = { ...DEFAULT_FLAGS };

/**
 * Enables or disables strict mode.
 *
 * When called with a boolean, all flags are set to their default-ON or
 * default-OFF state. To enable with custom flags, pass a partial flags
 * object instead of a boolean.
 */
export function setStrictMode(
  on: boolean | Partial<StrictModeFlags> = true
): void {
  if (typeof on === 'boolean') {
    enabled = on;
    flags = { ...DEFAULT_FLAGS };
    if (on) {
      flags.warnOnInvalidResult = true;
    }
  } else {
    enabled = true;
    flags = { ...DEFAULT_FLAGS, ...on };
  }
}

/** Returns true if strict mode is currently enabled. */
export function isStrictMode(): boolean {
  return enabled;
}

/** Returns the current strict-mode flags (a copy; mutating it is a no-op). */
export function getStrictModeFlags(): StrictModeFlags {
  return { ...flags };
}

/**
 * Emits a console warning if strict mode is enabled and the named flag is
 * on. The warning is rate-limited per (key) so a tight loop does not flood
 * the console.
 */
const warningLog = new Set<string>();
export function strictWarn(flag: keyof StrictModeFlags, message: string): void {
  if (!enabled || !flags[flag]) {
    return;
  }
  const key = `${flag}::${message}`;
  if (warningLog.has(key)) {
    return;
  }
  warningLog.add(key);
  // eslint-disable-next-line no-console
  console.warn(`[atemporal strict] ${flag}: ${message}`);
}

/** Resets the warning cache (useful for tests). */
export function clearStrictWarnings(): void {
  warningLog.clear();
}
