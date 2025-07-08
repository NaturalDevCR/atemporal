import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
import type { Plugin, AtemporalFactory, AtemporalFunction } from './types';

// Re-exporta los tipos públicos para los usuarios de la librería
export { TemporalWrapper as Atemporal };
export type { DateInput, TimeUnit, SettableUnit, Plugin } from './types';

// 1. Tomamos la función base que creará las instancias
const atemporalFn: AtemporalFunction = TemporalUtils.wrap;

// 2. Le decimos a TypeScript que nuestro objeto final 'atemporal' se comportará
//    como nuestra factoría (una función con propiedades).
const atemporal = atemporalFn as AtemporalFactory;

// 3. Le asignamos todas las propiedades estáticas que definimos en el tipo.
atemporal.isValid = TemporalUtils.isValid;
atemporal.setDefaultLocale = TemporalUtils.setDefaultLocale;
atemporal.setDefaultTimeZone = TemporalUtils.setDefaultTimeZone;
atemporal.getDefaultLocale = TemporalUtils.getDefaultLocale;

atemporal.extend = (plugin: Plugin, options) => {
    plugin(TemporalWrapper, atemporal, options);
};

// 4. Exportamos el objeto completo.
export default atemporal;