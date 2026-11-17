/** Shared capability checks; this module never imports a Temporal implementation. */

/**
 * Checks if the native Temporal API is available in the current environment
 * @returns {boolean} True if native Temporal is available, false otherwise
 */
export const getGlobalObject = (): any => {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  if (typeof self !== "undefined") return self;
  throw new Error("Unable to locate global object");
};

/**
 * Checks if the native Temporal API is available in the current environment.
 *
 * ⚠️ SPEC NOTE (ECMAScript 2026 / TC39 Stage 4):
 * `Temporal.TimeZone` and `Temporal.Calendar` were **removed** from the Temporal spec
 * in the June 2024 TC39 meeting (scope reduction for Stage 3→4 advancement).
 * Chrome 144+ and Firefox 139+ native implementations do NOT include these classes.
 * We intentionally omit those checks so that native support is correctly detected.
 *
 * @returns {boolean} True if native Temporal is available, false otherwise
 */
export function isNativeTemporalAvailable(): boolean {
  try {
    // Get the global object in a cross-platform way
    const globalObj = getGlobalObject();

    // Check if Temporal exists in the global scope
    if ("Temporal" in globalObj) {
      const temporal = (globalObj as any).Temporal;

      // Verify that it has the expected structure and key methods.
      // NOTE: We do NOT check for Temporal.TimeZone or Temporal.Calendar —
      // both were removed from the final ECMAScript 2026 spec (TC39 Stage 4).
      // Native implementations in Chrome 144+ and Firefox 139+ do not expose them.
      return Boolean(
        temporal &&
        typeof temporal === "object" &&
        typeof temporal.Now === "object" &&
        typeof temporal.Now.zonedDateTimeISO === "function" &&
        typeof temporal.PlainDate === "function" &&
        typeof temporal.PlainDateTime === "function" &&
        typeof temporal.ZonedDateTime === "function" &&
        typeof temporal.Instant === "function" &&
        typeof temporal.Duration === "function" &&
        typeof temporal.PlainTime === "function" &&
        typeof temporal.PlainYearMonth === "function" &&
        typeof temporal.PlainMonthDay === "function"
      );
    }
    return false;
  } catch (error) {
    // If any error occurs during detection, assume native Temporal is not available
    return false;
  }
}
