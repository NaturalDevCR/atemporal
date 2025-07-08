import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
/**
 * La clase principal. Útil para anotaciones de tipo.
 * Ejemplo: function logDate(date: Atemporal) { ... }
 */
export { TemporalWrapper as Atemporal };
/**
 * Utilidades estáticas que son útiles para el usuario final.
 */
export declare const isValid: typeof TemporalUtils.isValid;
export declare const setDefaultLocale: typeof TemporalUtils.setDefaultLocale;
export declare const setDefaultTimeZone: typeof TemporalUtils.setDefaultTimeZone;
/**
 * La función principal y por defecto para crear una instancia.
 * Esto imita el uso de dayjs('...').
 */
declare const atemporal: typeof TemporalUtils.wrap;
export default atemporal;
