/**
 * @file This is the main entry point for the 'atemporal' library.
 * It sets up the main factory function, attaches static utility methods,
 * and handles the plugin system, making it the central hub for all functionality.
 */

import {
  getTemporalInfo,
} from "./core/temporal-detection";
import type { Temporal } from "@js-temporal/polyfill";

import { Temporal as TemporalAPI } from "./core/temporal-api";
import { TemporalWrapper } from "./TemporalWrapper";
import { TemporalUtils } from "./TemporalUtils";
import {
  isAtemporal,
  isValid,
  isDuration,
  isValidTimeZone,
  isValidLocale,
  isPlugin,
  markAsPlugin,
  getOfficialPluginMetadata,
  PLUGIN_SENTINEL,
  OFFICIAL_PLUGIN_METADATA,
} from "./typeGuards";
import type {
  DateInput,
  Plugin,
  OfficialPluginName,
  AtemporalFactory,
  AtemporalFunction,
} from "./types";

import {
  InvalidAtemporalInstanceError,
  InvalidDateError,
  InvalidTimeZoneError,
} from "./errors";
import { debugLog } from "./core/debug";
import {
  FORMAT_PRESETS,
  listPresets,
  getPreset,
  type ValidationResult,
} from "./core/formatting/presets";
import {
  setStrictMode,
  isStrictMode,
  getStrictModeFlags,
  clearStrictWarnings,
  type StrictModeFlags,
} from "./core/strict-mode";
import { parseStrict, tryParseStrict } from './core/parsing/public-parse';

// Re-export the main wrapper class and utility types for direct use by consumers.
export { TemporalWrapper as Atemporal };
export type {
  DateInput,
  TimeUnit,
  SettableUnit,
  Plugin,
  OfficialPluginName,
  DateRange,
  OverlapResult,
  OverlapOptions,
  AtemporalDisambiguation,
  AtemporalOverflow,
  ParseOptions,
  AppliedExtension,
  AtemporalDiagnostics,
} from "./types";
export {
  ATEMPORAL_ERROR_CODES,
  AtemporalError,
  FormatMismatchError,
  InvalidAmPmError,
  InvalidAtemporalInstanceError,
  InvalidDateComponentsError,
  InvalidDateError,
  InvalidFormatError,
  InvalidTimeZoneError,
} from "./errors";
export type { AtemporalErrorCode } from "./errors";

// Export plugin authoring utilities
export {
  markAsPlugin,
  getOfficialPluginMetadata,
  PLUGIN_SENTINEL,
  OFFICIAL_PLUGIN_METADATA,
};

// Export the dateRangeOverlap plugin and related utilities
export {
  default as dateRangeOverlapPlugin,
  checkDateRangeOverlap,
  InvalidDateRangeError,
  OverlapDetectionError,
} from "./plugins/dateRangeOverlap";
export { default as businessDaysPlugin } from "./plugins/businessDays";
export { default as timeSlotsPlugin } from "./plugins/timeSlots";

// Re-export format presets
export { FORMAT_PRESETS as presets, listPresets, getPreset } from "./core/formatting/presets";
export type { ValidationResult } from "./core/formatting/presets";

/**
 * The core factory function for creating atemporal instances.
 * It can be called with various date inputs or with no arguments to get the current time.
 *
 * The function is fully typed by the `AtemporalFunction` type, so JSDoc param/returns are not needed.
 */
const atemporalFn: AtemporalFunction = (
  input?: DateInput,
  timeZone?: string
) => {
  // If the input is already an atemporal instance, clone it or change its timezone.
  if (input instanceof TemporalWrapper) {
    return timeZone ? input.timeZone(timeZone) : input.clone();
  }

  if (input === undefined) {
    // When no input is provided, create an instance for the current moment.
    const nowTemporal = TemporalAPI.Now.zonedDateTimeISO(
      timeZone || TemporalUtils.defaultTimeZone
    );
    return TemporalWrapper.from(nowTemporal);
  }

  // At this point, `input` is guaranteed to be a valid `DateInput` type, so the call is safe.
  return TemporalWrapper.from(input, timeZone);
};

// Augment the core function with static properties to create the final factory object.
const atemporal = atemporalFn as AtemporalFactory;

// --- Attach all static methods from TemporalWrapper and TemporalUtils ---

atemporal.duration = (
  durationLike: Temporal.DurationLike | string
): Temporal.Duration => {
  return TemporalAPI.Duration.from(durationLike);
};

