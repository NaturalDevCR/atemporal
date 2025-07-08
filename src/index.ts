import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
import type { Plugin, AtemporalFactory } from './types';


/**
 * La clase principal. Útil para anotaciones de tipo.
 * Ejemplo: function logDate(date: Atemporal) { ... }
 */
// Re-exporta los tipos públicos para los usuarios de la librería
export { TemporalWrapper as Atemporal };
export type { DateInput, TimeUnit, SettableUnit, Plugin } from './types';

/**
 * Utilidades estáticas que son útiles para el usuario final.
 */
export const isValid = TemporalUtils.isValid;
export const setDefaultLocale = TemporalUtils.setDefaultLocale;
export const setDefaultTimeZone = TemporalUtils.setDefaultTimeZone;
export const getDefaultLocale = TemporalUtils.getDefaultLocale;

/**
 * La función principal y por defecto para crear una instancia.
 * Esto imita el uso de dayjs('...').
 */
const atemporal = TemporalUtils.wrap;

/**
 * Extiende la funcionalidad de atemporal con un plugin.
 * @param plugin El plugin a cargar.
 * @param options Opciones para el plugin.
 */
atemporal.extend = (plugin, options) => {
    // El plugin recibe la clase (Atemporal), la fábrica (atemporal) y las opciones.
    // Esto le permite añadir métodos al prototype de Atemporal.
    plugin(Atemporal, atemporal, options);
    return atemporal; // Permite encadenar .extend() si es necesario
};

export default atemporal;