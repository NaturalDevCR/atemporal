/**
 * @file This is the main entry point for the 'atemporal' library.
 * It sets up the main factory function, attaches static utility methods,
 * and handles the plugin system, making it the central hub for all functionality.
 */

// Import the temporal detection system to use native Temporal when available
import { getCachedTemporalAPI, getTemporalInfo } from './core/temporal-detection';
// Import Temporal types for TypeScript compilation
import type { Temporal } from '@js-temporal/polyfill';

// Get the appropriate Temporal API (native or polyfilled)
const { Temporal: TemporalAPI } = getCachedTemporalAPI();
import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
import {
    isAtemporal,
    isValid,
    isDuration,
    isValidTimeZone,
    isValidLocale,
    isPlugin
} from './typeGuards';
import type { DateInput, Plugin, AtemporalFactory, AtemporalFunction } from './types';

import {
    InvalidAtemporalInstanceError,
    InvalidDateError,
    InvalidTimeZoneError
} from './errors';

// Re-export the main wrapper class and utility types for direct use by consumers.
export { TemporalWrapper as Atemporal };
export type { DateInput, TimeUnit, SettableUnit, Plugin } from './types';
export {
    InvalidAtemporalInstanceError,
    InvalidDateError,
    InvalidTimeZoneError
};

/**
 * The core factory function for creating atemporal instances.
 * It can be called with various date inputs or with no arguments to get the current time.
 *
 * The function is fully typed by the `AtemporalFunction` type, so JSDoc param/returns are not needed.
 */
const atemporalFn: AtemporalFunction = (input?: DateInput, timeZone?: string) => {
    // If the input is already an atemporal instance, clone it or change its timezone.
    if (input instanceof TemporalWrapper) {
        return timeZone ? input.timeZone(timeZone) : input.clone();
    }

    if (input === undefined) {
        // When no input is provided, create an instance for the current moment.
        const nowTemporal = TemporalAPI.Now.zonedDateTimeISO(timeZone || TemporalUtils.defaultTimeZone);
        return TemporalWrapper.from(nowTemporal);
    }

    // At this point, `input` is guaranteed to be a valid `DateInput` type, so the call is safe.
    return TemporalWrapper.from(input, timeZone);
};

// Augment the core function with static properties to create the final factory object.
const atemporal = atemporalFn as AtemporalFactory;

// --- Attach all static methods from TemporalWrapper and TemporalUtils ---

atemporal.duration = (durationLike: Temporal.DurationLike | string): Temporal.Duration => {
    return TemporalAPI.Duration.from(durationLike);
};

/**
 * Creates a new TemporalWrapper instance.
 * The function signature is inferred from `TemporalWrapper.from`.
 */
atemporal.from = TemporalWrapper.from;

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
atemporal.isPlugin = isPlugin as (input: any) => input is Plugin;

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

atemporal.extend = (plugin: Plugin, options) => {
    // Validate plugin parameter
    if (!plugin || typeof plugin !== 'function') {
        throw new Error('Plugin must be a function');
    }
    
    if (appliedPlugins.has(plugin)) {
        // Plugin already applied, skip to avoid duplicates
        return;
    }
    try {
        plugin(TemporalWrapper, atemporal, options);
        appliedPlugins.add(plugin);
    } catch (error) {
        console.error('Error applying plugin:', error);
        throw error;
    }
};

// Añade estas funciones antes de la exportación final

/**
 * Tracks which plugins have been loaded
 */
const loadedPlugins = new Map<string, Plugin>();

/**
 * List of available plugins in the library
 */
const AVAILABLE_PLUGINS = [
    'relativeTime',
    'customParseFormat',
    'advancedFormat',
    'durationHumanizer',
    'weekDay'
];

/**
 * Loads a plugin lazily (on-demand) when needed
 * @param pluginName - Name of the plugin to load (without the path)
 * @param options - Optional options for the plugin
 * @returns A promise that resolves when the plugin has been loaded and applied
 * @throws Error if the plugin doesn't exist or fails to load
 */
atemporal.lazyLoad = async (pluginName: string, options?: any): Promise<void> => {
    // Skip if already loaded
    if (loadedPlugins.has(pluginName)) {
        return;
    }
    
    // Validate plugin name
    if (!AVAILABLE_PLUGINS.includes(pluginName)) {
        throw new Error(
            `Plugin '${pluginName}' not found. Available plugins are: ${AVAILABLE_PLUGINS.join(', ')}`
        );
    }
    
    try {
        // Importar dinámicamente el plugin con la extensión correcta
        let plugin;
        try {
            // Primero intentamos importar con la extensión .ts (para desarrollo con ts-node)
            const pluginModule = await import(`./plugins/${pluginName}.ts`);
            plugin = pluginModule.default;
        } catch (e) {
            try {
                // Si falla, intentamos sin extensión (para producción/npm)
                const pluginModule = await import(`./plugins/${pluginName}`);
                plugin = pluginModule.default;
            } catch (e2) {
                // Último intento: importar desde el paquete raíz (para uso como dependencia npm)
                const pluginModule = await import(`atemporal/plugins/${pluginName}`);
                plugin = pluginModule.default;
            }
        }
        
        if (!plugin || typeof plugin !== 'function') {
            throw new Error(`Invalid plugin format for '${pluginName}'`);
        }
        
        // Aplicar el plugin
        atemporal.extend(plugin, options);
        
        // Registrar que el plugin ha sido cargado
        loadedPlugins.set(pluginName, plugin);
    } catch (error) {
        if (error instanceof Error) {
            // Proporcionar un mensaje de error más descriptivo
            throw new Error(`Error loading plugin '${pluginName}': ${error.message}`);
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
        pluginNames.map(name => 
            atemporal.lazyLoad(name, options?.[name])
        )
    );
};

/**
 * Checks if a specific plugin has been loaded
 * @param pluginName - Name of the plugin to check
 * @returns true if the plugin has been loaded, false otherwise
 */
atemporal.isPluginLoaded = (pluginName: string): boolean => {
    return loadedPlugins.has(pluginName);
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
atemporal.getAvailablePlugins = (): string[] => {
    return [...AVAILABLE_PLUGINS];
};

/**
 * Gets information about the current Temporal implementation being used
 * @returns Object containing information about whether native or polyfilled Temporal is being used
 */
atemporal.getTemporalInfo = getTemporalInfo;

// Export the final, augmented factory function as the default export of the library.
export default atemporal;