/**
 * Creates a new TemporalWrapper instance.
 * The function signature is inferred from `TemporalWrapper.from`.
 */
atemporal.from = TemporalWrapper.from;

atemporal.parse = parseStrict;
atemporal.tryParse = tryParseStrict;

/**
 * Creates a new TemporalWrapper instance from a Unix timestamp (seconds since epoch).
 * The function signature is inferred from `TemporalWrapper.unix`.
 */
atemporal.unix = TemporalWrapper.unix;

/**
 * Checks if a given input can be parsed into a valid date.
 * The function signature is inferred from `TemporalUtils.isValid`.
 */
atemporal.isValid = isValid;

/**
 * Checks if a given input is an instance of an atemporal object.
 * This acts as a TypeScript type guard.
 */
atemporal.isAtemporal = isAtemporal;

/**
 * Checks if a given input is an instance of Temporal.Duration.
 */
atemporal.isDuration = isDuration;

/**
 * Returns the earliest date from a list of inputs.
 * Accepts spread arguments or an array.
 */
atemporal.min = (...args: (DateInput | DateInput[])[]): TemporalWrapper => {
  const inputs = (Array.isArray(args[0]) ? args[0] : args) as DateInput[];
  if (inputs.length === 0)
    throw new InvalidDateError("No arguments provided to min");

  // Convert first to reference
  let minDate = TemporalWrapper.from(inputs[0]);
  if (!minDate.isValid())
    throw new InvalidDateError("Invalid date provided to min");

  for (let i = 1; i < inputs.length; i++) {
    const current = TemporalWrapper.from(inputs[i]);
    if (!current.isValid())
      throw new InvalidDateError("Invalid date provided to min");
    if (current.isBefore(minDate)) {
      minDate = current;
    }
  }
  return minDate;
};

/**
 * Returns the latest date from a list of inputs.
 * Accepts spread arguments or an array.
 */
atemporal.max = (...args: (DateInput | DateInput[])[]): TemporalWrapper => {
  const inputs = (Array.isArray(args[0]) ? args[0] : args) as DateInput[];
  if (inputs.length === 0)
    throw new InvalidDateError("No arguments provided to max");

  // Convert first to reference
  let maxDate = TemporalWrapper.from(inputs[0]);
  if (!maxDate.isValid())
    throw new InvalidDateError("Invalid date provided to max");

  for (let i = 1; i < inputs.length; i++) {
    const current = TemporalWrapper.from(inputs[i]);
    if (!current.isValid())
      throw new InvalidDateError("Invalid date provided to max");
    if (current.isAfter(maxDate)) {
      maxDate = current;
    }
  }
  return maxDate;
};

/**
 * Checks if a string is a valid and supported IANA time zone identifier.
 */
atemporal.isValidTimeZone = isValidTimeZone;

/**
 * Checks if a string is a structurally valid locale identifier.
 */
atemporal.isValidLocale = isValidLocale;

/**
 * Checks if a given function has the shape of an atemporal plugin.
 */
atemporal.isPlugin = isPlugin as (input: unknown) => input is Plugin;

/**
 * Sets the default locale for all new atemporal instances. Used for formatting.
 * The function signature is inferred from `TemporalUtils.setDefaultLocale`.
 */
atemporal.setDefaultLocale = TemporalUtils.setDefaultLocale;

/**
 * Sets the default IANA time zone for all new atemporal instances.
 * The function signature is inferred from `TemporalUtils.setDefaultTimeZone`.
 */
atemporal.setDefaultTimeZone = TemporalUtils.setDefaultTimeZone;

/**
 * Gets the currently configured default locale.
 * The function signature is inferred from `TemporalUtils.getDefaultLocale`.
 */
atemporal.getDefaultLocale = TemporalUtils.getDefaultLocale;

/**
 * Extends atemporal's functionality with a plugin.
 * The function signature is defined by its implementation.
 */
const appliedPlugins = new Set<Plugin>();
const loadedPlugins = new Map<OfficialPluginName, Plugin>();

  atemporal.extend = (plugin: Plugin, options) => {
    if (!plugin || typeof plugin !== "function") {
      throw new Error("Plugin must be a function");
    }

    if (appliedPlugins.has(plugin)) {
      return;
    }
    try {
      plugin(TemporalWrapper, atemporal, options);
      appliedPlugins.add(plugin);
      const metadata = getOfficialPluginMetadata(plugin);
      if (metadata) loadedPlugins.set(metadata.name, plugin);
    } catch (error) {
      debugLog('error', 'Error applying plugin', String(error));
      throw error;
    }
  };

// Add these functions before the final export

/**
 * Tracks which plugins have been loaded
 */
/**
 * List of available plugins in the library
 */
const AVAILABLE_PLUGINS: readonly OfficialPluginName[] = [
  "relativeTime",
  "customParseFormat",
  "advancedFormat",
  "durationHumanizer",
  "weekDay",
  "dateRangeOverlap",
  "businessDays",
  "timeSlots",
];

/**
 * Loads a plugin lazily (on-demand) when needed
 * @param pluginName - Name of the plugin to load (without the path)
 * @param options - Optional options for the plugin
 * @returns A promise that resolves when the plugin has been loaded and applied
 * @throws Error if the plugin doesn't exist or fails to load
 */
atemporal.lazyLoad = async (
  pluginName: string,
  options?: any
): Promise<void> => {
  // Skip if already loaded
  if (loadedPlugins.has(pluginName as OfficialPluginName)) {
    return;
  }

  // Validate plugin name
  if (!AVAILABLE_PLUGINS.includes(pluginName as OfficialPluginName)) {
    throw new Error(
      `Plugin '${pluginName}' not found. Available plugins are: ${AVAILABLE_PLUGINS.join(
        ", "
      )}`
    );
  }

  try {
    // Dynamically import the plugin with the correct extension
    let plugin;
    try {
      // First try importing with .ts extension (for development with ts-node)
      const pluginModule = await import(`./plugins/${pluginName}.ts`);
      plugin = pluginModule.default?.default ?? pluginModule.default;
    } catch (e) {
      try {
        // If that fails, try without extension (for production/npm)
        const pluginModule = await import(`./plugins/${pluginName}`);
        plugin = pluginModule.default?.default ?? pluginModule.default;
      } catch (e2) {
        // Last attempt: import from root package (for use as npm dependency)
        const pluginModule = await import(`atemporal/plugins/${pluginName}`);
        plugin = pluginModule.default?.default ?? pluginModule.default;
      }
    }

    if (!plugin || typeof plugin !== "function") {
      throw new Error(`Invalid plugin format for '${pluginName}'`);
    }

    // Apply the plugin
    atemporal.extend(plugin, options);

    const metadata = getOfficialPluginMetadata(plugin);
    if (!metadata || metadata.name !== pluginName) {
      throw new Error(`Invalid metadata for official plugin '${pluginName}'`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error loading plugin '${pluginName}': ${error.message}`, { cause: error });
    }
    throw error;
  }
};

/**
 * Loads multiple plugins at once
 * @param pluginNames - Array of plugin names to load
 * @param options - Optional options object where keys are plugin names
 * @returns A promise that resolves when all plugins have been loaded
 */
atemporal.lazyLoadMultiple = async (
  pluginNames: string[],
  options?: Record<string, any>
): Promise<void> => {
  await Promise.all(
    pluginNames.map((name) => atemporal.lazyLoad(name, options?.[name]))
  );
};

/**
 * Checks if a specific plugin has been loaded
 * @param pluginName - Name of the plugin to check
 * @returns true if the plugin has been loaded, false otherwise
 */
atemporal.isPluginLoaded = (pluginName: string): boolean => {
  return loadedPlugins.has(pluginName as OfficialPluginName);
};

/**
 * Gets the list of all plugins that have been loaded
 * @returns Array of loaded plugin names
 */
atemporal.getLoadedPlugins = (): string[] => {
  return Array.from(loadedPlugins.keys());
};

/**
 * Gets the list of all available plugins
 * @returns Array of available plugin names
 */
atemporal.getAvailablePlugins = (): OfficialPluginName[] => {
  return [...AVAILABLE_PLUGINS];
};

/**
 * Gets information about the current Temporal implementation being used
 * @returns Object containing information about whether native or polyfilled Temporal is being used
 */
atemporal.getTemporalInfo = getTemporalInfo;

// --- Ergonomic static helpers (Sprint 1.1) -------------------------------

/**
 * Tries to parse `input` into a `TemporalWrapper`. Returns `null` if the
 * input cannot be parsed or is not a valid date — never throws.
 *
 * Use this in user-facing code paths where a thrown `InvalidDateError`
 * would be inappropriate (e.g. parsing a value from a request body, a
 * URL parameter, or a user-typed field).
 *
 * @example
 * ```ts
 * const a = atemporal.try('2024-01-15');   // TemporalWrapper
 * const b = atemporal.try('not a date');   // null
 * const c = atemporal.try(null);           // null
 * const d = atemporal.try(undefined, 'UTC'); // null
 * ```
 */
atemporal.try = (input?: DateInput, timeZone?: string): TemporalWrapper | null => {
  if (input === null || input === undefined) {
    return null;
  }
  try {
    const result = atemporal(input as DateInput, timeZone);
    if (!result.isValid()) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
};

/**
 * Formats any value into an ISO 8601 string. Accepts the same input as
 * `atemporal(...)`. Returns `null` for invalid inputs (never throws).
 *
 * Shorthand for `atemporal.try(input)?.toISO() ?? null`.
 *
 * @example
 * ```ts
 * atemporal.iso();                    // null
 * atemporal.iso('2024-01-15');        // '2024-01-15T00:00:00.000Z'
 * atemporal.iso(0);                   // '1970-01-01T00:00:00.000Z'
 * atemporal.iso('garbage');           // null
 * atemporal.iso(date, 'America/NY');  // '2026-06-03T08:34:56.789-04:00'
 * ```
 */
atemporal.iso = (input?: DateInput, timeZone?: string): string | null => {
  if (input === null || input === undefined) {
    return null;
  }
  const wrapped = atemporal.try(input, timeZone);
  return wrapped === null ? null : wrapped.format(atemporal.presets.ISO);
};

/**
 * Validates `input` and returns a structured result. Does not throw.
 *
 * The returned object has a discriminant `ok` field. When `ok === true`,
 * `iso` and `confidence` are populated; when `ok === false`, `reason` and
 * `code` are populated.
 *
 * @example
 * ```ts
 * atemporal.validate('2024-01-15');
 * // { ok: true, iso: '2024-01-15T00:00:00.000Z', confidence: 0.95 }
 *
 * atemporal.validate('not a date');
 * // { ok: false, reason: '...', code: 'ATEMPORAL_INVALID_DATE' }
 * ```
 */
atemporal.validate = (input: unknown): ValidationResult => {
  if (input === null || input === undefined) {
    return {
      ok: false,
      reason: 'Input is null or undefined',
      code: 'ATEMPORAL_INVALID_INPUT',
    };
  }
  try {
    const wrapped = atemporal.try(input as DateInput);
    if (wrapped === null || !wrapped.isValid()) {
      return {
        ok: false,
        reason: 'Input could not be parsed as a valid date',
        code: 'ATEMPORAL_INVALID_DATE',
      };
    }
    return {
      ok: true,
      iso: wrapped.format(atemporal.presets.ISO),
      confidence: 1,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      reason: message,
      code: 'ATEMPORAL_PARSE_FAILED',
    };
  }
};

/**
 * Built-in format presets. Use as `atemporal(input).format(atemporal.presets.ISO)`.
 *
 * For programmatic access, use `atemporal.presets.list()` and
 * `atemporal.presets.get(name)`.
 */
atemporal.presets = Object.assign(
  { ...FORMAT_PRESETS },
  {
    list: listPresets,
    get: getPreset,
  }
) as Readonly<Record<string, string>> & AtemporalFactory['presets'];
Object.freeze(atemporal.presets);

// --- Strict mode (Sprint 1.3) --------------------------------------------

/**
 * Enables or disables atemporal's "strict mode". When enabled, the library
 * will `console.warn` on operations that could lead to subtle timezone or
 * parsing bugs.
 *
 * Pass `true` to enable with default flags, `false` to disable, or a
 * partial `StrictModeFlags` object to enable with custom flags.
 *
 * @example Enable with defaults
 * ```ts
 * atemporal.setStrictMode(true);
 * ```
 *
 * @example Enable only specific flags
 * ```ts
 * atemporal.setStrictMode({ warnOnDateObjectInput: true });
 * ```
 */
atemporal.setStrictMode = setStrictMode;

/** Returns true if strict mode is currently enabled. */
atemporal.isStrictMode = isStrictMode;

/** Returns the current strict-mode flags. */
atemporal.getStrictModeFlags = getStrictModeFlags;

/** Clears the strict-mode warning cache (useful in tests). */
atemporal.clearStrictWarnings = clearStrictWarnings;

// Export the final, augmented factory function as the default export of the library.
export default atemporal;
